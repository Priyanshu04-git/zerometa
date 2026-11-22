import ExifReader, { type ExpandedTags } from "exifreader";
import JSZip from "jszip";
import { PDFDocument, PDFName } from "pdf-lib";
import { getKindForFilename, type FileKind } from "./constants";
import { assessMetadataField, type MetadataCategory, type MetadataRisk } from "./metadataRisk";

export type MetadataStatus = "removed" | "present" | "not-detected";

export type MetadataField = {
  name: string;
  original?: string;
  cleaned?: string;
  status: MetadataStatus;
  category: MetadataCategory;
  risk: MetadataRisk;
  explanation: string;
};

export type MetadataComparison = {
  originalFilename: string;
  cleanedFilename: string;
  format: string;
  detectedOriginalFields: MetadataField[];
  detectedCleanedFields: MetadataField[];
  removedFields: MetadataField[];
  preservedFields: MetadataField[];
  limitations: string[];
  generatedAt: string;
};

type Detected = Record<string, string>;

const OMIT_KEYS = new Set(["FileType", "Image Width", "Image Height", "Bits Per Sample", "Color Components", "Subsampling"]);
const MAX_VALUE_LENGTH = 180;

function displayValue(value: unknown): string {
  if (typeof value === "string") return value.slice(0, MAX_VALUE_LENGTH);
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  if (Array.isArray(value)) return value.map((item) => displayValue(item)).join(", ").slice(0, MAX_VALUE_LENGTH);
  return "detected";
}

function tagValue(tag: unknown): string {
  if (!tag || typeof tag !== "object") return displayValue(tag);
  const record = tag as { description?: unknown; value?: unknown };
  return displayValue(record.description ?? record.value ?? "detected");
}

function flattenExifTags(tags: ExpandedTags): Detected {
  const result: Detected = {};
  const groups = ["exif", "iptc", "xmp", "gps", "photoshop", "makerNotes"] as const;
  for (const group of groups) {
    const section = tags[group] as Record<string, unknown> | undefined;
    if (!section) continue;
    for (const [name, tag] of Object.entries(section)) {
      if (name === "_raw" || OMIT_KEYS.has(name)) continue;
      result[`${group}.${name}`] = tagValue(tag);
    }
  }
  return result;
}

async function inspectImage(file: File): Promise<Detected> {
  const bytes = new Uint8Array(await file.arrayBuffer());
  const extension = file.name.split(".").pop()?.toLowerCase();
  const structure = extension === "jpg" || extension === "jpeg" ? inspectJpegStructure(bytes) : extension === "png" ? inspectPngStructure(bytes) : extension === "gif" ? inspectGifStructure(bytes) : inspectWebpStructure(bytes);
  try {
    const tags = await ExifReader.load(bytes, { expanded: true, async: true, includeUnknown: false });
    return { ...structure, ...flattenExifTags(tags) };
  } catch {
    return structure;
  }
}

function textFromBytes(bytes: Uint8Array): string {
  return new TextDecoder("latin1").decode(bytes);
}

function ascii(bytes: Uint8Array, start: number, length: number): string {
  return String.fromCharCode(...bytes.subarray(start, start + length));
}

function inspectJpegStructure(bytes: Uint8Array): Detected {
  const result: Detected = {};
  if (bytes.length < 4 || bytes[0] !== 0xff || bytes[1] !== 0xd8) return result;
  let offset = 2;
  while (offset + 4 <= bytes.length) {
    if (bytes[offset] !== 0xff) break;
    const marker = bytes[offset + 1];
    if (marker === 0xda) break;
    if (marker === 0xff) { offset += 1; continue; }
    if (marker === 0x01 || (marker >= 0xd0 && marker <= 0xd7)) { offset += 2; continue; }
    const length = (bytes[offset + 2] << 8) | bytes[offset + 3];
    if (length < 2 || offset + 2 + length > bytes.length) break;
    const payload = bytes.subarray(offset + 4, offset + 2 + length);
    if (marker === 0xe1) {
      const payloadText = textFromBytes(payload);
      if (payloadText.startsWith("Exif\0\0")) result["JPEG.EXIF"] = "present";
      else if (payloadText.includes("xmpmeta") || payloadText.includes("adobe.com/xap")) result["JPEG.XMP"] = "present";
      else result["JPEG.APP1-metadata"] = "present";
    } else if (marker === 0xed) result["JPEG.IPTC-Photoshop"] = "present";
    else if (marker === 0xfe) result["JPEG.comment"] = "present";
    offset += 2 + length;
  }
  return result;
}

function inspectPngStructure(bytes: Uint8Array): Detected {
  const result: Detected = {};
  if (bytes.length < 24 || ascii(bytes, 0, 8) !== "\x89PNG\r\n\x1a\n") return result;
  let offset = 8;
  while (offset + 12 <= bytes.length) {
    const length = new DataView(bytes.buffer, bytes.byteOffset + offset, 4).getUint32(0);
    const type = ascii(bytes, offset + 4, 4);
    if (offset + 12 + length > bytes.length) break;
    if (type === "eXIf") result["PNG.EXIF"] = "present";
    if (type === "tEXt" || type === "zTXt" || type === "iTXt") result[`PNG.${type}-text-metadata`] = "present";
    offset += 12 + length;
    if (type === "IEND") break;
  }
  return result;
}

function inspectGifStructure(bytes: Uint8Array): Detected {
  const result: Detected = {};
  if (bytes.length < 13 || !(ascii(bytes, 0, 6) === "GIF87a" || ascii(bytes, 0, 6) === "GIF89a")) return result;
  let offset = 13;
  if (bytes[10] & 0x80) offset += 3 * (1 << ((bytes[10] & 0x07) + 1));
  while (offset + 2 < bytes.length) {
    if (bytes[offset] === 0x3b) break;
    if (bytes[offset] === 0x21) {
      const label = bytes[offset + 1];
      if (label === 0xfe) result["GIF.comment"] = "present";
      else if (label === 0x01) result["GIF.plain-text"] = "present";
      else if (label === 0xff) {
        const size = bytes[offset + 2];
        const app = ascii(bytes, offset + 3, size);
        if (!app.startsWith("NETSCAPE") && !app.startsWith("ANIMEXTS")) result["GIF.application-metadata"] = "present";
      }
      offset += 2;
      while (offset < bytes.length) { const size = bytes[offset++]; offset += size; if (size === 0) break; }
      continue;
    }
    if (bytes[offset] === 0x2c) {
      if (offset + 10 >= bytes.length) break;
      const packed = bytes[offset + 9];
      offset += 10 + ((packed & 0x80) ? 3 * (1 << ((packed & 0x07) + 1)) : 0) + 1;
      while (offset < bytes.length) { const size = bytes[offset++]; offset += size; if (size === 0) break; }
      continue;
    }
    break;
  }
  return result;
}

function inspectWebpStructure(bytes: Uint8Array): Detected {
  const result: Detected = {};
  if (bytes.length < 12 || ascii(bytes, 0, 4) !== "RIFF" || ascii(bytes, 8, 4) !== "WEBP") return result;
  let offset = 12;
  while (offset + 8 <= bytes.length) {
    const size = new DataView(bytes.buffer, bytes.byteOffset + offset + 4, 4).getUint32(0, true);
    const type = ascii(bytes, offset, 4);
    if (type === "EXIF") result["WebP.EXIF"] = "present";
    if (type === "XMP ") result["WebP.XMP"] = "present";
    if (type === "ICCP") result["WebP.ICC-profile"] = "present";
    offset += 8 + size + (size & 1);
  }
  return result;
}

function addMarkerFields(text: string, markers: Array<[string, string]>, result: Detected) {
  for (const [key, label] of markers) {
    if (text.includes(key)) result[label] = "detected";
  }
}

function hasBytes(bytes: Uint8Array, pattern: number[]): boolean {
  outer: for (let i = 0; i <= bytes.length - pattern.length; i++) {
    for (let j = 0; j < pattern.length; j++) if (bytes[i + j] !== pattern[j]) continue outer;
    return true;
  }
  return false;
}

async function inspectPdf(file: File): Promise<Detected> {
  const result: Detected = {};
  const pdfDoc = await PDFDocument.load(await file.arrayBuffer(), { updateMetadata: false });
  const infoRef = pdfDoc.context.trailerInfo.Info;
  const info = infoRef ? pdfDoc.context.lookup(infoRef) : undefined;
  const fields: Array<[string, string]> = [
    ["Title", "PDF.Title"], ["Author", "PDF.Author"], ["Subject", "PDF.Subject"],
    ["Keywords", "PDF.Keywords"], ["Creator", "PDF.Creator"], ["Producer", "PDF.Producer"],
    ["CreationDate", "PDF.CreationDate"], ["ModDate", "PDF.ModDate"], ["Trapped", "PDF.Trapped"],
  ];
  const infoDictionary = info as { get?: (key: unknown) => unknown } | undefined;
  for (const [key, label] of fields) {
    if (infoDictionary && typeof infoDictionary.get === "function" && infoDictionary.get(PDFName.of(key))) result[label] = "present";
  }
  if (pdfDoc.catalog.get(PDFName.of("Metadata"))) result["PDF.XMP-metadata-stream"] = "present";
  return result;
}

async function inspectDocx(file: File): Promise<Detected> {
  const zip = await JSZip.loadAsync(await file.arrayBuffer());
  const result: Detected = {};
  const entries: Array<[string, string]> = [
    ["docProps/core.xml", "DOCX.core-properties"],
    ["docProps/app.xml", "DOCX.application-properties"],
    ["docProps/custom.xml", "DOCX.custom-properties"],
  ];
  for (const [path, label] of entries) {
    const entry = zip.file(path);
    if (!entry) continue;
    const xml = await entry.async("string");
    result[label] = "present";
    const fields = ["title", "subject", "creator", "keywords", "description", "lastModifiedBy", "created", "modified", "customProperties"];
    for (const field of fields) {
      if (new RegExp(`(?:[>:])${field}(?:\\s|>)`, "i").test(xml)) result[`${label}.${field}`] = "detected";
    }
  }
  return result;
}

function inspectIsoBmffBoxes(bytes: Uint8Array, result: Detected) {
  const containers = new Set(["moov", "trak", "mdia", "minf", "stbl", "edts", "udta", "meta", "ilst", "dinf"]);
  const walk = (start: number, end: number) => {
    let offset = start;
    while (offset + 8 <= end) {
      const size32 = new DataView(bytes.buffer, bytes.byteOffset + offset, 4).getUint32(0);
      const type = ascii(bytes, offset + 4, 4);
      let headerSize = 8;
      let boxSize = size32;
      if (size32 === 1 && offset + 16 <= end) {
        const high = new DataView(bytes.buffer, bytes.byteOffset + offset + 8, 4).getUint32(0);
        const low = new DataView(bytes.buffer, bytes.byteOffset + offset + 12, 4).getUint32(0);
        boxSize = high * 0x100000000 + low;
        headerSize = 16;
      } else if (size32 === 0) {
        boxSize = end - offset;
      }
      if (boxSize < headerSize || offset + boxSize > end) return;
      if (type === "udta") result["QuickTime.user-data"] = "present";
      if (type === "meta") result["QuickTime.metadata-box"] = "present";
      if (type === "uuid") result["QuickTime.uuid-metadata"] = "present";
      if (containers.has(type)) walk(offset + headerSize + (type === "meta" ? 4 : 0), offset + boxSize);
      offset += boxSize;
    }
  };
  walk(0, bytes.length);
}

async function inspectContainer(file: File): Promise<Detected> {
  const bytes = new Uint8Array(await file.arrayBuffer());
  const text = textFromBytes(bytes);
  const ext = file.name.split(".").pop()?.toLowerCase() ?? "";
  const result: Detected = {};
  if (ext === "mp3" || ext === "aac") {
    if (ascii(bytes, 0, 3) === "ID3") result["ID3.v2-tag"] = "present";
    if (bytes.length >= 128 && ascii(bytes, bytes.length - 128, 3) === "TAG") result["ID3.v1-tag"] = "present";
    if (hasBytes(bytes, Array.from(new TextEncoder().encode("APETAGEX")))) result["APE.v2-tag"] = "present";
    addMarkerFields(text, [["TIT2", "ID3.title"], ["TPE1", "ID3.artist"], ["TALB", "ID3.album"], ["TDRC", "ID3.date"], ["COMM", "ID3.comment"], ["TXXX", "ID3.user-defined"], ["WXXX", "ID3.link"], ["GEOB", "ID3.embedded-object"], ["APIC", "ID3.picture"]], result);
  } else if (ext === "wav") {
    if (ascii(bytes, 0, 4) === "RIFF" && ascii(bytes, 8, 4) === "WAVE") {
      let offset = 12;
      while (offset + 8 <= bytes.length) {
        const id = ascii(bytes, offset, 4);
        const size = new DataView(bytes.buffer, bytes.byteOffset + offset + 4, 4).getUint32(0, true);
        if (id === "LIST" && ascii(bytes, offset + 8, 4) === "INFO") result["RIFF.INFO-list"] = "present";
        if (id === "bext") result["RIFF.broadcast-extension"] = "present";
        if (id.toLowerCase() === "id3 ") result["RIFF.ID3-chunk"] = "present";
        offset += 8 + size + (size & 1);
      }
    }
  } else if (ext === "flac") {
    if (ascii(bytes, 0, 4) === "fLaC") {
      let offset = 4;
      while (offset + 4 <= bytes.length) {
        const header = bytes[offset];
        const type = header & 0x7f;
        const size = (bytes[offset + 1] << 16) | (bytes[offset + 2] << 8) | bytes[offset + 3];
        const labels: Record<number, string> = { 1: "FLAC.padding", 2: "FLAC.application", 4: "FLAC.Vorbis-comment", 6: "FLAC.picture" };
        if (labels[type]) result[labels[type]] = "present";
        offset += 4 + size;
        if (header & 0x80) break;
      }
    }
  } else if (ext === "webm" || ext === "mkv") {
    if (hasBytes(bytes, [0x12, 0x54, 0xc3, 0x67])) result["Matroska.tags"] = "present";
    if (hasBytes(bytes, [0x10, 0x43, 0xa7, 0x70])) result["Matroska.chapters"] = "present";
    if (hasBytes(bytes, [0x19, 0x41, 0xa4, 0x69])) result["Matroska.attachments"] = "present";
    addMarkerFields(text, [["WritingApp", "Matroska.writing-application"], ["MuxingApp", "Matroska.muxing-application"], ["Location", "Matroska.location"]], result);
  } else {
    inspectIsoBmffBoxes(bytes, result);
  }
  return result;
}

async function inspect(file: File, kind: FileKind | undefined): Promise<{ fields: Detected; limitations: string[]; format: string }> {
  const ext = file.name.split(".").pop()?.toUpperCase() ?? "UNKNOWN";
  if (kind === "jpeg" || kind === "image" || kind === "gif") {
    return { fields: await inspectImage(file), limitations: ["The comparison inspects targeted JPEG markers, PNG chunks, GIF extensions, WebP chunks, and readable image tags; unsupported vendor-specific blocks may not be listed."], format: ext };
  }
  if (kind === "pdf") return { fields: await inspectPdf(file), limitations: ["The comparison checks the PDF document-info dictionary and catalog XMP stream; embedded-object metadata is not inspected."], format: ext };
  if (kind === "docx") return { fields: await inspectDocx(file), limitations: ["The comparison checks DOCX core, application, and custom property parts; metadata inside embedded documents is not inspected."], format: ext };
  if (kind === "container") return { fields: await inspectContainer(file), limitations: ["The comparison inspects targeted ID3, RIFF, FLAC, Matroska, and ISO-BMFF structures; codec-private and unsupported vendor blocks are not fully enumerated."], format: ext };
  return { fields: {}, limitations: ["This file type is not supported by the browser comparison reader."], format: ext };
}

function toFields(original: Detected, cleaned: Detected): { all: MetadataField[]; removed: MetadataField[]; preserved: MetadataField[] } {
  const names = [...new Set([...Object.keys(original), ...Object.keys(cleaned)])].sort();
  const all = names.map((name) => {
    const originalValue = original[name];
    const cleanedValue = cleaned[name];
    const status: MetadataStatus = originalValue && !cleanedValue ? "removed" : originalValue && cleanedValue ? "present" : "not-detected";
    const assessment = assessMetadataField(name);
    return { name, original: originalValue, cleaned: cleanedValue, status, ...assessment };
  });
  return { all, removed: all.filter((field) => field.status === "removed"), preserved: all.filter((field) => field.status === "present") };
}

export async function compareMetadata(original: File, cleaned: File): Promise<MetadataComparison> {
  const kind = getKindForFilename(original.name);
  const [before, after] = await Promise.all([inspect(original, kind), inspect(cleaned, kind)]);
  const fieldSets = toFields(before.fields, after.fields);
  return {
    originalFilename: original.name,
    cleanedFilename: cleaned.name,
    format: before.format,
    detectedOriginalFields: fieldSets.all.filter((field) => field.original),
    detectedCleanedFields: fieldSets.all.filter((field) => field.cleaned),
    removedFields: fieldSets.removed,
    preservedFields: fieldSets.preserved,
    limitations: [...new Set([...before.limitations, ...after.limitations])],
    generatedAt: new Date().toISOString(),
  };
}

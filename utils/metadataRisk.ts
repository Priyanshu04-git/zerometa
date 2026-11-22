export type MetadataRisk = "high" | "medium" | "low";
export type MetadataCategory = "location" | "identity" | "time" | "device" | "content" | "technical" | "container" | "document";

export type MetadataAssessment = {
  category: MetadataCategory;
  risk: MetadataRisk;
  explanation: string;
};

const highRiskRules: Array<{ pattern: RegExp; category: MetadataCategory; explanation: string }> = [
  { pattern: /gps|location|latitude|longitude|altitude/i, category: "location", explanation: "May reveal where the file was captured or edited." },
  { pattern: /author|creator|artist|owner|account|lastmodifiedby|email|username|comment|user-defined|tpe1|writer/i, category: "identity", explanation: "May identify a person, account, or private conversation." },
  { pattern: /serial|device.?id|unique|uuid|document.?id|persistent.?id/i, category: "device", explanation: "May link this file to a specific device, account, or document history." },
];

const mediumRiskRules: Array<{ pattern: RegExp; category: MetadataCategory; explanation: string }> = [
  { pattern: /date|time|created|modified|timestamp|tdrc|creation/i, category: "time", explanation: "May reveal when the file was captured, created, or edited." },
  { pattern: /camera|lens|make|model|software|writing|muxing|producer|encoder|application/i, category: "device", explanation: "May reveal the device, application, or workflow used." },
  { pattern: /title|subject|keyword|description|album|track|copyright|publisher/i, category: "content", explanation: "May expose contextual or descriptive information about the file." },
  { pattern: /docx|pdf|word|core|custom|property|xmp|iptc|exif/i, category: "document", explanation: "May be a document or media property outside the visible content." },
];

export function assessMetadataField(name: string): MetadataAssessment {
  for (const rule of highRiskRules) if (rule.pattern.test(name)) return { category: rule.category, risk: "high", explanation: rule.explanation };
  for (const rule of mediumRiskRules) if (rule.pattern.test(name)) return { category: rule.category, risk: "medium", explanation: rule.explanation };
  if (/id3|riff|flac|matroska|quicktime|isobmff|box|chunk|marker|profile|resolution|sampling|channel|codec|padding|technical/i.test(name)) {
    return { category: /matroska|quicktime|isobmff|riff|flac|id3/i.test(name) ? "container" : "technical", risk: "low", explanation: "Usually technical or structural data; still review it for your use case." };
  }
  return { category: "technical", risk: "low", explanation: "Detected by the format-aware reader; review the value before sharing." };
}

export function riskLabel(risk: MetadataRisk): string {
  return risk === "high" ? "Review carefully" : risk === "medium" ? "Review if sensitive" : "Usually technical";
}

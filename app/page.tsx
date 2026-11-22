"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import JSZip from "jszip";
import { CheckCircle2, Download, Loader2, RotateCcw, ShieldCheck, Square } from "lucide-react";
import { Button } from "@/components/ui/button";
import Dropzone, { type FileStatus, type StoredFile } from "@/components/Dropzone";
import ClearAllButton from "@/components/ClearAllButton";
import ShareFunctions from "@/components/ShareFunctions";
import Hero from "@/components/Hero";
import MetadataComparisonPanel from "@/components/MetadataComparisonPanel";
import type { MetadataComparison } from "@/utils/metadataComparison";
import { evidenceReportJson } from "@/utils/evidenceReport";
import {
  MAX_FILE_COUNT,
  MAX_FILE_SIZE_MB,
  MAX_TOTAL_FILE_SIZE_BYTES,
  MAX_TOTAL_FILE_SIZE_MB,
  getKindForFilename,
  getTotalFileSizeBytes,
} from "@/utils/constants";
import { getFileExtensions } from "@/utils/utils";
import { toast } from "sonner";

type ErrorType = "file_count" | "unsupported_format" | "file_too_large" | "batch_too_large" | "animated_image" | "general" | "dropzone_error";
type ProcessedPair = { original: File; cleaned: File; comparison?: MetadataComparison };

const renameWithSuffix = (file: File, suffix = "_cleaned"): string => {
  const nameParts = file.name.split(".");
  if (nameParts.length < 2) return `${file.name}${suffix}`;
  const ext = nameParts.pop();
  return `${nameParts.join(".")}${suffix}.${ext}`;
};

const showErrorToast = (type: ErrorType) => {
  const messages: Record<ErrorType, { title: string; description: string; severity: "warning" | "error" }> = {
    file_count: { title: "Too many files", description: `You can only queue up to ${MAX_FILE_COUNT} files.`, severity: "warning" },
    unsupported_format: { title: "Unsupported file format", description: `Supported file types: ${getFileExtensions()}`, severity: "warning" },
    file_too_large: { title: "File too large", description: `Each file can be up to ${MAX_FILE_SIZE_MB} MB.`, severity: "warning" },
    batch_too_large: { title: "Batch too large", description: `Queued files can total up to ${MAX_TOTAL_FILE_SIZE_MB} MB. Remove a file or choose a smaller batch.`, severity: "warning" },
    animated_image: { title: "Animated image not supported", description: "Animated PNG and WebP files are rejected because browser cleaning would flatten them to one frame.", severity: "warning" },
    general: { title: "Something went wrong", description: "The file was not changed. Review the per-file error and try again.", severity: "error" },
    dropzone_error: { title: "Couldn't queue files", description: "An error occurred while queuing your files.", severity: "error" },
  };
  const { title, description, severity } = messages[type];
  (severity === "warning" ? toast.warning : toast.error)(title, { description, duration: 5000, dismissible: true });
};

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export default function Home() {
  const [fileStore, setFileStore] = useState<StoredFile[]>([]);
  const [fileStatuses, setFileStatuses] = useState<Record<string, FileStatus>>({});
  const [fileErrors, setFileErrors] = useState<Record<string, string>>({});
  const [processedPairs, setProcessedPairs] = useState<Record<string, ProcessedPair>>({});
  const [comparisonLoading, setComparisonLoading] = useState<Record<string, boolean>>({});
  const [processing, setProcessing] = useState(false);
  const [activeFileId, setActiveFileId] = useState<string | null>(null);
  const cancelRequested = useRef(false);

  const stats = useMemo(() => {
    const statuses = fileStore.map(({ id }) => fileStatuses[id] ?? "idle");
    return {
      total: fileStore.length,
      queued: statuses.filter((status) => status === "idle").length,
      processing: statuses.filter((status) => status === "processing").length,
      done: statuses.filter((status) => status === "done").length,
      failed: statuses.filter((status) => status === "failed").length,
      sizeMb: getTotalFileSizeBytes(fileStore.map(({ file }) => file)) / (1024 * 1024),
    };
  }, [fileStore, fileStatuses]);

  const comparisons = useMemo(
    () => Object.values(processedPairs).map((pair) => pair.comparison).filter((comparison): comparison is MetadataComparison => Boolean(comparison)),
    [processedPairs],
  );

  const handleFilesAccepted = (newFiles: File[]) => {
    const totalCount = fileStore.length + newFiles.length;
    if (totalCount > MAX_FILE_COUNT) return showErrorToast("file_count");
    const totalSize = getTotalFileSizeBytes([...fileStore.map(({ file }) => file), ...newFiles]);
    if (totalSize > MAX_TOTAL_FILE_SIZE_BYTES) return showErrorToast("batch_too_large");
    const wrapped = newFiles.map((file) => ({ id: crypto.randomUUID(), file }));
    setFileStore((previous) => [...previous, ...wrapped].slice(0, MAX_FILE_COUNT));
    toast.success(newFiles.length === 1 ? "1 file queued" : `${newFiles.length} files queued`, { duration: 1700 });
  };

  const handleFileRemoved = (id: string) => {
    setFileStore((previous) => previous.filter((stored) => stored.id !== id));
    setProcessedPairs((previous) => { const next = { ...previous }; delete next[id]; return next; });
    setFileStatuses((previous) => { const next = { ...previous }; delete next[id]; return next; });
    setFileErrors((previous) => { const next = { ...previous }; delete next[id]; return next; });
  };

  const handleClearAll = () => {
    if (processing) return;
    setFileStore([]);
    setFileStatuses({});
    setFileErrors({});
    setProcessedPairs({});
    setComparisonLoading({});
  };

  const processFiles = async (targetIds: string[], isRetry = false) => {
    if (targetIds.length === 0) return;
    cancelRequested.current = false;
    setProcessing(true);
    setFileErrors((previous) => isRetry ? Object.fromEntries(Object.entries(previous).filter(([id]) => !targetIds.includes(id))) : {});
    if (!isRetry) {
      setProcessedPairs({});
      setComparisonLoading({});
    }

    const { stripImageMetadata, stripGifMetadata, stripPdfMetadata, stripDocxMetadata, stripContainerMetadata, stripJpegMetadata } = await import("@/utils/stripMetadata");
    const { inspectRasterAnimation } = await import("@/utils/imageAnimation");
    const cleanedFiles: File[] = [];
    let failedCount = 0;
    let cancelled = false;

    for (const id of targetIds) {
      if (cancelRequested.current) { cancelled = true; break; }
      const stored = fileStore.find((item) => item.id === id);
      if (!stored) continue;
      setActiveFileId(id);
      setFileStatuses((previous) => ({ ...previous, [id]: "processing" }));
      try {
        let cleaned: File | null = null;
        switch (getKindForFilename(stored.file.name)) {
          case "jpeg": cleaned = await stripJpegMetadata(stored.file); break;
          case "image": {
            const animationStatus = await inspectRasterAnimation(stored.file);
            if (animationStatus === "animated") { showErrorToast("animated_image"); throw new Error("Animated image is not supported"); }
            cleaned = await stripImageMetadata(stored.file, animationStatus);
            break;
          }
          case "gif": cleaned = await stripGifMetadata(stored.file); break;
          case "pdf": cleaned = await stripPdfMetadata(stored.file); break;
          case "docx": cleaned = await stripDocxMetadata(stored.file); break;
          case "container": cleaned = await stripContainerMetadata(stored.file); break;
          default: throw new Error("Unsupported file format");
        }
        if (!cleaned) throw new Error("The format could not be parsed safely");
        const renamed = new File([cleaned], renameWithSuffix(stored.file), { type: cleaned.type });
        cleanedFiles.push(renamed);
        setProcessedPairs((previous) => ({ ...previous, [id]: { original: stored.file, cleaned: renamed } }));
        setFileStatuses((previous) => ({ ...previous, [id]: "done" }));
      } catch (error) {
        failedCount += 1;
        setFileStatuses((previous) => ({ ...previous, [id]: "failed" }));
        setFileErrors((previous) => ({ ...previous, [id]: error instanceof Error ? error.message : "Processing failed safely" }));
      }
    }

    if (cleanedFiles.length === 1) downloadBlob(cleanedFiles[0], cleanedFiles[0].name);
    if (cleanedFiles.length > 1) {
      const zip = new JSZip();
      cleanedFiles.forEach((file) => zip.file(file.name, file));
      downloadBlob(await zip.generateAsync({ type: "blob" }), "ZeroMeta_cleaned.zip");
    }
    if (cancelled) toast.info("Processing paused", { description: "Completed files are kept. Retry failed or queued files when ready." });
    else if (failedCount === 0 && cleanedFiles.length > 0) toast.success("Cleaning complete", { description: "Your download was created locally." });
    else if (cleanedFiles.length > 0) toast.warning(`${failedCount} file${failedCount === 1 ? "" : "s"} failed`, { description: "Review the file-level message and retry only those files." });
    else if (failedCount > 0) showErrorToast("general");
    setActiveFileId(null);
    setProcessing(false);
  };

  const handleMetadataRemoval = () => processFiles(fileStore.map(({ id }) => id));
  const handleRetry = () => processFiles(fileStore.filter(({ id }) => fileStatuses[id] === "failed").map(({ id }) => id), true);
  const handleCancel = () => { cancelRequested.current = true; };

  const handleCompare = async (id: string) => {
    const pair = processedPairs[id];
    if (!pair || comparisonLoading[id]) return;
    setComparisonLoading((previous) => ({ ...previous, [id]: true }));
    try {
      const { compareMetadata } = await import("@/utils/metadataComparison");
      const comparison = await compareMetadata(pair.original, pair.cleaned);
      setProcessedPairs((previous) => ({ ...previous, [id]: { ...pair, comparison } }));
    } catch (error) {
      console.error("Metadata comparison failed:", error);
      toast.error("Comparison unavailable", { description: "The files were cleaned successfully, but the local report could not be generated." });
    } finally {
      setComparisonLoading((previous) => ({ ...previous, [id]: false }));
    }
  };

  const downloadReport = (reportComparisons: MetadataComparison[], filename: string) => {
    if (reportComparisons.length === 0) return toast.info("Compare at least one cleaned file first");
    downloadBlob(new Blob([evidenceReportJson(reportComparisons)], { type: "application/json" }), filename);
  };

  useEffect(() => { document.title = processing ? "Cleaning metadata locally…" : "Free & Private Metadata Remover"; }, [processing]);

  return (
    <div className="w-full flex flex-col gap-(--fluid-xl-3xl) items-center py-(--fluid-md-2xl)">
      <div className="flex w-full items-center justify-between gap-3 rounded-full border border-border bg-card/70 px-4 py-2 text-xs shadow-sm">
        <span className="flex items-center gap-2 font-medium"><ShieldCheck className="size-4 text-(--accent-primary)" /> Local-only processing</span>
        <span className="text-muted-foreground">No file upload · no account · evidence stays in this tab</span>
      </div>
      <Hero />
      <div className="grid w-full gap-(--fluid-lg-xl) xl:grid-cols-[minmax(0,1.3fr)_minmax(320px,0.7fr)] xl:items-start">
        <section className="flex min-w-0 flex-col gap-(--fluid-lg-xl)" aria-label="Metadata cleaner workspace">
          <Dropzone processing={processing} fileStore={fileStore} fileStatuses={fileStatuses} fileErrors={fileErrors} onFilesAccepted={handleFilesAccepted} onFileRemove={handleFileRemoved} onError={showErrorToast} />
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border bg-card p-3 shadow-sm">
            <ClearAllButton fileStore={fileStore} processing={processing} onClearAll={handleClearAll} />
            <div className="flex flex-wrap gap-2">
              {processing ? <Button type="button" variant="outline" onClick={handleCancel}><Square className="mr-2 size-4" /> Stop after current file</Button> : <Button type="button" variant="outline" disabled={stats.failed === 0} onClick={handleRetry}><RotateCcw className="mr-2 size-4" /> Retry failed ({stats.failed})</Button>}
              <Button className="type-fluid type-button-lg px-(--fluid-md-xl)" disabled={fileStore.length === 0 || processing} onClick={handleMetadataRemoval}>
                {processing && <Loader2 className="mr-2 animate-spin" />} {processing ? "Cleaning…" : "Remove metadata"}
              </Button>
            </div>
          </div>
          {stats.done > 0 && (
            <section className="rounded-2xl border border-border bg-card p-(--fluid-md-xl) shadow-sm" aria-label="Metadata comparison results">
              <div className="mb-4 flex flex-wrap items-start justify-between gap-3"><div><h2 className="type-fluid type-heading-md">Evidence workspace</h2><p className="mt-1 text-sm text-muted-foreground">Inspect each cleaned file locally, then print or download a structured evidence report.</p></div><Button type="button" variant="outline" size="sm" onClick={() => downloadReport(comparisons, "ZeroMeta_evidence_report.json")}><Download className="mr-2 size-4" /> Batch JSON report</Button></div>
              <div className="flex flex-col gap-4">
                {fileStore.filter(({ id }) => fileStatuses[id] === "done" && processedPairs[id]).map(({ id, file }) => {
                  const pair = processedPairs[id];
                  if (!pair) return null;
                  return <div key={id} className="rounded-xl border border-border p-4"><div className="flex flex-wrap items-center justify-between gap-2"><div><p className="font-medium">{file.name}</p><p className="text-xs text-muted-foreground">Processed as {pair.cleaned.name}</p></div>{!pair.comparison && <MetadataComparisonPanel loading={comparisonLoading[id]} onCompare={() => handleCompare(id)} />}</div>{pair.comparison && <MetadataComparisonPanel comparison={pair.comparison} onCompare={() => handleCompare(id)} onDownloadReport={() => downloadReport([pair.comparison!], `${file.name}_evidence.json`)} onPrintReport={() => window.print()} />}</div>;
                })}
              </div>
            </section>
          )}
        </section>
        <aside className="sticky top-4 flex flex-col gap-4" aria-label="Batch dashboard">
          <section className="rounded-2xl border border-border bg-card p-5 shadow-sm"><div className="flex items-center justify-between"><div><p className="text-xs font-semibold uppercase tracking-[0.18em] text-(--accent-primary)">Batch dashboard</p><h2 className="mt-1 text-xl font-semibold">Your queue at a glance</h2></div><CheckCircle2 className="size-6 text-(--accent-primary)" /></div><div className="mt-5 grid grid-cols-2 gap-2 sm:grid-cols-4 xl:grid-cols-2"><div className="rounded-xl bg-muted p-3"><p className="text-xs text-muted-foreground">Queued</p><p className="mt-1 text-2xl font-semibold tabular-nums">{stats.queued}</p></div><div className="rounded-xl bg-muted p-3"><p className="text-xs text-muted-foreground">Done</p><p className="mt-1 text-2xl font-semibold tabular-nums text-emerald-600">{stats.done}</p></div><div className="rounded-xl bg-muted p-3"><p className="text-xs text-muted-foreground">Failed</p><p className="mt-1 text-2xl font-semibold tabular-nums text-rose-600">{stats.failed}</p></div><div className="rounded-xl bg-muted p-3"><p className="text-xs text-muted-foreground">Size</p><p className="mt-1 text-2xl font-semibold tabular-nums">{stats.sizeMb.toFixed(1)}<span className="text-sm"> MB</span></p></div></div>{activeFileId && <p className="mt-4 text-sm text-muted-foreground" role="status" aria-live="polite">Working on {fileStore.find(({ id }) => id === activeFileId)?.file.name ?? "current file"}…</p>}{stats.failed > 0 && <p className="mt-4 rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-800 dark:border-rose-900 dark:bg-rose-950/30 dark:text-rose-200">Failed files are unchanged. Review their messages in the queue and use Retry failed.</p>}</section>
          <section className="rounded-2xl border border-border bg-(--accent-secondary) p-5"><h2 className="font-semibold">What ZeroMeta can prove</h2><p className="mt-2 text-sm leading-6 text-muted-foreground">It can show targeted structures detected before and after processing. It cannot prove that every vendor-private value is gone, and it does not redact visible content.</p></section>
        </aside>
      </div>
      <div className="h-0.75 w-full rounded-full bg-foreground" />
      <ShareFunctions />
    </div>
  );
}

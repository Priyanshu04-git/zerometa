"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import { ClipboardPaste, File as FileIcon, FolderOpen, X, Loader2, CheckCircle2, XCircle } from "lucide-react";
import { Button } from "./ui/button";
import Typography from "./Typography";
import { MAX_FILE_SIZE_BYTES, MAX_FILE_COUNT, MAX_TOTAL_FILE_SIZE_MB, ACCEPTED_FILE_TYPES, getKindForFilename, getTotalFileSizeBytes } from "@/utils/constants";
import { toast } from "sonner";

export type FileStatus = "idle" | "processing" | "done" | "failed";
export type StoredFile = { id: string; file: File };

type DropzoneProps = {
  fileStore: StoredFile[];
  fileStatuses: Record<string, FileStatus>;
  fileErrors?: Record<string, string>;
  onFilesAccepted: (files: File[]) => void;
  onFileRemove: (id: string) => void;
  onError: (type: "unsupported_format" | "file_too_large" | "dropzone_error") => void;
  processing: boolean;
};

const acceptedExtensions = Array.from(new Set(Object.values(ACCEPTED_FILE_TYPES).flatMap(({ extensions }) => extensions)));
const acceptedExtensionsLabel = acceptedExtensions.map((ext) => ext.replace(/^\./, "").toUpperCase()).join(" · ");

export default function Dropzone({ fileStore, fileStatuses, fileErrors = {}, onFilesAccepted, onFileRemove, onError, processing }: DropzoneProps) {
  const [highlight, setHighlight] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const queuedSizeMb = getTotalFileSizeBytes(fileStore.map(({ file }) => file)) / (1024 * 1024);

  const handleFiles = useCallback((files: FileList | File[]) => {
    try {
      const newFiles: File[] = [];
      let reportedInvalid = false;
      for (const file of Array.from(files)) {
        if (getKindForFilename(file.name) === undefined) {
          if (!reportedInvalid) onError("unsupported_format");
          reportedInvalid = true;
          continue;
        }
        if (file.size > MAX_FILE_SIZE_BYTES) {
          if (!reportedInvalid) onError("file_too_large");
          reportedInvalid = true;
          continue;
        }
        newFiles.push(file);
      }
      if (newFiles.length > 0) onFilesAccepted(newFiles);
      if (fileInputRef.current) fileInputRef.current.value = "";
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
        fileInputRef.current.removeAttribute("webkitdirectory");
        fileInputRef.current.removeAttribute("directory");
      }
    } catch (error) {
      console.error(error);
      onError("dropzone_error");
    }
  }, [onError, onFilesAccepted]);

  useEffect(() => {
    const handlePaste = (event: ClipboardEvent) => {
      if (processing) return;
      const files = event.clipboardData?.files;
      if (files && files.length > 0) {
        event.preventDefault();
        handleFiles(files);
      }
    };
    window.addEventListener("paste", handlePaste);
    return () => window.removeEventListener("paste", handlePaste);
  }, [handleFiles, processing]);

  const openFilePicker = () => {
    if (processing) return;
    fileInputRef.current?.removeAttribute("webkitdirectory");
    fileInputRef.current?.removeAttribute("directory");
    fileInputRef.current?.click();
  };
  const openFolderPicker = (event: React.MouseEvent) => {
    event.stopPropagation();
    if (processing) return;
    fileInputRef.current?.setAttribute("webkitdirectory", "");
    fileInputRef.current?.setAttribute("directory", "");
    fileInputRef.current?.click();
  };

  return (
    <div className="w-full flex flex-col gap-(--space-md)">
      <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
        <span>{acceptedExtensionsLabel}</span>
        <span>Up to {MAX_FILE_COUNT} files · {MAX_TOTAL_FILE_SIZE_MB} MB total</span>
      </div>
      <div
        role="button"
        tabIndex={0}
        aria-label="Add files: drag and drop, paste, or activate to browse"
        aria-disabled={processing}
        className={`relative flex min-h-80 flex-col items-center justify-center gap-5 overflow-hidden rounded-3xl border-2 border-dashed p-(--space-3xl) transition-all ${highlight ? "border-(--accent-primary) bg-(--accent-secondary) shadow-[0_0_0_5px_color-mix(in_srgb,var(--accent-primary)_16%,transparent)]" : "border-border bg-card/80"} ${processing ? "cursor-not-allowed opacity-70" : "cursor-pointer hover:border-(--accent-primary) hover:bg-card"}`}
        onClick={openFilePicker}
        onKeyDown={(event) => { if (event.target === event.currentTarget && (event.key === "Enter" || event.key === " ")) { event.preventDefault(); openFilePicker(); } }}
        onDragOver={(event) => { if (!processing) { event.preventDefault(); setHighlight(true); } }}
        onDragLeave={() => { if (!processing) setHighlight(false); }}
        onDrop={(event) => { if (!processing) { event.preventDefault(); setHighlight(false); handleFiles(event.dataTransfer.files); event.dataTransfer.clearData(); } }}
      >
        <input ref={fileInputRef} type="file" multiple accept={acceptedExtensions.join(",")} onClick={(event) => event.stopPropagation()} onChange={(event) => event.target.files && handleFiles(event.target.files)} className="hidden" aria-hidden="true" />
        <div className="flex size-16 items-center justify-center rounded-2xl bg-(--accent-secondary) text-(--accent-primary)"><FileIcon size={30} strokeWidth={1.8} /></div>
        <div className="flex flex-col items-center text-center leading-tight"><Typography as="p" variant="label" className="leading-tight">Drop files here</Typography><Typography as="p" variant="bodySm" muted className="mt-2">or click to browse · paste an image/file from your clipboard</Typography></div>
        <p className="max-w-xl text-center text-xs leading-5 text-muted-foreground">HEIC/HEIF, OGG, TIFF, and AVI are not accepted yet because ZeroMeta does not have validated structure-specific cleaners for them.</p>
        <div className="flex flex-wrap justify-center gap-2" onClick={(event) => event.stopPropagation()}>
          <Button type="button" variant="outline" size="sm" disabled={processing} onClick={openFolderPicker}><FolderOpen className="mr-2 size-4" /> Choose folder</Button>
          <Button type="button" variant="ghost" size="sm" disabled={processing} onClick={() => toast.info("Paste a file with Ctrl/Cmd + V while this page is focused")}><ClipboardPaste className="mr-2 size-4" /> Paste from clipboard</Button>
        </div>
        {fileStore.length > 0 && <ul className="w-full max-w-2xl space-y-2 text-left" aria-label="Queued files">{fileStore.map(({ id, file }) => {
          const status = fileStatuses[id] ?? "idle";
          return <li key={id} className="rounded-xl border border-border/80 bg-background/70 p-3"><div className="flex items-center gap-3"><FileIcon className="size-5 shrink-0 text-(--accent-primary)" /><div className="min-w-0 flex-1"><Typography as="p" variant="bodySm" weight={500} className="truncate">{file.name}</Typography>{fileErrors[id] && <p className="mt-1 text-xs text-rose-600 dark:text-rose-300">{fileErrors[id]}</p>}</div>{status === "processing" && <Loader2 className="size-5 shrink-0 animate-spin text-(--accent-primary)" aria-label="Processing" />}{status === "done" && <CheckCircle2 className="size-5 shrink-0 text-emerald-500" aria-label="Complete" />}{status === "failed" && <XCircle className="size-5 shrink-0 text-rose-500" aria-label="Failed" />}<Button onClick={(event) => { event.stopPropagation(); onFileRemove(id); }} variant="ghost" size="icon" disabled={processing} aria-label={`Remove ${file.name}`}><X /></Button></div></li>;
        })}</ul>}
        <Typography as="p" variant="bodySm" weight={500} muted className="absolute bottom-(--space-md) right-(--space-xl)">{`${fileStore.length}/${MAX_FILE_COUNT} files · ${queuedSizeMb.toFixed(1)}/${MAX_TOTAL_FILE_SIZE_MB} MB`}</Typography>
        <p className="sr-only" aria-live="polite">{processing ? "Processing files locally" : `${fileStore.length} files queued`}</p>
      </div>
    </div>
  );
}

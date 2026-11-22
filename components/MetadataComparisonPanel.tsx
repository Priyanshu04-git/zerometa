"use client";

import { Button } from "@/components/ui/button";
import type { MetadataComparison } from "@/utils/metadataComparison";
import { CheckCircle2, Download, Eye, EyeOff, FileSearch, Info, Loader2, Printer, ShieldAlert } from "lucide-react";

const riskStyles = {
  high: "border-rose-300 bg-rose-50 text-rose-800 dark:border-rose-900 dark:bg-rose-950/30 dark:text-rose-200",
  medium: "border-amber-300 bg-amber-50 text-amber-800 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-200",
  low: "border-slate-300 bg-slate-50 text-slate-700 dark:border-slate-700 dark:bg-slate-900/40 dark:text-slate-300",
};

export default function MetadataComparisonPanel({
  comparison,
  loading,
  onCompare,
  onDownloadReport,
  onPrintReport,
}: {
  comparison?: MetadataComparison;
  loading?: boolean;
  onCompare: () => void;
  onDownloadReport?: () => void;
  onPrintReport?: () => void;
}) {
  if (loading) {
    return <div className="flex items-center gap-2 text-sm text-muted-foreground" role="status" aria-live="polite"><Loader2 className="size-4 animate-spin" /> Inspecting both files locally…</div>;
  }

  if (!comparison) {
    return (
      <Button type="button" variant="outline" size="sm" onClick={onCompare}>
        <Eye className="mr-2 size-4" /> Compare metadata
      </Button>
    );
  }

  const highRiskCount = [...comparison.removedFields, ...comparison.preservedFields].filter((field) => field.risk === "high").length;
  const mediumRiskCount = [...comparison.removedFields, ...comparison.preservedFields].filter((field) => field.risk === "medium").length;
  const allFields = [...comparison.removedFields, ...comparison.preservedFields];

  return (
    <div className="mt-3 rounded-2xl border border-border bg-background/80 p-4 text-sm shadow-[0_12px_40px_-28px_rgba(0,0,0,0.55)]" aria-label={`Metadata comparison for ${comparison.originalFilename}`}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="flex items-center gap-2 font-semibold"><FileSearch className="size-4 text-(--accent-primary)" /> Before vs after</p>
          <p className="text-xs text-muted-foreground">Detected fields only · runs in your browser · no upload · {comparison.format}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {onPrintReport && <Button type="button" variant="ghost" size="sm" onClick={onPrintReport}><Printer className="mr-1.5 size-4" /> Print</Button>}
          {onDownloadReport && <Button type="button" variant="ghost" size="sm" onClick={onDownloadReport}><Download className="mr-1.5 size-4" /> JSON report</Button>}
        </div>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 dark:border-emerald-900 dark:bg-emerald-950/30">
          <div className="flex items-center gap-2 font-medium text-emerald-800 dark:text-emerald-300"><CheckCircle2 className="size-4" /> Removed</div>
          <p className="mt-1 text-2xl font-semibold tabular-nums">{comparison.removedFields.length}</p>
          <p className="text-xs text-muted-foreground">detected in original, absent after processing</p>
        </div>
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 dark:border-amber-900 dark:bg-amber-950/30">
          <div className="flex items-center gap-2 font-medium text-amber-800 dark:text-amber-300"><EyeOff className="size-4" /> Still present</div>
          <p className="mt-1 text-2xl font-semibold tabular-nums">{comparison.preservedFields.length}</p>
          <p className="text-xs text-muted-foreground">detected in both files, usually technical data</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-900/30">
          <div className="flex items-center gap-2 font-medium"><Info className="size-4" /> Risk flags</div>
          <p className="mt-1 text-2xl font-semibold tabular-nums">{highRiskCount + mediumRiskCount}</p>
          <p className="text-xs text-muted-foreground">{highRiskCount} high · {mediumRiskCount} medium · {Math.max(0, allFields.length - highRiskCount - mediumRiskCount)} low</p>
        </div>
      </div>

      {comparison.removedFields.length > 0 ? (
        <div className="mt-4">
          <p className="mb-2 font-medium">Removed fields</p>
          <div className="flex flex-wrap gap-2">
            {comparison.removedFields.map((field) => <span key={field.name} title={field.explanation} className={`rounded-full border px-2.5 py-1 text-xs ${riskStyles[field.risk]}`}>{field.name}</span>)}
          </div>
        </div>
      ) : (
        <div className="mt-4 flex gap-2 rounded-xl border border-border p-3 text-muted-foreground"><ShieldAlert className="mt-0.5 size-4 shrink-0" /><span>No removable field was detected by the browser reader. This is not proof that the file contains no hidden metadata.</span></div>
      )}

      {allFields.length > 0 && (
        <details className="mt-4 rounded-xl border border-border bg-card/50 p-3">
          <summary className="cursor-pointer font-medium">Show metadata details and risk explanations</summary>
          <div className="mt-3 grid gap-2">
            {allFields.map((field) => (
              <div key={`${field.status}-${field.name}`} className="grid gap-2 rounded-lg border border-border/70 p-3 sm:grid-cols-[minmax(0,1fr)_auto]">
                <div className="min-w-0">
                  <p className="font-medium break-words">{field.name}</p>
                  <p className="text-xs text-muted-foreground">{field.category} · {field.explanation}</p>
                  <p className="mt-1 break-words text-xs"><span className="text-muted-foreground">Before:</span> {field.original ?? "not detected"} <span className="mx-1 text-muted-foreground">→</span> <span className="text-muted-foreground">After:</span> {field.cleaned ?? "not detected"}</p>
                </div>
                <span className={`h-fit rounded-full border px-2 py-1 text-[11px] font-medium ${riskStyles[field.risk]}`}>{field.risk}</span>
              </div>
            ))}
          </div>
        </details>
      )}

      {comparison.preservedFields.length > 0 && <p className="mt-3 text-xs text-muted-foreground">Still present: {comparison.preservedFields.map((field) => field.name).join(", ")}</p>}
      <div className="mt-4 border-t border-border pt-3 text-xs text-muted-foreground"><strong>Scope:</strong> {comparison.limitations.join(" ")} This comparison is evidence of detected/targeted differences, not a guarantee that every possible hidden value has been removed. Review visible content and filenames separately.</div>
    </div>
  );
}

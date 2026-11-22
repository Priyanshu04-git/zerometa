import type { MetadataComparison } from "./metadataComparison";
import { assessMetadataField, riskLabel } from "./metadataRisk";

export type EvidenceReport = {
  product: "ZeroMeta";
  generatedAt: string;
  processing: "browser-local";
  files: Array<{
    originalFilename: string;
    cleanedFilename: string;
    format: string;
    removed: number;
    stillPresent: number;
    detectedOriginal: number;
    removedFields: Array<{ name: string; risk: string; category: string; original?: string }>;
    preservedFields: Array<{ name: string; risk: string; category: string; cleaned?: string }>;
    limitations: string[];
  }>;
  caveat: string;
};

export function buildEvidenceReport(comparisons: MetadataComparison[]): EvidenceReport {
  return {
    product: "ZeroMeta",
    generatedAt: new Date().toISOString(),
    processing: "browser-local",
    files: comparisons.map((comparison) => ({
      originalFilename: comparison.originalFilename,
      cleanedFilename: comparison.cleanedFilename,
      format: comparison.format,
      removed: comparison.removedFields.length,
      stillPresent: comparison.preservedFields.length,
      detectedOriginal: comparison.detectedOriginalFields.length,
      removedFields: comparison.removedFields.map((field) => {
        const assessment = assessMetadataField(field.name);
        return { name: field.name, risk: riskLabel(assessment.risk), category: assessment.category, original: field.original };
      }),
      preservedFields: comparison.preservedFields.map((field) => {
        const assessment = assessMetadataField(field.name);
        return { name: field.name, risk: riskLabel(assessment.risk), category: assessment.category, cleaned: field.cleaned };
      }),
      limitations: comparison.limitations,
    })),
    caveat: "This report records detected, targeted differences. It is not proof that every possible hidden value has been removed, and it does not make a file anonymous.",
  };
}

export function evidenceReportJson(comparisons: MetadataComparison[]): string {
  return JSON.stringify(buildEvidenceReport(comparisons), null, 2);
}

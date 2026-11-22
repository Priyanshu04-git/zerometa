import Link from "next/link";
import { ArrowRight, FileCheck2, ShieldCheck, Workflow } from "lucide-react";

export const metadata = {
  title: "About ZeroMeta",
  description: "Learn how ZeroMeta removes targeted metadata locally in your browser and what its evidence reports can and cannot prove.",
};

const supportedGroups = [
  { label: "Images", formats: "JPEG / JPG, PNG, WebP, GIF" },
  { label: "Documents", formats: "PDF and DOCX" },
  { label: "Video", formats: "MP4, MOV, MKV, WebM" },
  { label: "Audio", formats: "WAV, MP3, FLAC, AAC, M4A" },
];

export default function AboutPage() {
  return (
    <article className="mx-auto flex w-full max-w-4xl flex-col gap-(--fluid-xl-3xl) py-(--fluid-md-2xl)">
      <header className="max-w-3xl">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-(--accent-primary)">About ZeroMeta</p>
        <h1 className="mt-4 type-fluid type-h1 leading-[1.02]">A privacy lab for everyday files.</h1>
        <p className="mt-6 max-w-2xl text-lg leading-8 text-muted-foreground">ZeroMeta is a browser-only metadata cleaner for people who want a practical privacy check before sharing a file. Your file is read, transformed, compared, and downloaded in your own browser.</p>
      </header>

      <section className="grid gap-4 md:grid-cols-3" aria-label="ZeroMeta principles">
        {[
          [ShieldCheck, "Local by design", "There is no file-processing upload endpoint, account, or server-side transformation."],
          [Workflow, "Evidence over promises", "Reports show targeted structures detected before and after processing instead of claiming perfect anonymity."],
          [FileCheck2, "Safe failure", "Unsupported or unsafe-to-parse inputs are rejected rather than silently rewritten."],
        ].map(([Icon, title, description]) => {
          const FeatureIcon = Icon as typeof ShieldCheck;
          return <div key={title as string} className="rounded-2xl border border-border bg-card p-5 shadow-sm"><FeatureIcon className="size-6 text-(--accent-primary)" aria-hidden="true" /><h2 className="mt-4 font-semibold">{title as string}</h2><p className="mt-2 text-sm leading-6 text-muted-foreground">{description as string}</p></div>;
        })}
      </section>

      <section className="rounded-3xl border border-border bg-card p-(--fluid-md-xl) shadow-sm">
        <h2 className="type-fluid type-heading-md">Supported today</h2>
        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          {supportedGroups.map((group) => <div key={group.label} className="rounded-xl border border-border/80 bg-background/70 p-4"><p className="text-xs font-semibold uppercase tracking-[0.14em] text-(--accent-primary)">{group.label}</p><p className="mt-2 text-sm leading-6">{group.formats}</p></div>)}
        </div>
        <p className="mt-5 text-sm leading-6 text-muted-foreground">HEIC/HEIF, OGG, TIFF, and AVI remain intentionally unsupported until ZeroMeta has safe structure-specific cleaners and regression fixtures for them.</p>
      </section>

      <section className="grid gap-5 md:grid-cols-2">
        <div>
          <h2 className="type-fluid type-heading-md">What the cleaner does</h2>
          <p className="mt-3 leading-7 text-muted-foreground">Each supported format uses a format-aware pipeline. For example, JPEG markers, PNG chunks, GIF extensions, PDF information structures, DOCX properties, and media-container tags are handled without sending the original bytes to a remote service.</p>
        </div>
        <div>
          <h2 className="type-fluid type-heading-md">What it does not do</h2>
          <p className="mt-3 leading-7 text-muted-foreground">Metadata removal does not redact visible captions, faces, watermarks, or text. The comparison report covers detected and targeted structures only; vendor-private values and embedded objects may fall outside its scope.</p>
        </div>
      </section>

      <div className="flex flex-wrap gap-3 border-t border-border pt-6">
        <Link className="inline-flex items-center rounded-full bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/85 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" href="/">Clean a file <ArrowRight className="ml-2 size-4" /></Link>
        <Link className="inline-flex items-center rounded-full border border-border px-5 py-3 text-sm font-semibold transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" href="/privacy.html">Read the privacy notes</Link>
      </div>
    </article>
  );
}

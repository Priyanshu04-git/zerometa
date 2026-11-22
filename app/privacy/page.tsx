import Link from "next/link";
import { ArrowRight, Check, LockKeyhole, TriangleAlert } from "lucide-react";

export const metadata = {
  title: "Privacy notes | ZeroMeta",
  description: "Understand what ZeroMeta processes locally, what leaves the browser, and the limits of browser-based metadata evidence.",
};

const localSteps = ["File bytes are selected or dropped into this browser tab.", "A format-specific cleaner creates a new local file in memory.", "ZeroMeta compares targeted structures locally when you request an evidence report.", "The cleaned file and JSON report are downloaded through your browser."];

export default function PrivacyPage() {
  return (
    <article className="mx-auto flex w-full max-w-4xl flex-col gap-(--fluid-xl-3xl) py-(--fluid-md-2xl)">
      <header className="max-w-3xl">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-(--accent-primary)">Privacy notes</p>
        <h1 className="mt-4 type-fluid type-h1 leading-[1.02]">Your files stay in your browser.</h1>
        <p className="mt-6 max-w-2xl text-lg leading-8 text-muted-foreground">ZeroMeta is designed as a static, client-side application. It does not need an account or a file upload to clean supported files.</p>
      </header>

      <section className="rounded-3xl border border-(--accent-primary)/30 bg-(--accent-secondary) p-(--fluid-md-xl)" aria-labelledby="local-processing-heading">
        <div className="flex items-start gap-4"><LockKeyhole className="mt-1 size-7 shrink-0 text-(--accent-primary)" aria-hidden="true" /><div><h2 id="local-processing-heading" className="type-fluid type-heading-md">What happens locally</h2><ol className="mt-5 space-y-4">{localSteps.map((step, index) => <li key={step} className="flex gap-3 text-sm leading-6"><span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-foreground text-xs font-semibold text-background">{index + 1}</span><span>{step}</span></li>)}</ol></div></div>
      </section>

      <section className="grid gap-5 md:grid-cols-2">
        <div className="rounded-2xl border border-border bg-card p-5 shadow-sm"><h2 className="font-semibold">What ZeroMeta does not collect</h2><ul className="mt-4 space-y-3 text-sm leading-6 text-muted-foreground">{["Original file bytes for metadata processing", "A user account or password", "A server-side copy of your cleaned file", "The contents of your evidence report"].map((item) => <li key={item} className="flex gap-2"><Check className="mt-1 size-4 shrink-0 text-emerald-600" aria-hidden="true" />{item}</li>)}</ul></div>
        <div className="rounded-2xl border border-border bg-card p-5 shadow-sm"><h2 className="font-semibold">What may still be visible</h2><ul className="mt-4 space-y-3 text-sm leading-6 text-muted-foreground">{["Normal website requests, browser cache, and hosting logs", "Analytics or advertising requests loaded by the published site", "The visible content inside the file", "Metadata structures outside the targeted comparison scope"].map((item) => <li key={item} className="flex gap-2"><TriangleAlert className="mt-1 size-4 shrink-0 text-amber-600" aria-hidden="true" />{item}</li>)}</ul></div>
      </section>

      <section>
        <h2 className="type-fluid type-heading-md">Evidence is not a guarantee of anonymity</h2>
        <p className="mt-3 max-w-3xl leading-7 text-muted-foreground">The evidence workspace reports targeted structures detected before and after processing. A field marked as removed means it was detected in the original and absent from the cleaned file under the implemented format-specific checks. It does not prove that every hidden, vendor-private, embedded-object, or forensic value is gone.</p>
      </section>

      <section className="rounded-2xl border border-border bg-card p-5 shadow-sm">
        <h2 className="font-semibold">Use ZeroMeta safely</h2>
        <p className="mt-3 text-sm leading-6 text-muted-foreground">Keep your browser updated, review the evidence report, and open the cleaned file before sharing it. For highly sensitive material, use a trusted offline environment and independently verify the result with a specialist tool such as ExifTool.</p>
      </section>

      <div className="flex flex-wrap gap-3 border-t border-border pt-6"><Link className="inline-flex items-center rounded-full bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/85 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" href="/">Return to ZeroMeta <ArrowRight className="ml-2 size-4" /></Link><Link className="inline-flex items-center rounded-full border border-border px-5 py-3 text-sm font-semibold transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" href="/about">About the project</Link></div>
    </article>
  );
}

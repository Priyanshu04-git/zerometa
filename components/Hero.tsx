import Typography from "./Typography";

const Hero = () => {
  return (
    <section className="relative overflow-hidden rounded-[2rem] border border-border bg-card px-(--fluid-lg-3xl) py-(--fluid-xl-4xl) shadow-[0_24px_80px_-52px_rgba(23,32,29,0.7)]">
      <div className="mb-5 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-(--accent-primary)">
        <span className="size-2 rounded-full bg-(--accent-primary) shadow-[0_0_0_5px_var(--accent-secondary)]" /> Privacy lab · browser-side
      </div>
      <Typography variant="display" as="h1" className="max-w-4xl">
        Clean the trail. Keep the file.
      </Typography>
      <Typography variant="hero" as="p" className="mt-5 max-w-3xl text-muted-foreground">
        ZeroMeta removes targeted metadata locally, then gives you a before-and-after evidence view. No upload, no account, no opaque processing.
      </Typography>
    </section>
  );
};

export default Hero;

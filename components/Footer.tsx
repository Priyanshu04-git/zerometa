import Typography from "./Typography";
import Link from "next/link";

const Footer = () => {
  return (
    <footer className="flex items-center xl:py-(--space-3xl) pt-(--space-2xl) pb-(--space-lg)">
      <div className="w-full flex flex-col gap-(--space-lg) sm:flex-row sm:justify-between sm:items-end">
        <Typography variant="footer" muted>Built for everyday digital hygiene.</Typography>
        <nav className="flex flex-wrap gap-x-4 gap-y-2 text-sm text-muted-foreground" aria-label="Footer navigation">
          <Link className="transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" href="/about.html">About</Link>
          <Link className="transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" href="/privacy.html">Privacy</Link>
          <Link className="transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" href="/how-it-works.html">How it works</Link>
          <Link className="transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" href="/blog.html">Blog</Link>
        </nav>
      </div>
    </footer>
  );
};

export default Footer;

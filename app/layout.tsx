import type { Viewport, Metadata } from "next";
import Navbar from "@/components/Navbar";
import SideNav from "@/components/SideNav";
import Footer from "@/components/Footer";
import { ThemeProvider } from "@/components/ThemeProvider";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/sonner";
import localFont from "next/font/local";
import Script from "next/script";
import "./globals.css";

const avenirNext = localFont({
  variable: "--font-avenir",
  display: "swap",
  src: [
    {
      path: "../public/fonts/avenir-next-regular.woff2",
      weight: "400",
      style: "normal",
    },
    {
      path: "../public/fonts/avenir-next-medium.woff2",
      weight: "500",
      style: "normal",
    },
    {
      path: "../public/fonts/avenir-next-demibold.woff2",
      weight: "600",
      style: "normal",
    },
  ],
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#17201d",
};

export const metadata: Metadata = {
  title: "Free & Private Metadata Remover",
  description:
    "Remove targeted metadata from supported images, videos, audio, PDFs, and documents. Free, no account, no file uploads.",
  alternates: {
    canonical: "https://privmeta-n4x4wqum.manus.space/",
  },
  keywords: [
    "remove metadata from image",
    "remove metadata from photo",
    "remove metadata from audio",
    "remove metadata from pdf",
    "remove metadata from video",
    "remove metadata from png",
    "remove metadata from jpg",
    "remove EXIF data",
    "strip metadata online",
    "metadata remover free",
    "private metadata removal",
    "remove metadata without uploading",
    "what is metadata",
    "metadata login",
    "metadata account",
    "AI metadata",
  ],
  robots: {
    index: true,
    follow: true,
    "max-image-preview": "large",
    "max-snippet": -1,
    "max-video-preview": -1,
    googleBot: "index, follow",
  },
  openGraph: {
    title: "Free & Private Metadata Remover",
    description:
      "Free metadata remover for photos, videos, PDFs, and documents. File cleaning runs in your browser with no file upload or account.",
    url: "https://privmeta-n4x4wqum.manus.space/",
    siteName: "ZeroMeta",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 628,
        alt: "ZeroMeta - Remove metadata from files free, in your browser",
      },
    ],

    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Free & Private Metadata Remover",
    description:
      "Remove targeted metadata from photos, videos, PDFs, and documents in your browser. Free, no account, and no file upload.",
    images: ["/og-image.png"],
    creator: "@privmeta",
  },
  metadataBase: new URL("https://privmeta-n4x4wqum.manus.space/"),
  authors: [{ name: "ZeroMeta" }],
  creator: "ZeroMeta",
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "48x48" },
      { url: "/favicon-96x96.png", sizes: "96x96", type: "image/png" },
      { url: "/favicon.svg", type: "image/svg+xml" },
    ],
    apple: { url: "/apple-touch-icon.png", sizes: "180x180" },
  },
  manifest: "/site.webmanifest",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <Script
          id="software-application-jsonld"
          strategy="beforeInteractive"
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "SoftwareApplication",
              name: "ZeroMeta",
              url: "https://privmeta-n4x4wqum.manus.space/",
              logo: {
                "@type": "ImageObject",
                url: "https://privmeta-n4x4wqum.manus.space/web-app-manifest-192x192.png",
              },
              image: "https://privmeta-n4x4wqum.manus.space/og-image.png",
              description:
                "Remove targeted metadata from supported files with client-side processing and no file uploads.",
              foundingDate: "2025-01-01",
              applicationCategory: "WebApplication",
              operatingSystem: "All",
              creator: {
                "@type": "Organization",
                name: "ZeroMeta",
                url: "https://privmeta-n4x4wqum.manus.space/",
                logo: "https://privmeta-n4x4wqum.manus.space/web-app-manifest-192x192.png",
              },
              offers: {
                "@type": "Offer",
                price: "0",
                priceCurrency: "USD",
              },
            }),
          }}
        />
        <meta name="application-name" content="ZeroMeta" />
        <meta name="theme-color" content="#17201d" />
        <Script id="register-service-worker" strategy="afterInteractive">
          {`if ("serviceWorker" in navigator) navigator.serviceWorker.register("/sw.js").catch(() => {});`}
        </Script>
        <script
          async
          src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-5595808001740123"
          crossOrigin="anonymous"
        />
        {process.env.NEXT_PUBLIC_CF_BEACON_TOKEN && (
          <Script
            defer
            src="https://static.cloudflareinsights.com/beacon.min.js"
            data-cf-beacon={JSON.stringify({
              token: process.env.NEXT_PUBLIC_CF_BEACON_TOKEN,
            })}
          />
        )}
      </head>

      <body
        suppressHydrationWarning
        className={`antialiased min-h-screen flex flex-col ${avenirNext.variable} font-avenir`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <TooltipProvider>
            <div className="flex flex-col flex-1 items-center">
              <div className="max-w-(--max-content-width) flex flex-col flex-1 w-full h-full px-(--space-xl)">
                <Navbar />
                <main className="flex-1">{children}</main>
                <Toaster richColors />
                <Footer />
                <SideNav />
              </div>
            </div>
          </TooltipProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}

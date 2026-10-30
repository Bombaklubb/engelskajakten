import type { Metadata, Viewport } from "next";
// Samma typsnitt som Grundjakten, självhostade: Outfit för rubriker, knappar
// och etiketter, Lexend för text eleven ska läsa. Inga anrop till Google
// Fonts, så ingen elevs IP-adress skickas vidare.
import "@fontsource-variable/outfit/wght.css";
import "@fontsource-variable/lexend/wght.css";
import "./globals.css";
import AnalyticsInit from "@/components/AnalyticsInit";
import MartinsJakter from "@/components/ui/MartinsJakter";
import ThemedBackdrop from "@/components/ui/ThemedBackdrop";

const FAVICON_SVG =
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 60 36">' +
  '<rect width="60" height="36" fill="#012169"/>' +
  '<path d="M0,0 L60,36 M60,0 L0,36" stroke="#fff" stroke-width="7.2"/>' +
  '<path d="M0,0 L60,36 M60,0 L0,36" stroke="#C8102E" stroke-width="2.4"/>' +
  '<rect x="22.8" width="14.4" height="36" fill="#fff"/><rect y="10.8" width="60" height="14.4" fill="#fff"/>' +
  '<rect x="25.2" width="9.6" height="36" fill="#C8102E"/><rect y="13.2" width="60" height="9.6" fill="#C8102E"/>' +
  "</svg>";
const FAVICON_DATA_URI = `data:image/svg+xml,${encodeURIComponent(FAVICON_SVG)}`;

// Strukturerad data (schema.org) som sökmotorer och AI-tjänster läser.
const STRUKTURERAD_DATA = JSON.stringify({
  "@context": "https://schema.org",
  "@type": "WebApplication",
  "name": "Engelskajakten",
  "url": "https://engelskajakten.vercel.app/",
  "description": "Engelskajakten är en gratis app för engelska från årskurs 1 till gymnasiet. Grammatikövningarna är samlade i fyra världar som eleverna tar sig igenom.",
  "applicationCategory": "EducationalApplication",
  "operatingSystem": "Webbläsare: Chromebook, dator, surfplatta och mobil",
  "isAccessibleForFree": true,
  "offers": {
    "@type": "Offer",
    "price": "0",
    "priceCurrency": "SEK"
  },
  "educationalLevel": "Åk 1–gymnasiet",
  "about": "Engelska",
  "author": {
    "@type": "Person",
    "name": "Martin Akdogan",
    "jobTitle": "Lärare",
    "url": "https://martinsjakter.vercel.app"
  },
  "isPartOf": {
    "@type": "WebSite",
    "name": "Martinsjakter",
    "url": "https://martinsjakter.vercel.app"
  }
}).replace(/</g, "\\u003c");

export const metadata: Metadata = {
  title: "Engelskajakten – Lär dig engelska",
  description:
    "Engelskajakten är en gratis app för engelska från årskurs 1 till gymnasiet. Grammatikövningarna är samlade i fyra världar som eleverna tar sig igenom.",
  keywords: ["engelska", "skola", "övningar", "grammatik", "gratis"],
  icons: {
    // Favikonen ligger direkt i sidan (data-URI) i stället för som en fil, så
    // den kostar inget eget anrop. Samma bild som public/union-jack.svg.
    // PNG-varianten används där SVG inte fungerar. Safari, iPad och
    // hemskärmen kräver en PNG som apple-touch-icon – med SVG visade Safari
    // bara ett rött "E" i favoriterna.
    icon: [
      { url: FAVICON_DATA_URI, type: "image/svg+xml" },
      { url: "/icon-192.png", type: "image/png", sizes: "192x192" },
    ],
    apple: { url: "/apple-touch-icon.png", sizes: "180x180" },
  },
  openGraph: {
    title: "Engelskajakten",
    description: "Grammatik på engelska i fyra världar.",
    url: "https://engelskajakten.vercel.app/",
    type: "website",
    images: [
      {
        url: "https://engelskajakten.vercel.app/engelskajakten-logo.png",
        width: 1200,
        height: 630,
      },
    ],
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="sv" suppressHydrationWarning>
      <body className="min-h-screen">
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: STRUKTURERAD_DATA }} />
        <ThemedBackdrop />
        <AnalyticsInit />
        {children}
        {/* Hörnen längst ned. Ljusa knappar i stället för vit text direkt på
            sidan: den vita texten försvann på ljusa sidor som Om och Affären,
            och på ljusa teman. */}
        <div className="fixed bottom-0 left-0 right-0 z-40 flex items-center justify-between px-3 pb-2 select-none pointer-events-none">
          <a
            href="mailto:martinsikt@gmail.com"
            className="pointer-events-auto inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-bold text-slate-700 bg-white/85 backdrop-blur-sm shadow-md border border-black/5 hover:text-slate-900 hover:bg-white transition-colors dark:bg-gray-900/80 dark:text-slate-200 dark:border-white/10 dark:hover:text-white"
          >
            <span aria-hidden="true">✉️</span>
            Kontakta Martin
          </a>
          <MartinsJakter />
        </div>
      </body>
    </html>
  );
}

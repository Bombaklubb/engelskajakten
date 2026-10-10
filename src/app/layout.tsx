import type { Metadata, Viewport } from "next";
import "./globals.css";
import AnalyticsInit from "@/components/AnalyticsInit";
import JakterMenu from "@/components/ui/JakterMenu";
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

export const metadata: Metadata = {
  title: "Engelskajakten – Lär dig engelska",
  description:
    "En gratis engelskträningsapp för åk 1–gymnasiet. Grammatikövningar och läsförståelse i fyra spännande världar.",
  keywords: ["engelska", "skola", "övningar", "grammatik", "läsförståelse", "gratis"],
  icons: {
    // Favikonen ligger direkt i sidan (data-URI) i stället för som en fil, så
    // den kostar inget eget anrop. Samma bild som public/union-jack.svg.
    icon: FAVICON_DATA_URI,
    apple: "/union-jack.svg",
  },
  openGraph: {
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
        <ThemedBackdrop />
        <AnalyticsInit />
        {children}
        {/* Upphovsrätt längst ned på varje sida. pb-14 håller raden ovanför de
            fasta hörnknapparna nedan. */}
        <footer className="relative z-10 px-4 pt-2 pb-14 text-center">
          <p className="inline-block max-w-2xl rounded-lg bg-white/80 px-3 py-1.5 text-[11px] leading-snug text-slate-600 backdrop-blur-sm dark:bg-gray-900/70 dark:text-slate-300">
            © 2025–2026 Martin Akdogan. Engelskajakten är fri att använda i undervisningen. Kopiering av
            appen, innehållet eller namnet är inte tillåten utan tillstånd.
          </p>
        </footer>
        {/* Hörnen längst ned. Ljusa knappar i stället för vit text direkt på
            sidan: den vita texten försvann på ljusa sidor som Om och Affären,
            och på ljusa teman. */}
        <div className="fixed bottom-0 left-0 right-0 z-40 flex items-center justify-between px-3 pb-2 select-none pointer-events-none">
          <a
            href="mailto:martin.akdogan@enkoping.se"
            className="pointer-events-auto inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-bold text-slate-700 bg-white/85 backdrop-blur-sm shadow-md border border-black/5 hover:text-slate-900 hover:bg-white transition-colors dark:bg-gray-900/80 dark:text-slate-200 dark:border-white/10 dark:hover:text-white"
          >
            <span aria-hidden="true">✉️</span>
            Kontakta Martin
          </a>
          <JakterMenu />
        </div>
      </body>
    </html>
  );
}

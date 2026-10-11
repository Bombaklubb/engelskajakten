"use client";

import { useEffect, useState } from "react";

/**
 * QR-kod för flytt-länken. Biblioteket (qrcode-generator) laddas först när en
 * kod ska visas, så det inte gör resten av appen tyngre.
 */
export default function QrCode({ text, size = 176, onTooLong }: { text: string; size?: number; onTooLong?: () => void }) {
  const [svg, setSvg] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setSvg(null);
    import("qrcode-generator").then(({ default: qrcode }) => {
      if (cancelled) return;
      try {
        const qr = qrcode(0, "L");
        qr.addData(text, "Byte");
        qr.make();
        setSvg(qr.createSvgTag({ cellSize: 4, margin: 2, scalable: true }));
      } catch {
        // Längre än en QR-kod rymmer – länken fungerar ändå.
        onTooLong?.();
      }
    });
    return () => {
      cancelled = true;
    };
  }, [text, onTooLong]);

  return (
    <div
      role="img"
      aria-label="QR-kod med flytt-länken"
      className="flex-shrink-0 rounded-xl bg-white p-1.5 border border-gray-200 [&>svg]:w-full [&>svg]:h-full"
      style={{ width: size, height: size }}
      dangerouslySetInnerHTML={{ __html: svg ?? "" }}
    />
  );
}

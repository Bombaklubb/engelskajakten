"use client";

import { useState } from "react";

/**
 * "Kopiera länken" på ett kapitelkort: kopierar kapitlets egen adress, så att
 * en lärare kan dela just det kapitlet. Knappen ligger inne i kortets länk,
 * så klicket stoppas här och öppnar inte kapitlet.
 */
export default function CopyLinkButton({ path, title }: { path: string; title: string }) {
  const [state, setState] = useState<"idle" | "copied" | "failed">("idle");

  async function copy(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    const url = window.location.origin + path;
    try {
      await navigator.clipboard.writeText(url);
      setState("copied");
    } catch {
      // Urklipp nekat (äldre webbläsare): visa adressen så att den går att kopiera för hand.
      window.prompt("Kopiera länken:", url);
      setState("failed");
    }
    setTimeout(() => setState("idle"), 2000);
  }

  return (
    <button
      type="button"
      onClick={copy}
      aria-label={`Kopiera länken till ${title}`}
      className="badge bg-indigo-50 dark:bg-gray-700 text-indigo-600 dark:text-gray-300 text-xs ml-auto flex-shrink-0 border-2 border-indigo-100 dark:border-gray-600 flex items-center gap-1 cursor-pointer hover:bg-indigo-100 dark:hover:bg-gray-600 transition-colors"
    >
      <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
      </svg>
      <span aria-live="polite">{state === "copied" ? "✓ Kopierad" : "Kopiera länken"}</span>
    </button>
  );
}

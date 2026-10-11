"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import QrCode from "@/components/ui/QrCode";
import { loadStudent } from "@/lib/storage";
import { canUseLinks, collectBundle, downloadFile, linkFor, makeCode } from "@/lib/transfer";

/**
 * "Spara och flytta dina framsteg" i profilen: flytt-länk med QR-kod, och
 * samma framsteg som fil. Inläsningen sker på /flytta.
 */
export default function TransferCard() {
  const [supported, setSupported] = useState(true);
  const [canShare, setCanShare] = useState(false);
  const [code, setCode] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState<"link" | "code" | null>(null);
  const [copyFailed, setCopyFailed] = useState(false);
  const [showCode, setShowCode] = useState(false);
  const [qrTooLong, setQrTooLong] = useState(false);

  useEffect(() => {
    setSupported(canUseLinks());
    setCanShare(typeof navigator !== "undefined" && typeof navigator.share === "function");
  }, []);

  const link = code ? linkFor(code) : null;
  const onTooLong = useCallback(() => setQrTooLong(true), []);

  async function create() {
    const student = loadStudent();
    if (!student) return;
    setBusy(true);
    setCopyFailed(false);
    setQrTooLong(false);
    try {
      setCode(await makeCode(collectBundle(student)));
    } catch {
      setSupported(false);
    } finally {
      setBusy(false);
    }
  }

  async function copy(text: string, what: "link" | "code") {
    try {
      await navigator.clipboard.writeText(text);
      setCopyFailed(false);
      setCopied(what);
      setTimeout(() => setCopied((c) => (c === what ? null : c)), 2000);
    } catch {
      setCopyFailed(true);
    }
  }

  async function share() {
    if (!link) return;
    try {
      await navigator.share({ title: "Engelskajakten – mina framsteg", url: link });
    } catch {
      // Eleven stängde delningsmenyn – inget att visa.
    }
  }

  function saveFile() {
    const student = loadStudent();
    if (student) downloadFile(collectBundle(student));
  }

  const btn = "inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl font-bold text-sm cursor-pointer transition-colors";
  const secondary = `${btn} border-2 border-en-200 dark:border-gray-600 text-en-700 dark:text-gray-200 bg-white dark:bg-gray-800 hover:bg-en-50 dark:hover:bg-gray-700`;
  const textLink = "font-bold text-en-600 dark:text-en-300 hover:underline underline-offset-4 cursor-pointer";

  return (
    <section className="card">
      <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100">💾 Spara och flytta dina framsteg</h2>
      <p className="text-sm text-gray-700 dark:text-gray-300 mt-1.5 leading-relaxed">
        Dina poäng sparas bara i den här webbläsaren. Skapa en flytt-länk när du byter dator, iPad eller
        webbläsare – eller spara den som säkerhetskopia, om skoldatorn rensas. Länken innehåller allt du har
        klarat: poäng, kapitel, köp och kistor. Inget skickas till någon server.
      </p>

      {!supported && (
        <p role="alert" className="mt-3 text-sm font-semibold text-red-700 dark:text-red-300">
          Webbläsaren är för gammal för flytt-länkar. Välj Spara som fil nedan i stället.
        </p>
      )}

      <div className="mt-4 flex flex-wrap gap-2">
        <button
          onClick={create}
          disabled={!supported || busy}
          className={`${btn} text-white bg-en-600 hover:bg-en-700 disabled:opacity-40 disabled:cursor-not-allowed`}
          style={{ boxShadow: "0 3px 0 0 rgba(0,0,0,0.18)" }}
        >
          📲 Skapa flytt-länk
        </button>
        <Link prefetch={false} href="/flytta" className={secondary}>
          ⬆️ Läs in
        </Link>
      </div>

      {link && (
        <div className="mt-5 space-y-3">
          <div className="flex flex-col sm:flex-row gap-4 sm:items-center">
            {!qrTooLong && <QrCode text={link} onTooLong={onTooLong} />}
            <div className="min-w-0">
              {qrTooLong && (
                <p className="text-sm font-semibold text-gray-800 dark:text-gray-200 mb-2">
                  Länken är för lång för en QR-kod. Kopiera eller dela den i stället.
                </p>
              )}
              <ol className="list-decimal pl-5 space-y-1.5 text-sm text-gray-800 dark:text-gray-200">
                {!qrTooLong && <li>Skanna QR-koden med kameran på den nya enheten.</li>}
                <li>
                  {qrTooLong ? "Kopiera" : "Eller kopiera"} länken och mejla den till dig själv. Öppna den sedan på den
                  nya enheten.
                </li>
              </ol>
              <div className="mt-3 flex flex-wrap gap-2">
                <button onClick={() => copy(link, "link")} className={secondary}>
                  {copied === "link" ? "✓ Kopierad" : "🔗 Kopiera länk"}
                </button>
                {canShare && (
                  <button onClick={share} className={secondary}>
                    📤 Dela länk
                  </button>
                )}
              </div>
            </div>
          </div>

          {copyFailed && (
            <p role="alert" className="text-sm font-semibold text-red-700 dark:text-red-300">
              Kopieringen fungerade inte. Välj Visa koden nedan och kopiera den själv.
            </p>
          )}

          <p className="rounded-xl px-3 py-2.5 text-sm font-semibold bg-amber-50 border border-amber-200 text-amber-900 dark:bg-amber-900/25 dark:border-amber-700/60 dark:text-amber-200">
            💡 Spara mejlet. Länken fungerar också som säkerhetskopia om datorn rensas.
          </p>
          <p className="text-xs text-gray-600 dark:text-gray-400">
            Länken visar hur långt du har kommit just nu. Gör en ny om du hinner spela mer innan du flyttar.
          </p>
        </div>
      )}

      <div className="mt-4 pt-3 border-t border-gray-100 dark:border-gray-700 text-sm text-gray-700 dark:text-gray-300">
        Fler sätt:{" "}
        <button onClick={saveFile} className={textLink}>Spara som fil</button>
        {code && (
          <>
            {" · "}
            <button onClick={() => setShowCode((s) => !s)} aria-expanded={showCode} className={textLink}>
              {showCode ? "Dölj koden" : "Visa koden"}
            </button>
          </>
        )}
      </div>

      {code && showCode && (
        <div className="mt-3 space-y-2">
          <textarea
            readOnly
            value={code}
            aria-label="Flytt-kod"
            onFocus={(e) => e.currentTarget.select()}
            className="w-full h-24 p-2 rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-900 text-xs font-mono text-gray-800 dark:text-gray-200 break-all resize-none"
          />
          <button onClick={() => copy(code, "code")} className={secondary}>
            {copied === "code" ? "✓ Kopierad" : "Kopiera kod"}
          </button>
        </div>
      )}
    </section>
  );
}

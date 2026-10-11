"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Header from "@/components/ui/Header";
import UnionJack from "@/components/ui/UnionJack";
import { loadStudent } from "@/lib/storage";
import { canUseLinks, readCode, readFile, replaceWarning, saveBundle, summarize, type TransferBundle } from "@/lib/transfer";
import type { StudentData } from "@/lib/types";

/**
 * "Läs in dina framsteg": det enda stället där en flytt-länk, en kod eller en
 * sparad fil läses in. Fungerar utan inloggning – så ser det ut på en ny enhet.
 */
export default function FlyttaPage() {
  const router = useRouter();
  const [student, setStudent] = useState<StudentData | null>(null);
  const [supported, setSupported] = useState(true);
  const [input, setInput] = useState("");
  const [bundle, setBundle] = useState<TransferBundle | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const BAD = "Länken eller koden gick inte att läsa. Kontrollera att du fick med allt, ända till sista tecknet.";
  const OLD = "Den här webbläsaren är för gammal för flytt-länkar. Uppdatera den, eller läs in en sparad fil nedan.";

  async function readText(text: string) {
    setError(null);
    setBundle(null);
    if (!text.trim()) return;
    const ok = canUseLinks();
    setBusy(true);
    const b = await readCode(text);
    setBusy(false);
    if (b) setBundle(b);
    else setError(ok || !text.includes("EJ1") ? BAD : OLD);
  }

  useEffect(() => {
    setStudent(loadStudent());
    const ok = canUseLinks();
    setSupported(ok);
    // Öppnad via en flytt-länk: läs koden direkt och ta bort den ur adressfältet,
    // så att den inte ligger kvar i webbläsarens historik.
    // Samma sak om länken öppnas när sidan redan är öppen (bara #-delen ändras).
    const fromHash = () => {
      const hash = window.location.hash;
      if (!hash.includes("k=")) return;
      history.replaceState(null, "", window.location.pathname);
      if (ok) void readText(hash);
      else setError(OLD);
    };
    fromHash();
    window.addEventListener("hashchange", fromHash);
    return () => window.removeEventListener("hashchange", fromHash);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setError(null);
    setBundle(null);
    const b = await readFile(file);
    if (b) setBundle(b);
    else setError("Filen gick inte att läsa. Kontrollera att det är en fil som du har sparat från Engelskajakten.");
  }

  function confirmSave() {
    if (!bundle) return;
    const warning = replaceWarning(bundle);
    if (warning && !window.confirm(warning)) return;
    saveBundle(bundle);
    router.push("/");
  }

  const sum = bundle ? summarize(bundle) : null;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Header student={student} />

      <div className="text-white" style={{ background: "linear-gradient(135deg, #1e3a8a, #2563eb, #3b82f6)" }}>
        <div className="max-w-2xl mx-auto px-4 py-6">
          <Link prefetch={false} href={student ? "/profile" : "/"} className="inline-flex items-center gap-1 text-white/75 hover:text-white text-sm mb-3 transition-colors">
            ← Tillbaka
          </Link>
          <div className="flex items-center gap-3">
            <UnionJack className="w-11 h-11 rounded-xl border-2 border-white/30 flex-shrink-0" />
            <div>
              <h1 className="text-2xl font-black">Läs in dina framsteg</h1>
              <p className="text-white/80 text-sm">Flytta Engelskajakten till en ny enhet</p>
            </div>
          </div>
        </div>
      </div>

      <main className="max-w-2xl mx-auto px-4 py-6 pb-20 space-y-5">
        <section className="card">
          <p className="text-[15px] leading-relaxed text-gray-700 dark:text-gray-300">
            Skanna QR-koden från din gamla enhet med kameran, eller öppna flytt-länken du har mejlat till dig själv.
            Du kan också klistra in länken här. Då får du med dig alla poäng, kapitel, köp och kistor.
          </p>

          {!supported && (
            <p role="alert" className="mt-3 text-sm font-semibold text-red-700 dark:text-red-300">{OLD}</p>
          )}

          <form
            className="mt-4"
            onSubmit={(e) => {
              e.preventDefault();
              void readText(input);
            }}
          >
            <label htmlFor="flytt-kod" className="block text-sm font-bold text-gray-900 dark:text-gray-100 mb-1.5">
              Flytt-länk eller kod
            </label>
            <div className="flex gap-2">
              <input
                id="flytt-kod"
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Klistra in här"
                autoComplete="off"
                autoCapitalize="off"
                spellCheck={false}
                disabled={!supported}
                className="input-field flex-1 min-w-0 !py-2.5"
              />
              <button
                type="submit"
                disabled={!supported || busy || !input.trim()}
                className="px-5 py-2.5 rounded-xl font-bold text-sm text-white bg-en-600 hover:bg-en-700 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                style={{ boxShadow: "0 3px 0 0 rgba(0,0,0,0.18)" }}
              >
                Läs in
              </button>
            </div>
          </form>

          <div className="mt-4 pt-3 border-t border-gray-100 dark:border-gray-700 text-sm text-gray-700 dark:text-gray-300 flex flex-wrap items-center gap-2">
            Har du sparat en fil?
            <button
              onClick={() => fileRef.current?.click()}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl border-2 border-en-200 dark:border-gray-600 font-bold text-en-700 dark:text-gray-200 hover:bg-en-50 dark:hover:bg-gray-700 cursor-pointer"
            >
              📄 Välj fil
            </button>
            <input ref={fileRef} type="file" accept=".json,application/json" onChange={onFile} className="hidden" />
          </div>

          {error && (
            <p role="alert" className="mt-4 rounded-xl px-3 py-2.5 text-sm font-semibold bg-red-50 border border-red-200 text-red-800 dark:bg-red-900/25 dark:border-red-700/60 dark:text-red-200">
              {error}
            </p>
          )}

          {sum && (
            <div className="mt-4 rounded-2xl p-4 bg-green-50 border-2 border-green-200 dark:bg-green-900/20 dark:border-green-700/60">
              <p className="font-black text-green-900 dark:text-green-200">Framstegen tillhör {sum.name}</p>
              <ul className="mt-2 text-sm text-green-900 dark:text-green-200 space-y-0.5">
                <li>⭐ {sum.points.toLocaleString("sv-SE")} poäng</li>
                <li>✅ {sum.completed} {sum.completed === 1 ? "klarat kapitel" : "klarade kapitel"}</li>
                {sum.unopened !== null && sum.unopened > 0 && <li>🧰 {sum.unopened} {sum.unopened === 1 ? "oöppnad kista" : "oöppnade kistor"}</li>}
                {sum.owned !== null && sum.owned > 0 && <li>🛒 {sum.owned} figurer, ramar, teman och effekter</li>}
              </ul>
              <div className="mt-3 flex flex-wrap gap-2">
                <button
                  onClick={confirmSave}
                  className="px-4 py-2.5 rounded-xl font-bold text-sm text-white bg-green-600 hover:bg-green-700 cursor-pointer"
                  style={{ boxShadow: "0 3px 0 0 rgba(0,0,0,0.18)" }}
                >
                  Läs in och fortsätt ✓
                </button>
                <button
                  onClick={() => setBundle(null)}
                  className="px-4 py-2.5 rounded-xl font-bold text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer"
                >
                  Avbryt
                </button>
              </div>
            </div>
          )}

          <p className="mt-4 text-xs text-gray-500 dark:text-gray-400">
            Inget skickas till någon server – allt läses bara av den här webbläsaren.
          </p>
        </section>
      </main>
    </div>
  );
}

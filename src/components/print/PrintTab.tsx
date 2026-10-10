"use client";

import { useMemo, useRef, useEffect, useState } from "react";
import type { StageContent, Stage, GrammarExercise, WordSearchModule, CoinGameModule } from "@/lib/types";
import PrintSheet, { type PrintChapter } from "@/components/print/PrintSheet";

/**
 * "Skriva ut": välj kapitel (eller enstaka frågor) i världen och skriv ut dem
 * som ett arbetsblad, med eller utan facit. Samma funktion som i
 * Svenskajakten, anpassad till Engelskajaktens innehåll.
 *
 * Allt sker i webbläsaren: urvalet finns i den här komponenten, och bladet
 * ritas direkt i <body> (se PrintSheet) och syns bara vid utskrift. Inga anrop.
 * Engelskajakten har inga övningar som kräver ljud, så inget behöver uteslutas.
 */

type Kind = "grammar" | "spelling" | "spel" | "wordsearch";

interface Row {
  kind: Kind;
  id: string;
  title: string;
  /** Utskrivbara frågor som korta texter i listan. Ordsök har inga. */
  items: string[];
  /** Index i kapitlets egen lista för varje fråga. */
  indexes: number[];
}

const SECTION_TITLES: Record<Kind, string> = {
  grammar: "📝 Grammatik",
  spelling: "✏️ Stavning",
  spel: "🪙 Samla mynt",
  wordsearch: "🔍 Ordsökning",
};

function label(ex: GrammarExercise): string {
  switch (ex.type) {
    case "multiple-choice":
      return [ex.image, ex.question].filter(Boolean).join(" ");
    case "fill-in-blank":
      return ex.sentence;
    case "build-sentence":
      return `${ex.instruction} (${ex.words.join(" · ")})`;
  }
}

function exerciseRows(kind: "grammar" | "spelling", mods: { id: string; title: string; exercises: GrammarExercise[] }[]): Row[] {
  return mods
    .map((m) => ({
      kind,
      id: m.id,
      title: m.title,
      items: m.exercises.map(label),
      indexes: m.exercises.map((_, i) => i),
    }))
    .filter((r) => r.items.length > 0);
}

const key = (kind: Kind, id: string, i?: number) => (i === undefined ? `${kind}:${id}` : `${kind}:${id}:${i}`);

export default function PrintTab({ stage, content }: { stage: Stage; content: StageContent }) {
  const sections = useMemo(() => {
    const out: { kind: Kind; rows: Row[] }[] = [
      { kind: "grammar", rows: exerciseRows("grammar", content.grammar ?? []) },
      { kind: "spelling", rows: exerciseRows("spelling", content.spelling ?? []) },
      {
        kind: "spel",
        rows: (content.spel ?? []).map((m: CoinGameModule) => ({
          kind: "spel" as const,
          id: m.id,
          title: m.title,
          items: m.questions.map((q) => q.question),
          indexes: m.questions.map((_, i) => i),
        })),
      },
      {
        kind: "wordsearch",
        rows: (content.wordsearch ?? []).map((m: WordSearchModule) => ({
          kind: "wordsearch" as const,
          id: m.id,
          title: m.title,
          items: [],
          indexes: [],
        })),
      },
    ];
    return out.filter((s) => s.rows.length > 0);
  }, [content]);

  /** Valda frågor ("slag:id:index") och hela ordsök ("wordsearch:id"). */
  const [picked, setPicked] = useState<Set<string>>(new Set());
  const [open, setOpen] = useState<Set<string>>(new Set());
  const [withKey, setWithKey] = useState(false);

  const rowKeys = (r: Row) => (r.kind === "wordsearch" ? [key(r.kind, r.id)] : r.indexes.map((i) => key(r.kind, r.id, i)));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const allKeys = useMemo(() => sections.flatMap((s) => s.rows.flatMap(rowKeys)), [sections]);

  function toggle(keys: string[], on: boolean) {
    setPicked((prev) => {
      const next = new Set(prev);
      for (const k of keys) {
        if (on) next.add(k);
        else next.delete(k);
      }
      return next;
    });
  }

  const questionCount = [...picked].filter((k) => !k.startsWith("wordsearch:")).length;
  const searchCount = [...picked].filter((k) => k.startsWith("wordsearch:")).length;

  /** Kapitlen som ska skrivas ut, i världens egen ordning. */
  const chapters: PrintChapter[] = useMemo(() => {
    const out: PrintChapter[] = [];
    for (const s of sections) {
      for (const r of s.rows) {
        if (r.kind === "wordsearch") {
          if (!picked.has(key(r.kind, r.id))) continue;
          const m = content.wordsearch!.find((w) => w.id === r.id)!;
          out.push({ kind: "wordsearch", title: m.title, words: m.words });
        } else if (r.kind === "spel") {
          const m = content.spel!.find((x) => x.id === r.id)!;
          const questions = r.indexes.filter((i) => picked.has(key(r.kind, r.id, i))).map((i) => m.questions[i]);
          if (questions.length) out.push({ kind: "questions", title: m.title, questions });
        } else {
          const list = r.kind === "grammar" ? content.grammar : content.spelling ?? [];
          const m = list.find((x) => x.id === r.id)!;
          const exercises = r.indexes.filter((i) => picked.has(key(r.kind, r.id, i))).map((i) => m.exercises[i]);
          if (exercises.length) out.push({ kind: "exercises", title: m.title, exercises });
        }
      }
    }
    return out;
  }, [picked, sections, content]);

  // Bladet är renderat (dolt på skärmen) så länge något är valt, så att det
  // är färdigt när utskriftsrutan öppnas. På en iPad returnerar
  // window.print() direkt – ett blad som skapades först vid utskriften hann
  // försvinna.
  function print() {
    if (chapters.length) window.print();
  }

  return (
    <div className="space-y-5 pb-10">
      <div className="card !p-4 sm:!p-5">
        <h2 className="text-lg font-black text-en-900 dark:text-gray-100">🖨️ Skriva ut</h2>
        <p className="text-sm text-gray-700 dark:text-gray-300 mt-1">
          Bocka i de kapitel eller frågor du vill ha på papper, och tryck på <strong>Skriv ut</strong>. I
          utskriftsrutan kan du också välja <strong>Spara som PDF</strong>. Det du skriver ut ger inga poäng i appen.
        </p>
        <div className="mt-4 flex flex-wrap items-center gap-2">
          <button
            onClick={print}
            disabled={!chapters.length}
            className="px-4 py-2.5 rounded-xl font-bold text-sm text-white bg-en-600 hover:bg-en-700 disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed"
            style={{ boxShadow: "0 3px 0 0 rgba(0,0,0,0.18)" }}
          >
            🖨️ Skriv ut
          </button>
          <label className="inline-flex items-center gap-2 px-3 py-2 rounded-xl border-2 border-en-200 dark:border-gray-600 text-sm font-bold text-gray-800 dark:text-gray-200 cursor-pointer">
            <input type="checkbox" checked={withKey} onChange={(e) => setWithKey(e.target.checked)} className="w-4 h-4 accent-en-600" />
            Med facit
          </label>
          <button onClick={() => toggle(allKeys, true)} className="px-3 py-2 rounded-xl text-sm font-bold text-gray-800 dark:text-gray-300 hover:bg-en-50 dark:hover:bg-gray-700 cursor-pointer">
            Markera alla
          </button>
          <button onClick={() => setPicked(new Set())} className="px-3 py-2 rounded-xl text-sm font-bold text-gray-800 dark:text-gray-300 hover:bg-en-50 dark:hover:bg-gray-700 cursor-pointer">
            Avmarkera
          </button>
          <span className="text-sm text-gray-600 dark:text-gray-400" aria-live="polite">
            {questionCount} {questionCount === 1 ? "fråga" : "frågor"}
            {searchCount ? `, ${searchCount} ordsök` : ""} valda
          </span>
        </div>
      </div>

      {sections.map((s) => (
        <section key={s.kind} className="card !p-4 sm:!p-5">
          <h3 className="font-black text-en-900 dark:text-gray-100 mb-2">{SECTION_TITLES[s.kind]}</h3>
          <ul className="divide-y divide-gray-100 dark:divide-gray-700">
            {s.rows.map((r) => (
              <ChapterRow
                key={r.id}
                row={r}
                keys={rowKeys(r)}
                picked={picked}
                open={open.has(key(r.kind, r.id))}
                onToggleOpen={() =>
                  setOpen((prev) => {
                    const next = new Set(prev);
                    const k = key(r.kind, r.id);
                    if (next.has(k)) next.delete(k);
                    else next.add(k);
                    return next;
                  })
                }
                onToggle={toggle}
              />
            ))}
          </ul>
        </section>
      ))}

      {chapters.length > 0 && <PrintSheet stage={stage} chapters={chapters} withKey={withKey} />}
    </div>
  );
}

function ChapterRow({
  row,
  keys,
  picked,
  open,
  onToggleOpen,
  onToggle,
}: {
  row: Row;
  keys: string[];
  picked: Set<string>;
  open: boolean;
  onToggleOpen: () => void;
  onToggle: (keys: string[], on: boolean) => void;
}) {
  const chosen = keys.filter((k) => picked.has(k)).length;
  const all = chosen === keys.length;
  const ref = useRef<HTMLInputElement>(null);
  // "Delvis vald" när bara några av kapitlets frågor är valda.
  useEffect(() => {
    if (ref.current) ref.current.indeterminate = chosen > 0 && !all;
  }, [chosen, all]);

  return (
    <li className="py-2">
      <div className="flex items-center gap-2">
        <input
          ref={ref}
          type="checkbox"
          checked={all}
          onChange={(e) => onToggle(keys, e.target.checked)}
          aria-label={`Välj ${row.title}`}
          className="w-4 h-4 flex-shrink-0 accent-en-600 cursor-pointer"
        />
        <span className="flex-1 min-w-0 text-sm font-semibold text-gray-900 dark:text-gray-100">{row.title}</span>
        <span className="text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap">
          {row.kind === "wordsearch" ? "rutnät" : chosen ? `${chosen} av ${keys.length}` : `${keys.length} frågor`}
        </span>
        {row.items.length > 0 && (
          <button
            onClick={onToggleOpen}
            aria-expanded={open}
            aria-label={open ? `Dölj frågorna i ${row.title}` : `Visa frågorna i ${row.title}`}
            className="px-2 py-1 rounded-lg text-xs font-bold text-gray-600 dark:text-gray-300 hover:bg-en-50 dark:hover:bg-gray-700 cursor-pointer"
          >
            {open ? "▲" : "▼"}
          </button>
        )}
      </div>
      {open && (
        <ul className="mt-1.5 ml-6 space-y-1">
          {row.items.map((text, j) => {
            const k = keys[j];
            return (
              <li key={k}>
                <label className="flex items-start gap-2 text-xs text-gray-700 dark:text-gray-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={picked.has(k)}
                    onChange={(e) => onToggle([k], e.target.checked)}
                    className="mt-0.5 w-3.5 h-3.5 flex-shrink-0 accent-en-600"
                  />
                  <span className="leading-snug">{text}</span>
                </label>
              </li>
            );
          })}
        </ul>
      )}
    </li>
  );
}

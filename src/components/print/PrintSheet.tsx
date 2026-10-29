"use client";

import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import type { GrammarExercise, Stage, WordSearchWord, CoinGameQuestion } from "@/lib/types";
import { buildGrid } from "@/lib/wordGrid";
import { ExerciseBody, WordGridTable, dealExercise, type DealtExercise } from "@/components/print/printItems";
import MartinsjakterTag from "@/components/print/MartinsjakterTag";

export type PrintChapter =
  | { kind: "exercises"; title: string; exercises: GrammarExercise[] }
  | { kind: "questions"; title: string; questions: CoinGameQuestion[] }
  | { kind: "wordsearch"; title: string; words: WordSearchWord[] };

/**
 * Det utskrivna arbetsbladet. Ritas direkt i <body> och är dolt på skärmen;
 * vid utskrift döljs allt annat i stället (se .print-sheet i globals.css), så
 * sidan blir ett rent A4-blad i svart på vitt.
 *
 * Flervalsalternativen blandas och ordsöksrutnäten byggs en gång per urval,
 * så facit alltid stämmer med frågorna ovanför.
 */
export default function PrintSheet({
  stage,
  chapters,
  withKey,
  active = true,
}: {
  stage: Stage;
  chapters: PrintChapter[];
  withKey: boolean;
  /** false: bladet ligger kvar men hålls utanför utskriften, medan ett färdigt arbetshäfte skrivs ut. */
  active?: boolean;
}) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const dealt = useMemo(() => chapters.map(deal), [chapters]);
  if (!mounted) return null;

  // Frågorna numreras i en följd genom hela bladet.
  let next = 1;
  const numbered = dealt.map((c) => {
    const start = next;
    next += c.count;
    return { ...c, start };
  });

  return createPortal(
    <div className={`print-sheet${active ? "" : " print-off"}`} aria-hidden="true">
      <header className="ps-header">
        <div>
          <p className="ps-brand">Engelskajakten · {stage.name} ({stage.grades})</p>
          <p className="ps-sub">engelskajakten.vercel.app</p>
        </div>
        <div className="ps-name">
          <span>Namn: ______________________</span>
          <span>Datum: ____________</span>
        </div>
      </header>

      {numbered.map((c, ci) => (
        <section key={ci} className="ps-chapter">
          <h2 className="ps-title">{c.title}</h2>
          {c.body(c.start)}
        </section>
      ))}

      <MartinsjakterTag />

      {withKey && (
        <section className="ps-key">
          <h2 className="ps-title">Facit</h2>
          {numbered.map((c, ci) => (
            <div key={ci} className="ps-key-chapter">
              <h3>{c.title}</h3>
              {c.key(c.start)}
            </div>
          ))}
        </section>
      )}
    </div>,
    document.body
  );
}

// ─── Hur varje slag ställs upp ───────────────────────────────────────────────

interface Dealt {
  title: string;
  count: number;
  body: (start: number) => React.ReactNode;
  key: (start: number) => React.ReactNode;
}

function deal(c: PrintChapter): Dealt {
  if (c.kind === "wordsearch") {
    const words = c.words.map((w) => w.word);
    const { grid, placements } = buildGrid(words);
    const onWord = new Set(placements.flatMap((p) => p.cells.map(([r, col]) => `${r}:${col}`)));
    const table = (isKey: boolean) => <WordGridTable grid={grid} hits={onWord} isKey={isKey} />;
    return {
      title: c.title,
      count: 0,
      body: () => (
        <div className="ps-item">
          <p className="ps-instr">Hitta orden i rutnätet. De kan stå vågrätt, lodrätt, snett eller baklänges.</p>
          {table(false)}
          <ul className="ps-words">
            {c.words.map((w) => (
              <li key={w.word}><span className="ps-box" /> {w.word.toUpperCase()}</li>
            ))}
          </ul>
        </div>
      ),
      key: () => table(true),
    };
  }

  // Samla mynt-frågor och grammatik/stavning. Alternativen blandas här, en
  // gång, så att bokstäverna på bladet och i facit stämmer (se lib/printDeal).
  const items: DealtExercise[] =
    c.kind === "questions"
      ? c.questions.map((q) =>
          dealExercise({ id: q.id, type: "multiple-choice", question: q.question, options: q.options, correctIndex: q.correctIndex })
        )
      : c.exercises.map((ex) => dealExercise(ex));

  return {
    title: c.title,
    count: items.length,
    body: (start) => (
      <ol className="ps-list" start={start}>
        {items.map((it, i) => (
          <li key={i} className="ps-item"><ExerciseBody item={it} /></li>
        ))}
      </ol>
    ),
    key: (start) => (
      <ol className="ps-key-list" start={start}>
        {items.map((it, i) => <li key={i}>{it.answer}</li>)}
      </ol>
    ),
  };
}

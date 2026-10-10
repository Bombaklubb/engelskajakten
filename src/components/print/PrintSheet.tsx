"use client";

import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import type { GrammarExercise, Stage, WordSearchWord, CoinGameQuestion } from "@/lib/types";
import { buildGrid } from "@/lib/wordGrid";

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
export default function PrintSheet({ stage, chapters, withKey }: { stage: Stage; chapters: PrintChapter[]; withKey: boolean }) {
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
    <div className="print-sheet" aria-hidden="true">
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

const LETTERS = "ABCDEFGH";

function shuffled<T>(list: T[]): T[] {
  const a = [...list];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/** "I have ___ apple." med en skrivlinje i luckan. */
function withGap(text: string): React.ReactNode {
  const parts = text.split("___");
  if (parts.length === 1) return text;
  return parts.map((p, i) => (
    <span key={i}>
      {p}
      {i < parts.length - 1 && <span className="ps-gap" />}
    </span>
  ));
}

/** Flervalsfråga: alternativen i ny ordning, facit som "B – an". */
function multipleChoice(question: string, options: string[], correctIndex: number, alsoCorrect: number[] = [], image?: string) {
  const order = shuffled(options.map((_, i) => i));
  const name = (oi: number) => `${LETTERS[order.indexOf(oi)]} – ${options[oi]}`;
  const also = alsoCorrect.filter((i) => i !== correctIndex);
  const answer = name(correctIndex) + (also.length ? ` (även ${also.map(name).join(", ")})` : "");
  const body = (
    <>
      <p>
        {image && <span className="ps-image">{image} </span>}
        {withGap(question)}
      </p>
      <ul className="ps-options">
        {order.map((oi, place) => (
          <li key={oi}><span className="ps-circle" /> {LETTERS[place]}. {options[oi]}</li>
        ))}
      </ul>
    </>
  );
  return { body, answer };
}

function deal(c: PrintChapter): Dealt {
  if (c.kind === "wordsearch") {
    const words = c.words.map((w) => w.word);
    const { grid, placements } = buildGrid(words);
    const onWord = new Set(placements.flatMap((p) => p.cells.map(([r, col]) => `${r}:${col}`)));
    const table = (isKey: boolean) => (
      <table className={`ps-grid ${isKey ? "ps-grid-key" : ""}`}>
        <tbody>
          {grid.map((row, r) => (
            <tr key={r}>
              {row.map((ch, col) => (
                <td key={col} className={isKey && onWord.has(`${r}:${col}`) ? "ps-hit" : undefined}>{ch}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    );
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
  // gång, så att bokstäverna på bladet och i facit stämmer.
  const items: { body: React.ReactNode; answer: string }[] =
    c.kind === "questions"
      ? c.questions.map((q) => multipleChoice(q.question, q.options, q.correctIndex))
      : c.exercises.map((ex) => {
          if (ex.type === "multiple-choice") {
            return multipleChoice(ex.question, ex.options, ex.correctIndex, ex.alsoCorrect, ex.image);
          }
          if (ex.type === "fill-in-blank") {
            return {
              body: (
                <>
                  <p>{withGap(ex.sentence)}</p>
                  {!ex.sentence.includes("___") && <span className="ps-line" />}
                </>
              ),
              // Flera luckor skrivs "a ... b" i innehållet.
              answer: ex.answer.split(/\s*\.\.\.\s*/).join(" / "),
            };
          }
          // Orden ligger i rätt ordning i innehållet (appen blandar dem på
          // skärmen), så de blandas här också – annars står svaret på bladet.
          const chips = shuffled(ex.words);
          return {
            body: (
              <>
                <p>{ex.instruction}</p>
                <p className="ps-chips">{chips.map((w, j) => <span key={j} className="ps-chip">{w}</span>)}</p>
                <span className="ps-line" />
              </>
            ),
            answer: ex.correctOrder.map((i) => ex.words[i]).join(" ").replace(/\s+([.,!?])/g, "$1"),
          };
        });

  return {
    title: c.title,
    count: items.length,
    body: (start) => (
      <ol className="ps-list" start={start}>
        {items.map((it, i) => (
          <li key={i} className="ps-item">{it.body}</li>
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

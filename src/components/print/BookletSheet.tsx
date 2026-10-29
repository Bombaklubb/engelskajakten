"use client";

import { createPortal } from "react-dom";
import type { Stage } from "@/lib/types";
import type { Booklet } from "@/lib/booklets";
import { ExerciseBody, WordGridTable } from "@/components/print/printItems";

/**
 * Ett färdigt arbetshäfte (se lib/booklets.ts) som utskrivna sidor: framsida
 * med innehållsförteckning, ett ämne per sida, ett ordsök och facit sist om
 * det är ikryssat. Ritas i <body> och syns bara vid utskrift, som "välj
 * själv"-bladet (PrintSheet), vars frågeutseende det delar.
 *
 * Varje ämne börjar på en egen sida och ryms på den, så sidnumren i
 * innehållsförteckningen är kända i förväg.
 */
export default function BookletSheet({ stage, booklet, withKey }: { stage: Stage; booklet: Booklet; withKey: boolean }) {
  // Ritas bara i webbläsaren, i samma klick som skriver ut det (se PrintTab),
  // så det får inte vänta en rendering på en "mounted"-flagga.
  if (typeof document === "undefined") return null;

  const { number, title, pages, wordsearch } = booklet;
  const running = `Engelskajakten · Arbetshäfte ${number} – ${title}`;
  const hits = new Set(wordsearch?.placements.flatMap((p) => p.cells.map(([r, c]) => `${r}:${c}`)) ?? []);
  const contents = [
    ...pages.map((p) => ({ title: p.title, page: p.pageNumber })),
    ...(wordsearch ? [{ title: `Ordsök – ${wordsearch.title}`, page: wordsearch.pageNumber }] : []),
    ...(withKey ? [{ title: "Facit", page: booklet.pageCount + 1 }] : []),
  ];

  return createPortal(
    <div className="print-sheet booklet" aria-hidden="true">
      {/* Framsida och innehåll */}
      <section className="bk-page bk-cover">
        <p className="bk-brand">Engelskajakten</p>
        <h1 className="bk-title">
          Arbetshäfte {number}
          <span>{title}</span>
        </h1>
        <p className="bk-world">{stage.name} · {stage.grades}</p>
        <div className="bk-name">
          <span>Namn: ______________________________</span>
          <span>Klass: __________</span>
        </div>
        <h2 className="bk-toc-title">Innehåll</h2>
        <ol className="bk-toc">
          {contents.map((c) => (
            <li key={c.title}>
              <span>{c.title}</span>
              <span className="bk-dots" />
              <span>{c.page}</span>
            </li>
          ))}
        </ol>
        <p className="bk-note">
          Varje sida börjar med en kort regel att komma ihåg. Sedan kommer uppgifterna, och längst ner
          fyller du i hur bra du tycker att du kan det.
        </p>
        <p className="ps-sub">engelskajakten.vercel.app</p>
      </section>

      {/* Ett ämne per sida */}
      {pages.map((page) => (
        <section key={page.pageNumber} className="bk-page">
          <p className="bk-running">{running}</p>
          <h2 className="bk-topic">{page.title}</h2>
          {page.rules.length > 0 && (
            <div className="bk-rules">
              <p className="bk-rules-title">💡 Kom ihåg</p>
              <ul>
                {page.rules.map((r, i) => <li key={i}>{r}</li>)}
              </ul>
            </div>
          )}
          <ol className="ps-list bk-questions">
            {page.items.map((item, i) => (
              <li key={i} className="ps-item">
                <ExerciseBody item={item} />
              </li>
            ))}
          </ol>
          <div className="bk-check">
            <p>Det här kan jag:</p>
            <span><span className="ps-box" /> 😊 Jag kan det</span>
            <span><span className="ps-box" /> 😐 Nästan</span>
            <span><span className="ps-box" /> 😟 Jag behöver öva mer</span>
          </div>
        </section>
      ))}

      {/* Ordsök sist */}
      {wordsearch && (
        <section className="bk-page">
          <p className="bk-running">{running}</p>
          <h2 className="bk-topic">Ordsök – {wordsearch.title}</h2>
          <p className="ps-instr">Hitta orden i rutnätet. De kan stå vågrätt, lodrätt, snett eller baklänges.</p>
          <WordGridTable grid={wordsearch.grid} hits={hits} isKey={false} />
          <ul className="ps-words">
            {wordsearch.words.map((w) => (
              <li key={w}><span className="ps-box" /> {w.toUpperCase()}</li>
            ))}
          </ul>
        </section>
      )}

      {/* Facit, på egna sidor så att det är lätt att ta ut */}
      {withKey && (
        <section className="ps-key bk-key">
          <h2 className="bk-topic">Facit – Arbetshäfte {number}</h2>
          {pages.map((page) => (
            <div key={page.pageNumber} className="ps-key-chapter">
              <h3>Sida {page.pageNumber} – {page.title}</h3>
              <ol className="ps-key-list">
                {page.items.map((item, i) => <li key={i}>{item.answer}</li>)}
              </ol>
            </div>
          ))}
          {wordsearch && (
            <div className="ps-key-chapter">
              <h3>Sida {wordsearch.pageNumber} – Ordsök</h3>
              <WordGridTable grid={wordsearch.grid} hits={hits} isKey />
            </div>
          )}
        </section>
      )}
    </div>,
    document.body
  );
}

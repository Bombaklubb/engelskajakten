import { LETTERS, type DealtExercise } from "@/lib/printDeal";

export { LETTERS, shuffled, dealExercise, dealChoices, type DealtExercise } from "@/lib/printDeal";

/**
 * Delarna en utskriven fråga består av, gemensamma för "välj själv"-bladet
 * (PrintSheet) och de färdiga arbetshäftena (BookletSheet), så att en fråga
 * ser likadan ut på båda.
 */

/** "I have ___ apple." med en skrivlinje i luckan. */
export function withGap(text: string): React.ReactNode {
  const parts = text.split("___");
  if (parts.length === 1) return text;
  return parts.map((p, i) => (
    <span key={i}>
      {p}
      {i < parts.length - 1 && <span className="ps-gap" />}
    </span>
  ));
}

/** Innehållet i en utskriven fråga, inuti dess numrerade <li>. */
export function ExerciseBody({ item: { ex, order, chips } }: { item: DealtExercise }) {
  if (ex.type === "multiple-choice") {
    return (
      <>
        <p>
          {ex.image && <span className="ps-image">{ex.image} </span>}
          {withGap(ex.question)}
        </p>
        <ul className="ps-options">
          {order!.map((oi, place) => (
            <li key={oi}><span className="ps-circle" /> {LETTERS[place]}. {ex.options[oi]}</li>
          ))}
        </ul>
      </>
    );
  }
  if (ex.type === "fill-in-blank") {
    return (
      <>
        <p>{withGap(ex.sentence)}</p>
        {!ex.sentence.includes("___") && <span className="ps-line" />}
      </>
    );
  }
  return (
    <>
      <p>{ex.instruction}</p>
      <p className="ps-chips">{(chips ?? ex.words).map((w, j) => <span key={j} className="ps-chip">{w}</span>)}</p>
      <span className="ps-line" />
    </>
  );
}

/** Ett ordsöksrutnät; i facit syns bokstäverna som bildar orden. */
export function WordGridTable({ grid, hits, isKey }: { grid: string[][]; hits: Set<string>; isKey: boolean }) {
  return (
    <table className={`ps-grid ${isKey ? "ps-grid-key" : ""}`}>
      <tbody>
        {grid.map((row, r) => (
          <tr key={r}>
            {row.map((ch, col) => (
              <td key={col} className={isKey && hits.has(`${r}:${col}`) ? "ps-hit" : undefined}>{ch}</td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}

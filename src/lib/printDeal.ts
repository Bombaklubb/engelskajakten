import type { GrammarExercise } from "./types";

/**
 * Hur en fråga görs klar för papper: alternativen i utskriven ordning och
 * svaret till facit. Ren TypeScript, så att arbetshäftena kan testas utan
 * React; utseendet finns i components/print/printItems.tsx.
 */

export const LETTERS = "ABCDEFGH";

/** En blandad kopia. `rand` är Math.random, eller en fast slump för ett färdigt häfte. */
export function shuffled<T>(list: T[], rand: () => number = Math.random): T[] {
  const a = [...list];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/** En fråga klar att skriva ut, med svaret till facit. */
export interface DealtExercise {
  ex: GrammarExercise;
  /** Flerval: den utskrivna ordningen, som index i ex.options. */
  order?: number[];
  /** Bygg meningen: orden i utskriven ordning. */
  chips?: string[];
  answer: string;
}

/** Flerval: alternativen i ny ordning, facit som "B – an". */
export function dealChoices(
  options: string[],
  correctIndex: number,
  alsoCorrect: number[] = [],
  rand: () => number = Math.random
): { order: number[]; answer: string } {
  const order = shuffled(options.map((_, i) => i), rand);
  const name = (oi: number) => `${LETTERS[order.indexOf(oi)]} – ${options[oi]}`;
  const also = alsoCorrect.filter((i) => i !== correctIndex);
  return { order, answer: name(correctIndex) + (also.length ? ` (även ${also.map(name).join(", ")})` : "") };
}

/**
 * Alternativen och orden blandas här, en gång, så att bokstäverna på bladet
 * och i facit stämmer. Orden i "bygg meningen" ligger i rätt ordning i
 * innehållet (appen blandar dem på skärmen), så de blandas här också –
 * annars står svaret på bladet.
 */
export function dealExercise(ex: GrammarExercise, rand: () => number = Math.random): DealtExercise {
  if (ex.type === "multiple-choice") {
    return { ex, ...dealChoices(ex.options, ex.correctIndex, ex.alsoCorrect, rand) };
  }
  if (ex.type === "fill-in-blank") {
    // Flera luckor skrivs "a ... b" i innehållet.
    return { ex, answer: ex.answer.split(/\s*\.\.\.\s*/).join(" / ") };
  }
  return {
    ex,
    chips: shuffled(ex.words, rand),
    answer: ex.correctOrder.map((i) => ex.words[i]).join(" ").replace(/\s+([.,!?])/g, "$1"),
  };
}

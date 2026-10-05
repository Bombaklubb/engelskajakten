// ─── Godtagbara svarsvarianter ────────────────────────────────────────────────
// Elever ska inte få fel för att de valt en annan korrekt engelsk form än den
// som råkar stå i facit, t.ex. "do not" i stället för "don't". Tabellen är
// tvåvägs. Appen lär ut brittisk engelska, så amerikansk stavning och
// amerikanska ord (color, pants …) finns inte med och godkänns inte.
//
// Läggs varianter till här gäller de i ALLA lucktextövningar direkt – ingen
// behöver redigera enskilda uppgifter.

const GROUPS: string[][] = [
  // ── Sammandragning ↔ utskriven form ────────────────────────────────────────
  ["aren't", "are not"],
  ["isn't", "is not"],
  ["wasn't", "was not"],
  ["weren't", "were not"],
  ["can't", "cannot", "can not"],
  ["couldn't", "could not"],
  ["didn't", "did not"],
  ["doesn't", "does not"],
  ["don't", "do not"],
  ["hasn't", "has not"],
  ["haven't", "have not"],
  ["hadn't", "had not"],
  ["needn't", "need not"],
  ["shouldn't", "should not"],
  ["wouldn't", "would not"],
  ["won't", "will not"],
  ["mustn't", "must not"],
  ["it's", "it is"],
  ["that's", "that is"],
  ["they're", "they are"],
  ["we're", "we are"],
  ["you're", "you are"],
  ["i'm", "i am"],
  ["he's", "he is"],
  ["she's", "she is"],

  // ── Synonymer som båda är korrekta översättningar ──────────────────────────
  // Bara brittisk engelska: amerikanska ord (pants, candy, mom …) godkänns inte.
  ["rabbit", "bunny"],
  ["grandmother", "grandma", "granny", "nan"],
  ["grandfather", "grandpa", "granddad", "grandad"],
  ["mum", "mummy"],
  ["dad", "daddy", "father"],
  ["bin", "rubbish bin"],
  ["sofa", "couch"],
  ["stomach", "belly", "tummy"],
  ["photo", "picture", "photograph"],
];

/** Uppslagstabell: varje form pekar på hela sin grupp. */
const MAP: Record<string, string[]> = {};
for (const group of GROUPS) {
  for (const form of group) MAP[form] = group;
}

/**
 * Alla former som ska godkännas för ett givet facit (inklusive facit självt).
 * Indata förutsätts redan normaliserad (gemener, trimmad).
 */
export function answerVariants(answer: string): string[] {
  return MAP[answer] ?? [answer];
}

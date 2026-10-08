/**
 * Blandar svarsalternativen i en flervalsfråga och flyttar med facit
 * (correctIndex) och eventuella extra godkända svar (alsoCorrect).
 *
 * I innehållsfilerna låg rätt svar ofta på samma plats – i stavningen nästan
 * alltid sist, i gymnasiets grammatik oftast först – så det gick att gissa sig
 * fram på placeringen. Nu blandas alternativen varje gång frågan visas.
 *
 * Alternativ som bara är siffror ("1", "2", "3", "4") får behålla sin ordning,
 * eftersom en blandad sifferföljd bara förvirrar.
 */
export function shuffleChoices<T extends { options: string[]; correctIndex: number; alsoCorrect?: number[] }>(
  q: T
): T {
  if (q.options.every((o) => /^\s*-?\d+([.,]\d+)?\s*$/.test(o))) return q;

  const order = q.options.map((_, i) => i);
  for (let i = order.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [order[i], order[j]] = [order[j], order[i]];
  }
  // order[ny plats] = gammal plats
  const newIndexOf = (old: number) => order.indexOf(old);
  return {
    ...q,
    options: order.map((i) => q.options[i]),
    correctIndex: newIndexOf(q.correctIndex),
    ...(q.alsoCorrect ? { alsoCorrect: q.alsoCorrect.map(newIndexOf) } : {}),
  };
}

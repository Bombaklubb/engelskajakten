/**
 * Adresser till kapitel. Alla kapitel i en värld visas på samma sida,
 * /world/<värld>/kapitel, och kapitlet anges efter # (se kapitel/KapitelClient).
 */

export type ChapterKind = "grammar" | "spelling" | "wordsearch" | "spel";

const KINDS: ChapterKind[] = ["grammar", "spelling", "wordsearch", "spel"];

export function chapterHref(stageId: string, kind: ChapterKind, moduleId: string): string {
  return `/world/${stageId}/kapitel#${kind}/${encodeURIComponent(moduleId)}`;
}

/** "#grammar/lag-g3-a-an" → { kind, id }. null om hashen inte är ett kapitel. */
export function chapterFromHash(hash: string): { kind: ChapterKind; id: string } | null {
  const m = hash.replace(/^#/, "").match(/^([a-z]+)\/(.+)$/);
  if (!m || !KINDS.includes(m[1] as ChapterKind)) return null;
  try {
    return { kind: m[1] as ChapterKind, id: decodeURIComponent(m[2]) };
  } catch {
    return null;
  }
}

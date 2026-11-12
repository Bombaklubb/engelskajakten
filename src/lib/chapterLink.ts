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

/**
 * Kapitlets egen adress, den som delas och som sökmotorer hittar:
 * /world/<värld>/<slag>/<id>. Sidan finns färdigbyggd för varje kapitel.
 * Eleverna öppnar i stället kapitlen via chapterHref, utan sidbyte.
 */
export function chapterSharePath(stageId: string, kind: ChapterKind, moduleId: string): string {
  return `/world/${stageId}/${kind}/${encodeURIComponent(moduleId)}`;
}

/** Nyckel i sessionStorage: kapitlet en utloggad besökare var på väg till. */
export const AFTER_LOGIN_KEY = "engelskajakten_efter_inloggning";

/** Bara kapiteladresser godtas som mål efter inloggningen. */
export function isChapterPath(path: string): boolean {
  return /^\/world\/[a-z]+\/(grammar|spelling|wordsearch|spel)\/[A-Za-z0-9_%-]+$/.test(path);
}

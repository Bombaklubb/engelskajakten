import { readFileSync } from "node:fs";
import { join } from "node:path";
import { STAGES } from "./stages";
import type { Metadata } from "next";
import type { StageContent } from "./types";

/**
 * Parametrar för generateStaticParams. Världssidorna och kapitelsidorna byggs
 * då en gång vid deploy och skickas som färdiga filer från Vercels CDN, i
 * stället för att renderas på servern vid varje besök. Sidorna hämtar ändå
 * sitt innehåll och elevens framsteg i webbläsaren, så inget ändras för eleven.
 */

export function stageParams(): { stage: string }[] {
  return STAGES.map((s) => ({ stage: s.id }));
}

type Kind = "grammar" | "spelling" | "wordsearch" | "spel";

export function moduleParams(kind: Kind): { stage: string; module: string }[] {
  const out: { stage: string; module: string }[] = [];
  for (const s of STAGES) {
    const file = join(process.cwd(), "public", "content", s.id, "content.json");
    const content = JSON.parse(readFileSync(file, "utf8")) as StageContent;
    for (const m of content[kind] ?? []) out.push({ stage: s.id, module: m.id });
  }
  return out;
}

export const SITE_URL = "https://engelskajakten.martinsjakter.se";

const KIND_NAMES: Record<Kind, string> = {
  grammar: "Grammatik",
  spelling: "Stavning",
  wordsearch: "Ordsökning",
  spel: "Spel",
};

function readContent(stageId: string): StageContent {
  const file = join(process.cwd(), "public", "content", stageId, "content.json");
  return JSON.parse(readFileSync(file, "utf8")) as StageContent;
}

/**
 * Egen titel och beskrivning för ett kapitels sida, så att en delad länk och
 * en träff i en sökmotor säger vad kapitlet handlar om. Läses ur innehållet
 * vid bygget.
 */
export function moduleMetadata(kind: Kind, stageId: string, moduleId: string): Metadata {
  const stage = STAGES.find((s) => s.id === stageId);
  const id = decodeURIComponent(moduleId);
  const mod = stage ? (readContent(stageId)[kind] ?? []).find((m) => m.id === id) : undefined;
  if (!stage || !mod) return {};
  const title = `${mod.title} – ${KIND_NAMES[kind]} · Engelskajakten`;
  const description = `${mod.description} ${KIND_NAMES[kind]} i ${stage.name} (${stage.grades}) i Engelskajakten – gratis övningar i engelska med rättning och förklaringar direkt.`;
  const url = `${SITE_URL}/world/${stageId}/${kind}/${encodeURIComponent(id)}`;
  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: { title, description, url, siteName: "Engelskajakten", type: "website" },
  };
}

/** Alla kapitels adresser, för sitemap.xml. */
export function allChapterPaths(): string[] {
  const kinds: Kind[] = ["grammar", "spelling", "wordsearch", "spel"];
  return kinds.flatMap((kind) => moduleParams(kind).map((p) => `/world/${p.stage}/${kind}/${encodeURIComponent(p.module)}`));
}

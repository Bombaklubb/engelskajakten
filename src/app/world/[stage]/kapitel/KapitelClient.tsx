"use client";

import { use, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import GrammarModuleClient from "../grammar/[module]/GrammarModuleClient";
import SpellingModuleClient from "../spelling/[module]/SpellingModuleClient";
import WordSearchModuleClient from "../wordsearch/[module]/WordSearchModuleClient";
import SpelModuleClient from "../spel/[module]/SpelModuleClient";
import { chapterFromHash, type ChapterKind } from "@/lib/chapterLink";

/**
 * Alla kapitel i en värld på en och samma sida: /world/<värld>/kapitel#<slag>/<id>.
 *
 * Varje kapitel låg förut på en egen adress, och varje nytt kapitel kostade då
 * ett anrop mot Vercel. Det som står efter # skickas aldrig till servern, så
 * sidan hämtas en gång och nästa kapitel byts bara här i webbläsaren. Kapitlen
 * själva är samma komponenter som på de gamla adresserna, som finns kvar för
 * gamla länkar och bokmärken.
 */

const CLIENTS: Record<ChapterKind, React.ComponentType<{ params: Promise<{ stage: string; module: string }> }>> = {
  grammar: GrammarModuleClient,
  spelling: SpellingModuleClient,
  wordsearch: WordSearchModuleClient,
  spel: SpelModuleClient,
};

/** Ett redan uppfyllt löfte, som React kan läsa med use() utan att vänta. */
function resolved<T>(value: T): Promise<T> {
  return Object.assign(Promise.resolve(value), { status: "fulfilled", value });
}

export default function KapitelClient({ params }: { params: Promise<{ stage: string }> }) {
  const { stage } = use(params);
  const router = useRouter();
  const [hash, setHash] = useState<string | null>(null);

  // Hashen finns bara i webbläsaren. Den läses när sidan visas och när den
  // ändras, till exempel med webbläsarens bakåtknapp mellan två kapitel.
  useEffect(() => {
    const read = () => setHash(window.location.hash);
    read();
    window.addEventListener("hashchange", read);
    return () => window.removeEventListener("hashchange", read);
  }, []);

  const chapter = hash === null ? null : chapterFromHash(hash);

  // Okänd eller saknad hash: tillbaka till världen.
  useEffect(() => {
    if (hash !== null && !chapter) router.replace(`/world/${stage}`);
  }, [hash, chapter, router, stage]);

  const moduleParams = useMemo(
    () => (chapter ? resolved({ stage, module: chapter.id }) : null),
    [stage, chapter?.id] // eslint-disable-line react-hooks/exhaustive-deps
  );

  if (!chapter || !moduleParams) return null;
  const Client = CLIENTS[chapter.kind];
  // key: ett nytt kapitel börjar från början, precis som på en ny sida.
  return <Client key={`${chapter.kind}/${chapter.id}`} params={moduleParams} />;
}

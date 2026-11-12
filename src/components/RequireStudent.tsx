"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { loadStudent } from "@/lib/storage";
import { AFTER_LOGIN_KEY, isChapterPath } from "@/lib/chapterLink";

/**
 * Runt ett kapitel som öppnas via sin egen adress (en delad länk eller en
 * sökträff). Den som inte är inloggad skickas till startsidan för att skriva
 * sitt namn, och kommer sedan rakt tillbaka till kapitlet (se app/page.tsx).
 */
export default function RequireStudent({ children }: { children: React.ReactNode }) {
  const router = useRouter();

  useEffect(() => {
    if (loadStudent()) return;
    const path = window.location.pathname.replace(/\/$/, "");
    try {
      if (isChapterPath(path)) sessionStorage.setItem(AFTER_LOGIN_KEY, path);
    } catch {
      // sessionStorage avstängd: eleven hamnar på startsidan efter inloggningen
    }
    router.replace("/");
  }, [router]);

  return <>{children}</>;
}

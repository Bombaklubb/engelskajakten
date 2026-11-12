import type { MetadataRoute } from "next";
import { STAGES } from "@/lib/stages";
import { SITE_URL, allChapterPaths } from "@/lib/staticParams";

// Byggs en gång vid deploy (appen exporteras som statiska filer). Filen heter
// .tsx för att Cloudflare-bygget bara tar med .tsx-filer (se next.config.ts).
export const dynamic = "force-static";

/** Startsidan, Om-sidan, världarna och varje kapitels egen sida. */
export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: `${SITE_URL}/`, priority: 1 },
    { url: `${SITE_URL}/om`, priority: 0.8 },
    ...STAGES.map((s) => ({ url: `${SITE_URL}/world/${s.id}`, priority: 0.7 })),
    ...allChapterPaths().map((path) => ({ url: `${SITE_URL}${path}`, priority: 0.5 })),
  ];
}

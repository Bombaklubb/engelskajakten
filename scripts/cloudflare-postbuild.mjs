/**
 * Körs efter `next build` på Cloudflare Pages (CF_PAGES=1), på de exporterade
 * filerna i out/. På Vercel gör det ingenting.
 *
 * Appen hämtar varje stadies content.json och rules.json som
 * content-<hash>.json (se lib/contentUrl.ts och next.config.ts). På Vercel
 * pekar en rewrite det namnet på den riktiga filen; en statisk sajt har inga
 * rewrites, så kopior med hashen i namnet skrivs bredvid originalen i stället,
 * och _headers får en regel som sparar dem för alltid (namnet byts när
 * innehållet ändras). Hashen räknas på samma sätt som i next.config.ts.
 */
import { appendFileSync, copyFileSync, existsSync, readFileSync } from "node:fs";
import { createHash } from "node:crypto";
import path from "node:path";

if (process.env.CF_PAGES === "1") {
  const STAGES = ["lagstadiet", "mellanstadiet", "hogstadiet", "gymnasiet"];
  const out = path.join(process.cwd(), "out");
  let n = 0;
  let rules = "";
  for (const stage of STAGES) {
    for (const name of ["content", "rules"]) {
      const src = path.join(process.cwd(), "public", "content", stage, `${name}.json`);
      const exported = path.join(out, "content", stage, `${name}.json`);
      if (!existsSync(src) || !existsSync(exported)) continue;
      const hash = createHash("sha256").update(readFileSync(src)).digest("hex").slice(0, 12);
      copyFileSync(exported, path.join(out, "content", stage, `${name}-${hash}.json`));
      rules += `\n/content/${stage}/${name}-${hash}.json\n  ! Cache-Control\n  Cache-Control: public, max-age=31536000, immutable\n`;
      n++;
    }
  }
  appendFileSync(path.join(out, "_headers"), rules);
  console.log(`cloudflare-postbuild: ${n} innehållsfiler med hash i namnet`);
}

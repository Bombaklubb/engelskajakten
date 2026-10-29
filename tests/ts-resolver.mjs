/**
 * Resolver hook for the test runner.
 *
 * The app is bundled by Next.js, which resolves extensionless imports like
 * `./gamification` and the `@/` alias. Node's ESM loader does neither, so this
 * hook fills both gaps and lets `node --test` run the real source files with no
 * build step and no test framework dependency.
 */
import { fileURLToPath, pathToFileURL } from "node:url";
import { existsSync } from "node:fs";
import path from "node:path";

const SRC = fileURLToPath(new URL("../src/", import.meta.url));

export function resolve(specifier, context, nextResolve) {
  // "@/lib/x" -> <repo>/src/lib/x
  if (specifier.startsWith("@/")) {
    const target = path.join(SRC, specifier.slice(2));
    for (const candidate of [target, `${target}.ts`, `${target}.tsx`, path.join(target, "index.ts")]) {
      if (existsSync(candidate)) return nextResolve(pathToFileURL(candidate).href, context);
    }
  }

  // "./gamification" -> "./gamification.ts"
  if (specifier.startsWith(".") && !path.extname(specifier) && context.parentURL) {
    const target = fileURLToPath(new URL(specifier, context.parentURL));
    for (const candidate of [`${target}.ts`, `${target}.tsx`, path.join(target, "index.ts")]) {
      if (existsSync(candidate)) return nextResolve(pathToFileURL(candidate).href, context);
    }
  }

  return nextResolve(specifier, context);
}

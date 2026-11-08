/**
 * Statistiken på Cloudflare Pages: samma logik som src/app/api/stats/ (Vercel),
 * men som Pages Functions. Databasen och nycklarna är desamma (Upstash Redis
 * via KV_REST_API_URL och KV_REST_API_TOKEN, prefixet "engelskajakten:"), så
 * lärarvyn räknar vidare där den var.
 *
 * Ligger utanför functions/, så att filen inte blir en egen adress.
 */
import { Redis } from "@upstash/redis/cloudflare";

export interface Env {
  KV_REST_API_URL?: string;
  KV_REST_API_TOKEN?: string;
  TEACHER_PASSWORD?: string;
}

export interface Context {
  request: Request;
  env: Env;
}

export const KEY_PREFIX = "engelskajakten:";

export function redisFrom(env: Env): Redis {
  return new Redis({ url: env.KV_REST_API_URL || "", token: env.KV_REST_API_TOKEN || "" });
}

/** Samma dagnyckel som src/lib/redis.ts (UTC-datum), så dagsmängderna är desamma. */
export function getTodayKey(): string {
  return new Date().toISOString().split("T")[0];
}

export const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });

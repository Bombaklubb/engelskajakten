/**
 * POST /api/stats/get – samma som src/app/api/stats/get/route.ts.
 * Aggregerad, anonym statistik till lärarvyn. Kräver lärarlösenordet.
 */
import type { Redis } from "@upstash/redis/cloudflare";
import { type Context, KEY_PREFIX, getTodayKey, json, redisFrom } from "../../../functions-lib/redis";

/** Hur länge en enhet räknas som "inloggad nu" efter sin senaste rapport. */
const ACTIVE_WINDOW_MS = 15 * 60 * 1000;

/**
 * Verkligt unika enheter. Är mängden visitors:all tom byggs den, en enda gång,
 * upp från dagsmängderna (samma som på Vercel).
 */
async function countUniqueDevices(redis: Redis): Promise<number> {
  const allKey = `${KEY_PREFIX}visitors:all`;
  try {
    const known = await redis.scard(allKey);
    if (known > 0) return known;

    const dayKeys = (await redis.keys(`${KEY_PREFIX}visitors:*`)).filter((k) => k !== allKey);
    if (dayKeys.length === 0) return 0;
    await redis.sunionstore(allKey, allKey, ...dayKeys);
    return await redis.scard(allKey);
  } catch {
    return 0;
  }
}

export async function onRequestPost({ request, env }: Context): Promise<Response> {
  try {
    const { password } = (await request.json()) as { password?: string };
    const teacherPassword = env.TEACHER_PASSWORD || "Engelskajakten";

    if (password !== teacherPassword) {
      return json({ error: "Unauthorized" }, 401);
    }

    const redis = redisFrom(env);
    const today = getTodayKey();
    const activeKey = `${KEY_PREFIX}active`;
    await redis.zremrangebyscore(activeKey, 0, Date.now() - ACTIVE_WINDOW_MS);
    const [activeNow, visitorsToday, uniqueDevices] = await Promise.all([
      redis.zcard(activeKey),
      redis.scard(`${KEY_PREFIX}visitors:${today}`),
      countUniqueDevices(redis),
    ]);

    return json({
      activeNow,
      visitorsToday,
      uniqueDevices,
      gdprNote: "Anonymiserad aggregerad statistik – ingen personlig data lagras",
    });
  } catch (error) {
    console.error("Get stats error:", error);
    return json({ error: "Internal server error" }, 500);
  }
}

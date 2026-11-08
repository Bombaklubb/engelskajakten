/**
 * POST /api/stats/track – samma som src/app/api/stats/track/route.ts.
 * Anonym statistik: bara det lärarvyn visar sparas (inloggade nu, enheter
 * idag och unika enheter totalt). Ingen personlig information lagras.
 */
import { type Context, KEY_PREFIX, getTodayKey, json, redisFrom } from "../../../functions-lib/redis";

export async function onRequestPost({ request, env }: Context): Promise<Response> {
  try {
    const event = (await request.json()) as { type?: string; deviceId?: string };
    const today = getTodayKey();

    if (!event.type || !event.deviceId) {
      return json({ error: "Missing required fields" }, 400);
    }
    if (!/^[a-f0-9-]{36}$/.test(event.deviceId)) {
      return json({ error: "Invalid deviceId format" }, 400);
    }

    const redis = redisFrom(env);
    // Varje anrop håller eleven kvar under "Inloggade nu" i lärarvyn.
    await redis.zadd(`${KEY_PREFIX}active`, { score: Date.now(), member: event.deviceId });

    if (event.type === "pageview") {
      await redis.sadd(`${KEY_PREFIX}visitors:${today}`, event.deviceId);
      // Permanent mängd över alla enheter som någonsin besökt appen.
      await redis.sadd(`${KEY_PREFIX}visitors:all`, event.deviceId);
    }

    return json({ success: true });
  } catch (error) {
    console.error("Track error:", error);
    return json({ error: "Internal server error" }, 500);
  }
}

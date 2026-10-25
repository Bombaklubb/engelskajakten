/**
 * GDPR-SÄKRAD STATISTIK-TRACKING – Engelskajakten
 *
 * Samlar IN anonym, aggregerad statistik.
 * INGEN personlig information lagras.
 */

import { NextRequest, NextResponse } from 'next/server';
import { redis, KEY_PREFIX, getTodayKey } from '@/lib/redis';

interface TrackEvent {
  type: 'pageview' | 'task_complete' | 'error' | 'session_time' | 'batch';
  deviceId: string;
  data?: {
    questionType?: string;
    timeSeconds?: number;
    correct?: boolean;
    /** batch: klarade kapitel sedan förra anropet. */
    tasks?: { correct?: boolean; questionType?: string }[];
  };
}

export async function POST(req: NextRequest) {
  try {
    const event: TrackEvent = await req.json();
    const today = getTodayKey();

    if (!event.type || !event.deviceId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    if (!/^[a-f0-9-]{36}$/.test(event.deviceId)) {
      return NextResponse.json({ error: 'Invalid deviceId format' }, { status: 400 });
    }

    // Varje anrop håller eleven kvar under "Inloggade nu" i lärarvyn. "Aktiva
    // nu" är en sorterad mängd med tidsstämpel, så lärarvyn räknar med ett zcard.
    await redis.zadd(`${KEY_PREFIX}active`, { score: Date.now(), member: event.deviceId });

    // Bara det lärarvyn visar sparas: enheter idag och unika enheter totalt.
    // Sidvisningar, kapitel, tid och fel sparades förut också (upp till sex
    // kommandon per anrop) men visas inte längre. Databasen delas med
    // Läsjakten och Readhunt och har ett tak på 500 000 kommandon i månaden,
    // som tog slut i oktober 2026. Övriga typer ('batch' och äldre
    // 'task_complete', 'session_time', 'error') kostar därför bara raden ovan.
    if (event.type === 'pageview') {
      await redis.sadd(`${KEY_PREFIX}visitors:${today}`, event.deviceId);
      // Permanent mängd över alla enheter som någonsin besökt appen.
      await redis.sadd(`${KEY_PREFIX}visitors:all`, event.deviceId);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Track error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

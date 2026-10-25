/**
 * GDPR-SÄKRAD STATISTIK-HÄMTNING – Engelskajakten
 *
 * Returnerar aggregerad, anonym statistik.
 * Kräver lösenord för åtkomst.
 *
 * Kostnaden är räknad i Redis-kommandon, för databasen ligger på en fri nivå
 * med 500 000 kommandon i månaden. Den här rutten kostade 78 kommandon per
 * hämtning — två KEYS-svep över hela nyckelrymden, ett sunionstore och två
 * slingor över fjorton dagar — och lärarvyn hämtade var trettionde sekund.
 * Det blev 9 360 kommandon i timmen från en flik som stod öppen.
 */

import { NextRequest, NextResponse } from 'next/server';
import { redis, KEY_PREFIX, getTodayKey } from '@/lib/redis';

const TEACHER_PASSWORD = process.env.TEACHER_PASSWORD || 'Engelskajakten';
/**
 * Hur länge en enhet räknas som "inloggad nu" efter sin senaste rapport.
 * Appen skickar kapitel och tid i klump, högst var tionde minut (se
 * analyticsService), så fönstret måste vara längre än så.
 */
const ACTIVE_WINDOW_MS = 15 * 60 * 1000;

/**
 * Verkligt unika enheter. Mängden visitors:all fylls på vid varje besök, men
 * data som samlades in innan den fanns ligger bara i dagsmängderna. Den
 * hopslagningen behöver göras en enda gång — förut gjordes den om vid varje
 * hämtning, med ett KEYS-svep och ett sunionstore som växer med historiken.
 * Är mängden tom är den antingen ny eller aldrig ifylld; då, och bara då,
 * byggs den upp från dagsmängderna.
 */
async function countUniqueDevices(): Promise<number> {
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

export async function POST(req: NextRequest) {
  try {
    const { password } = await req.json();

    if (password !== TEACHER_PASSWORD) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const today = getTodayKey();

    // Lärarvyn visar tre siffror: inloggade nu, enheter idag och unika enheter
    // totalt. Här lästes förut också uppgifter, tid och fel för fjorton dagar
    // till en graf som inte längre visas. Databasen delas med Läsjakten och
    // Readhunt och har ett tak på 500 000 kommandon i månaden, som tog slut i
    // oktober 2026.
    const activeKey = `${KEY_PREFIX}active`;
    await redis.zremrangebyscore(activeKey, 0, Date.now() - ACTIVE_WINDOW_MS);
    const [activeNow, visitorsToday, uniqueDevices] = await Promise.all([
      redis.zcard(activeKey),
      redis.scard(`${KEY_PREFIX}visitors:${today}`),
      countUniqueDevices(),
    ]);

    return NextResponse.json({
      activeNow,
      visitorsToday,
      uniqueDevices,          // verkligt unika enheter, hela historiken
      gdprNote: 'Anonymiserad aggregerad statistik – ingen personlig data lagras',
    });
  } catch (error) {
    console.error('Get stats error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

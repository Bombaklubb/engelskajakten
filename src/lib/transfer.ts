/**
 * Spara och flytta elevens framsteg mellan enheter.
 *
 * Allt som behövs packas till ett JSON-objekt. Som fil laddas det ner som det
 * är; som flytt-länk komprimeras det (deflate-raw), skrivs som base64url med
 * prefixet "EJ1" och läggs efter # i /flytta#k=<kod>. Det som står efter # skickas
 * aldrig till servern, så framstegen lämnar bara elevens egna enheter.
 *
 * Paketet har samma fält som StudentData högst upp (namn, poäng, kapitel), så
 * en fil från den nya versionen är också en giltig gammal säkerhetskopia. Det
 * som kom till senare – kistor, märken, köp och dagsserie – ligger under
 * "extra". Äldre filer och koder utan "extra" fungerar fortfarande; då behålls
 * det enheten redan har av sådant.
 *
 * Allt som läses in rensas: okända fält, stadier, avatarer och varor tas bort,
 * tal begränsas, och spenderade poäng får aldrig överstiga totalen.
 */

import type { StudentData, StageId, StageProgress, ModuleProgress, GamificationData, Chest, ChestType } from "./types";
import { AVATARS } from "./avatars";
import { SHOP_AVATAR_MAP, FRAME_MAP, THEME_MAP, EFFECT_MAP } from "./shop";
import { ALL_BADGES, BOSS_CONFIGS, defaultGamificationData } from "./gamification";
import { defaultShop, type ShopData } from "./shopStorage";

const PREFIX = "EJ1";
const STAGE_IDS: StageId[] = ["lagstadiet", "mellanstadiet", "hogstadiet", "gymnasiet"];
const MODULE_MAPS = ["grammarModules", "readingModules", "spellingModules", "wordsearchModules", "spelModules"] as const;
const CHEST_TYPES: ChestType[] = ["wood", "silver", "gold", "ruby", "diamond", "emerald", "hemlig"];
const BADGE_IDS = new Set(ALL_BADGES.map((b) => b.id));
const BOSS_IDS = new Set(Object.keys(BOSS_CONFIGS));
const MAX_POINTS = 100_000_000;

interface Streak { days: number; lastDate: string }

/** Det som läses in och sparas. gamification/shop/streak saknas i äldre filer. */
export interface TransferBundle {
  student: StudentData;
  gamification?: GamificationData;
  shop?: ShopData;
  streak?: Streak;
}

// ─── Lagring (samma nycklar som resten av appen) ─────────────────────────────

const k = (name: string) => name.toLowerCase().trim();
const KEYS = {
  active: "engelskajakten_active",
  session: "engelskajakten_session_start",
  student: (n: string) => `engelskajakten_student_${k(n)}`,
  gam: (n: string) => `engelskajakten_gamification_${k(n)}`,
  shop: (n: string) => `engelskajakten_shop_${k(n)}`,
  streak: (n: string) => `engelskajakten_streak_${k(n)}`,
};

function readJson<T>(key: string): T | undefined {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : undefined;
  } catch {
    return undefined;
  }
}

/** Allt som hör till eleven på den här enheten, i den form som flyttas. */
export function collectBundle(student: StudentData): TransferBundle {
  return {
    student,
    gamification: readJson<GamificationData>(KEYS.gam(student.name)) ?? defaultGamificationData(),
    shop: { ...defaultShop(), ...readJson<Partial<ShopData>>(KEYS.shop(student.name)) },
    streak: readJson<Streak>(KEYS.streak(student.name)),
  };
}

/** Paketet som JSON-objekt: StudentData högst upp, nyare delar under "extra". */
function toPayload(b: TransferBundle) {
  return { ...b.student, extra: { v: 1, gamification: b.gamification, shop: b.shop, streak: b.streak } };
}

// ─── Kontroll av det som läses in ────────────────────────────────────────────

const isObj = (v: unknown): v is Record<string, unknown> => typeof v === "object" && v !== null && !Array.isArray(v);
const str = (v: unknown, max = 200) => (typeof v === "string" ? v.slice(0, max) : undefined);
const int = (v: unknown, max = MAX_POINTS) => (typeof v === "number" && Number.isFinite(v) ? Math.min(max, Math.max(0, Math.round(v))) : 0);
const date = (v: unknown) => (typeof v === "string" && !Number.isNaN(Date.parse(v)) ? v.slice(0, 40) : new Date().toISOString());
const MODULE_ID = /^[a-z0-9][a-z0-9_-]{0,79}$/i;

function cleanModules(v: unknown): Record<string, ModuleProgress> {
  const out: Record<string, ModuleProgress> = {};
  if (!isObj(v)) return out;
  for (const [id, m] of Object.entries(v)) {
    if (!MODULE_ID.test(id) || !isObj(m)) continue;
    out[id] = {
      moduleId: id,
      completed: m.completed === true,
      points: int(m.points),
      attempts: int(m.attempts, 10_000),
      lastAttempt: date(m.lastAttempt),
    };
  }
  return out;
}

function cleanStudent(v: unknown): StudentData | null {
  if (!isObj(v)) return null;
  const name = str(v.name, 30)?.trim();
  if (!name || !isObj(v.stages)) return null;
  const stages = {} as Record<StageId, StageProgress>;
  for (const id of STAGE_IDS) {
    const s = isObj(v.stages[id]) ? (v.stages[id] as Record<string, unknown>) : {};
    stages[id] = { stageId: id } as StageProgress;
    for (const map of MODULE_MAPS) stages[id][map] = cleanModules(s[map]);
  }
  const avatar = str(v.avatar, 40);
  const student: StudentData = {
    name,
    createdAt: date(v.createdAt),
    lastActive: date(v.lastActive),
    totalPoints: int(v.totalPoints),
    stages,
  };
  if (avatar && (AVATARS.some((a) => a.id === avatar) || SHOP_AVATAR_MAP[avatar])) student.avatar = avatar;
  const day = str(v.lastModuleDay, 10);
  if (day && /^\d{4}-\d{2}-\d{2}$/.test(day)) student.lastModuleDay = day;
  return student;
}

function cleanGamification(v: unknown): GamificationData | undefined {
  if (!isObj(v)) return undefined;
  const g = defaultGamificationData();
  if (Array.isArray(v.chests)) {
    g.chests = v.chests
      .filter(isObj)
      .filter((c) => CHEST_TYPES.includes(c.type as ChestType))
      .slice(0, 1000)
      .map((c, i): Chest => {
        const chest: Chest = {
          id: str(c.id, 60) || `chest_in_${i}`,
          type: c.type as ChestType,
          earnedAt: date(c.earnedAt),
          opened: c.opened === true,
        };
        const reward = str(c.openedReward);
        if (chest.opened && reward) chest.openedReward = reward;
        return chest;
      });
  }
  if (Array.isArray(v.badges)) g.badges = [...new Set(v.badges.filter((b): b is string => typeof b === "string" && BADGE_IDS.has(b)))];
  g.exercisesCompleted = int(v.exercisesCompleted);
  g.bossUnlocked = v.bossUnlocked === true;
  if (typeof v.bossLastAttempt === "string") g.bossLastAttempt = date(v.bossLastAttempt);
  g.bossWins = int(v.bossWins, 100_000);
  if (Array.isArray(v.bossesBeaten)) g.bossesBeaten = [...new Set(v.bossesBeaten.filter((b): b is string => typeof b === "string" && BOSS_IDS.has(b)))];
  if (isObj(v.bossWinCounts)) {
    g.bossWinCounts = {};
    for (const [id, n] of Object.entries(v.bossWinCounts)) if (BOSS_IDS.has(id)) g.bossWinCounts[id] = int(n, 100_000);
  }
  const nums = (a: unknown) => (Array.isArray(a) ? [...new Set(a.filter((n): n is number => typeof n === "number" && Number.isFinite(n) && n >= 0))].slice(0, 500) : []);
  g.pointsMilestonesRewarded = nums(v.pointsMilestonesRewarded);
  g.exerciseMilestonesRewarded = nums(v.exerciseMilestonesRewarded);
  return g;
}

function cleanShop(v: unknown, totalPoints: number): ShopData | undefined {
  if (!isObj(v)) return undefined;
  const owned = (a: unknown, known: Record<string, unknown>) =>
    Array.isArray(a) ? [...new Set(a.filter((id): id is string => typeof id === "string" && id in known))] : [];
  const shop: ShopData = {
    // Spenderat kan aldrig vara mer än vad eleven har tjänat.
    spent: Math.min(int(v.spent), totalPoints),
    ownedAvatars: owned(v.ownedAvatars, SHOP_AVATAR_MAP),
    ownedFrames: owned(v.ownedFrames, FRAME_MAP),
    ownedThemes: owned(v.ownedThemes, THEME_MAP),
    ownedEffects: owned(v.ownedEffects, EFFECT_MAP),
    equippedFrame: null,
    equippedTheme: null,
    equippedEffect: null,
  };
  // Bara sådant eleven äger kan vara påtaget.
  if (typeof v.equippedFrame === "string" && shop.ownedFrames.includes(v.equippedFrame)) shop.equippedFrame = v.equippedFrame;
  if (typeof v.equippedTheme === "string" && shop.ownedThemes.includes(v.equippedTheme)) shop.equippedTheme = v.equippedTheme;
  if (typeof v.equippedEffect === "string" && shop.ownedEffects.includes(v.equippedEffect)) shop.equippedEffect = v.equippedEffect;
  return shop;
}

function cleanStreak(v: unknown): Streak | undefined {
  if (!isObj(v)) return undefined;
  const lastDate = str(v.lastDate, 10);
  if (!lastDate || !/^\d{4}-\d{2}-\d{2}$/.test(lastDate)) return undefined;
  return { days: int(v.days, 100_000), lastDate };
}

/** Kontrollerar ett inläst paket (ny eller gammal form). null om det inte går att använda. */
export function cleanBundle(raw: unknown): TransferBundle | null {
  const student = cleanStudent(raw);
  if (!student) return null;
  const extra = isObj(raw) && isObj(raw.extra) ? raw.extra : {};
  return {
    student,
    gamification: cleanGamification(extra.gamification),
    shop: cleanShop(extra.shop, student.totalPoints),
    streak: cleanStreak(extra.streak),
  };
}

// ─── Flytt-länk ──────────────────────────────────────────────────────────────

export function canUseLinks(): boolean {
  return typeof CompressionStream !== "undefined" && typeof DecompressionStream !== "undefined";
}

function toBase64Url(bytes: Uint8Array): string {
  let bin = "";
  for (let i = 0; i < bytes.length; i += 0x8000) bin += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function fromBase64Url(s: string): Uint8Array {
  const b64 = s.replace(/-/g, "+").replace(/_/g, "/") + "===".slice((s.length + 3) % 4);
  const bin = atob(b64);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

async function pipe(bytes: Uint8Array, stream: CompressionStream | DecompressionStream): Promise<Uint8Array> {
  const out = new Blob([bytes as BlobPart]).stream().pipeThrough(stream);
  return new Uint8Array(await new Response(out).arrayBuffer());
}

// I länken skrivs paketet kortare än i filen, så att fler kapitel ryms i en
// QR-kod: tidpunkter blir dagnummer och kapitel och kistor blir korta listor.
// Kistornas id:n skapas på nytt vid inläsningen.
const KIND = { g: "grammarModules", r: "readingModules", s: "spellingModules", w: "wordsearchModules", p: "spelModules" } as const;
type Short = keyof typeof KIND;
const toDay = (iso: string) => Math.floor((Date.parse(iso) || Date.now()) / 864e5);
const fromDay = (d: unknown) => new Date((typeof d === "number" ? d : toDay("")) * 864e5 + 432e5).toISOString();

function compact(b: TransferBundle) {
  const st = b.student;
  const stages: Record<string, Partial<Record<Short, Record<string, number[]>>>> = {};
  for (const id of STAGE_IDS) {
    for (const [short, map] of Object.entries(KIND) as [Short, (typeof MODULE_MAPS)[number]][]) {
      const mods = Object.entries(st.stages[id]?.[map] ?? {});
      if (!mods.length) continue;
      (stages[id] ??= {})[short] = Object.fromEntries(
        mods.map(([mid, m]) => [mid, [m.completed ? 1 : 0, m.points, m.attempts, toDay(m.lastAttempt)]])
      );
    }
  }
  const g = b.gamification;
  return {
    n: st.name, a: st.avatar, c: toDay(st.createdAt), t: st.totalPoints, d: st.lastModuleDay, s: stages,
    g: g && {
      ...g,
      chests: g.chests.map((c) => [CHEST_TYPES.indexOf(c.type), toDay(c.earnedAt), c.opened ? 1 : 0, ...(c.openedReward ? [c.openedReward] : [])]),
    },
    h: b.shop,
    k: b.streak,
  };
}

/** Den korta formen tillbaka till samma form som filen, före kontrollen. */
function expand(v: Record<string, unknown>) {
  const stages: Record<string, Record<string, Record<string, unknown>>> = {};
  const s = isObj(v.s) ? v.s : {};
  for (const id of STAGE_IDS) {
    stages[id] = {};
    const st = isObj(s[id]) ? (s[id] as Record<string, unknown>) : {};
    for (const [short, map] of Object.entries(KIND)) {
      const mods = isObj(st[short]) ? (st[short] as Record<string, unknown>) : {};
      stages[id][map] = Object.fromEntries(
        Object.entries(mods)
          .filter(([, m]) => Array.isArray(m))
          .map(([mid, m]) => {
            const [done, points, attempts, day] = m as unknown[];
            return [mid, { completed: done === 1, points, attempts, lastAttempt: fromDay(day) }];
          })
      );
    }
  }
  const g = isObj(v.g) ? v.g : undefined;
  return {
    name: v.n, avatar: v.a, createdAt: fromDay(v.c), lastActive: new Date().toISOString(), totalPoints: v.t, lastModuleDay: v.d, stages,
    extra: {
      gamification: g && {
        ...g,
        chests: Array.isArray(g.chests)
          ? g.chests.filter(Array.isArray).map((c: unknown[], i: number) => ({
              id: `chest_f${i}_${c[1]}`, type: CHEST_TYPES[c[0] as number], earnedAt: fromDay(c[1]), opened: c[2] === 1, openedReward: c[3],
            }))
          : [],
      },
      shop: v.h,
      streak: v.k,
    },
  };
}

/** Flytt-koden: "EJ1" + base64url av komprimerad JSON. */
export async function makeCode(b: TransferBundle): Promise<string> {
  const json = new TextEncoder().encode(JSON.stringify(compact(b)));
  return PREFIX + toBase64Url(await pipe(json, new CompressionStream("deflate-raw")));
}

export function linkFor(code: string): string {
  return `${window.location.origin}/flytta#k=${code}`;
}

/** Plockar ut koden ur en hel länk eller tar texten som den är. */
export function extractCode(input: string): string {
  const text = input.trim();
  const m = text.match(/[#?&]k=([^&\s]+)/);
  return (m ? decodeURIComponent(m[1]) : text).replace(/\s+/g, "");
}

/**
 * Läser en flytt-kod. Klarar även den äldre delningskoden (base64 av
 * URI-kodad JSON), som inte hade något prefix.
 */
export async function readCode(input: string): Promise<TransferBundle | null> {
  const code = extractCode(input);
  if (!code) return null;
  try {
    if (code.startsWith(PREFIX)) {
      const bytes = await pipe(fromBase64Url(code.slice(PREFIX.length)), new DecompressionStream("deflate-raw"));
      const raw = JSON.parse(new TextDecoder().decode(bytes));
      return cleanBundle(isObj(raw) && "n" in raw ? expand(raw) : raw);
    }
    return cleanBundle(JSON.parse(decodeURIComponent(atob(code))));
  } catch {
    return null;
  }
}

// ─── Fil ─────────────────────────────────────────────────────────────────────

/** Laddar ner samma sorts fil som den gamla säkerhetskopian, nu med allt. */
export function downloadFile(b: TransferBundle): void {
  const blob = new Blob([JSON.stringify(toPayload(b), null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `engelskajakten_${b.student.name.replace(/\s+/g, "_")}.json`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export async function readFile(file: File): Promise<TransferBundle | null> {
  try {
    return cleanBundle(JSON.parse(await file.text()));
  } catch {
    return null;
  }
}

// ─── Spara på den här enheten ────────────────────────────────────────────────

/** Finns redan något som skulle ersättas? Samma matchning som vid inloggning. */
export function replaceWarning(b: TransferBundle): string | null {
  const name = k(b.student.name);
  const active = localStorage.getItem(KEYS.active);
  if (localStorage.getItem(KEYS.student(name))) {
    return `Det finns redan en elev som heter ${b.student.name} på den här enheten. Det som är sparat för ${b.student.name} ersätts med framstegen du läser in. Vill du fortsätta?`;
  }
  if (active && active !== name) {
    const other = readJson<StudentData>(KEYS.student(active))?.name ?? active;
    return `Du är inloggad som ${other}. Du loggas ut, och framstegen sparas för ${b.student.name}. Vill du fortsätta?`;
  }
  return null;
}

/** Sparar paketet och loggar in eleven. Saknade delar lämnas orörda. */
export function saveBundle(b: TransferBundle): void {
  const { student } = b;
  localStorage.setItem(KEYS.student(student.name), JSON.stringify(student));
  if (b.gamification) localStorage.setItem(KEYS.gam(student.name), JSON.stringify(b.gamification));
  if (b.shop) {
    localStorage.setItem(KEYS.shop(student.name), JSON.stringify(b.shop));
  } else {
    // Äldre fil utan köp: behåll enhetens köp, men spenderat får inte bli mer än totalen.
    const existing = readJson<Partial<ShopData>>(KEYS.shop(student.name));
    if (existing && typeof existing.spent === "number" && existing.spent > student.totalPoints) {
      localStorage.setItem(KEYS.shop(student.name), JSON.stringify({ ...existing, spent: student.totalPoints }));
    }
  }
  if (b.streak) localStorage.setItem(KEYS.streak(student.name), JSON.stringify(b.streak));
  localStorage.setItem(KEYS.active, k(student.name));
  localStorage.setItem(KEYS.session, new Date().toISOString());
  // Tema och effekt ritas om direkt (se ThemedBackdrop).
  window.dispatchEvent(new Event("engelskajakten:cosmetics"));
}

/** Kort sammanfattning för bekräftelserutan. */
export function summarize(b: TransferBundle) {
  let completed = 0;
  for (const id of STAGE_IDS) for (const map of MODULE_MAPS) for (const m of Object.values(b.student.stages[id][map] ?? {})) if (m.completed) completed++;
  const s = b.shop;
  return {
    name: b.student.name,
    points: b.student.totalPoints,
    completed,
    unopened: b.gamification ? b.gamification.chests.filter((c) => !c.opened).length : null,
    owned: s ? s.ownedAvatars.length + s.ownedFrames.length + s.ownedThemes.length + s.ownedEffects.length : null,
  };
}

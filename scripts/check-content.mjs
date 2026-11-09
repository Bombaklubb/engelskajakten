// Test: går igenom varenda uppgift i public/content och larmar om någon inte
// går att lösa – ett rätt svar som inte finns bland alternativen, två likadana
// alternativ, en lucktext utan lucka, ett korsord där två ord krockar.
// Körs före varje bygge (prebuild) och med `npm test`, så att en trasig
// uppgift stoppar publiceringen i stället för att nå eleverna.
//
// Åtgärd vid larm: rätta uppgiften som pekas ut i public/content/<stadie>/content.json.
// Pröva kontrollen mot en annan mapp: node scripts/check-content.mjs <mapp>

import { readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const STAGES = ["lagstadiet", "mellanstadiet", "hogstadiet", "gymnasiet"];
const dir = process.argv[2] ?? join(dirname(fileURLToPath(import.meta.url)), "..", "public", "content");

const text = (v) => typeof v === "string" && v.trim().length > 0;
const same = (v) => v.trim().toLowerCase().replace(/\s+/g, " ");
// Uppgifterna i en modul. Läsförståelsen kallar dem questions.
const exercises = (m) => m.exercises ?? m.questions ?? [];

// Felet i en uppgift, eller null om den är hel.
function exerciseError(ex) {
  if (!text(ex.id)) return "saknar id";
  if (Array.isArray(ex.options)) {
    if (!text(ex.question)) return "saknar fråga";
    if (ex.options.length < 2) return "färre än två alternativ";
    if (!ex.options.every(text)) return "tomt alternativ";
    if (!Number.isInteger(ex.correctIndex) || ex.correctIndex < 0 || ex.correctIndex >= ex.options.length)
      return `correctIndex ${ex.correctIndex} pekar inte på något alternativ`;
    const dubbel = ex.options.find((o, i) => ex.options.findIndex((p) => same(p) === same(o)) !== i);
    if (dubbel) return `alternativet "${dubbel}" finns två gånger`;
    return null;
  }
  if (ex.type === "fill-in-blank") {
    if (!text(ex.sentence)) return "saknar mening";
    if (!text(ex.answer)) return "saknar svar";
    const luckor = ex.sentence.split("___").length - 1;
    if (luckor === 0) return "meningen har ingen lucka (___)";
    // Ett svar med flera delar skrivs "has ... been" – en del per lucka.
    const delar = ex.answer.split(/\s*(?:\.\.\.|…)\s*/).filter(Boolean).length;
    if (delar > 1 && delar !== luckor) return `${luckor} luckor men ${delar} svarsdelar`;
    return null;
  }
  if (ex.type === "build-sentence") {
    if (!Array.isArray(ex.words) || ex.words.length < 2 || !ex.words.every(text)) return "saknar ord";
    const order = Array.isArray(ex.correctOrder) ? [...ex.correctOrder].sort((a, b) => a - b) : [];
    if (order.length !== ex.words.length || !order.every((v, i) => v === i)) return "correctOrder är inte en ordning av alla ord";
    return null;
  }
  return `okänd uppgiftstyp "${ex.type}"`;
}

const fail = [];
let antal = 0;

for (const stage of STAGES) {
  let content;
  try {
    content = JSON.parse(readFileSync(join(dir, stage, "content.json"), "utf8"));
  } catch (err) {
    fail.push(`${stage}: content.json går inte att läsa (${err.message})`);
    continue;
  }
  const sedda = new Map();
  const unik = (id, var_) => {
    if (sedda.has(id)) fail.push(`${stage}: ${id} finns i både "${sedda.get(id)}" och "${var_}"`);
    sedda.set(id, var_);
  };

  for (const [section, list] of Object.entries(content)) {
    if (!Array.isArray(list)) continue;
    for (const m of list) {
      const var_ = `${stage} › ${section} › ${m.title}`;
      if (!text(m.id) || !text(m.title)) fail.push(`${stage} › ${section}: modul utan id eller titel`);
      unik(`modul ${section}/${m.id}`, var_);

      if (section === "wordsearch") {
        const ord = (m.words ?? []).map((w) => w.word);
        if (ord.length === 0) fail.push(`${var_}: inga ord`);
        for (const w of ord) if (!/^[A-Z]{2,}$/.test(w ?? "")) fail.push(`${var_}: ordet "${w}" ska vara versaler A–Z`);
        if (new Set(ord).size !== ord.length) fail.push(`${var_}: samma ord två gånger`);
        continue;
      }
      if (section === "crossword") {
        if (!(m.clues ?? []).length) fail.push(`${var_}: inga ledtrådar`);
        // Rutor där två ord korsar varandra måste ha samma bokstav.
        const rutor = new Map();
        for (const k of m.clues ?? []) {
          if (!/^[A-Z]{2,}$/.test(k.answer ?? "")) fail.push(`${var_}: svaret "${k.answer}" ska vara versaler A–Z`);
          if (!text(k.clue)) fail.push(`${var_}: ledtråd saknas för ${k.answer}`);
          [...(k.answer ?? "")].forEach((bokstav, i) => {
            const ruta = k.direction === "across" ? `${k.row},${k.col + i}` : `${k.row + i},${k.col}`;
            const annan = rutor.get(ruta);
            if (annan && annan !== bokstav) fail.push(`${var_}: ${k.answer} krockar i ruta ${ruta} (${annan}/${bokstav})`);
            rutor.set(ruta, bokstav);
          });
        }
        continue;
      }

      if (exercises(m).length === 0) fail.push(`${var_}: inga uppgifter`);
      for (const ex of exercises(m)) {
        antal++;
        const fel = exerciseError(ex);
        if (fel) fail.push(`${var_} › ${ex.id}: ${fel}`);
        if (text(ex.id)) unik(`uppgift ${ex.id}`, var_);
      }
    }
  }
}

if (fail.length) {
  console.error(`✗ ${fail.length} fel i innehållet:`);
  for (const f of fail) console.error("  - " + f);
  process.exit(1);
}
console.log(`✓ innehållet: ${antal} uppgifter i ${STAGES.length} stadier går att lösa`);

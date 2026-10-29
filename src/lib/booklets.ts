import type { GrammarExercise, GrammarModule, SpellingModule, StageContent, StageId } from "./types";
import { dealExercise, shuffled, type DealtExercise } from "./printDeal";
import { buildGrid, type Placement } from "./wordGrid";

/**
 * Färdiga arbetshäften: fyra färdiga häften per värld, att skriva ut under
 * "Skriva ut".
 *
 * Varje häfte tar några av världens ämnen i tur och ordning, ett ämne per
 * sida: en kort regelruta ur kapitlets egen hjälptext, fem uppgifter och
 * rutan "Det här kan jag". Sist kommer ett ordsök. Sidorna är fasta – en fast
 * slump väljer frågorna och ordnar alternativen – så ett häfte blir likadant
 * varje gång, innehållsförteckningen kan ge sidnummer och en klass kan prata
 * om "sidan 5, uppgift 3".
 *
 * Sluttesterna är inte med. Inte heller Substantiv och Adjektiv & Adverb, som
 * saknar hjälptext, eller Dialoger och Bild & Ord, vars hjälptext bara
 * beskriver hur appen används. Indelningen godkändes av Martin i oktober 2026.
 */

/** "g:lag-g1-be-verb" – grammatikkapitlet med det id:t; "s:" för stavning. */
type Source = `${"g" | "s"}:${string}`;

/** `count`: färre frågor än QUESTIONS_PER_PAGE, för ett ämne med långa frågor. */
interface PagePlan { title: string; from: Source[]; count?: number }
interface BookletPlan { title: string; pages: PagePlan[]; wordsearch: string }

const p = (title: string, ...from: Source[]): PagePlan => ({ title, from });
/** En sida med fyra uppgifter, för ämnen vars frågor är så långa att fem inte får plats. */
const p4 = (title: string, ...from: Source[]): PagePlan => ({ title, from, count: 4 });

export const BOOKLET_PLANS: Record<StageId, BookletPlan[]> = {
  lagstadiet: [
    {
      title: "Ord i vardagen",
      wordsearch: "lag-ws3-family-food",
      pages: [
        p("Kläder", "g:lag-v6-klader"),
        p("Mat och frukt", "g:lag-v7-mat", "g:lag-v4-frukter"),
        p("Möbler", "g:lag-v8-mobel"),
        p("Känslor", "g:lag-v9-kanslor"),
        p("Väder", "g:lag-v10-vader"),
        p("Sporter", "g:lag-v11-sporter"),
        p("Fordon", "g:lag-v12-fordon"),
      ],
    },
    {
      title: "Färger, djur och familj",
      wordsearch: "lag-ws1-colors-animals",
      pages: [
        p("Färger", "g:lag-v1-farger", "s:lag-sp3-farger"),
        p("Djur", "g:lag-v2-djur", "s:lag-sp2-djur"),
        p("Familjen", "g:lag-v3-familjen"),
        p("Kroppen", "g:lag-v5-kroppen", "s:lag-sp4-kroppen"),
        p("Skolan", "s:lag-sp1-skolan"),
        p("Vardag", "s:lag-sp5-vardag"),
        p("Synonymer", "g:lag-synonymer"),
        p("Motsatsord", "g:lag-motsatsord"),
      ],
    },
    {
      title: "Be, have och a/an",
      wordsearch: "lag-ws2-school",
      pages: [
        p("Is – am – are", "g:lag-g1-be-verb", "g:lag-fill1-be-verb"),
        p("Have – has", "g:lag-g2-have-has"),
        p("A / An", "g:lag-g3-a-an"),
        p("Plural", "g:lag-g4-plural", "g:lag-fill3-plural"),
        p("This – that – these – those", "g:lag-g5-demonstratives"),
        p("My, your, his, her", "g:lag-g6-possessive-adj"),
        p("Mine, yours", "g:lag-g7-possessive-pron"),
        p("There is / There are", "g:lag-g8-there-is"),
      ],
    },
    {
      title: "Verb och frågor",
      wordsearch: "lag-ws4-numbers-weather",
      pages: [
        p("Can / Can't", "g:lag-g9-can"),
        p("Lägesord – in, on, under", "g:lag-g10-prepositions-place"),
        p("Korta svar", "g:lag-g11-short-answers"),
        p("Do / Does", "g:lag-g14-do-does"),
        p("Verb med -s", "g:lag-fill2-s-form"),
        p("Frågeord", "g:lag-frageord"),
        p("Some och any", "g:lag-some-any"),
        p("Regelbundna verb", "g:lag-g15-regelbundna-verb"),
        p("Oregelbundna verb", "g:lag-g16-oregelbundna-verb"),
        p("-ing-form", "g:lag-g17-ing-form"),
      ],
    },
  ],
  mellanstadiet: [
    {
      title: "Ord i vardagen",
      wordsearch: "mel-ws4-sports-hobbies",
      pages: [
        p("Kläder", "g:mel-v5-klader"),
        p("Mat", "g:mel-v6-mat", "g:mel-v2-mat"),
        p("Grönsaker", "g:mel-v1-gronsaker"),
        p("Möbler", "g:mel-v7-mobel"),
        p("Känslor", "g:mel-v8-kanslor"),
        p("Väder", "g:mel-v9-vader"),
        p("Sporter", "g:mel-v10-sporter"),
        p("Fordon", "g:mel-v11-fordon"),
        p("Familj", "g:mel-v12-familj"),
      ],
    },
    {
      title: "Grammatikens grunder",
      wordsearch: "mel-ws3-countries-cities",
      pages: [
        p("Do / Does", "g:mel-g6-do-does"),
        p("A / An", "g:mel-g7-a-an"),
        p("Is / Am / Are", "g:mel-g8-be-verb", "g:mel-fill1-be-have-do"),
        p("Have / Has", "g:mel-g9-have-has"),
        p("This / That / These / Those", "g:mel-g10-demonstratives"),
        p("There is / There are", "g:mel-g11-there-is-are", "g:mel-fill2-there-prep"),
        p("Prepositioner", "g:mel-v3-lagesord", "g:mel-g4-prepositions"),
        p("Frågeord", "g:mel-v4-frageord", "g:mel-g-frageord"),
      ],
    },
    {
      title: "Verb och tider",
      wordsearch: "mel-ws1-verbs",
      pages: [
        p("Present simple", "g:mel-g1-present-simple"),
        p("Past simple", "g:mel-g2-past-simple"),
        p("Verb tenses", "g:mel-g-tenses", "g:mel-g-tenses2"),
        p("Verb och tider", "g:mel-g-tenses3", "g:mel-g-tenses4", "g:mel-g-tenses5"),
        p("Regelbundna verb", "g:mel-g12-regelbundna-verb"),
        p("Oregelbundna verb", "g:mel-g13-oregelbundna-verb", "s:mel-sp2-oregelbundna-verb"),
        p("-ing-form", "g:mel-g14-ing-form"),
        p("Adjektiv och jämförelser", "g:mel-g3-adjectives"),
      ],
    },
    {
      title: "Ord, ordföljd och blandat",
      wordsearch: "mel-ws2-adjectives",
      pages: [
        p("Synonymer", "g:mel-synonymer"),
        p("Motsatsord", "g:mel-motsatsord"),
        p("Some och any", "g:mel-some-any"),
        p("Ordföljd", "g:mel-bs-extra"),
        p("Skola och vardag", "s:mel-sp1-skola-vardag"),
        p("Platser", "s:mel-sp3-platser"),
        p("Beskrivande ord", "s:mel-sp4-beskrivande"),
        p("Sambandsord", "s:mel-sp5-sambandsord"),
        p("Blandad grammatik", "g:mel-g-mixed"),
      ],
    },
  ],
  hogstadiet: [
    {
      title: "Ord och känslor",
      wordsearch: "hog-ws4-technology",
      pages: [
        p("Kläder", "g:hog-v3-klader"),
        p("Mat", "g:hog-v4-mat"),
        p("Möbler", "g:hog-v5-mobel"),
        p("Känslor", "g:hog-v6-kanslor", "g:hog-v2-kanslor"),
        p("Väder", "g:hog-v7-vader"),
        p("Sporter", "g:hog-v8-sporter"),
        p("Fordon", "g:hog-v9-fordon"),
        p("Aktiviteter", "g:hog-v1-aktiviteter"),
      ],
    },
    {
      title: "Verbformer",
      wordsearch: "hog-ws2-irregular-verbs",
      pages: [
        p("Present perfect", "g:hog-g1-perfect"),
        p("Conditionals", "g:hog-g2-conditionals"),
        p("Passiv form", "g:hog-g3-passive"),
        p("Reported speech", "g:hog-g4-reported"),
        p("Avancerade verbformer", "g:hog-g-advanced", "g:hog-g-advanced2", "g:hog-g-advanced3"),
        p("Avancerad grammatik", "g:hog-g-advanced4", "g:hog-g-advanced5"),
        p("Past tense", "g:hog-fill1-past-tense"),
        p("Blandad grammatik", "g:hog-g-mixed"),
      ],
    },
    {
      title: "Grammatik – svåra fall",
      wordsearch: "hog-ws1-grammar-terms",
      pages: [
        p("Do / Does / Did", "g:hog-g13-do-does"),
        p("A / An", "g:hog-g14-a-an"),
        p("Is / Am / Are", "g:hog-g15-be-verb"),
        p("Have / Has", "g:hog-g16-have-has"),
        p("This / That / These / Those", "g:hog-g17-demonstratives"),
        p("There is / There are", "g:hog-g18-there-is-are"),
        p("Komparativ, superlativ och frågeform", "g:hog-fill2-comparative"),
        p("Frågeord", "g:hog-g-frageord"),
      ],
    },
    {
      title: "Verb, ord och stavning",
      wordsearch: "hog-ws3-environment",
      pages: [
        p("Regelbundna verb", "g:hog-g20-regelbundna-verb"),
        p("Oregelbundna verb", "g:hog-g21-oregelbundna-verb", "s:hog-sp3-oregelbundna-verb"),
        p("-ing eller to-infinitiv", "g:hog-g22-ing-form"),
        p("Some och any", "g:hog-some-any"),
        p("Synonymer", "g:hog-synonymer"),
        p("Motsatsord", "g:hog-motsatsord"),
        p("Argumentation", "s:hog-sp1-argumentation"),
        p("Samhälle", "s:hog-sp2-samhalle"),
        p("Akademiska ord", "s:hog-sp4-akademiska-ord"),
        p("Stavningsutmaningar", "s:hog-sp5-stavningsutmaningar"),
      ],
    },
  ],
  gymnasiet: [
    {
      title: "Ord i vardagen",
      wordsearch: "gym-ws4-global-issues",
      pages: [
        p("Kläder", "g:gym-v1-klader"),
        p("Mat", "g:gym-v2-mat"),
        p("Möbler", "g:gym-v3-mobel"),
        p("Känslor", "g:gym-v4-kanslor"),
        p("Väder", "g:gym-v5-vader"),
        p("Sporter", "g:gym-v6-sporter"),
        p("Fordon", "g:gym-v7-fordon"),
      ],
    },
    {
      title: "Avancerad grammatik 1",
      wordsearch: "gym-ws1-discourse",
      pages: [
        p("Advanced tenses", "g:gym-g1-advanced-tenses"),
        p("Modal verbs", "g:gym-g2-modals-advanced"),
        p("The subjunctive", "g:gym-g3-subjunctive"),
        p("Discourse markers", "g:gym-g4-discourse"),
        p("Advanced grammar", "g:gym-g-advanced", "g:gym-g-advanced2", "g:gym-g-advanced3"),
        p("Avancerad grammatik", "g:gym-g-advanced4", "g:gym-g-advanced5"),
        p("Blandad grammatik", "g:gym-g-mixed"),
      ],
    },
    {
      title: "Avancerad grammatik 2",
      wordsearch: "gym-ws2-literary",
      pages: [
        p("Relative clauses", "g:gym-g5-relative"),
        p("Inversion", "g:gym-g6-inversion"),
        p("Conditionals", "g:gym-g7-conditionals"),
        p("Phrasal verbs", "g:gym-g8-phrasal"),
        p("Collocations", "g:gym-g9-collocations"),
        p("Word formation", "g:gym-g10-wordformation"),
        p("Regelbundna verb", "g:gym-g11-regelbundna-verb"),
        p("Oregelbundna verb", "g:gym-g12-oregelbundna-verb"),
        p("Gerundium", "g:gym-g13-ing-form"),
      ],
    },
    {
      title: "Akademisk engelska",
      wordsearch: "gym-ws3-academic-words",
      pages: [
        p("Akademiska ord", "g:gym-v8-akademiska", "s:gym-sp3-akademisk-stil"),
        p("Samhälle och politik", "g:gym-v9-samhalle", "s:gym-sp4-samhallsfragor"),
        p("Miljö och hållbarhet", "g:gym-v10-miljo"),
        p("Affärsengelska", "g:gym-v11-business"),
        p("Analys", "s:gym-sp1-analys"),
        p("Argumentation", "s:gym-sp2-argumentation"),
        p("Svåra stavningsord", "s:gym-sp5-svara-stavningsord"),
      ],
    },
  ],
};

/** Uppgifter på varje ämnessida. */
export const QUESTIONS_PER_PAGE = 5;
/** Rader ur kapitlets hjälptext i rutan "Kom ihåg". */
const RULE_LINES = 3;

/**
 * Hjälptexten skrevs för skärmen. Rader som beskriver hur appen används
 * ("Klicka på orden …", "Läs dialogen …") hör inte hemma på papper och hoppas
 * över, liksom tomma rader. Det som blir kvar är regler och ordlistor.
 */
const APP_INSTRUCTION = /^(klicka|tryck|läs dialogen|titta på bilden|i den här övningen)/i;

export function paperRules(helpText: string[] | undefined): string[] {
  return (helpText ?? [])
    .map((line) => line.trim())
    .filter((line) => line.length > 0 && !APP_INSTRUCTION.test(line))
    .slice(0, RULE_LINES);
}

export interface BookletPage {
  title: string;
  /** Sidnummer i det utskrivna häftet; framsidan är sida 1. */
  pageNumber: number;
  rules: string[];
  items: DealtExercise[];
}

export interface Booklet {
  number: number;
  title: string;
  pages: BookletPage[];
  wordsearch: { title: string; words: string[]; grid: string[][]; placements: Placement[]; pageNumber: number } | null;
  /** Sidor före facit: framsida, ämnen och ordsök. */
  pageCount: number;
}

/** En liten fast slump (mulberry32), så att ett häfte blir likadant varje gång. */
export function seeded(text: string): () => number {
  let h = 1779033703 ^ text.length;
  for (let i = 0; i < text.length; i++) {
    h = Math.imul(h ^ text.charCodeAt(i), 3432918353);
    h = (h << 13) | (h >>> 19);
  }
  let a = h >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Kapitlet som en källa pekar på (en lista, så att saknade kapitel syns i testerna). */
export function sourceModules(content: StageContent, source: Source): (GrammarModule | SpellingModule)[] {
  const [kind, key] = [source[0], source.slice(2)];
  const list: (GrammarModule | SpellingModule)[] = (kind === "g" ? content.grammar : content.spelling) ?? [];
  return list.filter((m) => m.id === key);
}

/**
 * Frågorna till en sida (fem, eller `count`), blandade där ämnet tillåter:
 * mest flerval, upp till två att skriva själv och en mening att bygga – i den
 * ordningen, så att sidan börjar lätt.
 */
function pickQuestions(pool: GrammarExercise[], rand: () => number, count: number): GrammarExercise[] {
  const choose = shuffled(pool.filter((e) => e.type === "multiple-choice"), rand);
  const write = shuffled(pool.filter((e) => e.type === "fill-in-blank"), rand);
  const build = shuffled(pool.filter((e) => e.type === "build-sentence"), rand);

  const picked: Record<"choose" | "write" | "build", GrammarExercise[]> = {
    choose: [],
    write: write.slice(0, 2),
    build: build.slice(0, 1),
  };
  picked.choose = choose.slice(0, count - picked.build.length - picked.write.length);
  // Ett ämne med för få flervalsfrågor fylls på med det som finns.
  const spare = [...write.slice(2), ...build.slice(1)];
  while (picked.choose.length + picked.write.length + picked.build.length < count && spare.length) {
    picked.write.push(spare.shift()!);
  }
  return [...picked.choose, ...picked.write, ...picked.build];
}

/** En världs häften, uppställda och färdiga. */
export function buildBooklets(stageId: StageId, content: StageContent): Booklet[] {
  return (BOOKLET_PLANS[stageId] ?? []).map((plan, bi) => {
    const pages: BookletPage[] = plan.pages.map((page, pi) => {
      const modules = page.from.flatMap((src) => sourceModules(content, src));
      const pool = modules.flatMap((m) => m.exercises);
      // Egen slump per sida: en ändring på en sida flyttar inte om de andra.
      const rand = seeded(`${stageId}/${bi + 1}/${page.title}`);
      // Regelrutan tas från det första kapitlet som har regler som passar på papper.
      const rules = modules.map((m) => paperRules(m.helpText)).find((r) => r.length > 0) ?? [];
      return {
        title: page.title,
        pageNumber: pi + 2,
        rules,
        items: pickQuestions(pool, rand, page.count ?? QUESTIONS_PER_PAGE).map((ex) => dealExercise(ex, rand)),
      };
    });

    const ws = content.wordsearch?.find((w) => w.id === plan.wordsearch);
    const wordsearch = ws
      ? (() => {
          const words = ws.words.map((w) => w.word);
          const { grid, placements } = buildGrid(words, seeded(`${stageId}/${bi + 1}/${ws.id}`));
          return { title: ws.title, words, grid, placements, pageNumber: pages.length + 2 };
        })()
      : null;

    return {
      number: bi + 1,
      title: plan.title,
      pages,
      wordsearch,
      pageCount: 1 + pages.length + (wordsearch ? 1 : 0),
    };
  });
}

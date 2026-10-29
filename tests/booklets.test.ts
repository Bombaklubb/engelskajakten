/**
 * Färdiga arbetshäften (src/lib/booklets.ts): varje häfte byggs av det
 * riktiga innehållet, blir likadant varje gång och innehåller det framsidan
 * säger.
 */
import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { buildBooklets, BOOKLET_PLANS, QUESTIONS_PER_PAGE, sourceModules, paperRules } from "../src/lib/booklets";
import { LETTERS } from "../src/lib/printDeal";
import type { StageContent, StageId } from "../src/lib/types";

const STAGES: StageId[] = ["lagstadiet", "mellanstadiet", "hogstadiet", "gymnasiet"];
const content = (s: StageId): StageContent =>
  JSON.parse(readFileSync(new URL(`../public/content/${s}/content.json`, import.meta.url), "utf8"));

describe("arbetshäften", () => {
  test("regelrutan hoppar över rader om hur appen används", () => {
    assert.deepEqual(
      paperRules(["Klicka på orden i rätt ordning.", "  ", "Tänk på ordföljd.", "Regel 2", "Regel 3", "Regel 4"]),
      ["Tänk på ordföljd.", "Regel 2", "Regel 3"]
    );
  });

  for (const stage of STAGES) {
    const c = content(stage);

    test(`${stage}: 1–4 häften, och varje kapitel finns i innehållet`, () => {
      const plans = BOOKLET_PLANS[stage];
      assert.ok(plans.length >= 1 && plans.length <= 4, `${plans.length} häften`);
      for (const plan of plans) {
        assert.ok(plan.pages.length >= 5 && plan.pages.length <= 10, `${plan.title}: ${plan.pages.length} ämnessidor`);
        for (const page of plan.pages) {
          for (const src of page.from) assert.equal(sourceModules(c, src).length, 1, `${src} saknas`);
          assert.ok(!page.from.some((s) => /sluttest/.test(s)), `${page.title} tar med ett sluttest`);
        }
        assert.ok(c.wordsearch?.some((w) => w.id === plan.wordsearch), `ordsök ${plan.wordsearch} saknas`);
      }
    });

    test(`${stage}: rätt antal frågor och en regelruta på varje sida, och sidnummer i följd`, () => {
      for (const b of buildBooklets(stage, c)) {
        b.pages.forEach((page, i) => {
          assert.equal(page.pageNumber, i + 2, "framsidan är sida 1");
          const plan = BOOKLET_PLANS[stage][b.number - 1].pages[i];
          assert.equal(page.items.length, plan.count ?? QUESTIONS_PER_PAGE, `${b.title} / ${page.title}`);
          assert.equal(new Set(page.items.map((it) => it.ex)).size, page.items.length, "samma fråga två gånger");
          assert.ok(page.rules.length > 0 && page.rules.length <= 3, `${page.title}: ${page.rules.length} regelrader`);
          assert.ok(page.items.filter((it) => it.ex.type === "fill-in-blank").length <= 2 || page.items.every((it) => it.ex.type !== "multiple-choice"),
            `${page.title}: fler än två att skriva trots flervalsfrågor`);
        });
        assert.equal(b.wordsearch?.pageNumber, b.pages.length + 2);
        assert.equal(b.pageCount, b.pages.length + 2);
      }
    });

    test(`${stage}: ett häfte blir likadant varje gång`, () => {
      const strip = (bs: ReturnType<typeof buildBooklets>) =>
        JSON.stringify(bs.map((b) => [b.pages.map((p) => p.items.map((i) => [i.ex.id, i.order, i.chips, i.answer])), b.wordsearch?.grid]));
      assert.equal(strip(buildBooklets(stage, c)), strip(buildBooklets(stage, c)));
    });

    test(`${stage}: facit stämmer med de utskrivna bokstäverna, och alla ord finns i ordsöket`, () => {
      for (const b of buildBooklets(stage, c)) {
        for (const page of b.pages) {
          for (const it of page.items) {
            if (it.ex.type !== "multiple-choice") continue;
            const letter = it.answer[0];
            assert.equal(it.order![LETTERS.indexOf(letter)], it.ex.correctIndex, `${page.title}: ${it.ex.question}`);
          }
        }
        const ws = b.wordsearch!;
        assert.equal(ws.placements.length, ws.words.length, `${b.title}: alla ord fick inte plats`);
      }
    });
  }
});

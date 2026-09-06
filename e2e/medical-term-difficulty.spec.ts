import { test, expect } from "@playwright/test";
import {
  calculateMedicalTermDifficulty,
  countMedicalTermsByDifficulty,
  filterMedicalTermsByDifficulty,
  getLearningStageFromKeyboardLesson,
  selectWeightedMedicalTerms,
  type MedicalTermWithDifficulty,
} from "@/utils/medicalTermDifficulty";

/**
 * Unit tests for the pure medical-term-difficulty logic: automatic
 * classification, learning-stage derivation from the existing keyboard
 * lesson progress, and the weighted random selection used for training.
 *
 * These run as plain Node module imports (no Next.js server involved), the
 * same pattern used by e2e/register-invite-code.spec.ts.
 */

test.describe("calculateMedicalTermDifficulty", () => {
  test("classifies short, simple terms as Leicht (1)", () => {
    for (const term of ["Band", "Knie", "Muskel", "Sehne"]) {
      expect(calculateMedicalTermDifficulty(term)).toBe(1);
    }
  });

  test("classifies medium compound terms as Mittel (2)", () => {
    for (const term of ["Gelenkkapsel", "Meniskusriss", "Osteoporose"]) {
      expect(calculateMedicalTermDifficulty(term)).toBe(2);
    }
  });

  test("classifies long/hyphenated/umlaut-heavy terms as Schwer (3)", () => {
    for (const term of [
      "Acromioclaviculargelenk",
      "Patella-Apprehension-Test",
      "Pertrochantäre Femurfraktur",
    ]) {
      expect(calculateMedicalTermDifficulty(term)).toBe(3);
    }
  });

  test("always returns a valid difficulty, even for empty input", () => {
    expect([1, 2, 3]).toContain(calculateMedicalTermDifficulty(""));
    expect([1, 2, 3]).toContain(calculateMedicalTermDifficulty("   "));
  });
});

test.describe("getLearningStageFromKeyboardLesson", () => {
  test("lessons 1-3 are beginner", () => {
    expect(getLearningStageFromKeyboardLesson(1)).toBe("beginner");
    expect(getLearningStageFromKeyboardLesson(3)).toBe("beginner");
  });

  test("lessons 4-7 are intermediate", () => {
    expect(getLearningStageFromKeyboardLesson(4)).toBe("intermediate");
    expect(getLearningStageFromKeyboardLesson(7)).toBe("intermediate");
  });

  test("lesson 8 and above are advanced", () => {
    expect(getLearningStageFromKeyboardLesson(8)).toBe("advanced");
    expect(getLearningStageFromKeyboardLesson(20)).toBe("advanced");
  });
});

function makePool(): MedicalTermWithDifficulty[] {
  return [
    { term: "easy-1", difficulty: 1 },
    { term: "easy-2", difficulty: 1 },
    { term: "medium-1", difficulty: 2 },
    { term: "medium-2", difficulty: 2 },
    { term: "hard-1", difficulty: 3 },
    { term: "hard-2", difficulty: 3 },
  ];
}

test.describe("selectWeightedMedicalTerms", () => {
  test("beginners only ever receive easy terms", () => {
    const results = selectWeightedMedicalTerms(makePool(), "beginner", 50);
    expect(results).toHaveLength(50);
    for (const term of results) {
      expect(term).toMatch(/^easy-/);
    }
  });

  test("intermediate stage selects roughly 60% easy / 40% medium", () => {
    let easyCount = 0;
    let mediumCount = 0;
    const results = selectWeightedMedicalTerms(makePool(), "intermediate", 2000);
    for (const term of results) {
      if (term.startsWith("easy-")) easyCount++;
      else if (term.startsWith("medium-")) mediumCount++;
      else throw new Error(`unexpected term for intermediate stage: ${term}`);
    }
    const easyRatio = easyCount / results.length;
    expect(easyRatio).toBeGreaterThan(0.5);
    expect(easyRatio).toBeLessThan(0.7);
    expect(mediumCount).toBeGreaterThan(0);
  });

  test("advanced stage includes easy, medium and hard terms", () => {
    let easyCount = 0;
    let mediumCount = 0;
    let hardCount = 0;
    const results = selectWeightedMedicalTerms(makePool(), "advanced", 2000);
    for (const term of results) {
      if (term.startsWith("easy-")) easyCount++;
      else if (term.startsWith("medium-")) mediumCount++;
      else if (term.startsWith("hard-")) hardCount++;
    }
    expect(easyCount).toBeGreaterThan(0);
    expect(mediumCount).toBeGreaterThan(0);
    expect(hardCount).toBeGreaterThan(0);
    // Advanced users must keep receiving easy terms too, not just hard ones.
    expect(easyCount / results.length).toBeGreaterThan(0.15);
  });

  test("falls back to other unlocked categories when a targeted group is empty", () => {
    // Advanced stage wants easy/medium/hard, but only medium terms exist.
    const mediumOnlyPool: MedicalTermWithDifficulty[] = [
      { term: "medium-only-1", difficulty: 2 },
      { term: "medium-only-2", difficulty: 2 },
    ];
    const results = selectWeightedMedicalTerms(mediumOnlyPool, "advanced", 30);
    expect(results).toHaveLength(30);
    for (const term of results) {
      expect(term).toMatch(/^medium-only-/);
    }
  });

  test("falls back to any non-empty category when unlocked categories have no terms at all", () => {
    // Beginner stage only unlocks easy (1), but only hard (3) terms exist.
    const hardOnlyPool: MedicalTermWithDifficulty[] = [{ term: "hard-only", difficulty: 3 }];
    const results = selectWeightedMedicalTerms(hardOnlyPool, "beginner", 10);
    expect(results).toHaveLength(10);
    expect(results.every((term) => term === "hard-only")).toBe(true);
  });

  test("never returns an empty result while terms exist, for every stage", () => {
    for (const stage of ["beginner", "intermediate", "advanced"] as const) {
      const results = selectWeightedMedicalTerms(makePool(), stage, 5);
      expect(results.length).toBe(5);
    }
  });

  test("returns an empty result only when there are no terms at all", () => {
    expect(selectWeightedMedicalTerms([], "beginner", 10)).toEqual([]);
  });
});

test.describe("admin manager filtering and counts", () => {
  const sample = [
    { id: 1, term: "easy-a", difficulty: 1 as const },
    { id: 2, term: "easy-b", difficulty: 1 as const },
    { id: 3, term: "medium-a", difficulty: 2 as const },
    { id: 4, term: "hard-a", difficulty: 3 as const },
  ];

  test("'all' filter returns every term unchanged", () => {
    expect(filterMedicalTermsByDifficulty(sample, "all")).toEqual(sample);
  });

  test("filtering by a specific difficulty only returns matching terms", () => {
    expect(filterMedicalTermsByDifficulty(sample, 1).map((t) => t.term)).toEqual([
      "easy-a",
      "easy-b",
    ]);
    expect(filterMedicalTermsByDifficulty(sample, 2).map((t) => t.term)).toEqual(["medium-a"]);
    expect(filterMedicalTermsByDifficulty(sample, 3).map((t) => t.term)).toEqual(["hard-a"]);
  });

  test("counts per difficulty level match the sample data, including zero counts", () => {
    expect(countMedicalTermsByDifficulty(sample)).toEqual({ 1: 2, 2: 1, 3: 1 });
    expect(countMedicalTermsByDifficulty([])).toEqual({ 1: 0, 2: 0, 3: 0 });
  });
});

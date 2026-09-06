/**
 * Central logic for medical term difficulty levels.
 *
 * This module is imported both from server code (src/server/authService.ts,
 * admin/training API routes) and from client components (the admin medical
 * terms manager, to show a suggested difficulty). It contains no secrets and
 * no I/O, so it is safe to bundle for the client.
 */

export type MedicalTermDifficulty = 1 | 2 | 3;

export type MedicalTermLearningStage = "beginner" | "intermediate" | "advanced";

export interface MedicalTermWithDifficulty {
  term: string;
  difficulty: MedicalTermDifficulty;
}

export const MEDICAL_TERM_DIFFICULTY_LEVELS: MedicalTermDifficulty[] = [1, 2, 3];

export const MEDICAL_TERM_DIFFICULTY_LABELS: Record<MedicalTermDifficulty, string> = {
  1: "Leicht",
  2: "Mittel",
  3: "Schwer",
};

/** Tailwind classes for a colored badge; always paired with the text label above. */
export const MEDICAL_TERM_DIFFICULTY_BADGE_CLASSES: Record<MedicalTermDifficulty, string> = {
  1: "bg-green-100 text-green-800 border border-green-300 dark:bg-green-900/40 dark:text-green-300 dark:border-green-700",
  2: "bg-amber-100 text-amber-800 border border-amber-300 dark:bg-amber-900/40 dark:text-amber-300 dark:border-amber-700",
  3: "bg-red-100 text-red-800 border border-red-300 dark:bg-red-900/40 dark:text-red-300 dark:border-red-700",
};

export function isValidMedicalTermDifficulty(value: unknown): value is MedicalTermDifficulty {
  return value === 1 || value === 2 || value === 3;
}

/** Parses loosely-typed input (e.g. from a request body or a <select>) into a valid difficulty, or null. */
export function parseMedicalTermDifficulty(value: unknown): MedicalTermDifficulty | null {
  const numeric = typeof value === "string" ? Number(value) : value;
  return isValidMedicalTermDifficulty(numeric) ? numeric : null;
}

export type MedicalTermDifficultyFilter = "all" | MedicalTermDifficulty;

/** Filters a list of terms by difficulty; "all" returns the list unchanged. Used by the admin manager UI. */
export function filterMedicalTermsByDifficulty<T extends { difficulty: MedicalTermDifficulty }>(
  terms: T[],
  filter: MedicalTermDifficultyFilter
): T[] {
  return filter === "all" ? terms : terms.filter((term) => term.difficulty === filter);
}

/** Counts how many terms fall into each difficulty level. Used to show counts next to the admin filters. */
export function countMedicalTermsByDifficulty<T extends { difficulty: MedicalTermDifficulty }>(
  terms: T[]
): Record<MedicalTermDifficulty, number> {
  const counts: Record<MedicalTermDifficulty, number> = { 1: 0, 2: 0, 3: 0 };
  for (const term of terms) {
    counts[term.difficulty] += 1;
  }
  return counts;
}

const RARE_LETTERS_PATTERN = /[qxyQXY]/g;
const UMLAUT_PATTERN = /[äöüÄÖÜß]/g;
const WORD_SPLIT_PATTERN = /[\s-]+/;
const UPPERCASE_ABBREVIATION_PATTERN = /^[A-ZÄÖÜ]{2,}$/;

/**
 * Suggests an initial difficulty for a medical term based on its typing
 * complexity: overall length, number of word parts, hyphens, umlauts/ß and
 * rare letters (q, x, y). This is only a suggestion - administrators can
 * always override it, and their manual choice is never overwritten later.
 */
export function calculateMedicalTermDifficulty(term: string): MedicalTermDifficulty {
  const trimmed = term.trim();
  if (!trimmed) {
    return 1;
  }

  const length = trimmed.length;
  const words = trimmed.split(WORD_SPLIT_PATTERN).filter((word) => word.length > 0);
  const wordCount = words.length;
  const hyphenCount = (trimmed.match(/-/g) ?? []).length;
  const umlautCount = (trimmed.match(UMLAUT_PATTERN) ?? []).length;
  const rareLetterCount = (trimmed.match(RARE_LETTERS_PATTERN) ?? []).length;

  let lengthScore = 0;
  if (length >= 20) {
    lengthScore = 4;
  } else if (length >= 14) {
    lengthScore = 2;
  } else if (length >= 8) {
    lengthScore = 1;
  }

  let wordScore = 0;
  if (wordCount >= 3) {
    wordScore = 2;
  } else if (wordCount === 2) {
    wordScore = 1;
  }

  const abbreviationScore = UPPERCASE_ABBREVIATION_PATTERN.test(trimmed) ? 1 : 0;
  const score =
    lengthScore + wordScore + hyphenCount + umlautCount + rareLetterCount + abbreviationScore;

  if (score >= 4) {
    return 3;
  }
  if (score >= 1) {
    return 2;
  }
  return 1;
}

/** Keyboard lesson boundaries that map the existing lesson progress onto a training stage. */
export function getLearningStageFromKeyboardLesson(
  currentKeyboardLesson: number
): MedicalTermLearningStage {
  // Keep medical-term difficulty aligned with the visible course levels:
  // Beginner 1-15, Advanced 16-30, Professional/Elite 31+.
  if (!Number.isFinite(currentKeyboardLesson) || currentKeyboardLesson <= 15) {
    return "beginner";
  }
  if (currentKeyboardLesson <= 30) {
    return "intermediate";
  }
  return "advanced";
}

/**
 * Target proportions per learning stage. Higher stages extend the available
 * vocabulary with harder terms instead of replacing the easy ones.
 */
const STAGE_DIFFICULTY_WEIGHTS: Record<
  MedicalTermLearningStage,
  Partial<Record<MedicalTermDifficulty, number>>
> = {
  beginner: { 1: 1 },
  intermediate: { 1: 0.6, 2: 0.4 },
  advanced: { 1: 0.3, 2: 0.4, 3: 0.3 },
};

/**
 * Picks `count` terms using a weighted random selection based on the given
 * learning stage. If a targeted difficulty group has no available terms, the
 * remaining weight is redistributed across the other unlocked, non-empty
 * groups. If none of the unlocked groups have terms at all, this falls back
 * to any non-empty difficulty group so the result is only ever empty when
 * `terms` itself is empty.
 */
export function selectWeightedMedicalTerms(
  terms: MedicalTermWithDifficulty[],
  stage: MedicalTermLearningStage,
  count: number,
  random: () => number = Math.random
): string[] {
  if (terms.length === 0 || count <= 0) {
    return [];
  }

  const byDifficulty: Record<MedicalTermDifficulty, string[]> = { 1: [], 2: [], 3: [] };
  for (const entry of terms) {
    const difficulty = isValidMedicalTermDifficulty(entry.difficulty) ? entry.difficulty : 1;
    byDifficulty[difficulty].push(entry.term);
  }

  const weights = STAGE_DIFFICULTY_WEIGHTS[stage];
  let pools = (Object.entries(weights) as [string, number][])
    .map(([difficulty, weight]) => ({
      difficulty: Number(difficulty) as MedicalTermDifficulty,
      weight,
    }))
    .filter((pool) => byDifficulty[pool.difficulty].length > 0);

  if (pools.length === 0) {
    // Nothing available in any unlocked category (e.g. brand-new admin data) -
    // reliably fall back to whichever categories actually contain terms.
    pools = MEDICAL_TERM_DIFFICULTY_LEVELS.filter(
      (difficulty) => byDifficulty[difficulty].length > 0
    ).map((difficulty) => ({ difficulty, weight: 1 }));
  }

  if (pools.length === 0) {
    return [];
  }

  const totalWeight = pools.reduce((sum, pool) => sum + pool.weight, 0);

  const result: string[] = [];
  for (let i = 0; i < count; i++) {
    let roll = random() * totalWeight;
    let chosenPool = pools[pools.length - 1];
    for (const pool of pools) {
      if (roll < pool.weight) {
        chosenPool = pool;
        break;
      }
      roll -= pool.weight;
    }
    const list = byDifficulty[chosenPool.difficulty];
    result.push(list[Math.floor(random() * list.length)]);
  }
  return result;
}

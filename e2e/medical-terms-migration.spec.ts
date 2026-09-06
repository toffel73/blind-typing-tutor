import { test, expect } from "@playwright/test";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import Database from "better-sqlite3";
import { calculateMedicalTermDifficulty } from "@/utils/medicalTermDifficulty";

/**
 * Migration test for the medical_terms.difficulty column.
 *
 * This lives in its own file (rather than alongside e2e/medical-terms-admin.spec.ts)
 * so it gets an isolated Node module/global state: authService caches its
 * SQLite connection in a global for the lifetime of the process, so the
 * legacy (pre-difficulty) schema must be created on disk *before* authService
 * ever opens the database in this worker.
 */

const dbPath = join(mkdtempSync(join(tmpdir(), "medical-terms-migration-")), "auth.sqlite");
process.env.AUTH_DB_PATH = dbPath;

const preexistingTerms = ["Knie", "Gelenkkapsel", "Acromioclaviculargelenk"];

// Simulate a production database created before the difficulty feature existed:
// a medical_terms table with only id/term/created_at, already containing data.
const legacyDb = new Database(dbPath);
legacyDb
  .prepare(
    `CREATE TABLE medical_terms (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      term TEXT NOT NULL UNIQUE,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    )`
  )
  .run();
const insertLegacyTerm = legacyDb.prepare("INSERT INTO medical_terms (term) VALUES (?)");
for (const term of preexistingTerms) {
  insertLegacyTerm.run(term);
}
legacyDb.close();

const authService = await import("@/server/authService");

test.describe("medical_terms migration", () => {
  test("adds the difficulty column and classifies pre-existing terms without losing data", () => {
    const rows = authService.listMedicalTermsForAdmin();

    for (const term of preexistingTerms) {
      const row = rows.find((r) => r.term === term);
      expect(row).toBeTruthy();
      expect(row?.difficulty).toBe(calculateMedicalTermDifficulty(term));
    }

    for (const row of rows) {
      expect([1, 2, 3]).toContain(row.difficulty);
    }
  });

  test("a manually-changed difficulty is not reverted by re-running the default seed", () => {
    const target = authService
      .listMedicalTermsForAdmin()
      .find((row) => row.term === "Knie");
    if (!target) throw new Error("fixture term was not found");

    // "Knie" is also one of the built-in default terms (src/data/medicalTerms.ts).
    // Its default seed insert uses INSERT OR IGNORE, so an admin's manual change
    // must survive even though the term already exists in the seed list.
    const updateResult = authService.updateMedicalTermDifficultyByAdmin(target.id, 3);
    expect(updateResult.ok).toBe(true);

    const afterUpdate = authService
      .listMedicalTermsForAdmin()
      .find((row) => row.id === target.id);
    expect(afterUpdate?.difficulty).toBe(3);
  });
});

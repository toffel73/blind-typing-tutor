import { test, expect } from "@playwright/test";
import { register } from "node:module";
import { randomUUID } from "node:crypto";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { calculateMedicalTermDifficulty } from "@/utils/medicalTermDifficulty";

/**
 * Integration tests for medical term difficulty: admin CRUD validation, the
 * admin-only PATCH endpoint, unchanged admin permission checks, and
 * lesson-based training selection.
 *
 * Follows the same pattern as e2e/register-invite-code.spec.ts: all tests in
 * this file share one isolated SQLite database (never the dev server's), so
 * fixtures use unique usernames/terms per test to avoid collisions.
 */
register(new URL("./support/nextResolveShim.mjs", import.meta.url));

process.env.AUTH_DB_PATH = join(
  mkdtempSync(join(tmpdir(), "medical-terms-admin-test-")),
  "auth.sqlite"
);

const authService = await import("@/server/authService");
const { NextRequest } = await import("next/server");
const { POST: adminPostMedicalTerm } = await import("../app/api/admin/medical-terms/route");
const { PATCH: adminPatchMedicalTerm } = await import(
  "../app/api/admin/medical-terms/[id]/route"
);

function uniqueTerm(prefix: string) {
  return `${prefix}-${randomUUID().slice(0, 8)}`;
}

function uniqueUsername(prefix: string) {
  return `${prefix}-${randomUUID().slice(0, 8)}`;
}

function createAdminSessionToken(): string {
  const username = uniqueUsername("admin");
  const result = authService.registerUser(username, "AdminPass123!", "admin");
  expect(result.ok).toBe(true);
  const admin = authService.listUsersForAdmin().find((user) => user.username === username);
  if (!admin) throw new Error("Admin fixture user was not created");
  return authService.createSession(admin.id);
}

function createUserSessionToken(): string {
  const username = uniqueUsername("user");
  const result = authService.registerUser(username, "UserPass123!", "user");
  expect(result.ok).toBe(true);
  const user = authService.listUsersForAdmin().find((entry) => entry.username === username);
  if (!user) throw new Error("User fixture was not created");
  return authService.createSession(user.id);
}

test.describe("addMedicalTermByAdmin validation", () => {
  test("accepts valid difficulty values 1, 2 and 3", () => {
    for (const difficulty of [1, 2, 3] as const) {
      const term = uniqueTerm(`valid-${difficulty}`);
      const result = authService.addMedicalTermByAdmin(term, difficulty);
      expect(result.ok).toBe(true);
      const row = authService.listMedicalTermsForAdmin().find((r) => r.term === term);
      expect(row?.difficulty).toBe(difficulty);
    }
  });

  test("rejects invalid difficulty values with a clear message and creates no term", () => {
    for (const invalidDifficulty of [0, 4, -1, "leicht", null]) {
      const term = uniqueTerm("invalid");
      const result = authService.addMedicalTermByAdmin(term, invalidDifficulty);
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.message).toMatch(/Schwierigkeitsgrad/);
      }
      expect(authService.listMedicalTermsForAdmin().some((r) => r.term === term)).toBe(false);
    }
  });

  test("uses the automatic classification as a default when no difficulty is given", () => {
    const term = uniqueTerm("auto-classified");
    const result = authService.addMedicalTermByAdmin(term);
    expect(result.ok).toBe(true);
    const row = authService.listMedicalTermsForAdmin().find((r) => r.term === term);
    expect(row?.difficulty).toBe(calculateMedicalTermDifficulty(term));
  });
});

test.describe("updateMedicalTermDifficultyByAdmin", () => {
  test("persists a manual difficulty change", () => {
    const term = uniqueTerm("manual-change");
    authService.addMedicalTermByAdmin(term, 1);
    const created = authService.listMedicalTermsForAdmin().find((r) => r.term === term);
    if (!created) throw new Error("fixture term was not created");

    const updateResult = authService.updateMedicalTermDifficultyByAdmin(created.id, 3);
    expect(updateResult.ok).toBe(true);

    const updated = authService.listMedicalTermsForAdmin().find((r) => r.id === created.id);
    expect(updated?.difficulty).toBe(3);
  });

  test("rejects invalid difficulty values and leaves the term unchanged", () => {
    const term = uniqueTerm("stays-unchanged");
    authService.addMedicalTermByAdmin(term, 2);
    const created = authService.listMedicalTermsForAdmin().find((r) => r.term === term);
    if (!created) throw new Error("fixture term was not created");

    const updateResult = authService.updateMedicalTermDifficultyByAdmin(created.id, 7);
    expect(updateResult.ok).toBe(false);

    const unchanged = authService.listMedicalTermsForAdmin().find((r) => r.id === created.id);
    expect(unchanged?.difficulty).toBe(2);
  });

  test("returns a not-found error for an unknown term id", () => {
    const result = authService.updateMedicalTermDifficultyByAdmin(999999999, 2);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.message).toBe("Fachbegriff wurde nicht gefunden.");
    }
  });
});

test.describe("selectMedicalTermsForUserTraining picks terms based on lesson progress", () => {
  test("a user on an early keyboard lesson only receives easy terms", () => {
    const username = uniqueUsername("stage-beginner");
    authService.registerUser(username, "Password123!", "user");
    const user = authService.listUsersForAdmin().find((u) => u.username === username);
    if (!user) throw new Error("fixture user was not created");

    const easyTerm = uniqueTerm("easy-only");
    const hardTerm = uniqueTerm("hard-only");
    authService.addMedicalTermByAdmin(easyTerm, 1);
    authService.addMedicalTermByAdmin(hardTerm, 3);

    // A brand new user starts on keyboard lesson 1 (beginner stage): only
    // difficulty 1 terms should ever be selected among these two fixtures.
    const terms = authService.selectMedicalTermsForUserTraining(user.id, 20);
    expect(terms.length).toBe(20);
    expect(terms).not.toContain(hardTerm);
  });

  test("never returns an empty selection while medical terms exist", () => {
    const username = uniqueUsername("nonempty-check");
    authService.registerUser(username, "Password123!", "user");
    const user = authService.listUsersForAdmin().find((u) => u.username === username);
    if (!user) throw new Error("fixture user was not created");

    const terms = authService.selectMedicalTermsForUserTraining(user.id, 10);
    expect(terms.length).toBe(10);
  });
});

test.describe("admin API permission checks (unchanged)", () => {
  test("POST /api/admin/medical-terms rejects unauthenticated requests", async () => {
    const response = await adminPostMedicalTerm(
      new NextRequest("http://localhost/api/admin/medical-terms", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ term: uniqueTerm("no-session"), difficulty: 1 }),
      })
    );
    expect(response.status).toBe(401);
  });

  test("POST /api/admin/medical-terms rejects non-admin sessions", async () => {
    const token = createUserSessionToken();
    const response = await adminPostMedicalTerm(
      new NextRequest("http://localhost/api/admin/medical-terms", {
        method: "POST",
        headers: { "content-type": "application/json", cookie: `auth_session=${token}` },
        body: JSON.stringify({ term: uniqueTerm("plain-session"), difficulty: 1 }),
      })
    );
    expect(response.status).toBe(403);
  });

  test("POST /api/admin/medical-terms allows an admin session to create a term with a chosen difficulty", async () => {
    const token = createAdminSessionToken();
    const term = uniqueTerm("admin-created");
    const response = await adminPostMedicalTerm(
      new NextRequest("http://localhost/api/admin/medical-terms", {
        method: "POST",
        headers: { "content-type": "application/json", cookie: `auth_session=${token}` },
        body: JSON.stringify({ term, difficulty: 2 }),
      })
    );
    const data = (await response.json()) as { ok: boolean };
    expect(response.status).toBe(200);
    expect(data.ok).toBe(true);
    const row = authService.listMedicalTermsForAdmin().find((r) => r.term === term);
    expect(row?.difficulty).toBe(2);
  });

  test("PATCH /api/admin/medical-terms/[id] rejects invalid difficulty values via the API", async () => {
    const token = createAdminSessionToken();
    const term = uniqueTerm("api-invalid");
    authService.addMedicalTermByAdmin(term, 1);
    const created = authService.listMedicalTermsForAdmin().find((r) => r.term === term);
    if (!created) throw new Error("fixture term was not created");

    const response = await adminPatchMedicalTerm(
      new NextRequest(`http://localhost/api/admin/medical-terms/${created.id}`, {
        method: "PATCH",
        headers: { "content-type": "application/json", cookie: `auth_session=${token}` },
        body: JSON.stringify({ difficulty: 99 }),
      }),
      { params: Promise.resolve({ id: String(created.id) }) }
    );
    const data = (await response.json()) as { ok: boolean };
    expect(response.status).toBe(400);
    expect(data.ok).toBe(false);

    const unchanged = authService.listMedicalTermsForAdmin().find((r) => r.id === created.id);
    expect(unchanged?.difficulty).toBe(1);
  });

  test("PATCH /api/admin/medical-terms/[id] rejects unauthenticated and non-admin requests", async () => {
    const term = uniqueTerm("api-patch-auth");
    authService.addMedicalTermByAdmin(term, 1);
    const created = authService.listMedicalTermsForAdmin().find((r) => r.term === term);
    if (!created) throw new Error("fixture term was not created");

    const unauthenticated = await adminPatchMedicalTerm(
      new NextRequest(`http://localhost/api/admin/medical-terms/${created.id}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ difficulty: 2 }),
      }),
      { params: Promise.resolve({ id: String(created.id) }) }
    );
    expect(unauthenticated.status).toBe(401);

    const userToken = createUserSessionToken();
    const nonAdmin = await adminPatchMedicalTerm(
      new NextRequest(`http://localhost/api/admin/medical-terms/${created.id}`, {
        method: "PATCH",
        headers: { "content-type": "application/json", cookie: `auth_session=${userToken}` },
        body: JSON.stringify({ difficulty: 2 }),
      }),
      { params: Promise.resolve({ id: String(created.id) }) }
    );
    expect(nonAdmin.status).toBe(403);

    const unchanged = authService.listMedicalTermsForAdmin().find((r) => r.id === created.id);
    expect(unchanged?.difficulty).toBe(1);
  });

  test("PATCH /api/admin/medical-terms/[id] allows an admin session to change difficulty", async () => {
    const token = createAdminSessionToken();
    const term = uniqueTerm("api-ok");
    authService.addMedicalTermByAdmin(term, 1);
    const created = authService.listMedicalTermsForAdmin().find((r) => r.term === term);
    if (!created) throw new Error("fixture term was not created");

    const response = await adminPatchMedicalTerm(
      new NextRequest(`http://localhost/api/admin/medical-terms/${created.id}`, {
        method: "PATCH",
        headers: { "content-type": "application/json", cookie: `auth_session=${token}` },
        body: JSON.stringify({ difficulty: 3 }),
      }),
      { params: Promise.resolve({ id: String(created.id) }) }
    );
    const data = (await response.json()) as { ok: boolean };
    expect(response.status).toBe(200);
    expect(data.ok).toBe(true);

    const updated = authService.listMedicalTermsForAdmin().find((r) => r.id === created.id);
    expect(updated?.difficulty).toBe(3);
  });
});

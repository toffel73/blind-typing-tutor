import { test, expect } from "@playwright/test";
import { register } from "node:module";
import { randomUUID } from "node:crypto";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

/**
 * Unit/integration tests for the invite-code gated public registration flow.
 *
 * These tests exercise the real production code (app/api/auth/register/route.ts
 * and the invite-code helpers in src/server/authService.ts) directly in a Node
 * process, using an isolated SQLite database file so they never touch the
 * database used by the dev server / browser e2e tests.
 *
 * They intentionally do NOT go through the running Next.js server (webServer)
 * so they can freely flip REGISTRATION_INVITE_CODE on and off between cases.
 *
 * Node's native ESM resolver can't resolve the bare "next/server" specifier
 * used by route.ts outside of Next's own bundler (the "next" package has no
 * "exports" map for that subpath). A small local loader hook (see
 * ./support/nextResolveShim.mjs) restores resolution for that one case only;
 * it changes nothing else and never runs outside this test file.
 */
register(new URL("./support/nextResolveShim.mjs", import.meta.url));

// Use a dedicated, isolated SQLite file for this test file's authService instance.
process.env.AUTH_DB_PATH = join(
  mkdtempSync(join(tmpdir(), "invite-code-test-")),
  "auth.sqlite"
);

const { POST } = await import("../app/api/auth/register/route");
const { NextRequest } = await import("next/server");
const authService = await import("@/server/authService");

const REGISTER_URL = "http://localhost/api/auth/register";
const VALID_INVITE_CODE = "unit-test-invite-code";

function buildRequest(
  body: Record<string, unknown>,
  sessionToken?: string
): InstanceType<typeof NextRequest> {
  const headers: Record<string, string> = {
    "content-type": "application/json",
  };
  if (sessionToken) {
    headers.cookie = `auth_session=${sessionToken}`;
  }
  return new NextRequest(REGISTER_URL, {
    method: "POST",
    headers,
    body: JSON.stringify(body),
  });
}

function uniqueUsername(prefix: string) {
  return `${prefix}-${randomUUID().slice(0, 8)}`;
}

function userExists(username: string): boolean {
  return authService
    .listUsersForAdmin()
    .some((user) => user.username === username);
}

async function createAdminSessionToken(): Promise<string> {
  const adminUsername = uniqueUsername("admin");
  const result = authService.registerUser(adminUsername, "AdminPass123!", "admin");
  expect(result.ok).toBe(true);
  const adminUser = authService
    .listUsersForAdmin()
    .find((user) => user.username === adminUsername);
  if (!adminUser) {
    throw new Error("Admin fixture user was not created");
  }
  return authService.createSession(adminUser.id);
}

test.describe("POST /api/auth/register - invite code gate", () => {
  test.beforeEach(() => {
    delete process.env.REGISTRATION_INVITE_CODE;
  });

  test("logged out + correct invite code => user is created with role 'user'", async () => {
    process.env.REGISTRATION_INVITE_CODE = VALID_INVITE_CODE;
    const username = uniqueUsername("public-ok");

    const response = await POST(
      buildRequest({
        username,
        password: "CorrectHorse1!",
        passwordConfirm: "CorrectHorse1!",
        inviteCode: VALID_INVITE_CODE,
      })
    );
    const data = (await response.json()) as { ok: boolean; message: string };

    expect(data.ok).toBe(true);
    expect(userExists(username)).toBe(true);
    const created = authService
      .listUsersForAdmin()
      .find((user) => user.username === username);
    expect(created?.role).toBe("user");
  });

  test("logged out + wrong invite code => rejected, no user created", async () => {
    process.env.REGISTRATION_INVITE_CODE = VALID_INVITE_CODE;
    const username = uniqueUsername("public-wrong");

    const response = await POST(
      buildRequest({
        username,
        password: "CorrectHorse1!",
        passwordConfirm: "CorrectHorse1!",
        inviteCode: "this-is-not-the-code",
      })
    );
    const data = (await response.json()) as { ok: boolean; message: string };

    expect(response.status).toBeGreaterThanOrEqual(400);
    expect(data.ok).toBe(false);
    // Message must be neutral and must never echo the configured invite code.
    expect(data.message).not.toContain(VALID_INVITE_CODE);
    expect(userExists(username)).toBe(false);
  });

  test("logged out + empty invite code => rejected, no user created", async () => {
    process.env.REGISTRATION_INVITE_CODE = VALID_INVITE_CODE;
    const username = uniqueUsername("public-empty");

    const response = await POST(
      buildRequest({
        username,
        password: "CorrectHorse1!",
        passwordConfirm: "CorrectHorse1!",
        inviteCode: "",
      })
    );
    const data = (await response.json()) as { ok: boolean; message: string };

    expect(response.status).toBeGreaterThanOrEqual(400);
    expect(data.ok).toBe(false);
    expect(userExists(username)).toBe(false);
  });

  test("logged out + missing invite code field => rejected, no user created", async () => {
    process.env.REGISTRATION_INVITE_CODE = VALID_INVITE_CODE;
    const username = uniqueUsername("public-missing");

    const response = await POST(
      buildRequest({
        username,
        password: "CorrectHorse1!",
        passwordConfirm: "CorrectHorse1!",
        // inviteCode intentionally omitted
      })
    );
    const data = (await response.json()) as { ok: boolean; message: string };

    expect(response.status).toBeGreaterThanOrEqual(400);
    expect(data.ok).toBe(false);
    expect(userExists(username)).toBe(false);
  });

  test("REGISTRATION_INVITE_CODE not set => public registration fully disabled, no user created", async () => {
    // Explicitly ensure the env var is absent (not just empty).
    delete process.env.REGISTRATION_INVITE_CODE;
    const username = uniqueUsername("public-no-env");

    const response = await POST(
      buildRequest({
        username,
        password: "CorrectHorse1!",
        passwordConfirm: "CorrectHorse1!",
        inviteCode: "anything-at-all",
      })
    );
    const data = (await response.json()) as { ok: boolean; message: string };

    expect(response.status).toBeGreaterThanOrEqual(400);
    expect(data.ok).toBe(false);
    expect(userExists(username)).toBe(false);
  });

  test("REGISTRATION_INVITE_CODE set to empty string => public registration fully disabled", async () => {
    process.env.REGISTRATION_INVITE_CODE = "";
    const username = uniqueUsername("public-empty-env");

    const response = await POST(
      buildRequest({
        username,
        password: "CorrectHorse1!",
        passwordConfirm: "CorrectHorse1!",
        inviteCode: "",
      })
    );
    const data = (await response.json()) as { ok: boolean; message: string };

    expect(response.status).toBeGreaterThanOrEqual(400);
    expect(data.ok).toBe(false);
    expect(userExists(username)).toBe(false);
  });

  test("public registration can never grant role 'admin', even if requested in the body", async () => {
    process.env.REGISTRATION_INVITE_CODE = VALID_INVITE_CODE;
    const username = uniqueUsername("public-role-spoof");

    const response = await POST(
      buildRequest({
        username,
        password: "CorrectHorse1!",
        passwordConfirm: "CorrectHorse1!",
        inviteCode: VALID_INVITE_CODE,
        role: "admin",
      })
    );
    const data = (await response.json()) as { ok: boolean; message: string };

    expect(data.ok).toBe(true);
    const created = authService
      .listUsersForAdmin()
      .find((user) => user.username === username);
    expect(created?.role).toBe("user");
  });

  test("admin session => user creation succeeds without any invite code", async () => {
    // No REGISTRATION_INVITE_CODE configured at all for this case.
    delete process.env.REGISTRATION_INVITE_CODE;
    const adminSessionToken = await createAdminSessionToken();
    const username = uniqueUsername("admin-created");

    const response = await POST(
      buildRequest(
        {
          username,
          password: "AdminCreated1!",
          role: "user",
        },
        adminSessionToken
      )
    );
    const data = (await response.json()) as { ok: boolean; message: string };

    expect(data.ok).toBe(true);
    expect(userExists(username)).toBe(true);
  });

  test("non-admin logged-in session => rejected regardless of invite code", async () => {
    process.env.REGISTRATION_INVITE_CODE = VALID_INVITE_CODE;
    const plainUsername = uniqueUsername("plain-user");
    const registerResult = authService.registerUser(plainUsername, "PlainUser1!", "user");
    expect(registerResult.ok).toBe(true);
    const plainUser = authService
      .listUsersForAdmin()
      .find((user) => user.username === plainUsername);
    if (!plainUser) throw new Error("Fixture user was not created");
    const plainSessionToken = authService.createSession(plainUser.id);

    const newUsername = uniqueUsername("via-plain-session");
    const response = await POST(
      buildRequest(
        {
          username: newUsername,
          password: "CorrectHorse1!",
          passwordConfirm: "CorrectHorse1!",
          inviteCode: VALID_INVITE_CODE,
        },
        plainSessionToken
      )
    );
    const data = (await response.json()) as { ok: boolean; message: string };

    expect(response.status).toBe(403);
    expect(data.ok).toBe(false);
    expect(userExists(newUsername)).toBe(false);
  });
});

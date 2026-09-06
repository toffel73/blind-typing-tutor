import { NextRequest, NextResponse } from "next/server";
import {
  getSessionUser,
  isPublicRegistrationEnabled,
  registerUser,
  verifyInviteCode,
} from "@/server/authService";
import type { UserRole } from "@/types/auth";
import { PASSWORD_MISMATCH_MESSAGE } from "@/config/auth";

export const runtime = "nodejs";

const INVALID_INVITE_MESSAGE =
  "Registrierung nicht möglich. Bitte prüfen Sie den Einladungscode.";

export async function POST(request: NextRequest) {
  try {
    const sessionToken = request.cookies.get("auth_session")?.value ?? "";
    const sessionUser = getSessionUser(sessionToken);
    const isAdminRequest = sessionUser?.role === "admin";

    const body = (await request.json()) as {
      username?: string;
      password?: string;
      passwordConfirm?: string;
      role?: UserRole;
      inviteCode?: string;
    };

    const username = typeof body.username === "string" ? body.username : "";
    const password = typeof body.password === "string" ? body.password : "";

    if (isAdminRequest) {
      // A) Admin creates a user via the existing user management UI.
      // No invite code required; the existing admin check above already applies.
      const result = registerUser(username, password, body.role);
      return NextResponse.json(result, { status: result.ok ? 200 : 400 });
    }

    if (sessionUser) {
      // Logged-in non-admin users may not use this endpoint at all.
      return NextResponse.json(
        { ok: false, message: "Keine Berechtigung." },
        { status: 403 }
      );
    }

    // B) Public (unauthenticated) self-registration requires a valid invite code.
    if (!isPublicRegistrationEnabled()) {
      return NextResponse.json(
        { ok: false, message: INVALID_INVITE_MESSAGE },
        { status: 403 }
      );
    }

    if (password !== body.passwordConfirm) {
      return NextResponse.json(
        { ok: false, message: PASSWORD_MISMATCH_MESSAGE },
        { status: 400 }
      );
    }

    const inviteCode = typeof body.inviteCode === "string" ? body.inviteCode : "";
    if (!verifyInviteCode(inviteCode)) {
      return NextResponse.json(
        { ok: false, message: INVALID_INVITE_MESSAGE },
        { status: 403 }
      );
    }

    // The invite code never grants anything beyond the default "user" role,
    // regardless of what the request body contains.
    const result = registerUser(username, password, "user");
    return NextResponse.json(result, { status: result.ok ? 200 : 400 });
  } catch {
    return NextResponse.json(
      { ok: false, message: "Ungültige Anfrage." },
      { status: 400 }
    );
  }
}

import { NextRequest, NextResponse } from "next/server";
import {
  deleteMedicalTermByAdmin,
  getSessionUser,
  updateMedicalTermDifficultyByAdmin,
} from "@/server/authService";

export const runtime = "nodejs";

function ensureAdmin(request: NextRequest) {
  const sessionToken = request.cookies.get("auth_session")?.value ?? "";
  const sessionUser = getSessionUser(sessionToken);
  if (!sessionUser) {
    return { ok: false as const, status: 401, message: "Bitte zuerst einloggen." };
  }
  if (sessionUser.role !== "admin") {
    return { ok: false as const, status: 403, message: "Keine Berechtigung." };
  }
  return { ok: true as const };
}

function parseTermId(id: string) {
  const termId = Number(id);
  return Number.isInteger(termId) && termId > 0 ? termId : null;
}

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const auth = ensureAdmin(request);
  if (!auth.ok) {
    return NextResponse.json({ ok: false, message: auth.message }, { status: auth.status });
  }

  const { id } = await context.params;
  const termId = parseTermId(id);
  if (termId === null) {
    return NextResponse.json(
      { ok: false, message: "Ungültige Fachbegriff-ID." },
      { status: 400 }
    );
  }

  let difficulty: unknown;
  try {
    const body = (await request.json()) as { difficulty?: unknown };
    difficulty = body.difficulty;
  } catch {
    return NextResponse.json(
      { ok: false, message: "Ungültige Anfrage." },
      { status: 400 }
    );
  }

  const result = updateMedicalTermDifficultyByAdmin(termId, difficulty);
  if (!result.ok) {
    const status = result.message === "Fachbegriff wurde nicht gefunden." ? 404 : 400;
    return NextResponse.json(result, { status });
  }
  return NextResponse.json({
    ok: true,
    message: `Schwierigkeitsgrad von '${result.term}' wurde aktualisiert.`,
    difficulty: result.difficulty,
  });
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const auth = ensureAdmin(request);
  if (!auth.ok) {
    return NextResponse.json({ ok: false, message: auth.message }, { status: auth.status });
  }

  const { id } = await context.params;
  const termId = parseTermId(id);
  if (termId === null) {
    return NextResponse.json(
      { ok: false, message: "Ungültige Fachbegriff-ID." },
      { status: 400 }
    );
  }

  const result = deleteMedicalTermByAdmin(termId);
  if (!result.ok) {
    const status = result.message === "Fachbegriff wurde nicht gefunden." ? 404 : 400;
    return NextResponse.json(result, { status });
  }
  return NextResponse.json({
    ok: true,
    message: `Fachbegriff '${result.term}' wurde gelöscht.`,
  });
}


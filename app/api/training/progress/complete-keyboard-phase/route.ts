import { NextRequest, NextResponse } from "next/server";
import { completeKeyboardPhaseForSession, getSessionUser } from "@/server/authService";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  const sessionToken = request.cookies.get("auth_session")?.value ?? "";
  const sessionUser = getSessionUser(sessionToken);

  if (!sessionUser) {
    return NextResponse.json(
      { ok: false, message: "Bitte zuerst einloggen." },
      { status: 401 }
    );
  }

  let trainingExpiresAt: number | undefined;
  try {
    const body = (await request.json()) as { trainingExpiresAt?: number };
    if (typeof body.trainingExpiresAt === "number") {
      trainingExpiresAt = body.trainingExpiresAt;
    }
  } catch {
    // body is optional
  }

  if (!trainingExpiresAt) {
    return NextResponse.json(
      { ok: false, message: "trainingExpiresAt fehlt." },
      { status: 400 }
    );
  }

  const result = completeKeyboardPhaseForSession(sessionUser.id, trainingExpiresAt);
  return NextResponse.json(result);
}

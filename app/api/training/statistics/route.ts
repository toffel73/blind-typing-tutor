import { NextRequest, NextResponse } from "next/server";
import { getSessionUser, getTrainingStatistics } from "@/server/authService";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const sessionToken = request.cookies.get("auth_session")?.value ?? "";
  const sessionUser = getSessionUser(sessionToken);

  if (!sessionUser) {
    return NextResponse.json(
      { ok: false, message: "Bitte zuerst einloggen." },
      { status: 401 }
    );
  }

  const stats = getTrainingStatistics(sessionUser.id);
  return NextResponse.json({
    ok: true,
    ...stats,
  });
}

import { NextRequest, NextResponse } from "next/server";
import { getKeyboardProgressForUser, getSessionUser } from "@/server/authService";
import { getKeyboardLessonById, getLastKeyboardLessonId } from "@/data/keyboardTraining";

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

  const progress = getKeyboardProgressForUser(sessionUser.id);
  const totalLessons = getLastKeyboardLessonId();
  const nextLessonId = progress.currentKeyboardLesson < totalLessons ? progress.currentKeyboardLesson + 1 : null;
  const nextLesson = nextLessonId != null ? getKeyboardLessonById(nextLessonId) : null;

  return NextResponse.json({
    ok: true,
    ...progress,
    totalLessons,
    nextLessonId,
    nextLessonTitle: nextLesson?.title ?? null,
  });
}


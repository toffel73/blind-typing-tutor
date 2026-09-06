import { NextRequest, NextResponse } from "next/server";
import { getSessionUser, saveTrainingSession } from "@/server/authService";

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

  try {
    const body = (await request.json()) as {
      startedAt: number;
      endedAt: number;
      activeLearningTimeMs: number;
      wpm: number;
      accuracy: number;
      errors: number;
      attemptedWords?: number;
      correctWords?: number;
      currentLesson?: number;
    };

    const {
      startedAt, endedAt, activeLearningTimeMs, wpm, accuracy, errors,
      attemptedWords = 0, correctWords = 0, currentLesson,
    } = body;

    // Validate inputs
    if (
      typeof startedAt !== "number" || typeof endedAt !== "number" ||
      typeof activeLearningTimeMs !== "number" ||
      !Number.isFinite(attemptedWords) || !Number.isFinite(correctWords) ||
      attemptedWords < 0 || correctWords < 0 || correctWords > attemptedWords
    ) {
      return NextResponse.json(
        { ok: false, message: "Ungültige Eingabeparameter." },
        { status: 400 }
      );
    }

    saveTrainingSession(
      sessionUser.id,
      startedAt,
      endedAt,
      activeLearningTimeMs,
      wpm,
      accuracy,
      errors,
      Math.floor(attemptedWords),
      Math.floor(correctWords),
      currentLesson
    );

    return NextResponse.json({ ok: true, message: "Trainingseinheit gespeichert." });
  } catch (error) {
    console.error("Error saving training session:", error);
    return NextResponse.json(
      { ok: false, message: "Fehler beim Speichern der Trainingseinheit." },
      { status: 500 }
    );
  }
}

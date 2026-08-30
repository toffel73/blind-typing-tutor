import { NextRequest, NextResponse } from "next/server";
import { TRAINING_SESSION_TTL_MS } from "@/config/auth";

export const runtime = "nodejs";

interface TrainingSessionRequest {
  action?: "start" | "complete" | "clear";
}

interface TrainingSessionResponse {
  ok: boolean;
  status: string;
  startedAt?: number;
  expiresAt?: number;
  remainingMs?: number;
  message?: string;
}

/**
 * GET: Return training session configuration and timing info
 */
export async function GET(): Promise<NextResponse<TrainingSessionResponse>> {
  return NextResponse.json({
    ok: true,
    status: "ok",
    remainingMs: TRAINING_SESSION_TTL_MS,
  });
}

/**
 * POST: Start, complete, or clear a training session
 */
export async function POST(request: NextRequest): Promise<NextResponse<TrainingSessionResponse>> {
  try {
    const body = (await request.json()) as TrainingSessionRequest;
    const action = body.action ?? "start";

    if (action === "start") {
      const now = Date.now();
      const expiresAt = now + TRAINING_SESSION_TTL_MS;
      return NextResponse.json({
        ok: true,
        status: "started",
        startedAt: now,
        expiresAt: expiresAt,
      });
    }

    if (action === "complete") {
      return NextResponse.json({
        ok: true,
        status: "completed",
      });
    }

    if (action === "clear") {
      return NextResponse.json({
        ok: true,
        status: "cleared",
      });
    }

    return NextResponse.json(
      {
        ok: false,
        status: "error",
        message: "Unknown action",
      },
      { status: 400 }
    );
  } catch {
    return NextResponse.json(
      {
        ok: false,
        status: "error",
        message: "Invalid request",
      },
      { status: 400 }
    );
  }
}

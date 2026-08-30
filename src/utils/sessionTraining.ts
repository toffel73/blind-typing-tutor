import { TRAINING_PHASE_DURATION_SECONDS, TRAINING_SESSION_TTL_MS } from "@/config/auth";

export type SessionTrainingPhase = "phase1" | "phase2" | "phase3";

export interface SessionTrainingPhaseMeta {
  phase: SessionTrainingPhase;
  label: string;
  display: string;
}

// Phase boundaries derived from central config so they stay in sync automatically.
// Phase 1: top third of training time
// Phase 2: middle third
// Phase 3: bottom third (remaining ≤ PHASE_2_THRESHOLD_MS)
const PHASE_1_THRESHOLD_MS = TRAINING_PHASE_DURATION_SECONDS * 2 * 1000; // 2 phases worth remaining
const PHASE_2_THRESHOLD_MS = TRAINING_PHASE_DURATION_SECONDS * 1 * 1000; // 1 phase worth remaining

export function getSessionRemainingMs(expiresAt: number) {
  const remainingMs = new Date(expiresAt).getTime() - Date.now();
  return Math.min(Math.max(remainingMs, 0), TRAINING_SESSION_TTL_MS);
}

export function getSessionTrainingPhase(remainingMs: number): SessionTrainingPhase {
  if (remainingMs > PHASE_1_THRESHOLD_MS) {
    return "phase1";
  }
  if (remainingMs > PHASE_2_THRESHOLD_MS) {
    return "phase2";
  }
  return "phase3";
}

export function getSessionTrainingPhaseMeta(remainingMs: number): SessionTrainingPhaseMeta {
  const phase = getSessionTrainingPhase(remainingMs);
  if (phase === "phase1") {
    return { phase, label: "Tastaturtraining", display: "1/3 · Tastaturtraining" };
  }
  if (phase === "phase2") {
    return { phase, label: "Worttraining", display: "2/3 · Worttraining" };
  }
  return { phase, label: "Medizinische Begriffe", display: "3/3 · Medizinische Begriffe" };
}

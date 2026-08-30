import { TRAINING_SESSION_TTL_MS } from "@/config/auth";

export type TrainingSessionStatus = "not-started" | "active" | "completed";

export interface TrainingSessionData {
  status: TrainingSessionStatus;
  startedAt: number | null;
  expiresAt: number | null;
}

const STORAGE_KEY = "training_session";

/**
 * Get the current training session data from localStorage
 */
export function getTrainingSessionData(): TrainingSessionData {
  if (typeof window === "undefined") {
    return { status: "not-started", startedAt: null, expiresAt: null };
  }

  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (!stored) {
      return { status: "not-started", startedAt: null, expiresAt: null };
    }
    const parsed = JSON.parse(stored) as TrainingSessionData;
    return parsed;
  } catch {
    return { status: "not-started", startedAt: null, expiresAt: null };
  }
}

/**
 * Save training session data to localStorage
 */
function saveTrainingSessionData(data: TrainingSessionData): void {
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {
    // Silently fail if localStorage is not available
  }
}

/**
 * Start a new training session
 */
export function startTrainingSession(): TrainingSessionData {
  const now = Date.now();
  const data: TrainingSessionData = {
    status: "active",
    startedAt: now,
    expiresAt: now + TRAINING_SESSION_TTL_MS,
  };
  saveTrainingSessionData(data);
  return data;
}

/**
 * Complete the current training session
 */
export function completeTrainingSession(): TrainingSessionData {
  const data: TrainingSessionData = {
    status: "completed",
    startedAt: null,
    expiresAt: null,
  };
  saveTrainingSessionData(data);
  return data;
}

/**
 * Clear the training session (reset to not-started state)
 */
export function clearTrainingSession(): TrainingSessionData {
  const data: TrainingSessionData = {
    status: "not-started",
    startedAt: null,
    expiresAt: null,
  };
  saveTrainingSessionData(data);
  return data;
}

/**
 * Get remaining time in milliseconds for the current training session
 */
export function getTrainingSessionRemainingMs(): number {
  const data = getTrainingSessionData();
  if (data.status !== "active" || !data.expiresAt) {
    return 0;
  }
  const remaining = data.expiresAt - Date.now();
  return Math.min(Math.max(remaining, 0), TRAINING_SESSION_TTL_MS);
}

/**
 * Check if a training session is currently active
 */
export function isTrainingSessionActive(): boolean {
  const data = getTrainingSessionData();
  if (data.status !== "active" || !data.expiresAt) {
    return false;
  }
  const remaining = data.expiresAt - Date.now();
  return remaining > 0;
}

/**
 * Get the expiry timestamp of the current active training session
 */
export function getTrainingSessionExpiresAt(): number | null {
  const data = getTrainingSessionData();
  if (data.status === "active" && data.expiresAt) {
    return data.expiresAt;
  }
  return null;
}

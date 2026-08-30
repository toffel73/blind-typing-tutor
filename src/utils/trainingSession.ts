import { TRAINING_SESSION_TTL_MS } from "@/config/auth";

export type TrainingSessionStatus = "not-started" | "active" | "paused" | "completed";

export interface TrainingSessionData {
  status: TrainingSessionStatus;
  startedAt: number | null;
  expiresAt: number | null;
  pausedAt: number | null; // Time when training was paused
  totalPausedMs: number; // Total time spent in paused state
}

const STORAGE_KEY = "training_session";

/**
 * Get the current training session data from localStorage
 */
export function getTrainingSessionData(): TrainingSessionData {
  if (typeof window === "undefined") {
    return { status: "not-started", startedAt: null, expiresAt: null, pausedAt: null, totalPausedMs: 0 };
  }

  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (!stored) {
      return { status: "not-started", startedAt: null, expiresAt: null, pausedAt: null, totalPausedMs: 0 };
    }
    const parsed = JSON.parse(stored) as TrainingSessionData;
    return parsed;
  } catch {
    return { status: "not-started", startedAt: null, expiresAt: null, pausedAt: null, totalPausedMs: 0 };
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
    pausedAt: null,
    totalPausedMs: 0,
  };
  saveTrainingSessionData(data);
  return data;
}

/**
 * Pause the current training session
 */
export function pauseTrainingSession(): TrainingSessionData {
  const data = getTrainingSessionData();
  if (data.status !== "active" || !data.expiresAt) {
    return data;
  }

  const pausedData: TrainingSessionData = {
    ...data,
    status: "paused",
    pausedAt: Date.now(),
  };
  saveTrainingSessionData(pausedData);
  return pausedData;
}

/**
 * Resume the current training session
 */
export function resumeTrainingSession(): TrainingSessionData {
  const data = getTrainingSessionData();
  if (data.status !== "paused" || !data.pausedAt || !data.expiresAt) {
    return data;
  }

  const now = Date.now();
  const pauseDuration = now - data.pausedAt;
  
  const resumedData: TrainingSessionData = {
    ...data,
    status: "active",
    pausedAt: null,
    expiresAt: data.expiresAt + pauseDuration, // Extend expiry by pause duration
    totalPausedMs: data.totalPausedMs + pauseDuration,
  };
  saveTrainingSessionData(resumedData);
  return resumedData;
}

/**
 * Complete the current training session
 */
export function completeTrainingSession(): TrainingSessionData {
  const data: TrainingSessionData = {
    status: "completed",
    startedAt: null,
    expiresAt: null,
    pausedAt: null,
    totalPausedMs: 0,
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
    pausedAt: null,
    totalPausedMs: 0,
  };
  saveTrainingSessionData(data);
  return data;
}

/**
 * Get remaining time in milliseconds for the current training session
 */
export function getTrainingSessionRemainingMs(): number {
  const data = getTrainingSessionData();
  if (!data.expiresAt) {
    return 0;
  }

  if (data.status === "paused") {
    // If paused, return the remaining time at the pause point
    const remaining = data.expiresAt - (data.pausedAt ?? Date.now());
    return Math.min(Math.max(remaining, 0), TRAINING_SESSION_TTL_MS);
  }

  if (data.status === "active") {
    const remaining = data.expiresAt - Date.now();
    return Math.min(Math.max(remaining, 0), TRAINING_SESSION_TTL_MS);
  }

  return 0;
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
 * Check if a training session is currently paused
 */
export function isTrainingSessionPaused(): boolean {
  const data = getTrainingSessionData();
  return data.status === "paused";
}

/**
 * Get the expiry timestamp of the current active training session
 */
export function getTrainingSessionExpiresAt(): number | null {
  const data = getTrainingSessionData();
  if ((data.status === "active" || data.status === "paused") && data.expiresAt) {
    return data.expiresAt;
  }
  return null;
}

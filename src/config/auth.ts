// Authentication session: 1 hour (independent of training duration)
export const SESSION_TTL_MS = 60 * 60 * 1000;
export const SESSION_TTL_SECONDS = SESSION_TTL_MS / 1000;

// Training session: 3 minutes total (3 phases × 60 seconds)
// To change duration: update TRAINING_PHASE_DURATION_SECONDS here, then update
// PHASE_1_THRESHOLD_MS / PHASE_2_THRESHOLD_MS in src/utils/sessionTraining.ts to match.
export const TRAINING_PHASE_DURATION_SECONDS = 60; // seconds per phase
export const TRAINING_SESSION_TTL_MS = TRAINING_PHASE_DURATION_SECONDS * 3 * 1000; // 180 000 ms
export const TRAINING_SESSION_TTL_SECONDS = TRAINING_SESSION_TTL_MS / 1000;

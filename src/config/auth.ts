// Authentication session: 1 hour (independent of training duration)
export const SESSION_TTL_MS = 60 * 60 * 1000;
export const SESSION_TTL_SECONDS = SESSION_TTL_MS / 1000;

// Training session: 9 minutes total (3 phases × 180 seconds each).
// To change the duration, update TRAINING_PHASE_DURATION_SECONDS here.
// Phase thresholds in src/utils/sessionTraining.ts are derived automatically.
export const TRAINING_PHASE_DURATION_SECONDS = 180; // seconds per phase (3 phases)
export const TRAINING_SESSION_TTL_MS = TRAINING_PHASE_DURATION_SECONDS * 3 * 1000;
export const TRAINING_SESSION_TTL_SECONDS = TRAINING_SESSION_TTL_MS / 1000;
export const TRAINING_DURATION_MINUTES = TRAINING_SESSION_TTL_MS / 60_000;

// Shared client/server validation message so the wording never drifts
// between the register form's client-side check and the API's server-side check.
export const PASSWORD_MISMATCH_MESSAGE = "Die Passwörter stimmen nicht überein.";

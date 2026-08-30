// Authentication session: 1 hour (independent of training duration)
export const SESSION_TTL_MS = 60 * 60 * 1000;
export const SESSION_TTL_SECONDS = SESSION_TTL_MS / 1000;

// Training session: 10 minutes (managed separately from auth)
export const TRAINING_SESSION_TTL_MS = 10 * 60 * 1000;
export const TRAINING_SESSION_TTL_SECONDS = TRAINING_SESSION_TTL_MS / 1000;

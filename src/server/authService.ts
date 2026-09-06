import { mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import {
  createHash,
  randomBytes,
  scryptSync,
  timingSafeEqual,
} from "node:crypto";
import Database from "better-sqlite3";
import { SESSION_TTL_MS } from "@/config/auth";
import {
  ELITE_LESSON_ID,
  getKeyboardLessonById,
  getLearningLevelForLesson,
  learningLevelLabels,
} from "@/data/keyboardTraining";
import { medicalTerms as defaultMedicalTerms } from "@/data/medicalTerms";
import type { UserRole } from "@/types/auth";
import {
  calculateMedicalTermDifficulty,
  getLearningStageFromKeyboardLesson,
  isValidMedicalTermDifficulty,
  selectWeightedMedicalTerms,
  type MedicalTermDifficulty,
} from "@/utils/medicalTermDifficulty";

interface UserRow {
  id: number;
  username: string;
  password_hash: string;
  password_salt: string;
  role: UserRole;
}

interface AdminUserListRow {
  id: number;
  username: string;
  role: UserRole;
}

interface MedicalTermRow {
  id: number;
  term: string;
  difficulty: MedicalTermDifficulty;
}

interface SessionUser {
  id: number;
  username: string;
  role: UserRole;
  expiresAt: number;
}

interface SessionRecord {
  sessionId: number;
  expiresAt: number;
  issuedAt: number | null;
}

interface UserLearningProgressRow {
  userId: number;
  currentKeyboardLesson: number;
  lastCompletedSessionExpiresAt: number | null;
}

declare global {
  var __authDatabase: Database.Database | undefined;
}

function getDb() {
  if (!global.__authDatabase) {
    const dbPath = process.env.AUTH_DB_PATH ?? join("/tmp", "auth.sqlite");
    mkdirSync(dirname(dbPath), { recursive: true });
    const db = new Database(dbPath);
    db.pragma("journal_mode = WAL");
    db.pragma("foreign_keys = ON");
    db.prepare(
      `CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        password_salt TEXT NOT NULL,
        role TEXT NOT NULL DEFAULT 'user',
        created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
      )`
    ).run();
    const userColumns = db.prepare("PRAGMA table_info(users)").all() as Array<{ name: string }>;
    const hasRole = userColumns.some((column) => column.name === "role");
    if (!hasRole) {
      db.prepare("ALTER TABLE users ADD COLUMN role TEXT NOT NULL DEFAULT 'user'").run();
    }
    db.prepare(
      "UPDATE users SET role = 'user' WHERE role IS NULL OR role NOT IN ('admin', 'user')"
    ).run();
    db.prepare("UPDATE users SET role = 'admin' WHERE username = 'toffel73'").run();

    db.prepare(
      `CREATE TABLE IF NOT EXISTS medical_terms (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        term TEXT NOT NULL UNIQUE,
        difficulty INTEGER NOT NULL DEFAULT 1 CHECK(difficulty IN (1, 2, 3)),
        created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
      )`
    ).run();
    const medicalTermColumns = db.prepare("PRAGMA table_info(medical_terms)").all() as Array<{
      name: string;
    }>;
    const hasDifficultyColumn = medicalTermColumns.some((column) => column.name === "difficulty");
    if (!hasDifficultyColumn) {
      // Existing production data predates the difficulty feature: add the column
      // with a safe default first, then classify already-present terms once so
      // no data is lost and every term always has a valid difficulty. Admins can
      // change any of these initial values afterwards; this backfill only runs
      // the one time the column is added, so manual edits are never overwritten.
      db.prepare(
        "ALTER TABLE medical_terms ADD COLUMN difficulty INTEGER NOT NULL DEFAULT 1 CHECK(difficulty IN (1, 2, 3))"
      ).run();
      const existingTerms = db.prepare("SELECT id, term FROM medical_terms").all() as Array<{
        id: number;
        term: string;
      }>;
      const updateDifficulty = db.prepare("UPDATE medical_terms SET difficulty = ? WHERE id = ?");
      const classifyExistingTerms = db.transaction((rows: Array<{ id: number; term: string }>) => {
        for (const row of rows) {
          updateDifficulty.run(calculateMedicalTermDifficulty(row.term), row.id);
        }
      });
      classifyExistingTerms(existingTerms);
    }
    const insertMedicalTerm = db.prepare(
      "INSERT OR IGNORE INTO medical_terms (term, difficulty) VALUES (?, ?)"
    );
    const medicalInsertTransaction = db.transaction((terms: string[]) => {
      for (const term of terms) {
        const trimmedTerm = term.trim();
        insertMedicalTerm.run(trimmedTerm, calculateMedicalTermDifficulty(trimmedTerm));
      }
    });
    medicalInsertTransaction(defaultMedicalTerms);
    db.prepare(
      `CREATE TABLE IF NOT EXISTS schema_migrations (
        id TEXT PRIMARY KEY,
        applied_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
      )`
    ).run();
    const uppercaseDifficultyMigration = "2026-09-uppercase-medical-abbreviations";
    const uppercaseDifficultyApplied = db
      .prepare("SELECT id FROM schema_migrations WHERE id = ?")
      .get(uppercaseDifficultyMigration) as { id: string } | undefined;
    if (!uppercaseDifficultyApplied) {
      const migrateUppercaseDifficulties = db.transaction(() => {
        db.prepare(
          "UPDATE medical_terms SET difficulty = 2 WHERE term IN ('CT', 'MRT', 'CRPS') AND difficulty = 1"
        ).run();
        db.prepare("INSERT INTO schema_migrations (id) VALUES (?)").run(
          uppercaseDifficultyMigration
        );
      });
      migrateUppercaseDifficulties();
    }

    db.prepare(
      `CREATE TABLE IF NOT EXISTS sessions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        token_hash TEXT UNIQUE NOT NULL,
        issued_at INTEGER,
        expires_at INTEGER NOT NULL,
        created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )`
    ).run();
    db.prepare(
      `CREATE TABLE IF NOT EXISTS user_learning_progress (
        user_id INTEGER PRIMARY KEY,
        current_keyboard_lesson INTEGER NOT NULL DEFAULT 1,
        last_completed_session_expires_at INTEGER,
        updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )`
    ).run();
    db.prepare(
      `CREATE TABLE IF NOT EXISTS training_sessions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        started_at INTEGER NOT NULL,
        ended_at INTEGER NOT NULL,
        active_learning_time_ms INTEGER NOT NULL DEFAULT 0,
        wpm INTEGER NOT NULL DEFAULT 0,
        accuracy REAL NOT NULL DEFAULT 0,
        errors INTEGER NOT NULL DEFAULT 0,
        attempted_words INTEGER NOT NULL DEFAULT 0,
        correct_words INTEGER NOT NULL DEFAULT 0,
        current_lesson INTEGER,
        created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )`
    ).run();
    const trainingSessionColumns = db.prepare("PRAGMA table_info(training_sessions)").all() as Array<{ name: string }>;
    if (!trainingSessionColumns.some((column) => column.name === "attempted_words")) {
      db.prepare("ALTER TABLE training_sessions ADD COLUMN attempted_words INTEGER NOT NULL DEFAULT 0").run();
    }
    if (!trainingSessionColumns.some((column) => column.name === "correct_words")) {
      db.prepare("ALTER TABLE training_sessions ADD COLUMN correct_words INTEGER NOT NULL DEFAULT 0").run();
    }
    db.prepare("CREATE INDEX IF NOT EXISTS idx_training_sessions_user_id_ended_at ON training_sessions(user_id, ended_at)").run();
    const columns = db.prepare("PRAGMA table_info(sessions)").all() as Array<{ name: string }>;
    const hasIssuedAt = columns.some((column) => column.name === "issued_at");
    if (!hasIssuedAt) {
      db.prepare("ALTER TABLE sessions ADD COLUMN issued_at INTEGER").run();
    }
    db.prepare("CREATE INDEX IF NOT EXISTS idx_sessions_token_hash ON sessions(token_hash)").run();
    global.__authDatabase = db;
  }

  return global.__authDatabase;
}

function hashPassword(password: string, salt: string) {
  const derived = scryptSync(password, salt, 64);
  return Buffer.from(derived).toString("hex");
}

function createSalt() {
  return randomBytes(16).toString("hex");
}

function normalizeUsername(username: string) {
  return username.trim();
}

function normalizeRole(role: string | undefined): UserRole {
  return role === "admin" ? "admin" : "user";
}

/**
 * Reads the public registration invite code exclusively from the server-side
 * environment variable REGISTRATION_INVITE_CODE. Never expose this value to
 * the client, log it, or persist it anywhere (including SQLite).
 */
function getRegistrationInviteCode(): string | null {
  const code = process.env.REGISTRATION_INVITE_CODE;
  return typeof code === "string" && code.length > 0 ? code : null;
}

/**
 * Public (unauthenticated) registration is only available when a non-empty
 * REGISTRATION_INVITE_CODE is configured on the server.
 */
export function isPublicRegistrationEnabled(): boolean {
  return getRegistrationInviteCode() !== null;
}

/**
 * Compares a candidate invite code against REGISTRATION_INVITE_CODE using a
 * constant-time comparison. Both values are hashed to a fixed-length digest
 * first so that timingSafeEqual never fails due to differing input lengths.
 */
export function verifyInviteCode(candidate: string): boolean {
  const expected = getRegistrationInviteCode();
  if (!expected || typeof candidate !== "string" || candidate.length === 0) {
    return false;
  }
  const expectedHash = createHash("sha256").update(expected).digest();
  const candidateHash = createHash("sha256").update(candidate).digest();
  return timingSafeEqual(expectedHash, candidateHash);
}

function validateUsernameAndPassword(username: string, password: string) {
  const normalizedUsername = normalizeUsername(username);
  if (!normalizedUsername) {
    return "Benutzername ist erforderlich.";
  }
  if (normalizedUsername.length > 64) {
    return "Benutzername darf maximal 64 Zeichen haben.";
  }
  if (password.length < 8) {
    return "Passwort muss mindestens 8 Zeichen lang sein.";
  }
  if (password.length > 128) {
    return "Passwort darf maximal 128 Zeichen haben.";
  }
  return null;
}

function validatePasswordOnly(password: string) {
  if (!password) {
    return "Passwort ist erforderlich.";
  }
  if (password.length < 8) {
    return "Passwort muss mindestens 8 Zeichen lang sein.";
  }
  if (password.length > 128) {
    return "Passwort darf maximal 128 Zeichen haben.";
  }
  return null;
}

function verifyPassword(password: string, passwordHash: string, passwordSalt: string) {
  const computed = hashPassword(password, passwordSalt);
  const computedBuffer = Buffer.from(computed, "hex");
  const storedBuffer = Buffer.from(passwordHash, "hex");
  if (computedBuffer.length !== storedBuffer.length) {
    return false;
  }
  return timingSafeEqual(computedBuffer, storedBuffer);
}

function hashSessionToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

function sanitizeKeyboardLesson(lesson: number) {
  const maxLesson = ELITE_LESSON_ID;
  if (!Number.isFinite(lesson)) {
    return 1;
  }
  return Math.min(Math.max(Math.floor(lesson), 1), maxLesson);
}

export function registerUser(username: string, password: string, role: string | undefined = "user") {
  const error = validateUsernameAndPassword(username, password);
  if (error) {
    return { ok: false as const, message: error };
  }

  const normalizedUsername = normalizeUsername(username);
  const normalizedRole = normalizeRole(role);
  const db = getDb();
  const existing = db
    .prepare("SELECT id FROM users WHERE username = ?")
    .get(normalizedUsername) as { id: number } | undefined;

  if (existing) {
    return { ok: false as const, message: "Dieser Benutzername ist bereits vergeben." };
  }

  const salt = createSalt();
  const hash = hashPassword(password, salt);
  db.prepare(
    "INSERT INTO users (username, password_hash, password_salt, role) VALUES (?, ?, ?, ?)"
  ).run(normalizedUsername, hash, salt, normalizedRole);
  return { ok: true as const, message: "Registrierung erfolgreich." };
}

export function listUsersForAdmin(): AdminUserListRow[] {
  const db = getDb();
  return db
    .prepare("SELECT id, username, role FROM users ORDER BY username COLLATE NOCASE ASC")
    .all() as AdminUserListRow[];
}

export function getKeyboardProgressForUser(userId: number) {
  const db = getDb();
  db.prepare("INSERT OR IGNORE INTO user_learning_progress (user_id) VALUES (?)").run(userId);
  const row = db
    .prepare(
      `SELECT user_id AS userId,
              current_keyboard_lesson AS currentKeyboardLesson,
              last_completed_session_expires_at AS lastCompletedSessionExpiresAt
       FROM user_learning_progress
       WHERE user_id = ?`
    )
    .get(userId) as UserLearningProgressRow | undefined;

  const lessonId = sanitizeKeyboardLesson(row?.currentKeyboardLesson ?? 1);
  if (!row || row.currentKeyboardLesson !== lessonId) {
    db.prepare(
      `UPDATE user_learning_progress
       SET current_keyboard_lesson = ?, updated_at = CURRENT_TIMESTAMP
       WHERE user_id = ?`
    ).run(lessonId, userId);
  }
  const lesson = getKeyboardLessonById(lessonId);
  return {
    currentKeyboardLesson: lesson.id,
    lessonTitle: lesson.title,
    learningLevel: getLearningLevelForLesson(lesson.id),
    learningLevelLabel: learningLevelLabels[getLearningLevelForLesson(lesson.id)],
    eliteUnlocked: lesson.id === ELITE_LESSON_ID,
  };
}

export function completeKeyboardPhaseForSession(userId: number, sessionExpiresAt: number) {
  const db = getDb();
  const maxLesson = ELITE_LESSON_ID;
  const tx = db.transaction((dbUserId: number, dbSessionExpiresAt: number) => {
    db.prepare("INSERT OR IGNORE INTO user_learning_progress (user_id) VALUES (?)").run(dbUserId);
    const current = db
      .prepare(
        `SELECT current_keyboard_lesson AS currentKeyboardLesson,
                last_completed_session_expires_at AS lastCompletedSessionExpiresAt
         FROM user_learning_progress
         WHERE user_id = ?`
      )
      .get(dbUserId) as UserLearningProgressRow;

    const currentLesson = sanitizeKeyboardLesson(current.currentKeyboardLesson);
    if (current.lastCompletedSessionExpiresAt === dbSessionExpiresAt) {
      return { lessonId: currentLesson, advanced: false };
    }

    const nextLesson = Math.min(currentLesson + 1, maxLesson);
    db.prepare(
      `UPDATE user_learning_progress
       SET current_keyboard_lesson = ?,
           last_completed_session_expires_at = ?,
           updated_at = CURRENT_TIMESTAMP
       WHERE user_id = ?`
    ).run(nextLesson, dbSessionExpiresAt, dbUserId);

    return { lessonId: nextLesson, advanced: nextLesson !== currentLesson };
  });

  const result = tx(userId, sessionExpiresAt);
  const lesson = getKeyboardLessonById(result.lessonId);
  return {
    ok: true as const,
    advanced: result.advanced,
    currentKeyboardLesson: lesson.id,
    lessonTitle: lesson.title,
  };
}

export function deleteUserByAdmin(
  currentAdminUserId: number,
  targetUserId: number
): { ok: true; username: string } | { ok: false; message: string } {
  const db = getDb();
  const targetUser = db
    .prepare("SELECT id, username, role FROM users WHERE id = ?")
    .get(targetUserId) as AdminUserListRow | undefined;

  if (!targetUser) {
    return { ok: false, message: "Benutzer wurde nicht gefunden." };
  }
  if (targetUser.id === currentAdminUserId) {
    return { ok: false, message: "Das eigene Benutzerkonto kann nicht gelöscht werden." };
  }
  if (targetUser.role === "admin") {
    const adminCount = db
      .prepare("SELECT COUNT(*) AS count FROM users WHERE role = 'admin'")
      .get() as { count: number };
    if (adminCount.count <= 1) {
      return { ok: false, message: "Der letzte Admin kann nicht gelöscht werden." };
    }
  }

  const tx = db.transaction((userId: number) => {
    db.prepare("DELETE FROM sessions WHERE user_id = ?").run(userId);
    db.prepare("DELETE FROM users WHERE id = ?").run(userId);
  });
  tx(targetUser.id);

  return { ok: true, username: targetUser.username };
}

export function listMedicalTermsForAdmin(): MedicalTermRow[] {
  const db = getDb();
  return db
    .prepare("SELECT id, term, difficulty FROM medical_terms ORDER BY term COLLATE NOCASE ASC")
    .all() as MedicalTermRow[];
}

/**
 * Selects a batch of medical terms for a training session, weighted by the
 * user's current keyboard lesson (used as the existing numeric learning
 * stage - no separate progress tracking is introduced). Early lessons only
 * unlock easy terms; later lessons extend the vocabulary with medium and
 * hard terms without dropping the easy ones. Never returns an empty result
 * as long as at least one medical term exists.
 */
export function selectMedicalTermsForUserTraining(userId: number, count = 40): string[] {
  const rows = listMedicalTermsForAdmin();
  const pool =
    rows.length > 0
      ? rows.map((row) => ({ term: row.term, difficulty: row.difficulty }))
      : defaultMedicalTerms.map((term) => ({
          term,
          difficulty: calculateMedicalTermDifficulty(term),
        }));

  const progress = getKeyboardProgressForUser(userId);
  const stage = getLearningStageFromKeyboardLesson(progress.currentKeyboardLesson);
  return selectWeightedMedicalTerms(pool, stage, count);
}

export function addMedicalTermByAdmin(
  term: string,
  difficulty?: unknown
): { ok: true; term: string } | { ok: false; message: string } {
  const normalizedTerm = term.trim();
  if (!normalizedTerm) {
    return { ok: false, message: "Fachbegriff darf nicht leer sein." };
  }
  if (normalizedTerm.length > 120) {
    return { ok: false, message: "Fachbegriff darf maximal 120 Zeichen haben." };
  }

  let normalizedDifficulty: MedicalTermDifficulty;
  if (difficulty === undefined) {
    normalizedDifficulty = calculateMedicalTermDifficulty(normalizedTerm);
  } else if (isValidMedicalTermDifficulty(difficulty)) {
    normalizedDifficulty = difficulty;
  } else {
    return {
      ok: false,
      message: "Ungültiger Schwierigkeitsgrad. Erlaubt sind nur 1 (Leicht), 2 (Mittel) oder 3 (Schwer).",
    };
  }

  const db = getDb();
  const existing = db
    .prepare("SELECT id FROM medical_terms WHERE lower(term) = lower(?)")
    .get(normalizedTerm) as { id: number } | undefined;
  if (existing) {
    return { ok: false, message: "Fachbegriff existiert bereits." };
  }

  db.prepare("INSERT INTO medical_terms (term, difficulty) VALUES (?, ?)").run(
    normalizedTerm,
    normalizedDifficulty
  );
  return { ok: true, term: normalizedTerm };
}

export function updateMedicalTermDifficultyByAdmin(
  id: number,
  difficulty: unknown
): { ok: true; term: string; difficulty: MedicalTermDifficulty } | { ok: false; message: string } {
  if (!isValidMedicalTermDifficulty(difficulty)) {
    return {
      ok: false,
      message: "Ungültiger Schwierigkeitsgrad. Erlaubt sind nur 1 (Leicht), 2 (Mittel) oder 3 (Schwer).",
    };
  }

  const db = getDb();
  const row = db.prepare("SELECT term FROM medical_terms WHERE id = ?").get(id) as
    | { term: string }
    | undefined;
  if (!row) {
    return { ok: false, message: "Fachbegriff wurde nicht gefunden." };
  }

  db.prepare("UPDATE medical_terms SET difficulty = ? WHERE id = ?").run(difficulty, id);
  return { ok: true, term: row.term, difficulty };
}

export function deleteMedicalTermByAdmin(
  id: number
): { ok: true; term: string } | { ok: false; message: string } {
  const db = getDb();
  const row = db.prepare("SELECT term FROM medical_terms WHERE id = ?").get(id) as
    | { term: string }
    | undefined;
  if (!row) {
    return { ok: false, message: "Fachbegriff wurde nicht gefunden." };
  }
  db.prepare("DELETE FROM medical_terms WHERE id = ?").run(id);
  return { ok: true, term: row.term };
}

export function loginUser(username: string, password: string) {
  const normalizedUsername = normalizeUsername(username);
  if (!normalizedUsername || !password) {
    return { ok: false as const, message: "Benutzername und Passwort sind erforderlich." };
  }

  const db = getDb();
  const user = db
    .prepare("SELECT id, username, password_hash, password_salt, role FROM users WHERE username = ?")
    .get(normalizedUsername) as UserRow | undefined;

  if (!user || !verifyPassword(password, user.password_hash, user.password_salt)) {
    return { ok: false as const, message: "Ungültiger Benutzername oder Passwort." };
  }

  return { ok: true as const, message: `Willkommen, ${user.username}!`, userId: user.id };
}

export function createSession(userId: number) {
  const token = randomBytes(32).toString("base64url");
  const tokenHash = hashSessionToken(token);
  const issuedAt = Date.now();
  const expiresAt = issuedAt + SESSION_TTL_MS;
  const db = getDb();
  db.prepare(
    "INSERT INTO sessions (user_id, token_hash, issued_at, expires_at) VALUES (?, ?, ?, ?)"
  ).run(userId, tokenHash, issuedAt, expiresAt);
  return token;
}

export function getSessionUser(sessionToken: string): SessionUser | null {
  if (!sessionToken) {
    return null;
  }

  const tokenHash = hashSessionToken(sessionToken);
  const db = getDb();
  const row = db
    .prepare(
      `SELECT users.id AS userId, users.username, sessions.id AS sessionId,
              users.role, sessions.expires_at AS expiresAt, sessions.issued_at AS issuedAt
       FROM sessions
       INNER JOIN users ON users.id = sessions.user_id
       WHERE sessions.token_hash = ?`
    )
    .get(tokenHash) as (SessionRecord & { userId: number; username: string; role: UserRole }) | undefined;

  if (!row) {
    return null;
  }

  if (!isSessionRecordValid(row)) {
    db.prepare("DELETE FROM sessions WHERE id = ?").run(row.sessionId);
    return null;
  }

  return { id: row.userId, username: row.username, role: row.role, expiresAt: row.expiresAt };
}

/**
 * Save a completed training session
 */
export function saveTrainingSession(
  userId: number,
  startedAt: number,
  endedAt: number,
  activeLearningTimeMs: number,
  wpm: number,
  accuracy: number,
  errors: number,
  attemptedWords: number,
  correctWords: number,
  currentLesson?: number
): void {
  const db = getDb();
  db.prepare(
    `INSERT INTO training_sessions
     (user_id, started_at, ended_at, active_learning_time_ms, wpm, accuracy, errors,
      attempted_words, correct_words, current_lesson)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).run(
    userId, startedAt, endedAt, activeLearningTimeMs, wpm, accuracy, errors,
    attemptedWords, correctWords, currentLesson ?? null
  );
}

/**
 * Get 7-day training statistics for a user
 */
export function getTrainingStatistics(userId: number): {
  totalLearningTimeMs: number;
  averageWpm: number;
  totalErrors: number;
  sessionCount: number;
  dailyStats: Array<{ date: string; learningTimeMs: number }>;
  weeklyStats: Array<{
    weekStart: string;
    averageWpm: number;
    correctWords: number;
    attemptedWords: number;
    correctWordRate: number;
  }>;
} {
  const db = getDb();
  const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;

  const stats = db
    .prepare(
      `SELECT 
        SUM(active_learning_time_ms) as totalLearningTimeMs,
        AVG(wpm) as averageWpm,
        SUM(errors) as totalErrors,
        COUNT(*) as sessionCount
      FROM training_sessions
      WHERE user_id = ? AND ended_at > ?`
    )
    .get(userId, sevenDaysAgo) as {
    totalLearningTimeMs: number | null;
    averageWpm: number | null;
    totalErrors: number | null;
    sessionCount: number;
  };

  const dailyStats = db
    .prepare(
      // 'localtime' makes SQLite apply the server's TZ offset (set via TZ=Europe/Berlin env var).
      // This ensures training sessions are grouped by the local calendar date, not UTC.
      `SELECT 
        DATE(ended_at / 1000, 'unixepoch', 'localtime') as date,
        SUM(active_learning_time_ms) as learningTimeMs
      FROM training_sessions
      WHERE user_id = ? AND ended_at > ?
      GROUP BY DATE(ended_at / 1000, 'unixepoch', 'localtime')
      ORDER BY date ASC`
    )
    .all(userId, sevenDaysAgo) as Array<{ date: string; learningTimeMs: number }>;

  const twelveWeeksAgo = Date.now() - 12 * 7 * 24 * 60 * 60 * 1000;
  const weeklyRows = db.prepare(
    `SELECT
       DATE(ended_at / 1000, 'unixepoch', 'localtime', 'weekday 0', '-6 days') AS weekStart,
       CASE WHEN SUM(active_learning_time_ms) > 0
         THEN SUM(wpm * active_learning_time_ms) * 1.0 / SUM(active_learning_time_ms)
         ELSE AVG(wpm) END AS averageWpm,
       SUM(correct_words) AS correctWords,
       SUM(attempted_words) AS attemptedWords
     FROM training_sessions
     WHERE user_id = ? AND ended_at > ?
     GROUP BY weekStart
     ORDER BY weekStart ASC`
  ).all(userId, twelveWeeksAgo) as Array<{
    weekStart: string;
    averageWpm: number | null;
    correctWords: number | null;
    attemptedWords: number | null;
  }>;

  const weeklyStats = weeklyRows.map((row) => {
    const attemptedWords = row.attemptedWords ?? 0;
    const correctWords = row.correctWords ?? 0;
    return {
      weekStart: row.weekStart,
      averageWpm: Math.round(row.averageWpm ?? 0),
      correctWords,
      attemptedWords,
      correctWordRate: attemptedWords > 0 ? Math.round((correctWords / attemptedWords) * 1000) / 10 : 0,
    };
  });

  return {
    totalLearningTimeMs: stats.totalLearningTimeMs ?? 0,
    averageWpm: Math.round(stats.averageWpm ?? 0),
    totalErrors: stats.totalErrors ?? 0,
    sessionCount: stats.sessionCount,
    dailyStats: dailyStats || [],
    weeklyStats,
  };
}

export function deleteSession(sessionToken: string): void {
  if (!sessionToken) return;
  const tokenHash = hashSessionToken(sessionToken);
  const db = getDb();
  db.prepare("DELETE FROM sessions WHERE token_hash = ?").run(tokenHash);
}

function isSessionRecordValid(session: SessionRecord) {
  const now = Date.now();
  if (session.issuedAt === null) {
    return false;
  }
  return session.expiresAt > now;
}

export function changePasswordByUserId(
  userId: number,
  currentPassword: string,
  newPassword: string
) {
  if (!currentPassword || !newPassword) {
    return { ok: false as const, message: "Alle Felder sind erforderlich." };
  }

  const passwordError = validatePasswordOnly(newPassword);
  if (passwordError) {
    return { ok: false as const, message: passwordError };
  }

  const db = getDb();
  const user = db
    .prepare("SELECT id, username, password_hash, password_salt, role FROM users WHERE id = ?")
    .get(userId) as UserRow | undefined;

  if (!user || !verifyPassword(currentPassword, user.password_hash, user.password_salt)) {
    return { ok: false as const, message: "Aktuelles Passwort ist nicht korrekt." };
  }

  const salt = createSalt();
  const hash = hashPassword(newPassword, salt);
  db.prepare("UPDATE users SET password_hash = ?, password_salt = ? WHERE id = ?").run(
    hash,
    salt,
    user.id
  );
  db.prepare("DELETE FROM sessions WHERE user_id = ?").run(user.id);

  return { ok: true as const, message: "Passwort erfolgreich geändert." };
}

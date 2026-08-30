"use client";

import { useEffect, useState } from "react";
import { TRAINING_SESSION_TTL_MS } from "@/config/auth";
import { getTrainingSessionRemainingMs } from "@/utils/trainingSession";

interface SessionTimerProps {
  expiresAt: number;
  isPaused?: boolean;
  onRemainingChange?: (remainingMs: number) => void;
}

function formatTime(ms: number): string {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

export function SessionTimer({ expiresAt, isPaused, onRemainingChange }: SessionTimerProps) {
  const [remaining, setRemaining] = useState(() => {
    const remainingMs = getTrainingSessionRemainingMs();
    return remainingMs > 0
      ? remainingMs
      : Math.min(Math.max(new Date(expiresAt).getTime() - Date.now(), 0), TRAINING_SESSION_TTL_MS);
  });

  useEffect(() => {
    const tick = () => {
      // Always read remaining from the session store so pause is respected
      const ms = getTrainingSessionRemainingMs();
      setRemaining(ms);
      onRemainingChange?.(ms);
      // Training expiry is handled by AppContent — no logout here.
    };

    tick();
    // Keep ticking even when paused so we can emit 0 and AppContent can react
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [expiresAt, isPaused, onRemainingChange]);

  const isExpired = remaining <= 0;

  return (
    <span
      className={`font-mono text-sm tabular-nums px-2 py-1 rounded ${
        isExpired
          ? "text-red-600 dark:text-red-400"
          : remaining < 60_000
            ? "text-orange-500 dark:text-orange-400"
            : "text-gray-700 dark:text-gray-300"
      }`}
    >
      ⏱ {formatTime(remaining)}
    </span>
  );
}

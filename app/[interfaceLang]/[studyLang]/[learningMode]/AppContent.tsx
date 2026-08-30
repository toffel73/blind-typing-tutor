"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Game } from "@/components/Game";
import { translations } from "@/translations";
import { useAppSettings } from "@/hooks/useAppSettings";
import { useIsMobile } from "@/hooks/useIsMobile";
import { Header } from "@/components/layout/Header";
import { MobileMessage } from "@/components/layout/MobileMessage";
import type { UserRole } from "@/types/auth";
import { initGA, trackPageView } from "@/utils/analytics";
import {
  getSessionTrainingPhaseMeta,
} from "@/utils/sessionTraining";
import {
  getTrainingSessionData,
  getTrainingSessionRemainingMs,
  pauseTrainingSession,
  resumeTrainingSession,
  clearTrainingSession,
} from "@/utils/trainingSession";

interface AppContentProps {
  params: {
    interfaceLang: string;
    studyLang: string;
    learningMode: string;
  };
}

interface SessionData {
  authenticated: boolean;
  user?: {
    id: number;
    username: string;
    role: UserRole;
  };
  expiresAt?: number;
}

export function AppContent({ params }: AppContentProps) {
  const router = useRouter();
  const settings = useAppSettings(params);
  const t = translations[settings.interfaceLanguage];
  const [trainingExpiresAt, setTrainingExpiresAt] = useState<number | null>(null);
  const [sessionRemainingMs, setSessionRemainingMs] = useState<number | null>(null);
  const [sessionUsername, setSessionUsername] = useState<string | null>(null);
  const [sessionChecked, setSessionChecked] = useState(false);
  const [isTrainingPaused, setIsTrainingPaused] = useState(false);
  const [showEndDialog, setShowEndDialog] = useState(false);

  // Initialize GA
  useEffect(() => {
    initGA();
  }, []);

  // Track page view on language or mode change
  useEffect(() => {
    trackPageView(window.location.pathname, `${t.title} - ${settings.mode}`);
  }, [settings.interfaceLanguage, settings.mode, t.title]);

  // Check session and training session on mount
  useEffect(() => {
    void fetch("/api/auth/session", { cache: "no-store" })
      .then((res) => res.json() as Promise<SessionData>)
      .then((data) => {
        if (!data.authenticated || typeof data.expiresAt !== "number") {
          router.replace("/login");
          return;
        }

        // Auth session is valid
        setSessionUsername(typeof data.user?.username === "string" ? data.user.username : null);

        // Check for active training session (including paused)
        const trainingSessionData = getTrainingSessionData();
        if ((trainingSessionData.status === "active" || trainingSessionData.status === "paused") && trainingSessionData.expiresAt) {
          setTrainingExpiresAt(trainingSessionData.expiresAt);
          setSessionRemainingMs(getTrainingSessionRemainingMs());
          // Restore paused state on reload
          setIsTrainingPaused(trainingSessionData.status === "paused");
          setSessionChecked(true);
        } else {
          // No active training session - redirect to dashboard
          router.replace(`/${params.interfaceLang}/dashboard`);
        }
      })
      .catch(() => {
        router.replace("/login");
      });
  }, [router, params.interfaceLang]);

  // Handle pause/resume toggle
  const handleTogglePause = () => {
    if (isTrainingPaused) {
      const resumed = resumeTrainingSession();
      if (resumed.expiresAt) {
        setTrainingExpiresAt(resumed.expiresAt);
      }
      setIsTrainingPaused(false);
    } else {
      pauseTrainingSession();
      setIsTrainingPaused(true);
    }
  };

  // Handle end training with confirmation
  const handleEndTraining = () => {
    setShowEndDialog(true);
  };

  const confirmEndTraining = () => {
    clearTrainingSession();
    router.replace(`/${params.interfaceLang}/dashboard`);
  };

  const sessionPhaseMeta =
    sessionRemainingMs != null ? getSessionTrainingPhaseMeta(sessionRemainingMs) : null;
  const phaseCompletionSessionRef = useRef<number | null>(null);

  // Handle phase 1 to phase 2 transition
  useEffect(() => {
    if (!trainingExpiresAt || !sessionPhaseMeta) {
      return;
    }
    if (sessionPhaseMeta.phase === "phase1") {
      return;
    }
    if (phaseCompletionSessionRef.current === trainingExpiresAt) {
      return;
    }

    phaseCompletionSessionRef.current = trainingExpiresAt;
    void fetch("/api/training/progress/complete-keyboard-phase", {
      method: "POST",
      cache: "no-store",
    }).catch(() => undefined);
  }, [trainingExpiresAt, sessionPhaseMeta]);

  // Monitor training session expiry and redirect to dashboard when it expires
  useEffect(() => {
    if (!trainingExpiresAt) {
      return;
    }

    const checkExpiry = () => {
      const now = Date.now();
      if (now >= trainingExpiresAt) {
        // Training session has expired, clear it and redirect to dashboard
        if (typeof window !== "undefined") {
          window.localStorage.removeItem("training_session");
        }
        router.replace(`/${params.interfaceLang}/dashboard`);
      }
    };

    const interval = setInterval(checkExpiry, 1000);
    return () => clearInterval(interval);
  }, [trainingExpiresAt, router, params.interfaceLang]);

  // Mobile detection
  const isMobile = useIsMobile();

  // Don't render until session is verified to prevent flash of trainer for expired sessions
  if (!sessionChecked) {
    return null;
  }

  if (isMobile) {
    return (
      <MobileMessage
        title={t.title}
        desktopRequired={t.mobileDesktopRequired}
        description={t.mobileDescription}
        footer={t.mobileFooter}
        darkMode={settings.darkMode}
      />
    );
  }

  return (
    <div
      className={`min-h-screen flex flex-col transition-colors duration-300 ${settings.darkMode ? "dark:bg-gray-900" : "bg-gray-50"
        }`}
      suppressHydrationWarning
    >
      <Header
        title={t.title}
        lightMode={t.lightMode}
        darkMode={t.darkMode}
        interfaceLanguage={settings.interfaceLanguage}
        isDarkMode={settings.darkMode}
        setDarkMode={settings.setDarkMode}
        studyLang={params.studyLang}
        learningMode={params.learningMode as "words" | "phrases" | "custom"}
        sessionExpiresAt={trainingExpiresAt}
        onSessionRemainingChange={setSessionRemainingMs}
        sessionUsername={sessionUsername}
        onBackToDashboard={() => {
          if (typeof window !== "undefined") {
            window.localStorage.removeItem("training_session");
          }
          router.replace(`/${params.interfaceLang}/dashboard`);
        }}
        isTrainingPaused={isTrainingPaused}
        onTogglePause={handleTogglePause}
        onEndTraining={handleEndTraining}
      />

      <main className="grow pt-20">
        <Game
          mode={settings.mode}
          setMode={settings.setMode}
          layoutId={settings.layoutId}
          learningLanguage={settings.learningLanguage}
          language={settings.learningLanguage}
          showKeyboard={settings.showKeyboard}
          showHands={settings.showHands}
          showColors={settings.showColors}
          correctionMode={settings.correctionMode}
          soundEnabled={settings.soundEnabled}
          onToggleKeyboard={() => settings.setShowKeyboard((v) => !v)}
          onToggleHands={() => settings.setShowHands((v) => !v)}
          onToggleColors={() => settings.setShowColors((v) => !v)}
          onToggleCorrection={() => settings.setCorrectionMode((v) => !v)}
          onToggleSound={() => settings.setSoundEnabled((v) => !v)}
          translations={t}
          sessionTrainingPhase={sessionPhaseMeta?.phase}
          sessionTrainingPhaseLabel={sessionPhaseMeta?.display}
          isTrainingPaused={isTrainingPaused}
        />
      </main>

      {/* End Training Confirmation Dialog */}
      {showEndDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60]">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 max-w-sm">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Training beenden?
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Möchtest du diese Trainingseinheit wirklich beenden?
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowEndDialog(false)}
                className="px-4 py-2 rounded-lg bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
              >
                Weiter trainieren
              </button>
              <button
                onClick={confirmEndTraining}
                className="px-4 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700 transition-colors"
              >
                Training beenden
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Pause Indicator */}
      {isTrainingPaused && (
        <div className="fixed inset-0 flex items-center justify-center pointer-events-none z-40">
          <div className="bg-gray-900/80 dark:bg-gray-900/90 text-white px-8 py-4 rounded-lg text-center">
            <p className="text-2xl font-bold">Training pausiert</p>
          </div>
        </div>
      )}
    </div>
  );
}

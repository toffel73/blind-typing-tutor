"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { UserRole } from "@/types/auth";
import { Users, BookOpen } from "lucide-react";
import { startTrainingSession } from "@/utils/trainingSession";
import { TRAINING_DURATION_MINUTES } from "@/config/auth";
import { Logo } from "@/components/layout/Logo";
import { ProgressCharts, type WeeklyTrainingStat } from "@/components/dashboard/ProgressCharts";
import type { LearningLevel } from "@/data/keyboardTraining";

interface SessionData {
  authenticated: boolean;
  user?: {
    id: number;
    username: string;
    role: UserRole;
  };
  expiresAt?: number;
}

interface ProgressData {
  currentKeyboardLesson: number;
  lessonTitle: string;
  totalLessons: number;
  nextLessonId: number | null;
  nextLessonTitle: string | null;
  learningLevel: LearningLevel;
  learningLevelLabel: string;
  eliteUnlocked: boolean;
}

interface StatisticsData {
  ok: boolean;
  totalLearningTimeMs: number;
  averageWpm: number;
  totalErrors: number;
  sessionCount: number;
  dailyStats: Array<{ date: string; learningTimeMs: number }>;
  weeklyStats: WeeklyTrainingStat[];
}

const TOTAL_LESSONS = 45;
const LEVELS: Array<{ id: LearningLevel; label: string; range: string }> = [
  { id: "beginner", label: "Beginner", range: "Lektionen 1–15" },
  { id: "advanced", label: "Advanced", range: "Lektionen 16–30" },
  { id: "professional", label: "Professional", range: "Lektionen 31–45" },
  { id: "elite", label: "Elite", range: "Fortlaufendes Training" },
];

interface PageProps {
  params: Promise<{
    interfaceLang: string;
  }>;
}

export default function DashboardPage({ params }: PageProps) {
  const router = useRouter();
  const [sessionData, setSessionData] = useState<SessionData | null>(null);
  const [progressData, setProgressData] = useState<ProgressData | null>(null);
  const [statisticsData, setStatisticsData] = useState<StatisticsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Unwrap params on mount
  const [interfaceLang, setInterfaceLang] = useState<string | null>(null);

  useEffect(() => {
    void params.then((p) => setInterfaceLang(p.interfaceLang));
  }, [params]);

  // Check session
  useEffect(() => {
    const checkSession = async () => {
      // Clear any stale training sessions
      if (typeof window !== "undefined") {
        window.localStorage.removeItem("training_session");
      }

      try {
        const response = await fetch("/api/auth/session", { cache: "no-store" });
        const data = (await response.json()) as SessionData;

        if (!data.authenticated) {
          router.replace("/login");
          return;
        }

        setSessionData(data);

        // Fetch progress and statistics
        try {
          const progressResponse = await fetch("/api/training/progress", { cache: "no-store" });
          const progressJson = (await progressResponse.json()) as ProgressData;
          setProgressData(progressJson);
        } catch {
          // Silently fail - progress not critical
        }

        try {
          const statsResponse = await fetch("/api/training/statistics", { cache: "no-store" });
          const statsJson = (await statsResponse.json()) as StatisticsData;
          setStatisticsData(statsJson);
        } catch {
          // Silently fail - statistics not critical
        }

        setIsLoading(false);
      } catch {
        setError("Fehler beim Abrufen der Session.");
        setIsLoading(false);
      }
    };

    void checkSession();
  }, [router]);

  const handleStartTraining = () => {
    if (interfaceLang && sessionData?.user) {
      startTrainingSession();
      router.push(`/${interfaceLang}/${interfaceLang}/words`);
    }
  };

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } finally {
      router.replace("/login");
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 dark:border-indigo-400 mx-auto mb-4"></div>
          <p className="text-gray-700 dark:text-gray-300">Lädt...</p>
        </div>
      </div>
    );
  }

  if (error || !sessionData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <p className="text-red-600 dark:text-red-400 mb-4">{error || "Session konnte nicht geladen werden."}</p>
          <button
            onClick={() => router.push("/login")}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
          >
            Zurück zum Login
          </button>
        </div>
      </div>
    );
  }

  const totalLessons = progressData?.totalLessons ?? TOTAL_LESSONS;
  const isElite = progressData?.eliteUnlocked ?? false;
  const completedLessons = progressData ? Math.min(progressData.currentKeyboardLesson - 1, totalLessons) : 0;
  const remainingLessons = progressData ? Math.max(0, totalLessons - completedLessons) : 0;
  const progressPercent = progressData ? Math.round((completedLessons / totalLessons) * 100) : 0;

  return (
    <div className="min-h-screen bg-[var(--ock-app-bg)] dark:bg-gray-900 transition-colors duration-300">
      {/* Header */}
      <header className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-md shadow-sm px-6 py-4 transition-colors duration-300">
        <div className="max-w-4xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-3">
            <Logo height={28} />
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">
              OCK - Tastatutor
            </h1>
          </div>
          <div className="flex items-center gap-2">
            {sessionData.user?.role === "admin" && (
              <button
                onClick={() => router.push("/admin/users")}
                className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-900 dark:text-white transition-colors"
                title="Benutzerverwaltung"
                aria-label="Benutzerverwaltung"
              >
                <Users size={20} />
              </button>
            )}
            <button
              onClick={() => void handleLogout()}
              className="px-3 py-1.5 text-sm font-medium rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            >
              Abmelden
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-6 py-12">
        {/* Welcome Section */}
        <div className="mb-12">
          <h2 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
            Hallo, {sessionData.user?.username}! 👋
          </h2>
          <p className="text-lg text-gray-600 dark:text-gray-400">
            Willkommen zu deiner persönlichen Lernplattform für blindes Tastschreiben
          </p>
        </div>

        {/* Training Card */}
        <div className="ock-card p-8 mb-8">
          <div className="mb-6">
            <h3 className="text-2xl font-semibold text-gray-900 dark:text-white mb-2">
              {TRAINING_DURATION_MINUTES}-Minuten Training
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              Starten Sie eine {TRAINING_DURATION_MINUTES}-minütige Trainingseinheit mit drei Phasen:
            </p>
          </div>

          <ul className="space-y-3 mb-8 text-gray-700 dark:text-gray-300">
            <li className="flex items-start gap-3">
              <span className="text-indigo-600 dark:text-indigo-400 font-bold">1/3</span>
              <div>
                <div className="font-semibold">Tastaturtraining</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  Trainieren Sie die Tastaturpositionen ohne Blickkontakt
                </div>
              </div>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-indigo-600 dark:text-indigo-400 font-bold">2/3</span>
              <div>
                <div className="font-semibold">Worttraining</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  Trainieren Sie mit echten Wörtern, um Ihre Geschwindigkeit zu erhöhen
                </div>
              </div>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-indigo-600 dark:text-indigo-400 font-bold">3/3</span>
              <div>
                <div className="font-semibold">Medizinische Begriffe</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  Üben Sie Fachbegriffe für fortgeschrittenes Blindschreiben
                </div>
              </div>
            </li>
          </ul>

          <button
            onClick={handleStartTraining}
            className="w-full py-3 px-6 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 transition-colors duration-300"
          >
            Training starten →
          </button>
        </div>

        {/* Progress Card */}
        <div className="ock-card p-6 mb-8">
          <h3 className="text-xs font-bold tracking-widest uppercase text-gray-500 dark:text-gray-400 mb-4">
            Ihr Lernfortschritt
          </h3>
          {progressData ? (
            <div className="space-y-4">
              <div>
                <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">
                  Aktuelle Lektion
                </p>
                <div className="text-xl font-bold text-gray-900 dark:text-white">
                  {isElite ? "Elite-Training freigeschaltet" : `Lektion ${progressData.currentKeyboardLesson} von ${totalLessons}`}
                </div>
                <div className="text-base text-indigo-600 dark:text-indigo-400 font-medium">
                  {progressData.lessonTitle}
                </div>
                {progressData.nextLessonId != null && progressData.nextLessonTitle && (
                  <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Als Nächstes: Lektion {progressData.nextLessonId} · {progressData.nextLessonTitle}
                  </div>
                )}
              </div>
              <div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3 overflow-hidden">
                  <div
                    className="bg-indigo-600 dark:bg-indigo-400 h-3 rounded-full transition-all"
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                  {progressPercent} % des Tastaturkurses abgeschlossen
                </div>
              </div>
              <div className="flex gap-8 text-sm">
                <div>
                  <div className="font-semibold text-gray-900 dark:text-white">
                    {completedLessons} {completedLessons === 1 ? "Lektion" : "Lektionen"}
                  </div>
                  <div className="text-gray-500 dark:text-gray-400">Abgeschlossen</div>
                </div>
                {remainingLessons > 0 && (
                  <div>
                    <div className="font-semibold text-gray-900 dark:text-white">
                      {remainingLessons} {remainingLessons === 1 ? "Lektion" : "Lektionen"}
                    </div>
                    <div className="text-gray-500 dark:text-gray-400">Noch vor Ihnen</div>
                  </div>
                )}
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2 pt-3" aria-label="Lernstufen">
                {LEVELS.map((level) => {
                  const active = progressData.learningLevel === level.id;
                  const levelOrder = LEVELS.findIndex((item) => item.id === progressData.learningLevel);
                  const complete = LEVELS.findIndex((item) => item.id === level.id) < levelOrder;
                  return (
                    <div
                      key={level.id}
                      className={`rounded-xl border p-3 ${active ? "border-violet-500 bg-violet-50 dark:bg-violet-950/30" : complete ? "border-green-300 bg-green-50 dark:bg-green-950/20" : "border-gray-200 dark:border-gray-700"}`}
                    >
                      <div className="text-xs text-gray-500">{complete ? "✓ Abgeschlossen" : active ? "Aktuelle Stufe" : "Als Nächstes"}</div>
                      <div className="font-semibold text-gray-900 dark:text-white">{level.label}</div>
                      <div className="text-xs text-gray-500">{level.range}</div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <p className="text-gray-600 dark:text-gray-400">
              Ihr Lernfortschritt wird automatisch gespeichert und trägt zum Keyboard-Training bei.
            </p>
          )}
        </div>

        {/* Statistics Cards */}
        {statisticsData && statisticsData.ok && (
          <div className="ock-card p-6 mb-8">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              📈 Letzte 7 Tage
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <div className="text-3xl font-bold text-indigo-600 dark:text-indigo-400">
                  {Math.round(statisticsData.totalLearningTimeMs / 60000)}
                </div>
                <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                  Lernzeit (Min.)
                </div>
              </div>
              <div>
                <div className="text-3xl font-bold text-green-600 dark:text-green-400">
                  {statisticsData.averageWpm}
                </div>
                <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                  Ø Geschwindigkeit (WPM)
                </div>
              </div>
              <div>
                <div className="text-3xl font-bold text-red-600 dark:text-red-400">
                  {statisticsData.totalErrors}
                </div>
                <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                  Fehler
                </div>
              </div>
              <div>
                <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                  {statisticsData.sessionCount}
                </div>
                <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                  Trainingseinheiten
                </div>
              </div>
            </div>

            {/* Daily Activity Chart */}
            {statisticsData.dailyStats && statisticsData.dailyStats.length > 0 && (
              <div className="mt-6">
                <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">
                  Tägliche Aktivität
                </h4>
                <div className="space-y-2">
                  {(() => {
                    const today = new Date();
                    const days = [];
                    for (let i = 6; i >= 0; i--) {
                      const date = new Date(today);
                      date.setDate(date.getDate() - i);
                      days.push(date);
                    }

                    // getDay() returns 0=Sun, 1=Mon … 6=Sat — array indexed accordingly
                    const dayNames = ["So", "Mo", "Di", "Mi", "Do", "Fr", "Sa"];
                    const statsMap = new Map(
                      statisticsData.dailyStats.map((s) => [s.date, s.learningTimeMs])
                    );

                    return days.map((date, index) => {
                      // Use local calendar date (not UTC) so Europe/Berlin midnight is correct
                      const year = date.getFullYear();
                      const month = String(date.getMonth() + 1).padStart(2, "0");
                      const day = String(date.getDate()).padStart(2, "0");
                      const dateStr = `${year}-${month}-${day}`;
                      const mins = Math.round((statsMap.get(dateStr) ?? 0) / 60000);
                      const dayName = dayNames[date.getDay()];

                      return (
                        <div key={index} className="flex items-center gap-2">
                          <div className="w-8 text-xs font-medium text-gray-600 dark:text-gray-400">
                            {dayName}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <div className="flex-1 bg-gray-300 dark:bg-gray-700 rounded h-2">
                                <div
                                  className="bg-indigo-600 dark:bg-indigo-400 h-2 rounded transition-all"
                                  style={{
                                    width: `${Math.min((mins / 10) * 100, 100)}%`,
                                  }}
                                ></div>
                              </div>
                              <div className="text-xs text-gray-600 dark:text-gray-400 w-12 text-right">
                                {mins} Min.
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    });
                  })()}
                </div>
              </div>
            )}
            <div className="mt-8 border-t border-gray-200 dark:border-gray-700 pt-6">
              <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">Deine Entwicklung</h4>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-5">Die letzten zwölf Lernwochen – nur für dich sichtbar.</p>
              <ProgressCharts weeks={statisticsData.weeklyStats ?? []} />
            </div>
          </div>
        )}

        <div className="ock-card p-6 mb-8">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
            👤 Benutzername
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            Deine persönliche Lernplattform für blindes Tastschreiben
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-500">
            Benutzername: <span className="font-mono font-semibold text-gray-700 dark:text-gray-300">{sessionData.user?.username}</span>
          </p>
        </div>

        {/* Admin Quick Access */}
        {sessionData.user?.role === "admin" && (
          <div className="mb-8">
            <h3 className="ock-section-heading mb-3">Administration</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <button
                onClick={() => router.push("/admin/users")}
                className="ock-card p-5 flex items-center gap-4 text-left hover:shadow-xl transition-shadow"
              >
                <span className="flex items-center justify-center w-10 h-10 rounded-full bg-[var(--ock-red-light)] text-[var(--ock-red)]">
                  <Users size={20} />
                </span>
                <span>
                  <span className="block font-semibold text-gray-900 dark:text-white">
                    Benutzerverwaltung
                  </span>
                  <span className="block text-sm text-gray-500 dark:text-gray-400">
                    Benutzer anlegen, Rollen vergeben
                  </span>
                </span>
              </button>
              <button
                onClick={() => router.push("/admin/medical-terms")}
                className="ock-card p-5 flex items-center gap-4 text-left hover:shadow-xl transition-shadow"
              >
                <span className="flex items-center justify-center w-10 h-10 rounded-full bg-[var(--ock-red-light)] text-[var(--ock-red)]">
                  <BookOpen size={20} />
                </span>
                <span>
                  <span className="block font-semibold text-gray-900 dark:text-white">
                    Fachbegriffe verwalten
                  </span>
                  <span className="block text-sm text-gray-500 dark:text-gray-400">
                    Medizinische Begriffe pflegen
                  </span>
                </span>
              </button>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="mt-16 border-t border-gray-200 dark:border-gray-700 py-6 px-6">
        <div className="max-w-4xl mx-auto text-center text-sm text-gray-600 dark:text-gray-400">
          <p>
            © 2024 OCK - Tastatutor -{" "}
            <button
              onClick={() => void handleLogout()}
              className="ock-link hover:underline"
            >
              Abmelden
            </button>
          </p>
        </div>
      </footer>
    </div>
  );
}

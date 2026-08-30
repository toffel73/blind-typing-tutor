"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { UserRole } from "@/types/auth";
import { Keyboard as KeyboardIcon } from "lucide-react";

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
}

interface StatisticsData {
  ok: boolean;
  totalLearningTimeMs: number;
  averageWpm: number;
  totalErrors: number;
  sessionCount: number;
  dailyStats: Array<{ date: string; learningTimeMs: number }>;
}

const TOTAL_LESSONS = 15;

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
      // Start training session in localStorage
      const now = Date.now();
      const expiresAt = now + 10 * 60 * 1000; // 10 minutes
      const trainingSession = {
        status: "active",
        startedAt: now,
        expiresAt: expiresAt,
      };
      window.localStorage.setItem("training_session", JSON.stringify(trainingSession));

      // Redirect to training page
      router.push(`/${interfaceLang}/${interfaceLang}/words`);
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

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-300">
      {/* Header */}
      <header className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-md shadow-sm px-6 py-4 transition-colors duration-300">
        <div className="max-w-4xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-3">
            <KeyboardIcon className="w-7 h-7 text-indigo-600 dark:text-indigo-400" />
            <h1 className="text-2xl font-bold font-mono text-gray-900 dark:text-white">
              Blind Typing Tutor
            </h1>
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
            Willkommen zu deiner persönlichen Lernplattform für Blind Typing
          </p>
        </div>

        {/* Training Card */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8 mb-8 transition-colors duration-300">
          <div className="mb-6">
            <h3 className="text-2xl font-semibold text-gray-900 dark:text-white mb-2">
              10-Minuten Training
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              Starten Sie eine 10-minütige Trainingseinheit mit drei Phasen:
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
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 transition-colors duration-300">
          <h3 className="text-xs font-bold tracking-widest uppercase text-gray-500 dark:text-gray-400 mb-4">
            Ihr Lernfortschritt
          </h3>
          {progressData ? (() => {
            const totalLessons = progressData.totalLessons ?? TOTAL_LESSONS;
            const completedLessons = progressData.currentKeyboardLesson - 1;
            const remainingLessons = totalLessons - progressData.currentKeyboardLesson;
            const progressPercent = Math.round((completedLessons / totalLessons) * 100);
            return (
              <div className="space-y-4">
                <div>
                  <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">
                    Aktuelle Lektion
                  </p>
                  <div className="text-xl font-bold text-gray-900 dark:text-white">
                    Lektion {progressData.currentKeyboardLesson} von {totalLessons}
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
                    <div className="font-semibold text-gray-900 dark:text-white">{completedLessons} {completedLessons === 1 ? "Lektion" : "Lektionen"}</div>
                    <div className="text-gray-500 dark:text-gray-400">Abgeschlossen</div>
                  </div>
                  {remainingLessons > 0 && (
                    <div>
                      <div className="font-semibold text-gray-900 dark:text-white">{remainingLessons} {remainingLessons === 1 ? "Lektion" : "Lektionen"}</div>
                      <div className="text-gray-500 dark:text-gray-400">Noch vor Ihnen</div>
                    </div>
                  )}
                </div>
              </div>
            );
          })() : (
            <p className="text-gray-600 dark:text-gray-400">
              Ihr Lernfortschritt wird automatisch gespeichert und trägt zum Keyboard-Training bei.
            </p>
          )}
        </div>

        {/* Statistics Cards */}
        {statisticsData && statisticsData.ok && (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 transition-colors duration-300">
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

                    const dayNames = ["Mo", "Di", "Mi", "Do", "Fr", "Sa", "So"];
                    const statsMap = new Map(
                      statisticsData.dailyStats.map((s) => [s.date, s.learningTimeMs])
                    );

                    return days.map((date, index) => {
                      const dateStr = date.toISOString().split("T")[0];
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
          </div>
        )}

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 transition-colors duration-300">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
            👤 Benutzername
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            Deine persönliche Lernplattform für Blind Typing
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-500">
            Benutzername: <span className="font-mono font-semibold text-gray-700 dark:text-gray-300">{sessionData.user?.username}</span>
          </p>
        </div>

        {/* Admin Links */}
        {sessionData.user?.role === "admin" && (
          <div className="mt-8 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-xl p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              👨‍💼 Administration
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <button
                onClick={() => router.push("/admin/users")}
                className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors"
              >
                Benutzerverwaltung
              </button>
              <button
                onClick={() => router.push("/admin/medical-terms")}
                className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors"
              >
                Fachbegriffe verwalten
              </button>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="mt-16 border-t border-gray-200 dark:border-gray-700 py-6 px-6">
        <div className="max-w-4xl mx-auto text-center text-sm text-gray-600 dark:text-gray-400">
          <p>
            © 2024 Blind Typing Tutor -{" "}
            <button
              onClick={() => router.push("/login")}
              className="text-indigo-600 dark:text-indigo-400 hover:underline"
            >
              Logout
            </button>
          </p>
        </div>
      </footer>
    </div>
  );
}

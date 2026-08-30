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

interface PageProps {
  params: Promise<{
    interfaceLang: string;
  }>;
}

export default function DashboardPage({ params }: PageProps) {
  const router = useRouter();
  const [sessionData, setSessionData] = useState<SessionData | null>(null);
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
      try {
        const response = await fetch("/api/auth/session", { cache: "no-store" });
        const data = (await response.json()) as SessionData;

        if (!data.authenticated) {
          router.replace("/login");
          return;
        }

        setSessionData(data);
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

        {/* Info Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 transition-colors duration-300">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
              📊 Ihr Fortschritt
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Ihr Lernfortschritt wird automatisch gespeichert und trägt zum Keyboard-Training bei.
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-500">
              Benutzername: <span className="font-mono font-semibold text-gray-700 dark:text-gray-300">{sessionData.user?.username}</span>
            </p>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 transition-colors duration-300">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
              ⚙️ Einstellungen
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Während des Trainings können Sie Sprache, Layout, Design und mehr anpassen.
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-500">
              Rolle: <span className="font-mono font-semibold text-gray-700 dark:text-gray-300">
                {sessionData.user?.role === "admin" ? "Administrator" : "Benutzer"}
              </span>
            </p>
          </div>
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

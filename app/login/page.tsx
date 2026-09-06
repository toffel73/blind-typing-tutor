"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Keyboard as KeyboardIcon } from "lucide-react";
import { PASSWORD_MISMATCH_MESSAGE } from "@/config/auth";

interface ApiResponse {
  ok: boolean;
  message: string;
}

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<"login" | "register">("login");

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const [registerUsername, setRegisterUsername] = useState("");
  const [registerPassword, setRegisterPassword] = useState("");
  const [registerPasswordConfirm, setRegisterPasswordConfirm] = useState("");
  const [inviteCode, setInviteCode] = useState("");
  const [isRegistering, setIsRegistering] = useState(false);
  const [registerMessage, setRegisterMessage] = useState<string | null>(null);

  const switchMode = (nextMode: "login" | "register") => {
    setMode(nextMode);
    setMessage(null);
    setRegisterMessage(null);
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setIsLoading(true);
    setMessage(null);
    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      const data = (await response.json()) as ApiResponse;
      setMessage(data.message);
      if (data.ok) {
        router.push("/");
      }
    } catch {
      setMessage("Fehler bei der Anfrage.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegisterSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setRegisterMessage(null);

    if (registerPassword !== registerPasswordConfirm) {
      setRegisterMessage(PASSWORD_MISMATCH_MESSAGE);
      return;
    }

    setIsRegistering(true);
    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: registerUsername,
          password: registerPassword,
          passwordConfirm: registerPasswordConfirm,
          inviteCode,
        }),
      });
      const data = (await response.json()) as ApiResponse;
      setRegisterMessage(data.message);
      if (data.ok) {
        setRegisterUsername("");
        setRegisterPassword("");
        setRegisterPasswordConfirm("");
        setInviteCode("");
        switchMode("login");
        setMessage(data.message);
      }
    } catch {
      setRegisterMessage("Fehler bei der Anfrage.");
    } finally {
      setIsRegistering(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 dark:bg-gray-900 px-4">
      <div className="w-full max-w-md">
        <div className="flex items-center justify-center gap-2 mb-8">
          <KeyboardIcon className="w-7 h-7 text-indigo-600 dark:text-indigo-400" />
          <span className="text-2xl font-bold font-mono text-gray-900 dark:text-white">
            OCK - Tastatutor
          </span>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8">
          {mode === "login" ? (
            <>
              <h1 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
                Anmelden
              </h1>

              <form className="space-y-4" onSubmit={(e) => void handleSubmit(e)}>
                <div>
                  <label
                    htmlFor="username"
                    className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                  >
                    Benutzername
                  </label>
                  <input
                    id="username"
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Benutzername"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    required
                    autoComplete="username"
                  />
                </div>

                <div>
                  <label
                    htmlFor="password"
                    className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                  >
                    Passwort
                  </label>
                  <input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Passwort"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    required
                    autoComplete="current-password"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-2 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-60 font-medium transition-colors"
                >
                  {isLoading ? "Bitte warten..." : "Anmelden"}
                </button>
              </form>

              {message && (
                <p className="mt-4 text-sm text-gray-700 dark:text-gray-300">{message}</p>
              )}

              <p className="mt-6 text-center text-sm text-gray-600 dark:text-gray-400">
                Noch kein Konto?{" "}
                <button
                  type="button"
                  onClick={() => switchMode("register")}
                  className="text-indigo-600 dark:text-indigo-400 hover:underline font-medium"
                >
                  Registrieren
                </button>
              </p>
            </>
          ) : (
            <>
              <h1 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
                Registrieren
              </h1>

              <form className="space-y-4" onSubmit={(e) => void handleRegisterSubmit(e)}>
                <div>
                  <label
                    htmlFor="register-username"
                    className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                  >
                    Benutzername
                  </label>
                  <input
                    id="register-username"
                    type="text"
                    value={registerUsername}
                    onChange={(e) => setRegisterUsername(e.target.value)}
                    placeholder="Benutzername"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    required
                    autoComplete="username"
                  />
                </div>

                <div>
                  <label
                    htmlFor="register-password"
                    className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                  >
                    Passwort
                  </label>
                  <input
                    id="register-password"
                    type="password"
                    value={registerPassword}
                    onChange={(e) => setRegisterPassword(e.target.value)}
                    placeholder="Passwort"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    required
                    autoComplete="new-password"
                  />
                </div>

                <div>
                  <label
                    htmlFor="register-password-confirm"
                    className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                  >
                    Passwort bestätigen
                  </label>
                  <input
                    id="register-password-confirm"
                    type="password"
                    value={registerPasswordConfirm}
                    onChange={(e) => setRegisterPasswordConfirm(e.target.value)}
                    placeholder="Passwort bestätigen"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    required
                    autoComplete="new-password"
                  />
                </div>

                <div>
                  <label
                    htmlFor="invite-code"
                    className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                  >
                    Einladungscode
                  </label>
                  <input
                    id="invite-code"
                    type="text"
                    value={inviteCode}
                    onChange={(e) => setInviteCode(e.target.value)}
                    placeholder="Einladungscode"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    required
                    autoComplete="off"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isRegistering}
                  className="w-full py-2 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-60 font-medium transition-colors"
                >
                  {isRegistering ? "Bitte warten..." : "Registrieren"}
                </button>
              </form>

              {registerMessage && (
                <p className="mt-4 text-sm text-gray-700 dark:text-gray-300">{registerMessage}</p>
              )}

              <p className="mt-6 text-center text-sm text-gray-600 dark:text-gray-400">
                <button
                  type="button"
                  onClick={() => switchMode("login")}
                  className="text-indigo-600 dark:text-indigo-400 hover:underline font-medium"
                >
                  Zurück zur Anmeldung
                </button>
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

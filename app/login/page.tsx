"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff } from "lucide-react";
import { PASSWORD_MISMATCH_MESSAGE } from "@/config/auth";
import { Logo } from "@/components/layout/Logo";

interface ApiResponse {
  ok: boolean;
  message: string;
}

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<"login" | "register">("login");

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [registrationSuccess, setRegistrationSuccess] = useState(false);
  const [showForgotPasswordHint, setShowForgotPasswordHint] = useState(false);

  const [registerUsername, setRegisterUsername] = useState("");
  const [registerPassword, setRegisterPassword] = useState("");
  const [registerPasswordConfirm, setRegisterPasswordConfirm] = useState("");
  const [showRegisterPassword, setShowRegisterPassword] = useState(false);
  const [inviteCode, setInviteCode] = useState("");
  const [isRegistering, setIsRegistering] = useState(false);
  const [registerMessage, setRegisterMessage] = useState<string | null>(null);

  const switchMode = (nextMode: "login" | "register") => {
    setMode(nextMode);
    setMessage(null);
    setRegisterMessage(null);
    setRegistrationSuccess(false);
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
        setShowRegisterPassword(false);
        setInviteCode("");
        switchMode("login");
        setMessage(data.message);
        setRegistrationSuccess(true);
      }
    } catch {
      setRegisterMessage("Fehler bei der Anfrage.");
    } finally {
      setIsRegistering(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[var(--ock-app-bg)] dark:bg-gray-900 px-4 py-12">
      <div className="w-full max-w-md">
        <div className="flex flex-col items-center gap-3 mb-8">
          <Logo height={48} priority />
          <span className="text-2xl font-bold text-gray-900 dark:text-white">
            OCK - Tastatutor
          </span>
        </div>

        <div className="ock-card p-8">
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
                    className="ock-input"
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
                  <div className="relative">
                    <input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Passwort"
                      className="ock-input pr-10"
                      required
                      autoComplete="current-password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((v) => !v)}
                      className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-500 dark:text-gray-400"
                      aria-label={showPassword ? "Passwort verbergen" : "Passwort anzeigen"}
                      tabIndex={-1}
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="ock-btn-primary w-full py-2.5"
                >
                  {isLoading ? "Bitte warten..." : "Anmelden"}
                </button>
              </form>

              <p className="mt-4 text-center text-sm">
                <button
                  type="button"
                  onClick={() => setShowForgotPasswordHint((v) => !v)}
                  className="ock-link"
                >
                  Passwort vergessen?
                </button>
              </p>

              {showForgotPasswordHint && (
                <p className="mt-2 text-center text-sm text-gray-600 dark:text-gray-400">
                  Bitte wenden Sie sich an einen Administrator, um Ihr Passwort zurückzusetzen.
                </p>
              )}

              {message && (
                <p
                  className={`mt-4 text-sm ${
                    registrationSuccess
                      ? "text-green-700 dark:text-green-400"
                      : "text-gray-700 dark:text-gray-300"
                  }`}
                >
                  {message}
                </p>
              )}

              <div className="mt-6 flex items-center gap-3 text-xs uppercase tracking-wide text-gray-400 dark:text-gray-500">
                <span className="h-px flex-1 bg-gray-200 dark:bg-gray-700" />
                oder
                <span className="h-px flex-1 bg-gray-200 dark:bg-gray-700" />
              </div>

              <p className="mt-6 text-center text-sm text-gray-600 dark:text-gray-400">
                Noch kein Konto?{" "}
                <button
                  type="button"
                  onClick={() => switchMode("register")}
                  className="ock-link"
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
                    className="ock-input"
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
                  <div className="relative">
                    <input
                      id="register-password"
                      type={showRegisterPassword ? "text" : "password"}
                      value={registerPassword}
                      onChange={(e) => setRegisterPassword(e.target.value)}
                      placeholder="Passwort"
                      className="ock-input pr-10"
                      required
                      autoComplete="new-password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowRegisterPassword((v) => !v)}
                      className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-500 dark:text-gray-400"
                      aria-label={showRegisterPassword ? "Passwort verbergen" : "Passwort anzeigen"}
                      tabIndex={-1}
                    >
                      {showRegisterPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
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
                    type={showRegisterPassword ? "text" : "password"}
                    value={registerPasswordConfirm}
                    onChange={(e) => setRegisterPasswordConfirm(e.target.value)}
                    placeholder="Passwort bestätigen"
                    className="ock-input"
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
                    className="ock-input"
                    required
                    autoComplete="off"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isRegistering}
                  className="ock-btn-primary w-full py-2.5"
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
                  className="ock-link"
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

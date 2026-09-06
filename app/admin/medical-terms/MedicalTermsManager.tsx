"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  calculateMedicalTermDifficulty,
  countMedicalTermsByDifficulty,
  filterMedicalTermsByDifficulty,
  MEDICAL_TERM_DIFFICULTY_BADGE_CLASSES,
  MEDICAL_TERM_DIFFICULTY_LABELS,
  MEDICAL_TERM_DIFFICULTY_LEVELS,
  parseMedicalTermDifficulty,
  type MedicalTermDifficulty,
  type MedicalTermDifficultyFilter,
} from "@/utils/medicalTermDifficulty";

interface MedicalTerm {
  id: number;
  term: string;
  difficulty: MedicalTermDifficulty;
}

interface ApiResponse {
  ok: boolean;
  message: string;
}

function DifficultyBadge({ difficulty }: { difficulty: MedicalTermDifficulty }) {
  return (
    <span
      className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium whitespace-nowrap ${MEDICAL_TERM_DIFFICULTY_BADGE_CLASSES[difficulty]}`}
    >
      {MEDICAL_TERM_DIFFICULTY_LABELS[difficulty]}
    </span>
  );
}

export function MedicalTermsManager() {
  const [terms, setTerms] = useState<MedicalTerm[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newTerm, setNewTerm] = useState("");
  const [newDifficulty, setNewDifficulty] = useState<MedicalTermDifficulty>(1);
  const [isNewDifficultyTouched, setIsNewDifficultyTouched] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [pendingDelete, setPendingDelete] = useState<MedicalTerm | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [savingDifficultyId, setSavingDifficultyId] = useState<number | null>(null);
  const [filter, setFilter] = useState<MedicalTermDifficultyFilter>("all");

  const loadTerms = useCallback(async () => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const response = await fetch("/api/admin/medical-terms", { cache: "no-store" });
      if (!response.ok) {
        const data = (await response.json()) as ApiResponse;
        setErrorMessage(data.message || "Fachbegriffe konnten nicht geladen werden.");
        setTerms([]);
        return;
      }
      const data = (await response.json()) as MedicalTerm[];
      setTerms(data);
    } catch {
      setErrorMessage("Fachbegriffe konnten nicht geladen werden.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    const timeout = setTimeout(() => {
      void loadTerms();
    }, 0);
    return () => clearTimeout(timeout);
  }, [loadTerms]);

  useEffect(() => {
    if (!message) {
      return;
    }
    const timeout = setTimeout(() => setMessage(null), 3500);
    return () => clearTimeout(timeout);
  }, [message]);

  // The automatic classification is only a starting suggestion for the create
  // form; once the admin has manually picked a difficulty, further edits to
  // the term text no longer override that choice.
  useEffect(() => {
    if (!isCreateOpen || isNewDifficultyTouched) {
      return;
    }
    setNewDifficulty(calculateMedicalTermDifficulty(newTerm));
  }, [newTerm, isCreateOpen, isNewDifficultyTouched]);

  const countsByDifficulty = useMemo(() => countMedicalTermsByDifficulty(terms), [terms]);

  const visibleTerms = useMemo(
    () => filterMedicalTermsByDifficulty(terms, filter),
    [terms, filter]
  );

  async function handleDifficultyChange(term: MedicalTerm, nextDifficulty: MedicalTermDifficulty) {
    setSavingDifficultyId(term.id);
    setErrorMessage(null);
    try {
      const response = await fetch(`/api/admin/medical-terms/${term.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ difficulty: nextDifficulty }),
      });
      const data = (await response.json()) as ApiResponse;
      if (data.ok) {
        setTerms((current) =>
          current.map((entry) =>
            entry.id === term.id ? { ...entry, difficulty: nextDifficulty } : entry
          )
        );
        setMessage(
          `Schwierigkeitsgrad von '${term.term}' wurde auf ${MEDICAL_TERM_DIFFICULTY_LABELS[nextDifficulty]} geändert.`
        );
      } else {
        setErrorMessage(data.message);
      }
    } catch {
      setErrorMessage("Fehler bei der Anfrage.");
    } finally {
      setSavingDifficultyId(null);
    }
  }

  return (
    <div className="w-full max-w-3xl ock-card p-8">
      <div className="flex items-center justify-between gap-4 mb-4">
        <h1 className="text-xl font-semibold text-gray-900 dark:text-white">Fachbegriffe</h1>
        {!isCreateOpen && (
          <button
            type="button"
            onClick={() => setIsCreateOpen(true)}
            className="ock-btn-primary px-3 py-2"
          >
            Begriff hinzufügen
          </button>
        )}
      </div>

      {message && <p className="mb-4 text-sm text-green-700 dark:text-green-400">{message}</p>}
      {errorMessage && <p className="mb-4 text-sm text-red-600 dark:text-red-400">{errorMessage}</p>}

      <div className="mb-6 flex flex-wrap gap-2" role="group" aria-label="Nach Schwierigkeitsgrad filtern">
        <button
          type="button"
          onClick={() => setFilter("all")}
          aria-pressed={filter === "all"}
          className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-colors ${
            filter === "all"
              ? "bg-gray-900 text-white border-gray-900 dark:bg-white dark:text-gray-900 dark:border-white"
              : "bg-white text-gray-700 border-gray-300 hover:bg-gray-100 dark:bg-gray-900 dark:text-gray-200 dark:border-gray-600 dark:hover:bg-gray-800"
          }`}
        >
          Alle ({terms.length})
        </button>
        {MEDICAL_TERM_DIFFICULTY_LEVELS.map((level) => (
          <button
            key={level}
            type="button"
            onClick={() => setFilter(level)}
            aria-pressed={filter === level}
            className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-colors ${
              filter === level
                ? "bg-gray-900 text-white border-gray-900 dark:bg-white dark:text-gray-900 dark:border-white"
                : "bg-white text-gray-700 border-gray-300 hover:bg-gray-100 dark:bg-gray-900 dark:text-gray-200 dark:border-gray-600 dark:hover:bg-gray-800"
            }`}
          >
            {MEDICAL_TERM_DIFFICULTY_LABELS[level]} ({countsByDifficulty[level]})
          </button>
        ))}
      </div>

      {isCreateOpen && (
        <div className="mb-6 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
          <form
            className="space-y-3"
            onSubmit={(event) => {
              event.preventDefault();
              setIsSaving(true);
              setErrorMessage(null);
              void fetch("/api/admin/medical-terms", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ term: newTerm, difficulty: newDifficulty }),
              })
                .then((response) => response.json() as Promise<ApiResponse>)
                .then(async (data) => {
                  if (data.ok) {
                    setMessage(`${newTerm.trim()} wurde hinzugefügt.`);
                    setNewTerm("");
                    setNewDifficulty(1);
                    setIsNewDifficultyTouched(false);
                    setIsCreateOpen(false);
                    await loadTerms();
                  } else {
                    setErrorMessage(data.message);
                  }
                })
                .catch(() => {
                  setErrorMessage("Fehler bei der Anfrage.");
                })
                .finally(() => setIsSaving(false));
            }}
          >
            <div>
              <label
                htmlFor="medical-term-input"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
              >
                Fachbegriff
              </label>
              <input
                id="medical-term-input"
                type="text"
                value={newTerm}
                onChange={(event) => setNewTerm(event.target.value)}
                className="ock-input w-full"
                required
                maxLength={120}
              />
            </div>
            <div>
              <label
                htmlFor="medical-term-difficulty"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
              >
                Schwierigkeitsgrad{" "}
                <span className="font-normal text-gray-500 dark:text-gray-400">
                  (Vorschlag, kann geändert werden)
                </span>
              </label>
              <div className="flex items-center gap-3">
                <select
                  id="medical-term-difficulty"
                  value={newDifficulty}
                  onChange={(event) => {
                    const parsed = parseMedicalTermDifficulty(event.target.value);
                    setNewDifficulty(parsed ?? 1);
                    setIsNewDifficultyTouched(true);
                  }}
                  className="ock-input w-auto"
                >
                  {MEDICAL_TERM_DIFFICULTY_LEVELS.map((level) => (
                    <option key={level} value={level}>
                      {MEDICAL_TERM_DIFFICULTY_LABELS[level]}
                    </option>
                  ))}
                </select>
                <DifficultyBadge difficulty={newDifficulty} />
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button
                type="submit"
                disabled={isSaving}
                className="ock-btn-primary px-3 py-2 disabled:opacity-60"
              >
                {isSaving ? "Bitte warten..." : "Hinzufügen"}
              </button>
              <button
                type="button"
                onClick={() => {
                  setNewTerm("");
                  setNewDifficulty(1);
                  setIsNewDifficultyTouched(false);
                  setErrorMessage(null);
                  setIsCreateOpen(false);
                }}
                className="px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                Abbrechen
              </button>
            </div>
          </form>
        </div>
      )}

      {pendingDelete && (
        <div className="mb-6 border border-red-200 dark:border-red-700 rounded-lg p-4 bg-red-50/60 dark:bg-red-900/20">
          <p className="text-sm text-gray-900 dark:text-gray-100 mb-3">
            Fachbegriff &bdquo;{pendingDelete.term}&ldquo; wirklich löschen?
          </p>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setPendingDelete(null)}
              className="px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700"
              disabled={isDeleting}
            >
              Abbrechen
            </button>
            <button
              type="button"
              onClick={async () => {
                setIsDeleting(true);
                setErrorMessage(null);
                const response = await fetch(`/api/admin/medical-terms/${pendingDelete.id}`, {
                  method: "DELETE",
                });
                const data = (await response.json()) as ApiResponse;
                if (data.ok) {
                  setMessage(data.message);
                  setPendingDelete(null);
                  await loadTerms();
                } else {
                  setErrorMessage(data.message);
                }
                setIsDeleting(false);
              }}
              className="px-3 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700 disabled:opacity-60"
              disabled={isDeleting}
            >
              {isDeleting ? "Bitte warten..." : "Fachbegriff löschen"}
            </button>
          </div>
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200 dark:border-gray-700">
              <th className="text-left py-2 text-gray-900 dark:text-gray-100">Begriff</th>
              <th className="text-left py-2 text-gray-900 dark:text-gray-100">Schwierigkeit</th>
              <th className="text-left py-2 text-gray-900 dark:text-gray-100">Aktion</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={3} className="py-4 text-gray-600 dark:text-gray-300">
                  Lade Fachbegriffe...
                </td>
              </tr>
            ) : visibleTerms.length === 0 ? (
              <tr>
                <td colSpan={3} className="py-4 text-gray-600 dark:text-gray-300">
                  {terms.length === 0
                    ? "Keine Fachbegriffe vorhanden."
                    : "Keine Fachbegriffe für diesen Filter vorhanden."}
                </td>
              </tr>
            ) : (
              visibleTerms.map((term) => (
                <tr key={term.id} className="border-b border-gray-100 dark:border-gray-700/70">
                  <td className="py-2 text-gray-800 dark:text-gray-200">{term.term}</td>
                  <td className="py-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <DifficultyBadge difficulty={term.difficulty} />
                      <label className="sr-only" htmlFor={`difficulty-${term.id}`}>
                        Schwierigkeitsgrad für {term.term} ändern
                      </label>
                      <select
                        id={`difficulty-${term.id}`}
                        value={term.difficulty}
                        disabled={savingDifficultyId === term.id}
                        onChange={(event) => {
                          const parsed = parseMedicalTermDifficulty(event.target.value);
                          if (parsed) {
                            void handleDifficultyChange(term, parsed);
                          }
                        }}
                        className="ock-input py-1 px-2 text-sm w-auto disabled:opacity-60"
                      >
                        {MEDICAL_TERM_DIFFICULTY_LEVELS.map((level) => (
                          <option key={level} value={level}>
                            {MEDICAL_TERM_DIFFICULTY_LABELS[level]}
                          </option>
                        ))}
                      </select>
                    </div>
                  </td>
                  <td className="py-2">
                    <button
                      type="button"
                      onClick={() => setPendingDelete(term)}
                      className="text-sm text-red-600 dark:text-red-400 hover:underline"
                    >
                      Löschen
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

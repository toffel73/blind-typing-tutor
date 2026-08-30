"use client";

import React, { useState } from "react";
import {
  Keyboard as KeyboardIcon,
  Moon,
  Sun,
  Info,
  ArrowLeft,
} from "lucide-react";
import type { InterfaceLanguage } from "../../translations";
import type { ContentType } from "../../utils/url";
import { LandingOverlay } from "./LandingOverlay";
import { AuthMenu } from "./AuthMenu";
import { SessionTimer } from "./SessionTimer";

interface HeaderProps {
  title: string;
  lightMode: string;
  darkMode: string;
  interfaceLanguage: InterfaceLanguage;
  isDarkMode: boolean;
  setDarkMode: (dark: boolean) => void;
  studyLang: string;
  learningMode: ContentType;
  sessionExpiresAt?: number | null;
  onSessionRemainingChange?: (remainingMs: number) => void;
  sessionUsername?: string | null;
  onBackToDashboard?: () => void;
  isTrainingPaused?: boolean;
  onTogglePause?: () => void;
  onEndTraining?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  title,
  lightMode,
  darkMode: darkModeLabel,
  interfaceLanguage,
  isDarkMode,
  setDarkMode,
  studyLang,
  learningMode,
  sessionExpiresAt,
  onSessionRemainingChange,
  sessionUsername,
  onBackToDashboard,
  isTrainingPaused,
  onTogglePause,
  onEndTraining,
}) => {
  const [showLanding, setShowLanding] = useState(false);
  return (
    <>
      <header className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-md shadow-sm px-6 py-4 flex justify-between items-center fixed w-full top-0 z-50 transition-colors duration-300">
        <div className="flex items-center gap-4">
          {onBackToDashboard && (
            <button
              onClick={onBackToDashboard}
              className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer text-gray-900 dark:text-white transition-colors"
              title="Zurück zum Dashboard"
              aria-label="Zurück zum Dashboard"
            >
              <ArrowLeft size={20} />
            </button>
          )}
          <h1
            data-testid="app-title"
            className="text-xl font-bold text-gray-900 dark:text-white whitespace-nowrap transition-colors flex items-center gap-2 font-mono"
          >
            <KeyboardIcon className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
            {title}
          </h1>

          <button
            onClick={() => setShowLanding(true)}
            className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer text-gray-900 dark:text-white transition-colors"
            title="About this typing tutor"
            aria-label="Show information about the typing tutor"
          >
            <Info size={20} />
          </button>
        </div>

        <div className="flex items-center gap-3">
          {/* Training Controls */}
          {sessionExpiresAt != null && onTogglePause && onEndTraining && (
            <div className="flex items-center gap-2">
              <button
                onClick={onTogglePause}
                className="px-3 py-1 text-sm font-medium rounded-lg transition-colors bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-900 dark:text-white"
                title={isTrainingPaused ? "Training fortsetzen" : "Training pausieren"}
                aria-label={isTrainingPaused ? "Training fortsetzen" : "Training pausieren"}
              >
                {isTrainingPaused ? "Fortsetzen" : "Pause"}
              </button>
              <button
                onClick={onEndTraining}
                className="px-3 py-1 text-sm font-medium rounded-lg transition-colors bg-red-200 dark:bg-red-900 hover:bg-red-300 dark:hover:bg-red-800 text-red-900 dark:text-red-100"
                title="Training beenden"
                aria-label="Training beenden"
              >
                Beenden
              </button>
            </div>
          )}

          {sessionExpiresAt != null && (
            <SessionTimer
              expiresAt={sessionExpiresAt}
              onRemainingChange={onSessionRemainingChange}
            />
          )}
          {sessionUsername && (
            <span
              className="max-w-36 truncate text-sm font-medium text-gray-700 dark:text-gray-300"
              title={sessionUsername}
            >
              {sessionUsername}
            </span>
          )}
          <AuthMenu />
          <button
            data-testid="theme-toggle-button"
            onClick={() => setDarkMode(!isDarkMode)}
            className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer text-gray-900 dark:text-white transition-colors"
            title={isDarkMode ? lightMode : darkModeLabel}
            aria-label={isDarkMode ? lightMode : darkModeLabel}
          >
            {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
          </button>
        </div>
      </header>

      {/* Landing Overlay - outside header so it can appear on top */}
      <LandingOverlay
        show={showLanding}
        onClose={() => setShowLanding(false)}
        interfaceLang={interfaceLanguage}
        studyLang={studyLang}
        learningMode={learningMode}
      />
    </>
  );
};

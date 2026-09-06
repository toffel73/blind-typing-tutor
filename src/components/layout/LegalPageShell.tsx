import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Logo } from "./Logo";

interface LegalPageShellProps {
  title: string;
  children: React.ReactNode;
}

export function LegalPageShell({ title, children }: LegalPageShellProps) {
  return (
    <div className="min-h-screen bg-[var(--ock-app-bg)] dark:bg-gray-900">
      <header className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-md shadow-sm px-6 py-4">
        <div className="max-w-4xl mx-auto flex items-center gap-3">
          <Link
            href="/"
            className="p-2 -ml-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-900 dark:text-white transition-colors"
            title="Zurück zum Dashboard"
            aria-label="Zurück zum Dashboard"
          >
            <ArrowLeft size={20} />
          </Link>
          <Logo height={24} />
          <span className="font-bold text-gray-900 dark:text-white">
            OCK – Tastatutor
          </span>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-10">
        <article className="ock-card p-6 sm:p-10 text-gray-700 dark:text-gray-300">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-8">
            {title}
          </h1>
          <div className="legal-content">{children}</div>
        </article>
      </main>
    </div>
  );
}

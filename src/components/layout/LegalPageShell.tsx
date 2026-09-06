import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Logo } from "./Logo";

interface LegalPageShellProps {
  title: string;
  children: React.ReactNode;
}

export function LegalPageShell({ title, children }: LegalPageShellProps) {
  return (
    <div className="legal-page min-h-screen bg-[var(--ock-app-bg)] dark:bg-gray-900">
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

      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-10 sm:py-14">
        <article className="legal-document ock-card overflow-hidden text-gray-700 dark:text-gray-300">
          <div className="legal-document-heading px-6 py-7 sm:px-10 sm:py-9">
            <p className="ock-section-heading mb-2">OCK – Tastatutor</p>
            <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-gray-900 dark:text-white">
              {title}
            </h1>
            <p className="mt-3 text-sm sm:text-base text-gray-500 dark:text-gray-400">
              Rechtliche Informationen zur internen Lernanwendung
            </p>
          </div>
          <div className="legal-content px-6 py-7 sm:px-10 sm:py-9">{children}</div>
        </article>

        <nav
          aria-label="Rechtliche Informationen"
          className="mt-6 flex items-center justify-center gap-3 text-sm"
        >
          <Link href="/impressum" className="legal-nav-link">
            Impressum
          </Link>
          <span className="text-gray-300 dark:text-gray-600" aria-hidden="true">•</span>
          <Link href="/datenschutz" className="legal-nav-link">
            Datenschutz
          </Link>
        </nav>
      </main>
    </div>
  );
}

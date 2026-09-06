import Link from "next/link";
import { Logo } from "@/components/layout/Logo";

interface LegalPageShellProps {
  title: string;
  children: React.ReactNode;
}

export function LegalPageShell({ title, children }: LegalPageShellProps) {
  return (
    <div className="min-h-screen bg-[var(--ock-app-bg)] px-4 py-8 dark:bg-gray-900 sm:px-6">
      <header className="mx-auto mb-6 flex max-w-4xl items-center justify-between gap-4">
        <Link href="/de/dashboard" className="flex items-center gap-3 text-gray-900 dark:text-white">
          <Logo height={30} priority />
          <span className="font-bold">OCK – Tastatutor</span>
        </Link>
        <Link href="/de/dashboard" className="ock-link text-sm font-medium">
          Zurück zum Dashboard
        </Link>
      </header>

      <main className="ock-card mx-auto max-w-4xl p-6 sm:p-10">
        <h1 className="mb-8 text-3xl font-bold text-gray-900 dark:text-white">{title}</h1>
        <div className="space-y-7 text-sm leading-7 text-gray-700 dark:text-gray-300 [&_a]:text-[var(--ock-red)] [&_a]:underline [&_h2]:mt-8 [&_h2]:text-xl [&_h2]:font-semibold [&_h2]:text-gray-900 dark:[&_h2]:text-white [&_h3]:mt-5 [&_h3]:font-semibold [&_h3]:text-gray-900 dark:[&_h3]:text-white [&_ul]:list-disc [&_ul]:space-y-1 [&_ul]:pl-6">
          {children}
        </div>
      </main>

      <footer className="mx-auto mt-6 flex max-w-4xl justify-center gap-4 text-xs text-gray-500 dark:text-gray-400">
        <Link href="/impressum" className="hover:underline">Impressum</Link>
        <Link href="/datenschutz" className="hover:underline">Datenschutz</Link>
      </footer>
    </div>
  );
}

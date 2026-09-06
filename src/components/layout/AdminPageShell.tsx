import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Logo } from "./Logo";

interface AdminPageShellProps {
  children: React.ReactNode;
}

/**
 * Shared top bar + page background for admin subpages (`/admin/users`,
 * `/admin/medical-terms`) so branding stays consistent without touching
 * the existing admin logic/components.
 */
export function AdminPageShell({ children }: AdminPageShellProps) {
  return (
    <div className="min-h-screen bg-[var(--ock-app-bg)] dark:bg-gray-900">
      <header className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-md shadow-sm px-6 py-4">
        <div className="max-w-3xl mx-auto flex items-center gap-3">
          {/*
            The root route ("/") always redirects to the language-specific
            dashboard (see app/page.tsx), so this is the correct target for
            "back to dashboard" without needing to know interfaceLang here.
          */}
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
            OCK - Tastatutor
          </span>
        </div>
      </header>
      <div className="flex items-start justify-center px-4 py-10">{children}</div>
    </div>
  );
}

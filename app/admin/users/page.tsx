import type { Metadata } from "next";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { AdminUsersManager } from "./AdminUsersManager";
import { getSessionUser } from "@/server/authService";
import { AdminPageShell } from "@/components/layout/AdminPageShell";

export const metadata: Metadata = {
  title: "Benutzerverwaltung | OCK - Tastatutor",
};

export default async function AdminUsersPage() {
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get("auth_session")?.value ?? "";
  const sessionUser = getSessionUser(sessionToken);

  if (!sessionUser) {
    redirect("/login");
  }

  if (sessionUser.role !== "admin") {
    redirect("/");
  }

  return (
    <AdminPageShell>
      <AdminUsersManager />
    </AdminPageShell>
  );
}

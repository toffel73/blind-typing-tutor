import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { MedicalTermsManager } from "./MedicalTermsManager";
import { getSessionUser } from "@/server/authService";
import { AdminPageShell } from "@/components/layout/AdminPageShell";

export default async function AdminMedicalTermsPage() {
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
      <MedicalTermsManager />
    </AdminPageShell>
  );
}


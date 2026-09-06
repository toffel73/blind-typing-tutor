import type { Metadata } from "next";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { LegalPageShell } from "@/components/layout/LegalPageShell";
import { getSessionUser } from "@/server/authService";

export const metadata: Metadata = {
  title: "Impressum | OCK – Tastatutor",
  robots: { index: false, follow: false },
};

export default async function ImpressumPage() {
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get("auth_session")?.value ?? "";

  if (!getSessionUser(sessionToken)) {
    redirect("/login");
  }

  return (
    <LegalPageShell title="Impressum">
      <section>
        <h2>Angaben gemäß § 5 DDG</h2>
        <address>
          Christoph Holland<br />
          Klingerstraße 14<br />
          51143 Köln<br />
          Deutschland
        </address>
      </section>

      <section>
        <h2>Kontakt</h2>
        <p>
          Telefon: <a href="tel:+492214972990">0221 4972990</a><br />
          E-Mail: <a href="mailto:info@oc-koeln.de">info@oc-koeln.de</a>
        </p>
      </section>

      <section>
        <h2>Verantwortlich für den Inhalt</h2>
        <address>
          Christoph Holland<br />
          Klingerstraße 14<br />
          51143 Köln
        </address>
      </section>

      <section>
        <h2>Haftung für Inhalte</h2>
        <p>
          Die Inhalte dieser Anwendung wurden mit größtmöglicher Sorgfalt
          erstellt. Eine Gewähr für die Richtigkeit, Vollständigkeit und
          Aktualität der bereitgestellten Inhalte kann jedoch nicht übernommen
          werden.
        </p>
        <p>
          Der Tastatutor dient ausschließlich dem internen Training der
          Schreibfertigkeit. Die in den Übungen verwendeten medizinischen
          Begriffe stellen keine medizinische Beratung oder
          Behandlungsempfehlung dar.
        </p>
      </section>

      <section>
        <h2>Urheberrecht</h2>
        <p>
          Die innerhalb dieser Anwendung erstellten Inhalte und Werke
          unterliegen dem deutschen Urheberrecht. Eine Vervielfältigung,
          Bearbeitung, Verbreitung oder sonstige Verwertung außerhalb der
          Grenzen des Urheberrechts bedarf der vorherigen Zustimmung des
          jeweiligen Rechteinhabers.
        </p>
      </section>
    </LegalPageShell>
  );
}

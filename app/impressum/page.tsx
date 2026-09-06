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
  if (!getSessionUser(sessionToken)) redirect("/login");

  return (
    <LegalPageShell title="Impressum">
      <section>
        <h2>Angaben gemäß § 5 DDG</h2>
        <p>
          Gemeinschaftspraxis<br />
          Orthopädie und Chirurgie Köln (GbR)<br />
          Aachener Straße 557b<br />
          50933 Köln-Braunsfeld
        </p>
      </section>

      <section>
        <h2>Vertreten durch</h2>
        <p>
          Dr. med. Oliver Coenen<br />
          Dr. med. Adam Smok<br />
          Dr. med. Jürgen Eistetter<br />
          Dr. med. Kay Hiersemann<br />
          Dr. med. Tom Jansen<br />
          Dr. med. Michael Kehrer
        </p>
      </section>

      <section>
        <h2>Kontakt</h2>
        <p>
          Telefon: <a href="tel:+492214972990">0221 4972990</a><br />
          Telefax: 0221 4995261<br />
          E-Mail: <a href="mailto:info@oc-koeln.de">info@oc-koeln.de</a><br />
          Internet: <a href="https://www.oc-koeln.de/" target="_blank" rel="noreferrer">www.oc-koeln.de</a>
        </p>
      </section>

      <section>
        <h2>Aufsichtsbehörde und Kammer</h2>
        <p>
          Kassenärztliche Vereinigung Nordrhein<br />
          Sedanstraße 10–16, 50668 Köln
        </p>
        <p>
          Ärztekammer Nordrhein<br />
          Tersteegenstraße 31, 40474 Düsseldorf
        </p>
      </section>

      <section>
        <h2>Berufsbezeichnung und berufsrechtliche Regelungen</h2>
        <p>
          Arzt, Orthopäde beziehungsweise Orthopäde und Unfallchirurg; die Berufsbezeichnungen
          wurden in der Bundesrepublik Deutschland verliehen.
        </p>
        <ul>
          <li>Berufsordnung der Ärztekammer Nordrhein</li>
          <li>Heilberufsgesetz des Landes Nordrhein-Westfalen</li>
        </ul>
        <p>
          Die Regelungen sind über die <a href="https://www.aekno.de/" target="_blank" rel="noreferrer">Ärztekammer Nordrhein</a> abrufbar.
        </p>
      </section>

      <section>
        <h2>Berufshaftpflichtversicherung</h2>
        <p>Janitos Versicherung AG und Versicherungskammer Bayern; räumlicher Geltungsbereich: Deutschland.</p>
      </section>

      <section>
        <h2>Inhaltlich verantwortlich</h2>
        <p>Verantwortlich gemäß § 18 Abs. 2 MStV sind die oben genannten vertretungsberechtigten Gesellschafter.</p>
      </section>
    </LegalPageShell>
  );
}

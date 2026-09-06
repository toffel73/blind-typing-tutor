import type { Metadata } from "next";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { LegalPageShell } from "@/components/layout/LegalPageShell";
import { getSessionUser } from "@/server/authService";

export const metadata: Metadata = {
  title: "Datenschutzerklärung | OCK – Tastatutor",
  robots: { index: false, follow: false },
};

export default async function DatenschutzPage() {
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get("auth_session")?.value ?? "";
  if (!getSessionUser(sessionToken)) redirect("/login");

  return (
    <LegalPageShell title="Datenschutzerklärung">
      <section>
        <h2>1. Verantwortliche Stelle</h2>
        <p>
          Gemeinschaftspraxis Orthopädie und Chirurgie Köln (GbR)<br />
          Aachener Straße 557b, 50933 Köln-Braunsfeld<br />
          Telefon: <a href="tel:+492214972990">0221 4972990</a><br />
          E-Mail: <a href="mailto:info@oc-koeln.de">info@oc-koeln.de</a>
        </p>
      </section>

      <section>
        <h2>2. Datenschutzbeauftragte</h2>
        <p>
          Melanie Schmolke<br />
          Gemeinschaftspraxis Orthopädie und Chirurgie Köln<br />
          Aachener Straße 557b, 50933 Köln<br />
          Telefon: <a href="tel:+492214972990">0221 4972990</a><br />
          E-Mail: <a href="mailto:info@oc-koeln.de">info@oc-koeln.de</a>
        </p>
      </section>

      <section>
        <h2>3. Zweck und Umfang der Anwendung</h2>
        <p>
          Der OCK-Tastatutor ist eine interne Lernanwendung zur Verbesserung des Tastschreibens.
          Die Anwendung verarbeitet keine Patientendaten und ist nicht für die Eingabe realer
          Behandlungs-, Befund- oder Gesundheitsdaten bestimmt.
        </p>
      </section>

      <section>
        <h2>4. Benutzerkonto und Anmeldung</h2>
        <p>Für die Nutzung werden Benutzername, technisch gesicherter Passwort-Hash, Benutzerrolle sowie Erstellungszeitpunkt des Kontos verarbeitet. Das Klartextpasswort wird nicht gespeichert.</p>
        <p>Die Verarbeitung dient der sicheren Bereitstellung der internen Anwendung und erfolgt auf Grundlage von Art. 6 Abs. 1 lit. b beziehungsweise lit. f DSGVO sowie, soweit die Nutzung im Beschäftigungskontext erfolgt, § 26 BDSG.</p>
      </section>

      <section>
        <h2>5. Lernfortschritt und Trainingsstatistiken</h2>
        <p>Zur persönlichen Lernfortschrittsanzeige speichert die Anwendung insbesondere:</p>
        <ul>
          <li>aktuelle Lektion und Lernstufe,</li>
          <li>Zeitpunkt und Dauer von Trainingseinheiten,</li>
          <li>Wörter pro Minute, Genauigkeit und Fehlerzahl,</li>
          <li>Anzahl versuchter und richtig geschriebener Wörter.</li>
        </ul>
        <p>Diese Daten werden dem jeweils angemeldeten Nutzer angezeigt. Eine Ausbilder- oder Leistungsüberwachungsansicht ist nicht Bestandteil der Anwendung.</p>
      </section>

      <section>
        <h2>6. Session-Cookie und lokale Speicherung</h2>
        <p>Für die Anmeldung wird das technisch notwendige Cookie <code>auth_session</code> verwendet. Es enthält einen zufälligen Sitzungsschlüssel; serverseitig wird nur dessen kryptografischer Hash gespeichert.</p>
        <p>Darüber hinaus speichert der Browser funktionale Einstellungen, beispielsweise Darstellungs-, Tastatur- und Trainingsoptionen, im lokalen Speicher. Diese Einträge können über die Browserfunktionen gelöscht werden.</p>
      </section>

      <section>
        <h2>7. Server-Logdaten</h2>
        <p>Beim Aufruf der Anwendung werden technisch notwendige Verbindungsdaten verarbeitet. Dazu können IP-Adresse, Zeitpunkt, angeforderte Adresse, Browserkennung und Übertragungsstatus gehören. Die Verarbeitung dient der sicheren und störungsfreien Bereitstellung gemäß Art. 6 Abs. 1 lit. f DSGVO.</p>
      </section>

      <section>
        <h2>8. Schriftarten und Reichweitenmessung</h2>
        <p>Die Anwendung bindet Schriftarten von Google Fonts ein. Dabei kann der Browser eine Verbindung zu Google-Servern herstellen und insbesondere die IP-Adresse übermitteln.</p>
        <p>Sofern für die Anwendung eine Google-Analytics-Mess-ID konfiguriert und Google Analytics aktiviert wird, können Nutzungs- und Gerätedaten an Google übermittelt werden. Eine solche optionale Reichweitenmessung darf nur unter Beachtung der erforderlichen datenschutzrechtlichen Voraussetzungen betrieben werden.</p>
      </section>

      <section>
        <h2>9. Speicherdauer und Löschung</h2>
        <p>Kontodaten, Lernfortschritt und Trainingsstatistiken werden grundsätzlich bis zur Löschung des Benutzerkontos gespeichert. Bei der administrativen Kontolöschung werden die zugehörigen Sitzungen, Lernstände und Trainingsdaten aus der Anwendungsdatenbank entfernt. Gesetzliche Aufbewahrungspflichten bleiben unberührt.</p>
      </section>

      <section>
        <h2>10. Empfänger und Auftragsverarbeitung</h2>
        <p>Zugriff erhalten nur hierzu berechtigte Personen und technisch eingesetzte Dienstleister, soweit dies für Hosting, Wartung oder Sicherheit erforderlich ist. Eine Weitergabe zu Werbezwecken findet nicht statt.</p>
      </section>

      <section>
        <h2>11. Rechte betroffener Personen</h2>
        <p>Betroffene Personen haben nach Maßgabe der gesetzlichen Voraussetzungen das Recht auf Auskunft, Berichtigung, Löschung, Einschränkung der Verarbeitung, Datenübertragbarkeit und Widerspruch. Zudem besteht ein Beschwerderecht bei einer Datenschutzaufsichtsbehörde.</p>
        <p>Anfragen können an <a href="mailto:info@oc-koeln.de">info@oc-koeln.de</a> gerichtet werden.</p>
      </section>

      <section>
        <h2>12. Stand</h2>
        <p>Stand: September 2026</p>
      </section>
    </LegalPageShell>
  );
}

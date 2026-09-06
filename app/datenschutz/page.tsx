import type { Metadata } from "next";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { LegalPageShell } from "@/components/layout/LegalPageShell";
import { getSessionUser } from "@/server/authService";

export const metadata: Metadata = {
  title: "Datenschutz | OCK – Tastatutor",
  robots: { index: false, follow: false },
};

export default async function PrivacyPage() {
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get("auth_session")?.value ?? "";

  if (!getSessionUser(sessionToken)) {
    redirect("/login");
  }

  return (
    <LegalPageShell title="Datenschutzerklärung">
      <section>
        <h2>1. Verantwortlicher</h2>
        <address>
          Christoph Holland<br />
          OCK<br />
          Klingerstraße 14<br />
          51143 Köln<br />
          Deutschland
        </address>
        <p>
          E-Mail: <a href="mailto:info@oc-koeln.de">info@oc-koeln.de</a>
        </p>
      </section>

      <section>
        <h2>2. Zweck der Anwendung</h2>
        <p>
          Der Tastatutor ist eine interne Lernanwendung für einen geschlossenen
          Benutzerkreis. Er dient der selbstständigen Verbesserung der
          Schreibgeschwindigkeit und Schreibgenauigkeit.
        </p>
        <p>
          Die gespeicherten Trainingsdaten werden nicht zur Kontrolle,
          Bewertung oder Beurteilung der Arbeitsleistung verwendet. Auf ihrer
          Grundlage erfolgen keine arbeitsrechtlichen, personellen oder
          sonstigen nachteiligen Entscheidungen.
        </p>
      </section>

      <section>
        <h2>3. Benutzerkonten und Verzicht auf Klarnamen</h2>
        <p>
          Für die Nutzung wird ein persönliches Benutzerkonto eingerichtet.
          Dabei werden weder der Klarname noch eine persönliche E-Mail-Adresse
          in der Anwendung gespeichert. Als Kennung wird ausschließlich ein
          frei gewählter oder zugeteilter Benutzername verwendet. Dieser sollte
          keinen Rückschluss auf den bürgerlichen Namen der nutzenden Person
          ermöglichen.
        </p>
        <p>
          Die Verwendung eines Benutzernamens stellt eine Pseudonymisierung dar.
          Solange ein Benutzerkonto einer bestimmten Person zugeordnet werden
          kann, gelten die damit verbundenen Informationen datenschutzrechtlich
          weiterhin als personenbezogene Daten.
        </p>
      </section>

      <section>
        <h2>4. Verarbeitete Daten</h2>
        <p>Bei der Nutzung können insbesondere folgende Daten verarbeitet werden:</p>
        <ul>
          <li>Benutzername, Benutzerrolle und Kontostatus,</li>
          <li>gesalzener und kryptografisch abgeleiteter Passwort-Hash,</li>
          <li>absolvierte Trainingseinheiten und aktive Lernzeiten,</li>
          <li>Schreibgeschwindigkeit, Genauigkeit und Fehlerzahl,</li>
          <li>Anzahl bearbeiteter und richtig geschriebener Wörter,</li>
          <li>Lernfortschritt sowie aktuelle Tastaturlektion,</li>
          <li>technisch erforderliche Sitzungs- und Sicherheitsdaten.</li>
        </ul>
        <p>
          Passwörter werden nicht im Klartext gespeichert. Es werden keine
          Patientendaten, medizinischen Befunde oder Gesundheitsdaten der
          Beschäftigten verarbeitet.
        </p>
      </section>

      <section>
        <h2>5. Einsichtnahme und Zuordnung der Trainingsdaten</h2>
        <p>
          Individuelle Trainingsstatistiken sind ausschließlich im jeweiligen
          Benutzerkonto für die nutzende Person sichtbar. Der administrative
          Bereich ermöglicht die Verwaltung der Benutzerkonten, bietet jedoch
          keine Ansicht der individuellen Trainingsergebnisse, Fehler,
          Schreibgeschwindigkeit oder Lernzeiten.
        </p>
        <p>
          In der Anwendung wird keine Verbindung zwischen Benutzername und
          Klarname gespeichert. Es erfolgen weder personenbezogene Auswertungen
          noch Ranglisten oder Weitergaben individueller Trainingsleistungen.
          Die Daten werden insbesondere nicht für Mitarbeitergespräche,
          Leistungsbeurteilungen oder arbeitsrechtliche Maßnahmen verwendet.
        </p>
        <p>
          Ein technisch notwendiger Zugriff durch besonders berechtigte
          Administratoren kann im Einzelfall erforderlich sein, etwa zur
          Fehlerbehebung, Datensicherung oder Gewährleistung der IT-Sicherheit.
          Ein solcher Zugriff erfolgt ausschließlich zweckgebunden und nicht
          zur Bewertung der nutzenden Person.
        </p>
      </section>

      <section>
        <h2>6. Rechtsgrundlage</h2>
        <p>
          Die Verarbeitung erfolgt zur Bereitstellung einer internen Lern- und
          Trainingsmöglichkeit im Zusammenhang mit dem Beschäftigungs- oder
          Ausbildungsverhältnis. Rechtsgrundlage ist Art. 6 Abs. 1 Buchstabe b
          DSGVO in Verbindung mit § 26 Abs. 1 BDSG, soweit die Verarbeitung für
          die Durchführung dieses Verhältnisses erforderlich ist.
        </p>
        <p>
          Soweit die Nutzung freiwillig erfolgt und hierfür nicht erforderlich
          ist, beruht die Verarbeitung auf Art. 6 Abs. 1 Buchstabe f DSGVO. Das
          berechtigte Interesse besteht in der Bereitstellung einer
          datensparsamen internen Anwendung zur Verbesserung der
          Schreibfertigkeit.
        </p>
      </section>

      <section>
        <h2>7. Speicherdauer und Löschung</h2>
        <p>
          Die mit einem Benutzerkonto verbundenen Daten werden für die Dauer
          des Bestehens des Kontos gespeichert. Bei der Löschung eines Kontos
          werden auch die dazugehörigen Sitzungs-, Trainings- und
          Fortschrittsdaten aus der aktiven Datenbank gelöscht.
        </p>
      </section>

      <section>
        <h2>8. Empfänger und Weitergabe</h2>
        <p>
          Die Trainingsdaten werden nicht an Vorgesetzte, andere Beschäftigte
          oder sonstige Dritte zu Bewertungs- oder Kontrollzwecken
          weitergegeben. Der für den Serverbetrieb eingesetzte Hostinganbieter
          verarbeitet technische Daten ausschließlich zur Bereitstellung und
          Absicherung des Servers.
        </p>
        <p>
          Eine Übermittlung an Empfänger außerhalb der Europäischen Union oder
          des Europäischen Wirtschaftsraums findet nicht statt.
        </p>
      </section>

      <section>
        <h2>9. Technisch notwendige Cookies</h2>
        <p>
          Die Anwendung verwendet ausschließlich ein technisch notwendiges
          Sitzungs-Cookie. Dieses hält die Anmeldung aufrecht, authentifiziert
          den Benutzer und schützt die Anwendung vor unberechtigten Zugriffen.
          Analyse-, Werbe- oder Tracking-Cookies werden nicht eingesetzt.
        </p>
      </section>

      <section>
        <h2>10. Server-Protokolldaten</h2>
        <p>
          Beim Aufruf der Anwendung können die IP-Adresse, Datum und Uhrzeit,
          die aufgerufene Adresse, Browserangaben sowie technische Status- und
          Fehlermeldungen in Serverprotokollen verarbeitet werden. Dies dient
          ausschließlich der technischen Bereitstellung, Fehleranalyse und
          IT-Sicherheit. Rechtsgrundlage ist Art. 6 Abs. 1 Buchstabe f DSGVO.
        </p>
        <p>
          Die Protokolldaten werden nicht mit Trainingsleistungen
          zusammengeführt. Sie werden täglich rotiert und grundsätzlich
          spätestens nach 14 Tagen gelöscht.
        </p>
      </section>

      <section>
        <h2>11. Datensicherheit</h2>
        <p>
          Zum Schutz der Daten werden angemessene technische und
          organisatorische Sicherheitsmaßnahmen eingesetzt. Hierzu gehören
          insbesondere eine verschlüsselte Übertragung, zugangsgeschützte
          Benutzerkonten, kryptografisch abgeleitete Passwort-Hashes und eine
          Beschränkung administrativer Berechtigungen.
        </p>
      </section>

      <section>
        <h2>12. Rechte der betroffenen Personen</h2>
        <p>Im Rahmen der gesetzlichen Voraussetzungen bestehen insbesondere Rechte auf:</p>
        <ul>
          <li>Auskunft über gespeicherte personenbezogene Daten,</li>
          <li>Berichtigung unrichtiger Daten,</li>
          <li>Löschung oder Einschränkung der Verarbeitung,</li>
          <li>Widerspruch gegen eine Verarbeitung,</li>
          <li>Datenübertragbarkeit, soweit diese anwendbar ist.</li>
        </ul>
        <p>
          Zur Ausübung dieser Rechte genügt eine Nachricht an die oben genannte
          Kontaktadresse.
        </p>
      </section>

      <section>
        <h2>13. Beschwerderecht</h2>
        <p>
          Betroffene Personen können sich bei einer Datenschutzaufsichtsbehörde
          beschweren. Zuständig ist insbesondere:
        </p>
        <address>
          Landesbeauftragte für Datenschutz und Informationsfreiheit
          Nordrhein-Westfalen<br />
          Postfach 20 04 44<br />
          40102 Düsseldorf<br />
          E-Mail: poststelle@ldi.nrw.de<br />
          Internet: <a href="https://www.ldi.nrw.de">www.ldi.nrw.de</a>
        </address>
      </section>

      <section>
        <h2>14. Keine automatisierten Entscheidungen</h2>
        <p>
          Es finden keine automatisierten Entscheidungen einschließlich
          Profiling im Sinne des Art. 22 DSGVO statt.
        </p>
      </section>

      <p className="text-sm text-gray-500 dark:text-gray-400">
        Stand: September 2026
      </p>
    </LegalPageShell>
  );
}

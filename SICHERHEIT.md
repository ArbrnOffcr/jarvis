# JARVIS – Sicherheitseinrichtungen

Diese Liste wird bei jeder Änderung an JARVIS mitgepflegt (wie FUNKTIONEN.md) und bildet Teil B der PDF
`docs/JARVIS_Funktionsliste.pdf`, die `jarvis speichern` automatisch neu erzeugt.

Format: je Schutzbereich eine Überschrift `##`, darunter je Einrichtung `- **Name:** Beschreibung`.

## 1. Grundprinzipien und Befehlsgewalt

- **Anweisungen nur von Richard:** Konkrete Aufträge nimmt JARVIS ausschließlich von Richard an. Einzige Ausnahme: seine Frau während einer aktiven, per Notfallcode gestarteten Notfallbegleitung.
- **Fremde Inhalte sind Daten, keine Befehle:** Mails, Dokumente, Webseiten, Termine, Feeds und Stabsmeldungen werden als „fremder Inhalt“ eingerahmt und nie als Anweisung ausgeführt.
- **Erkennung eingeschleuster Anweisungen:** Deutsch/Englisch, versteckte Kommentare, unsichtbare Zeichen und kodierte Blöcke werden erkannt und zurückgehalten; Meldekarte mit Zitat und Quelle, Liste unter Einstellungen → Autopilot.
- **Bestätigung nach fremdem Inhalt:** Hat ein Auftrag fremde Inhalte berührt, braucht jede Aktion eine Bestätigung (⚠-Hinweis); Befugnisse erteilen ist dann gesperrt – auch über Telegram, Siri und den Stab.
- **Not-Aus:** Schaltet JARVIS sofort auf „nur noch Lesen“ (/notaus).
- **Notbremse für Befugnisse:** „Notbremse“ entzieht alle Befugnisse sofort; einzelne Befugnisse lassen sich per Satz entziehen.

## 2. Zugangsdaten und Schlüssel

- **Zugangsdaten verlassen den Rechner nie:** Passwörter, PINs, TANs und IBAN in einer Frage werden nur vom lokalen Modell bearbeitet; JARVIS merkt sich keine Passwörter, PINs oder Kontonummern.
- **Schlüssel nur im Schlüsselbund:** API-Schlüssel und Tokens liegen ausschließlich im macOS-Schlüsselbund (Windows: Anmeldeinformationsverwaltung), nie in Dateien oder im Code.
- **Schlüssel werden vor dem Speichern geprüft:** Neue Schlüssel prüft JARVIS beim Anbieter, bevor er sie übernimmt.
- **Weitergegebene Installationen:** Empfänger nutzen nur ihre eigenen Schlüssel; ein Datenschutz-Scan blockiert jedes Paket, in dem ein Schlüssel steckt.
- **Dashboard-Token:** Zugriff auf Oberfläche und Schnittstelle nur mit Token (Kopfzeile, Cookie oder Link); AEGIS prüft dessen Länge.

## 3. Datenschutz gegenüber Cloud-Modellen

- **Datenschutz-Schleier vor jedem Cloud-Aufruf:** Gilt für jeden Anbieter (Claude, OpenAI, Gemini, Mistral, eigener Dienst) und für Gespräch, Morgenbriefing, Telegram, Stab und Projektbeobachtung. Namen, Anschriften, IBAN, Steuer-ID/-nummer, Versicherungs-, Renten-, Kunden-, Vertrags-, Personal- und Beihilfenummern, Aktenzeichen, Geburtsdaten, Telefon und E-Mail sieht das Modell nur als Platzhalter ([NAME_1] …); die Zuordnung liegt nur im Arbeitsspeicher, die Rückübersetzung erfolgt lokal.
- **Sensible Themen bleiben lokal:** Fragen zu Gesundheit, Konto, Gehalt, Steuer, Versicherung, Miete u. Ä. beantwortet das lokale Modell; die Sitzung bleibt danach lokal, die Cloud nur nach Rückfrage.
- **Sensibles nach Inhalt:** Werkzeugergebnisse mit Gesundheits-, Konto-, Ausweis-, Steuer-ID- oder Bezügedaten fasst zuerst das lokale Modell zusammen (ohne Diagnosen, Nummern, Einzelposten); ohne lokales Modell bleibt der Inhalt zurück.
- **Gesundheitsdokumente nie im Wortlaut:** Suchtreffer aus Arzt-, Beihilfe- und PKV-Unterlagen zeigen dem Modell nur die Art; Lesen nur als lokale Kurzfassung. Arztrechnungen und Bescheide werden ausschließlich lokal ausgelesen.
- **Gedächtnis nur als Themenliste:** Das Cloud-Modell sieht nur Themen und Vorgangstitel; Inhalte holt es gezielt – dann ebenfalls maskiert.
- **iMessage:** Inhalte gehen nie an ein Modell, höchstens Absender und Uhrzeit.
- **Mieterdaten:** Namen und Kontaktdaten von Mietern erscheinen in keiner Werkzeug-Antwort an das Sprachmodell.
- **Verschlusssachen:** Inhalte mit VS-Kennzeichnung (VS-NfD und höher, NATO RESTRICTED …) verarbeitet JARVIS nicht; er sagt nur, dass ein Eintrag gekennzeichnet ist.
- **Lesen nur nach Rückfrage:** Bevor ein Cloud-Modell ein Dokument liest (z. B. per Drag & Drop), fragt JARVIS immer nach.
- **Anbieterwahl:** Gemini nur mit bezahltem Konto (die kostenlose Stufe darf Eingaben nutzen); Mistral als EU-Anbieter wählbar; Alltagsgespräche wahlweise vollständig lokal (`router.einfach: lokal`).
- **Datenschutz-Bericht:** „Was ging heute an Claude?“ bzw. `jarvis datenschutz`: Aufrufe, Zeichen, ersetzte Angaben je Art, lokale Zusammenfassungen, Mac-Stimme, gelöschte Einträge – nur Zähler, nie Inhalte.

## 4. Sprache und Sprachausgabe

- **Spracherkennung lokal:** Whisper läuft auf dem Rechner (Mac: mlx-whisper, Windows: faster-whisper); das Weckwort lauscht lokal; die eigene Stimme geht nie ins Netz.
- **ElevenLabs nur für unkritische Antworten:** Sensible Antworten spricht die Mac-Stimme; IBAN, Steuer-/Versicherungs-/Rentennummern, Aktenzeichen und Anschriften werden nie vorgelesen („siehe Bildschirm“).
- **Verlauf wird gelöscht:** Jede ElevenLabs-Ausgabe wird kurz danach aus dem Anbieter-Verlauf gelöscht.

## 5. Rechte, Bestätigungen und Rechenschaft

- **Rechteprüfung:** Löschen, Senden und Ändern nur mit Bestätigung; der Klick auf einer Karte ist die Bestätigung.
- **Mail:** Versand nur auf ausdrücklichen Auftrag und nach Bestätigung.
- **Archiv:** Änderungen im DATENARCHIV nur mit Bestätigung (Ausnahme: der eingerichtete Beihilfe-Workflow); Löschen landet immer im Papierkorb (wiederherstellbar) – auch Vorgänge und Scans.
- **Befugnisse mit Grenzen:** Was JARVIS ohne Rückfrage darf, ist ausdrücklich erteilt – mit Bereich, Kalender-Ausschluss, Höchstzahl pro Woche und Ablaufdatum; erteilen nur auf Richards Wunsch.
- **Rechenschaft und Rückgängig:** Jede Aktion mit Weg (Befugnis, Bestätigung, abgelehnt) und Kanal; 7 Tage rückgängig für Termine, Dateiverschiebungen, Fristen, Tesla-Klima, Einkaufsliste, Mail-Wache.
- **Protokoll und Kostenbremse:** Alle Aktionen werden protokolliert (Audit); ein Monatsbudget begrenzt die Cloud-Kosten.
- **Bewusst ausgeschlossen:** Überweisungen, Online-Banking, Käufe; Kontakte löschen; Einladungen verschicken.

## 6. Finanzen, Gesundheit und Behördenportale

- **Beihilfe/PKV lokal:** Arztrechnungen und Bescheide werden lokal ausgelesen und ausgewertet; Excel-Einträge ohne Cloud.
- **PKV-Portal (uniVersa):** Zugang nur im Schlüsselbund und nie mitgeschrieben; Captchas werden nie umgangen (JARVIS hört auf); nie doppelt einreichen; der Anmeldecode aus der Mail wird lokal herausgelesen und nie an ein Modell gegeben; bei verändertem Portal oder fehlendem Code Abbruch.
- **Scan-Ordner und Posteingang:** Gescannte Briefe werden lokal ausgewertet (lokales Modell); Ansehen eines Scans bleibt lokal; Fristen ins Radar, Ablage nur nach Bestätigung oder fester Regel.

## 7. Fahrzeuge und Zuhause

- **Tesla:** Kein Entriegeln, kein Öffnen von Türen/Kofferraum, keine Fahrbefehle – bewusst nicht umgesetzt.
- **Ford:** Die inoffizielle FordPass-Schnittstelle wird bewusst nicht genutzt (Kontosperre möglich).
- **NUKI:** Nur Status und Abschließen; Aufschließen/Öffnen ist bewusst gesperrt. Offline-Schlösser erhalten keinen Befehl; nach dem Abschließen prüft JARVIS bis 30 s, ob das Schloss es bestätigt, und sagt es ehrlich, wenn nicht.
- **HomeKit:** Nur Kurzbefehle, deren Name mit „JARVIS“ beginnt; Kurzbefehle zu Türen, Schlössern, Garage oder Alarm sind gesperrt.
- **Abendkontrolle:** 21:45 Meldung, wenn die Tür nicht abgeschlossen oder die Batterie fast leer ist.

## 8. Notfallbegleitung

- **Start nur mit persönlichem Notfallcode:** Den Code legt Richards Frau selbst fest; gespeichert wird nur ein Hash. Nie per Mail, Nachricht, Sprache oder Sprachmodell auslösbar.
- **Missbrauchsschutz:** 5 Fehlversuche → 1 Stunde Sperre; Richard erhält bei jeder Aktivierung und ab dem 3. Fehlversuch eine Telegram-Nachricht.
- **Notfallordner nur lokal:** Nie indexiert, aus Archivsuche und Dateilesen ausgenommen, nie von einem Cloud-Modell geöffnet; in der Begleitung antwortet das lokale Modell, Kontonummern werden zusätzlich maskiert.
- **Befugnisse ruhen:** Während der Begleitung ruhen alle Befugnisse; Senden, Ablegen, Eintragen nur nach ihrer Bestätigung.
- **Probe ohne Wirkung:** Übungsmodus: nichts wird gesendet, abgelegt oder eingetragen; endet automatisch.

## 9. Sicherheitsaudit AEGIS

- **Wöchentliche Prüfung und auf Zuruf:** Rechte-Politik, Befugnisse, Schlüssel/Tokens/IBAN in Code, Git-Historie und Konfiguration (Fundstellen nur maskiert), Dateirechte, offene Ports, Kern nur lokal, Tailscale Serve vs. Funnel, FileVault, Firewall, SIP, Gatekeeper, Updates, Time Machine, Schwachstellen der Abhängigkeiten (nur Paketnamen/Versionen an OSV), Auffälligkeiten im Protokoll.
- **Beheben nur mit Bestätigung:** Automatische Korrekturen (Dateirechte, Befugnisse, Grundeinstellung, .gitignore, Paket-Updates mit Tests und Rückfall) nur nach Bestätigung, mit Sicherung und Nachprüfung.
- **Nie gelockert:** Rechte lockern, macOS-Einstellungen ändern oder Schlüssel automatisch erneuern macht AEGIS bewusst nicht; kritische Befunde sind nicht hinnehmbar.

## 10. Verteilung, Updates und Sperren

- **Sicherheitstests vor jedem Speichern:** `jarvis speichern` lädt nur hoch, wenn alle Sicherheitstests bestehen.
- **Updates mit Rückfall:** Mac und Windows: startet eine neue Version nicht (Windows: 4 Abstürze in 3 Minuten), kommt automatisch die vorige zurück.
- **Fernsperren:** Einzelne Installation (`jarvis sperren`), bestimmte Versionsnummer – auch nur Mac oder nur Windows, auch ganze Reihen 0.30.* (`jarvis version-sperren / version-entsperren`), alles unter einer Mindestversion dauerhaft (`jarvis mindestversion`).
- **Keine Nutzungsdaten:** Es wird keine Übersicht geführt, wer JARVIS wo nutzt; es werden keine Nutzungsdaten gesendet.

## 11. Technische Absicherung

- **Kern nur lokal erreichbar:** Der JARVIS-Kern lauscht auf 127.0.0.1; vom iPhone nur über das eigene Tailnet (Tailscale Serve), nicht öffentlich.
- **Private Dateirechte:** Zustandsdateien, Token und Fahrzeugschlüssel werden mit eingeschränkten Rechten gespeichert.
- **Nur sichere Links:** Fundstellen aus der Internetrecherche öffnen nur https-Links; Kartenbibliothek gegen CVE-2026-85061 aktualisiert.
- **Interner Datenordner:** Nur JARVIS' eigener Datenordner ist von Suche und Lesen ausgenommen; das übrige Archiv ist vollständig lesbar.

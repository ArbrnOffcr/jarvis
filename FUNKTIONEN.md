# JARVIS – Funktionsliste

Stand: 27.10.2026 · Version 0.8
Diese Liste wird bei jeder Änderung an JARVIS mitgepflegt. JARVIS liest sie selbst, wenn du ihn fragst: „Was kannst du?“

Bedeutung der Zeichen:
- ✅ = funktioniert
- ⚙️ = funktioniert, braucht aber eine Einrichtung (Schlüssel, Ordner …)
- 🔒 = JARVIS fragt vorher nach deiner Bestätigung
- ❌ = kann JARVIS nicht (bewusst oder noch nicht)

---

## 1. Bedienung

| Funktion | Stand | Hinweis |
|---|---|---|
| Text-Chat im Dashboard und im Terminal (`jarvis`) | ✅ | |
| Start ohne Text: JARVIS begrüßt nur gesprochen („Guten Morgen/Tag/Abend, Sir“) und wartet; einmal am Tag kommt stattdessen das Tagesupdate mit Text | ✅ | Begrüßung entfällt, wenn die Stimme auf AUS steht |
| Spracheingabe per Leertaste (gedrückt halten) | ✅ | Erkennung lokal mit Whisper, nichts geht ins Netz |
| Weckwort „Hey Jarvis“ | ⚙️ | Knopf WECKWORT; lauscht lokal |
| Gesprächsmodus: nach jeder Antwort 6 s weiter zuhören | ✅ | Knopf GESPRÄCH: AN / OHNE STOPP / AUS |
| Unterbrechen: Dazwischenreden oder Leertaste stoppt JARVIS | ✅ | Bei Lautsprechern evtl. Echo → OHNE STOPP |
| Sprachausgabe mit ElevenLabs-Stimme, gestreamt | ⚙️ | Ohne Schlüssel: Mac-Stimme; mit Schlüssel: Standardstimme oder eigene Auswahl |
| Deutsch und Englisch (Antwort in der Sprache der Frage) | ✅ | |
| Eigene Mac-App mit Dauer-Mikrofon, Fenster frei verschiebbar | ✅ | `jarvis app` |
| Reduzierte Ansicht (nur Kern und Untertitel) und Dashboard-Ansicht | ✅ | Untertitel scrollbar |
| Dokumente per Drag & Drop in den Chat | ✅ | Vor dem Lesen durch Claude wird immer gefragt |
| Fotos/Scans vom iPhone („Ablage → Dokument/Kontakt vom iPhone“) | ✅ | Continuity Camera |
| Unterwegs per Telegram-Bot (Text, Fotos, PDFs, Briefing) | ⚙️ | ⚙ Einstellungen → Verbindungen → Telegram |
| iPhone-Web-App auf dem Home-Bildschirm (Sprechen, Untertitel, Karte, Player) | ⚙️ | Tailscale auf Mac und iPhone, dann ⚙ Einstellungen → iPhone → IPHONE VERBINDEN |
| Siri: „Hey Siri, frag Jarvis“ – Antwort wird vorgelesen | ⚙️ | Kurzbefehl aus ⚙ Einstellungen → iPhone; Bestätigungspflichtiges nur am Mac |
| Schnellknöpfe: TAGESLAGE, POSTEINGANG, WOCHE PLANEN, FRISTEN, VERGESSEN? | ✅ | |
| Telefonnotiz per ⌥⌘N | ✅ | Aufnahme → Zusammenfassung → Aufgaben |
| Not-Aus: nur noch Lesen | ✅ | `/notaus` |
| Geführte Einführung (ca. 3 Minuten, mit Übungen) | ✅ | startet nach der Installation; wiederholen: ⚙ Einstellungen, Menü Hilfe oder „Starte die Einführung“ |
| Einstellungen an einem Ort | ✅ | ⚙ EINSTELLUNGEN oder ⌘, |
| Schlüssel und Zugänge nachträglich einrichten – ohne Terminal (Claude, ElevenLabs mit Stimmenauswahl, iCloud, Telegram, Bilder, YouTube, Name/Wohnort, Dokumenten-Ordner, lokales Modell, iPhone) | ✅ | ⚙ Einstellungen → Verbindungen; Schlüssel werden vorher geprüft |
| Funktionsliste in JARVIS anzeigen; „Was kannst du?“ | ✅ | ⚙ Einstellungen → FUNKTIONSLISTE |

## 2. Kalender und Termine

| Funktion | Stand | Hinweis |
|---|---|---|
| Termine lesen (iCloud inkl. Familienkalender, abonnierte Kalender) | ⚙️ | iCloud-App-Passwort nötig |
| Termin anlegen, verschieben | ✅ | wird gemeldet |
| Termin löschen | 🔒 | |
| Wochenplan mit Engpässen und freien Tagen | ✅ | Sonntag 19 Uhr automatisch |
| Geburtstage aus den Kontakten | ✅ | |
| Einladungen an andere verschicken, Termine zusagen/absagen | ❌ | |
| Google- oder Outlook-Kalender | ❌ | nur iCloud und Abos |

## 3. Erinnerungen, Einkauf, Notizen

| Funktion | Stand | Hinweis |
|---|---|---|
| Erinnerungen lesen, anlegen (mit Fälligkeit), abhaken | ✅ | Apple Erinnerungen |
| Einkaufsliste: „Setz Milch auf die Einkaufsliste“ | ✅ | Liste „Einkäufe“, ohne Rückfrage, ohne Doppelte |
| „Was muss ich einkaufen?“ → kurze Aufzählung | ✅ | |
| Gekauftes abhaken („Hab die Butter gekauft“) | ✅ | |
| Notizen suchen, lesen, anlegen, ergänzen | ✅ | Apple Notizen |
| Erinnerungen oder Notizen löschen, Fälligkeit nachträglich ändern | ❌ | |
| Timer („10 Minuten für die Nudeln“), auch mehrere gleichzeitig | ✅ | Countdown oben, Alarm mit Stopp/+9 Min., Mitteilung |
| Wecker zu einer Uhrzeit, auch wiederkehrend (z. B. werktags) | ✅ | klingelt auf dem Mac, auf dem er gestellt wurde |

## 4. Mail und Nachrichten

| Funktion | Stand | Hinweis |
|---|---|---|
| Posteingang, Suche, Mail lesen (iCloud-Mail) | ⚙️ | |
| Entwurf schreiben – im eigenen Schreibstil (lokal gelernt) | ✅ | wird nur gespeichert, nicht gesendet |
| Mail senden, auch mit Dokument als Anhang | 🔒 | nur auf ausdrücklichen Wunsch |
| Wichtige neue Mails melden | ✅ | Einschätzung lokal |
| Werbefilter: Werbung in den Papierkorb (30 Tage zurückholbar) | ✅ | erste Woche nur Probelauf; Ausnahmen möglich |
| iMessage/SMS: neue Nachrichten melden und vorlesen | ⚙️ | Festplattenvollzugriff; Inhalt geht nie an die KI |
| iMessage/SMS schreiben („Schreib Anna, dass ich später komme“) | 🔒 | Empfänger aus den Kontakten; SMS braucht die iPhone-Weiterleitung |
| Gmail, Outlook, Exchange | ❌ | nur iCloud-Mail |

## 5. Kontakte

| Funktion | Stand | Hinweis |
|---|---|---|
| Kontakte suchen (Telefon, Mail, Adresse, Geburtstag) | ✅ | |
| Kontakt aus Foto/Visitenkarte/Signatur anlegen (Prüfkarte) | 🔒 | iPhone-Kamera oder Telegram „Kontakt“ |
| Diktierten Kontakt anlegen | 🔒 | |
| Kontakte ändern (Nummer, Mail, Adresse, Firma, Geburtstag, Notiz) | 🔒 | |
| Kontakte löschen | ❌ | bewusst nicht (kein Papierkorb in Kontakte) |

## 6. Dokumente und Archiv

| Funktion | Stand | Hinweis |
|---|---|---|
| Archiv inhaltlich durchsuchen (PDF, Scans, Office, Fotos – mit Texterkennung) | ⚙️ | Archiv-Ordner nötig; Index lokal |
| Ordner auflisten, Datei lesen | ✅ | |
| Datei im JARVIS-Fenster zeigen (mit Lupe) | ✅ | Klick auf den Pfad öffnet den Finder |
| Datei in ihrer App öffnen | ✅ | |
| Datei anlegen, verschieben, umbenennen | 🔒 | |
| Datei löschen | 🔒 | landet im JARVIS-Papierkorb |
| Word erstellen, ergänzen, Text ersetzen | ✅ / 🔒 | Ändern bestehender Dateien mit Bestätigung |
| Excel erstellen, Zellen setzen | ✅ / 🔒 | |
| PowerPoint erstellen | ✅ | |
| Bestehende PowerPoint bearbeiten | ❌ | |
| Hineingezogene Dokumente zusammenfassen, Fristen erkennen, Ablage vorschlagen | ✅ | Ablage 🔒 |

## 7. Post, Fristen, Steuer, Finanzen

| Funktion | Stand | Hinweis |
|---|---|---|
| Posteingang: gescannte Briefe erkennen (Absender, Betreff, Fristen) | ⚙️ | Genius-Scan-Ordner in iCloud; Auswertung lokal |
| Ablage vorschlagen | 🔒 | Ablegen nach Bestätigung |
| Bekannte Absender selbst ablegen | ✅ | erst nach 3 Bestätigungen und 30 Tagen |
| Fristenradar: Ausweis, TÜV, Vertragsende, Antwort ans Amt | ✅ | mit Vorlauf im Briefing und in Erinnerungen |
| Steuer-Sammelmappe: Belege vormerken | ✅ | |
| Steuer-Sammelmappe: Excel-Liste für den Steuerberater | ✅ | |
| Haushaltsbuch: Verträge, Abos, Versicherungen; Beitragsänderungen melden | ✅ | |
| Beihilfe/PKV: Arztrechnungen erfassen, Anträge und Zahlungen erinnern, Bescheide zuordnen | ⚙️ | Excel-Übersicht im passenden Format nötig |
| Überweisungen, Online-Banking, Käufe | ❌ | bewusst nicht |
| Passwörter, PINs, Kontonummern merken | ❌ | bewusst nicht; Kontonummern werden für die Cloud unkenntlich gemacht |

## 8. Wissen, Recherche, Anzeige

| Funktion | Stand | Hinweis |
|---|---|---|
| Internetrecherche mit Quellenangabe | ✅ | nur über Claude, nicht lokal |
| Tabellen, Diagramme und Karten im Dashboard | ✅ | |
| Fotos aus Google Bilder | ⚙️ | Serper-Schlüssel; sonst Wikimedia |
| YouTube-Videos eingebettet (stumm starten, Ton, Pause, nächstes) | ⚙️ | YouTube-Schlüssel |
| Kurze freie Clips zur Veranschaulichung | ✅ | |
| Prinzipskizzen beim Erklären („Wie funktioniert …?“) | ✅ | |
| Wetter am aktuellen Standort (Mac-Ortungsdienste oder iPhone), sonst am Heimatort | ⚙️ | Einmal Ortungsdienste erlauben; Standort gilt 8 Stunden |
| Wetter an heutigen Reisezielen: Termine mit Ort, die noch anstehen und mehr als 50 km entfernt sind – mit Wetter zur Terminzeit | ✅ | im Dashboard, im Tagesupdate und im Lagevortrag |
| Heimatort in den Einstellungen ändern (Ortsname, PLZ oder Adresse) | ✅ | Ortssuche über Open-Meteo und OpenStreetMap |
| Übersetzen, Texte formulieren, Konzepte und Pläne | ✅ | |
| Live-Kamera auswerten, Bilder selbst erzeugen | ❌ | |

## 9. Karte, Musik und Podcasts

| Funktion | Stand | Hinweis |
|---|---|---|
| Orte auf der Karte zeigen (3D-Anflug vom Globus) | ✅ | OpenStreetMap-Daten |
| Route mit Fahrzeit, Strecke, Ankunft und Abbiegehinweisen (Auto, Rad, zu Fuß) | ✅ | ohne Live-Verkehr; Start = Standort (iPhone) oder Zuhause |
| Route an Apple Karten übergeben (mit Verkehr, Navigation) | ✅ | Knopf „IN APPLE KARTEN“ |
| „Wo ist?“ öffnen (Personen, Geräte, AirTags) | ✅ | |
| Standorte aus „Wo ist?“ im Dashboard anzeigen | ❌ | Apple sperrt den Zugriff |
| Musik aus der Mediathek: Titel, Album, Künstler, Playlist | ✅ | über die Musik-App |
| Musik aus dem Apple-Music-Katalog | ⚙️ | öffnet in der Musik-App; startet evtl. erst nach einmal ▶ |
| Podcasts (neueste Folge oder nach Stichwort) | ✅ | spielt im JARVIS-Player, merkt sich die Position |
| Steuerung per Sprache: Pause, weiter, nächstes, lauter/leiser, „Was läuft?“ | ✅ | |
| Mini-Player nur während der Wiedergabe; Musik wird leiser, wenn JARVIS spricht | ✅ | |
| Podcasts-App selbst steuern, Spotify | ❌ | |

## 10. Gedächtnis und Vorausdenken

| Funktion | Stand | Hinweis |
|---|---|---|
| Fakten über dich, Familie, Haushalt merken und vergessen | ✅ | lesbare Dateien in iCloud |
| Laufende Vorgänge mit Status, Frist und nächstem Schritt | ✅ | |
| Morgenbriefing (Termine, Fälliges, Fristen, Zahlungen, Wetter) | ✅ | Uhrzeit einstellbar |
| Hinweise im Tagesverlauf (bald fällig, wichtige Mails) | ✅ | |
| Wochencheck „Was habe ich vergessen?“ | ✅ | Freitag 16 Uhr |
| Gesprächsaufnahme mit Transkript, Zusammenfassung und Aufgaben | ✅ | lokal; Word-Datei im Archiv |

## 11. Datenschutz und Sicherheit

| Funktion | Stand | Hinweis |
|---|---|---|
| Sensible Themen (Gesundheit, Finanzen, Steuer …) bleiben lokal | ✅ | sonst Rückfrage vor der Cloud |
| Zugangsdaten verlassen den Mac nie | ✅ | |
| Schlüssel nur im Schlüsselbund | ✅ | |
| Rechteprüfung: Löschen, Senden, Ändern nur mit Bestätigung | ✅ | |
| Protokoll aller Aktionen, Kostenbremse (Monatsbudget) | ✅ | |
| Eigene Zusatzregeln in config.yaml (persona.zusatz) | ✅ | |

## 12. Stab – JARVIS als Chef des Stabes

| Funktion | Stand | Hinweis |
|---|---|---|
| Größere Aufträge („Bereite meine Woche vor“) verteilt JARVIS parallel an Sachgebietsagenten und trägt dir das gewichtete Ergebnis als Lagevortrag vor | ✅ | Sofort · Diese Woche · Zur Kenntnis |
| Sieben Agenten: Chronos (Termine), Hermes (Mail/Nachrichten), Adjutant (Dienstliches), Quaestor (Beihilfe/Finanzen, lokal), Archivar (Ablage), Scout (Recherche/Wetter), Quartiermeister (Einkauf/Routen) | ✅ | einzeln abschaltbar |
| Nur JARVIS spricht mit dir; Agenten stimmen sich bei Bedarf direkt untereinander ab | ✅ | nur Auskünfte, ohne Freigabe, protokolliert |
| Einfache Fragen beantwortet JARVIS weiter direkt | ✅ | |
| Schnellweg für Lagefragen („Was steht heute an?“, „Bereite meine Woche vor“, Morgenbriefing): Stab startet sofort, Daten werden vorab parallel abgerufen, JARVIS trägt in einem Schritt vor | ✅ | Quaestor meldet Fristen/Zahlungen ohne Sprachmodell |
| Geschwindigkeit mit und ohne Stab messen | ✅ | `jarvis messen` |
| Lagevortrag als animierte Präsentation (Tagesupdate, „Was steht heute an?“, „Bereite meine Woche vor“): Lage mit Kennzahlen, Sofort-Karten, Termine als Zeitstrahl bzw. Wochenraster (Dienst/Privat farbig), Wetter, Fristen mit Countdown-Ringen, Post & Erinnerungen, Zur Kenntnis | ✅ | Grafik wechselt synchron zur Stimme; ohne Stimme automatisch |
| Im Vortrag blättern und nachfragen: Pfeiltasten, „weiter“/„zurück“, Antippen einer Karte fragt JARVIS nach Details | ✅ | Esc oder „Vortrag schließen“ |
| Eigenes Emblem je Agent; beim Delegieren fliegen die Embleme sichtbar aus dem Kern, Abstimmungen und Meldungen werden als Datenpakete gezeigt | ✅ | auch in der Startsequenz und in den Einstellungen |
| Stab ein-/ausschalten | ✅ | Button STAB in der Kopfleiste, ⚙ Einstellungen → Stab oder „Schalte den Stab aus“ |
| Alle Agenten mit Aufgaben, Rechten und Werkzeugen ansehen | ✅ | ⚙ Einstellungen → Stab |
| Persönlichkeit von JARVIS einstellen: Grundton (Butler, Stabsoffizier, herzlich, sachlich), Humor, Ausführlichkeit, Du/Sie, eigene Anweisung | ✅ | auch per Sprache, mit Bestätigung |
| Persönlichkeit der Agenten: Tonfall, Ausführlichkeit, Modell, eigene Anweisung | ✅ | Quaestor bleibt immer lokal |
| Jede Persona-Änderung versioniert, mit Grund protokolliert und zurücksetzbar | ✅ | ATLAS-Privat/agenten/ |
| Einsatzprotokoll (wer, was, Modell, Dauer, Kosten – ohne Inhalte) | ✅ | Einstellungen → Stab → Letzte Einsätze |
| Kostengrenze für den Stab (Standard 20 € pro Monat), Hinweis bei 80 % | ✅ | per Befehl erhöhbar oder aufhebbar |
| Morgenbriefing vom Stab erstellt | ✅ | automatisch wie bisher |
| Agenten mit eigener Stimme | ❌ | bewusst nicht – nur JARVIS spricht |

## 13. Technik und Betrieb

| Funktion | Stand | Hinweis |
|---|---|---|
| Läuft als Hintergrunddienst mit Autostart | ✅ | |
| Mehrere Macs und Benutzer, Wache-Übergabe | ✅ | |
| Automatische Updates; startet eine neue Version nicht, kommt die vorige zurück | ✅ | |
| Schnelle Antworten | ✅ | Werkzeuge nach Bedarf, 1-h-Prompt-Cache, Vorwärmen |
| Lokales Sprachmodell (Ollama) für Privates und offline | ⚙️ | ca. 7 GB |
| Weitergabe: Installations-DMG mit grafischem Assistenten | ✅ | `jarvis paket` / `jarvis veroeffentlichen` |
| Weitergegebene Installationen nutzen nur die eigenen Schlüssel des Empfängers | ✅ | Datenschutz-Scan blockiert jeden Schlüssel im Paket |
| Weitergegebene Installation aus der Ferne deaktivieren (einzeln, alle, zu alte Versionen) | ✅ | `jarvis sperren <Kennung>`; Kennung steht beim Empfänger unter ⚙ Einstellungen |
| Übersicht, wer JARVIS wo nutzt | ❌ | bewusst nicht – es werden keine Nutzungsdaten gesendet |
| Intel-Macs, Windows, eigene App im App Store | ❌ | iPhone über Web-App, Siri und Telegram |
| Smart Home, Live-Verkehr in der eigenen Karte | ❌ | |

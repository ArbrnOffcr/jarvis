# JARVIS – Funktionsliste

Stand: 04.11.2026 · Version 0.36.0
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
| Frischer Start: JARVIS begrüßt nach Tageszeit („Guten Morgen/Tag/Abend, Sir.“) – gesprochen und als einzige Zeile, nie alter Text der letzten Sitzung; einmal am Tag kommt stattdessen das Tagesupdate. War die App länger als 5 Minuten verborgen oder minimiert, beginnt beim Zurückkommen eine neue Sitzung mit neuer Begrüßung | ✅ | Stimme auf AUS: Begrüßung nur als Text |
| Nahtloser Übergang: die Begrüßung wird während der Startsequenz vorgeladen und setzt ein, während das Zünden des Kerns ausklingt – keine Ruhepause mit anschließendem Sprung ins Sprechen | ✅ | |
| Spracheingabe per Leertaste (gedrückt halten) | ✅ | Erkennung lokal mit Whisper, nichts geht ins Netz |
| Weckwort „Hey Jarvis“ | ⚙️ | Knopf WECKWORT; lauscht lokal |
| Sprache: Deutsch als Standard, fließender Wechsel zwischen Deutsch und Englisch (er antwortet in der Sprache, in der du gerade sprichst/schreibst); andere Sprachen (Französisch, Italienisch, Arabisch …) nur auf Anweisung, z. B. „Lass uns Französisch sprechen“ – zurück mit „wieder Deutsch“ | ✅ | gilt bis zum Zurückschalten, Neustart oder 4 Stunden; ohne Anweisung erkennt die Spracherkennung fremde Sprachen fest als Deutsch; erkannte Sprache steht im Protokoll |
| Gesprächsmodus: nach jeder Antwort 6 s weiter zuhören | ✅ | Knopf GESPRÄCH: AN / OHNE STOPP / AUS |
| Unterbrechen: Dazwischenreden oder Leertaste stoppt JARVIS | ✅ | Bei Lautsprechern evtl. Echo → OHNE STOPP |
| Sprachausgabe mit ElevenLabs-Stimme, gestreamt | ⚙️ | Ohne Schlüssel: Mac-Stimme; mit Schlüssel: Standardstimme oder eigene Auswahl |
| Deutsch und Englisch (Antwort in der Sprache der Frage) | ✅ | |
| Eigene Mac-App mit Dauer-Mikrofon, Fenster frei verschiebbar | ✅ | `jarvis app` |
| Reduzierte Ansicht (nur Kern und Untertitel) und Dashboard-Ansicht | ✅ | Untertitel scrollbar |
| Stilwelt MOSAIK: abstraktes, frontales Gesicht mit dunklen Augenhöhlen, flacher Nase und flachem Mund, eingebettet in einen feinen Kachelteppich in Plexus-Farben, der kräftig wie eine zähe Masse wabert (treibende Wölbungen ohne Vorzugsrichtung, echte Tiefe, im Gesicht gedämpft); das Gesicht folgt ganz leicht der Maus; bei Bildern, Videos und Dokumenten bleibt MOSAIK erhalten (Gesicht gedämpft dahinter, kein Wechsel zum Kern) | ✅ | STIL-Knopf oder „Zeig dich als MOSAIK“; am Mac ca. 40.000 Kacheln |
| MOSAIK lebt: dezente Mimik, Mund passend zu Stimme und Lauten – auch bei reinen Textantworten liest er stumm mit; Zuhören färbt das Gesicht Plexus-Grün; Nachdenken zeigt gedämpfte Datenströme wie bei Plexus, die seitlich um den Kopf schwingen und oben hinter der Stirn – im Gehirn – verlöschen (nie über dem Gesicht) – je Quelle in eigener, zurückhaltender Farbe | ✅ | Mimik aus neun Posen (ChatGPT), neu aufbereiten: werkzeuge/mosaik/aufbereiten.py |
| Startsequenz je nach zuletzt gewähltem Stil: bei MOSAIK liegt der Teppich dunkel hinter der Sequenz, wächst beim Aufladen von der Mitte her und entfaltet sich beim Zünden nahtlos zum Gesicht | ✅ | bei Plexus wie bisher mit Globus |
| 3D-Fundament: Kern und MOSAIK zeichnen in Ruhe nur 30 Bilder/s, im Hintergrund (Fenster ohne Fokus) 20, bei offenem Grundriss/Fahrzeug-3D 24; ist MOSAIK aktiv, ruht der Kern ganz; ruckelt es, sinkt die Pixeldichte von selbst | ✅ | Einstellungen → Verbindungen → „3D-Grafik“: automatisch / immer hoch / sparsam (Akku) – mit Anzeige der aktuellen Bildrate |
| Avatare AURA, NOVA, MILO und eigene 3D-Modelle (.glb) | ❌ | entfernt, ersetzt durch MOSAIK; hochgeladene Modelle wandern beim ersten Start in den Papierkorb |
| Schnellleiste links: Fahrzeuge und Immobilien mit einem Klick – dezent, auch in der reduzierten Ansicht | ✅ | Name erscheint beim Darüberfahren |
| Dokumente per Drag & Drop in den Chat | ✅ | Vor dem Lesen durch Claude wird immer gefragt |
| Fotos/Scans vom iPhone („Ablage → Dokument/Kontakt vom iPhone“) | ✅ | Continuity Camera |
| Unterwegs per Telegram-Bot (Text, Fotos, PDFs, Briefing) | ⚙️ | ⚙ Einstellungen → Verbindungen → Telegram |
| iPhone-Web-App auf dem Home-Bildschirm (Sprechen, Untertitel, Karte, Player) | ⚙️ | Tailscale auf Mac und iPhone, dann ⚙ Einstellungen → iPhone → IPHONE VERBINDEN; „VERBINDUNG PRÜFEN“ zeigt, woran es hakt (Anmeldung, MagicDNS, HTTPS, Serve-Freigabe) und wie es zu beheben ist; Tailscale-Befehle funktionieren auch aus dem Hintergrunddienst (Mac-App von Tailscale) |
| Siri: „Hey Siri, frag Jarvis“ – Antwort wird vorgelesen | ⚙️ | Kurzbefehl aus ⚙ Einstellungen → iPhone; Bestätigungspflichtiges nur am Mac |
| Schnellknöpfe: TAGESLAGE, POSTEINGANG, WOCHE PLANEN, FRISTEN, VERGESSEN? | ✅ | |
| Telefonnotiz per ⌥⌘N | ✅ | Aufnahme → Zusammenfassung → Aufgaben |
| Not-Aus: nur noch Lesen | ✅ | `/notaus` |
| Geführte Einführung (ca. 3 Minuten, mit Übungen) | ✅ | startet nach der Installation; wiederholen: ⚙ Einstellungen, Menü Hilfe oder „Starte die Einführung“ |
| Setup-Guide für neue Benutzer: zehn Schritte mit Erklärung (wofür, wo bekommt man es, was kostet es), Pflicht/empfohlen/optional, Eingabe direkt im Guide mit Prüfung – KI-Modell (Claude oder OpenAI/Gemini/Mistral/eigener Dienst), lokales Modell, Dokumenten-Archiv, Kalender & Mail, Stimme, Telegram/iPhone, Extras (Bilder, YouTube, NUKI), Über dich; am Ende Checkliste und Start der Einführung | ✅ | startet bei der Erstinstallation vor der Einführung, solange kein KI-Schlüssel da ist; sonst ⚙ Einstellungen → Allgemein → „Setup-Guide“ oder „Starte den Setup-Guide“; merkt sich den letzten Schritt |
| Einstellungen an einem Ort | ✅ | ⚙ EINSTELLUNGEN, ⌘, oder Menü JARVIS → „Einstellungen …“; ist die Oberfläche nicht geladen (Kern antwortet nicht), meldet die Mac-App das mit Knopf „Neu laden“ statt stumm zu bleiben (nach `jarvis app`) |
| Versionsanzeige klein unten links im Dashboard (Version und Stand), aktualisiert sich nach Updates von selbst | ✅ | |
| Schlüssel und Zugänge nachträglich einrichten – ohne Terminal (Claude, ElevenLabs mit Stimmenauswahl, iCloud, Telegram, Bilder, YouTube, Name/Wohnort, Dokumenten-Ordner, lokales Modell, iPhone) | ✅ | ⚙ Einstellungen → Verbindungen; Schlüssel werden vorher geprüft |
| Dokumenten-Archiv wahlweise in iCloud Drive, OneDrive, Google Drive, Dropbox (bzw. jedem Cloud-Speicher unter „Orte“ im Finder) oder einem lokalen Ordner; Ordnerwahl startet direkt im gewählten Speicher; Dateien, die nur in der Cloud liegen, lädt JARVIS beim Lesen selbst | ✅ | ⚙ Einstellungen → Verbindungen → „Dokumenten-Ordner“; ohne iCloud findet JARVIS einen Ordner „DATENARCHIV“ ganz oben in OneDrive & Co. auch selbst; das private Gedächtnis bleibt in iCloud (ohne iCloud lokal) |
| Funktionsliste in JARVIS anzeigen; „Was kannst du?“ | ✅ | ⚙ Einstellungen → FUNKTIONSLISTE |
| Funktionsliste und alle Sicherheitseinrichtungen als PDF (Titelblatt, Inhaltsverzeichnis, Überblick je Bereich, Teil A Funktionen, Teil B Sicherheit) – wird bei jeder neuen Version automatisch neu erzeugt, liegt im Repository unter docs/ und hängt an jedem GitHub-Release | ✅ | entsteht bei `jarvis speichern` aus FUNKTIONEN.md und SICHERHEIT.md; von Hand: `python -m atlas.funktionsliste_pdf` |

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
| Posteingang, Suche, Mail lesen (iCloud-Mail oder anderes Mail-Konto) | ⚙️ | |
| Mail-Konto wählbar: iCloud (Standard), Gmail (App-Passwort), Outlook/Microsoft 365 (Anmeldung bei Microsoft per Code, kein Passwort), GMX, WEB.DE, T-Online oder beliebiger IMAP-Server; gilt für alles – Posteingang, Entwürfe, Senden, Mailwache, PKV-Code, Schreibstil, Wissensindex; Entwürfe-/Gesendet-Ordner erkennt JARVIS selbst | ✅ | Einstellungen → Verbindungen → „Mail-Konto“; Lesen und Senden werden vor dem Speichern geprüft; Passwort/Token nur im Schlüsselbund; Kalender bleibt iCloud; Outlook braucht einmalig eine eigene App-Registrierung (Client-ID) im Microsoft-Entra-Portal |
| Entwurf schreiben – im eigenen Schreibstil (lokal gelernt) | ✅ | wird nur gespeichert, nicht gesendet |
| Mail senden, auch mit Dokument als Anhang | 🔒 | nur auf ausdrücklichen Wunsch |
| Mail-Wache: Posteingang dauerhaft im Hintergrund überwachen und sofort melden, wenn eine erwartete Mail eintrifft (Absender und/oder Betreff, einmalig oder dauerhaft, optional bis Datum; auch „jede neue Mail“) | ✅ | „Sag mir Bescheid, wenn die Mail von … kommt“; Ansage mit „Soll ich sie vorlesen?“, Mitteilung, Telegram; Chip oben links; Einstellungen → Daten & Postfächer; erwartete Mails sortiert der Werbefilter nie aus |
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
| Archivsuche in drei Schichten: Dateiname & Ordner (unscharf – Umlaute/ß, Wortstämme, zusammengesetzte Wörter, Synonyme wie Meldebestätigung ↔ Meldebescheinigung), Stichwörter im Text und Bedeutung; je Dokument ein Treffer mit Datum, Ordner und Fundgrund | ✅ | findet Dokumente auch, wenn ihr Inhalt (noch) nicht lesbar ist; sagt nie vorschnell „gibt es nicht“ |
| „Alles zum Thema X“: viele Dokumente inkl. inhaltlich verwandter, nach Ordnern gruppiert, mit Zeitraum – JARVIS stellt sie im Zusammenhang vor (Ablauf, Bezüge, mögliche Lücken); „verwandte Dokumente“ zu einem Fund | ✅ | z. B. „Such mir alle Dokumente zu meinem Umzug nach Leipzig“ |
| Index heilt sich selbst: nicht lesbare Dokumente (iCloud-Platzhalter, gesperrte Dateien) werden aus iCloud geladen und erneut versucht; Name und Ablageort sind immer im Index | ✅ | bis 400 je Lauf, höchstens 6 Versuche; Stand unter `jarvis index` |
| Steckbrief je Dokument: das lokale Modell fasst jedes lesbare Dokument zusammen (Art, worum es geht, Absender, Beteiligte, Datum, Beträge, Fristen, Aktenzeichen, Orte, Schlagworte, Vorgang) – die Suche findet so nach Bedeutung, auch ohne gleiche Wörter | ✅ | entsteht im Hintergrund (Gespräche haben Vorrang), nur lokal; keine Steckbriefe für Verschlusssachen, bei Gesundheitsdokumenten nur die Art |
| Eine Suche über alles: Dokumente, Mails (Posteingang + Gesendet, 12 Monate), Termine (1 Jahr zurück, ½ Jahr voraus), Gedächtnis, Vorgänge und frühere Gespräche – „Was war da mit …?“, „Wann hatte ich …?“; „Alles zum Thema X“ zeigt Mails, Termine und Gespräche als eigene Gruppen | ✅ | Index der Mails/Termine nur lokal je Benutzer; iMessage bleibt außen vor |
| Suchtest mit Goldfragen: misst, ob JARVIS die erwarteten Dokumente findet (Platz 1, unter den ersten 5) | ✅ | `jarvis suchtest`; eigene Fragen in ATLAS-Privat/goldfragen.json ergänzen |
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
| „Ablage lernen“: Scan-Ordner aufräumen – holt alle Scans (auch früher nicht abgelegte) und geht sie der Reihe nach mit dir durch: ansehen, Ordner vorschlagen/durchsuchen, Namen anpassen, ablegen, überspringen oder in den Papierkorb; jede Ablage merkt sich JARVIS für den Absender, auf Wunsch als feste Regel | ✅🔒 | Einstellungen → Daten & Postfächer → Ablageregeln → „Ablage lernen“, auf jeder Briefkarte „Alle Scans der Reihe nach“ oder per Sprache „Räum den Scan-Ordner auf“; Lesen lokal, Papierkorb mit zweitem Klick |
| Im Finder abgelegt = gelernt: verschiebst du einen Scan selbst (auch umbenannt) aus dem Scan-Ordner ins DATENARCHIV, findet JARVIS ihn dort wieder (Spotlight, Größe und Inhalt) und merkt sich den Ordner für den Absender | ✅ | Sammelmeldung „Gesehen: Du hast … im Finder abgelegt – gemerkt“; gilt für Scans, die JARVIS schon kennt (einmal „Ablage lernen“ öffnen holt alle alten dazu) |
| Scan-Ordner ohne Fehlerflut: schon verarbeitete Scans werden nicht erneut gelesen (kein iCloud-Download bei jedem Durchgang); lässt sich etwas nicht lesen, kommt eine einzige Sammelmeldung statt einer Nachricht pro Datei | ✅ | behebt die Telegram-Meldungen „[Errno 60] Operation timed out“ |
| Scan-Ordner robust: Dateien, die noch nur in iCloud liegen, lädt JARVIS erst herunter; leere/halbfertige Exporte wartet er ab; ein echter Lesefehler wird je Datei nur einmal gemeldet (auch nach Neustarts), bis sich die Datei ändert | ✅ | |
| Briefkarte „▤ Durchsuchen“: durch das DATENARCHIV klicken (Pfadleiste, Suche, neuen Unterordner anlegen) und direkt ablegen; Haken „Briefe von … künftig immer hier ablegen“ macht daraus eine feste Regel – ab dem nächsten Brief legt JARVIS selbst ab und meldet es | ✅ | Regeln ansehen/entfernen: ⚙ Einstellungen → Daten → „Ablageregeln“; das ganze DATENARCHIV ist sichtbar – ausgenommen nur JARVIS' eigener Datenordner (Suchindex, Systemdateien); ohne festen Haken weiter: selbst ab der 3. Bestätigung nach 30 Tagen |
| Ablage vorschlagen | 🔒 | Ablegen nach Bestätigung |
| Bekannte Absender selbst ablegen | ✅ | erst nach 3 Bestätigungen und 30 Tagen |
| Fristenradar: Ausweis, TÜV, Vertragsende, Antwort ans Amt | ✅ | mit Vorlauf im Briefing und in Erinnerungen |
| Vorgänge erledigen oder löschen: im Dashboard rechts (Maus über den Vorgang → ✓ abschließen, ✕ löschen) und im Projektfenster; gelöschte Vorgänge liegen im Papierkorb, die Mahnung „seit … Tagen überschritten“ hört damit auf | ✅ | mit Rückfrage |
| Steuer-Sammelmappe: Belege vormerken | ✅ | |
| Steuer-Sammelmappe: Excel-Liste für den Steuerberater | ✅ | |
| Haushaltsbuch: Verträge, Abos, Versicherungen; Beitragsänderungen melden | ✅ | |
| Beihilfe/PKV: Arztrechnungen erfassen, Anträge und Zahlungen erinnern, Bescheide zuordnen | ⚙️ | Excel-Übersicht im passenden Format nötig |
| PKV-Antrag selbst im uniVersa-Kundenportal einreichen: einmal einlernen (du reichst im JARVIS-Browserfenster ein, er schreibt mit – ohne Passwort; bei „Durchsuchen“ legt er die Belege selbst ein), danach meldet er sich an, holt den Anmeldecode aus deiner Mail, lädt alle offenen Rechnungen (beider Kinder) in einem Antrag hoch, sendet ab und legt die Bestätigung ins PKV-Archiv; Browser: Safari-Technik (WebKit), kein Chrome nötig | 🔒 | `jarvis setup universa` (Zugang nur im Schlüsselbund), dann „Lerne die PKV-Einreichung“ / „Reiche die PKV ein“; mit Befugnis „pkv_einreichen“ täglich 19 Uhr selbstständig; bei Captcha, verändertem Portal oder fehlendem Code hört er auf; Beihilfe Bund nur per App – dort weiter du |
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

## 10. Fahrzeuge: Tesla und Ford

### Tesla

| Funktion | Stand | Hinweis |
|---|---|---|
| Status: Akku, Reichweite, Laden (Leistung, Ladeende, Limit, Ladeplan), Klima innen/außen, Standort, verriegelt | ⚙️ | Einmalige Einrichtung unter ⚙ Einstellungen → Verbindungen → Tesla (offizielle Fleet API, eigener Zugang) |
| Grafische Ansicht mit Bild des eigenen Autos, animiertem Akku, Ladeanzeige und Klima; Modell, Ausstattung (z. B. Long Range) und Baujahr automatisch | ✅ | „Zeig mir mein Auto“, „Wie voll ist der Akku?“ |
| Eigenes Foto des Autos verwenden – Hintergrund wird auf dem Mac automatisch entfernt | ✅ | Knopf „Bild ändern“ im Fahrzeugfenster; Freistellen ab macOS 14 |
| Klimatisierung ein/aus, Wunschtemperatur | ⚙️ | per Sprache oder Knopf; braucht den virtuellen Schlüssel im Auto |
| Laden starten/stoppen, Ladelimit, Ladeplan (Abfahrtszeit mit Vorklimatisierung oder Ladestart) | ⚙️ | per Sprache oder Knopf |
| Live-Karte: Auto als echtes 3D-Modell in Lackfarbe (dreht und neigt sich mit der Karte, Räder drehen sich, Licht auf der Straße), Fahrt flüssig animiert mit leuchtender Spur | ✅ | „Wo steht mein Auto?“ oder Knopf „Live-Karte“ |
| Karte minimieren: schwebt kantenlos am Rand und verfolgt die Fahrt live; Klick öffnet sie wieder groß | ✅ | Abruf alle 12 s während der Fahrt (kostet je Abruf einen Bruchteil eines Cents), geparkt jede Minute |
| Orte bei Durchfahrt: Ortsteil und Ort werden während der Fahrt kurz eingeblendet (auch in der minimierten Karte, Ortseinfahrt hervorgehoben); Liste der durchfahrenen Orte in der großen Karte | ✅ | höchstens alle 15 s bzw. 400 m abgefragt (OpenStreetMap) |
| TÜV/HU und Kfz-Versicherung im Fahrzeugfenster: Fälligkeit mit Countdown, Versicherer, Kündigungsfrist (1 Monat vor Hauptfälligkeit) | ✅ | eintragen im Fenster oder per Sprache; wird als Frist mit Erinnerung geführt |
| Schlafendes Auto wird nur auf Wunsch geweckt | ✅ | sonst letzter Stand mit Uhrzeit |
| Wächtermodus (Sentry) ein- und ausschalten | ✅ | Knopf im Fahrzeugfenster; Ausschalten nur mit Bestätigung |
| Live-Kamerabild / Wächter-Kameras im Dashboard | ❌ | Teslas Schnittstelle (Fleet API) bietet keinen Kamerazugriff – nur in der Tesla-App |
| Entriegeln, Türen/Kofferraum öffnen, Fahren | ❌ | bewusst nicht |
| Fahrzeugfenster mit Reitern TESLA / FORD | ✅ | Wechsel oben im Fenster |

### Ford Tourneo Custom (Übergabe März 2027 – vorbereitet)

| Funktion | Stand | Hinweis |
|---|---|---|
| Schon jetzt: Fahrzeugprofil (Name, Farbe, Kennzeichen, Übergabetermin), eigenes Foto, TÜV und Versicherung mit Fristen | ✅ | ⚙ Einstellungen → Verbindungen → Ford Tourneo Custom; Termine im Fahrzeugfenster |
| Vorschau mit Beispieldaten, um Fenster und Live-Karte vor der Übergabe zu sehen | ✅ | „Vorschau ansehen“ im Fahrzeugfenster; deutlich als VORSCHAU gekennzeichnet |
| Status: Tank in %, Reichweite, Kilometerstand, verriegelt, Zündung, Reifendruck je Rad, Öl, AdBlue, 12-V-Batterie, Warnmeldungen | ⚙️ | nach der Übergabe: Ford-Entwickler-App (offizielle FordConnect Query), Anmeldung mit dem FordPass-Konto – „Wie voll ist der Tank vom Bus?“ |
| Live-Karte mit 3D-Van in Lackfarbe | ⚙️ | „Wo steht der Bus?“ – Abruf höchstens alle 30 s |
| Experten-Einstellungen: Anmelde-/API-Adressen, Pfade und Kopfzeilen änderbar, empfangene Felder ansehen | ✅ | falls Ford die Schnittstelle anpasst |
| Fernsteuerung (Öffnen, Starten, Standheizung) | ❌ | bietet Ford über die offizielle Schnittstelle nicht an; die inoffizielle FordPass-Schnittstelle wird bewusst nicht genutzt (Kontosperre möglich) |

## 10a. Immobilien (HESTIA)

| Funktion | Stand | Hinweis |
|---|---|---|
| Immobiliendashboard: Karte mit 3D-Gebäuden, Hauptbild und Galerie (bis 5 Bilder, auch HEIC), Mieter, Miete kalt/NK/warm, Darlehen mit Restschuld und Zinsbindung, Objektdaten | ✅ | „Zeig mir meine Immobilie“ oder ⚙ Einstellungen → Immobilien |
| Unter den Bildern: Karte mit der Lage und daneben das 3D-Modell des Grundrisses zum Drehen und Zoomen | ✅ | ⤢ öffnet den Grundriss-Editor; ohne Grundriss: „＋ Grundriss hinzufügen“ |
| Kennzahlen mit Ampel: Brutto-/Nettomietrendite, Cashflow, Beleihung, Kapitaldienstdeckung, Kaltmiete je m², EK-Rendite, Tilgung | ✅ | Ampel-Grenzen und Kappungsgrenze unter ⚙ Einstellungen → Immobilien |
| Profi-Dashboard (Portfolio vieler Objekte): Kennzahlenleiste (Objekte/Einheiten, Ist-/Soll-Kaltmiete, Leerstand, Cashflow operativ und nach Steuern, Ø Faktor/Bruttorendite, Wert − Restschuld, Beleihung/DSCR, Vermögenszuwachs p. a.), Handlungsbedarf (Leerstand, Erhöhung jetzt möglich, Zinsbindung ≤ 24 Monate, negativer Cashflow), Objektkarten mit Belegungsband der Wohneinheiten, Cashflow je Objekt, Einheiten-Matrix nach Etage (Status, Miete, €/m², Cashflow je Einheit, nächste Erhöhung), Mieterhöhungs-Zeitplan der nächsten 24 Monate, Hochrechnung Wert/Restschuld mit Tabelle | ✅ | ⚙ Einstellungen → Immobilien → Schalter „Profi-Dashboard“ (wirkt sofort, auch bei nur einer Immobilie); dann führt links in der Schnellleiste „Portfolio“ (statt „Immobilien“) direkt ins Profi-Dashboard, außerdem „◆ PORTFOLIO“ im Immobilienfenster oder „Wie steht mein Portfolio?“; Rechenweg wie das Kalkulationstool (Rücklage, Mietausfall, AfA auf Gebäudeanteil + aktivierte Investitionen, Grenzsteuersatz); Annahmen global und je Objekt änderbar; keine Steuer-/Rechtsberatung |
| Wohneinheiten je Objekt: Bezeichnung, Etage, m², Zimmer, Status (vermietet/vakant/Renovierung/Eigennutzung), Mieter, Einzug, Mietart (Vergleichs-, Staffel-, Indexmiete), Kalt/NK, letzte Erhöhung, Marktmiete €/m², Staffeln | ✅ | im Portfolio „✎ Einheiten & Annahmen“; Objekte ohne Einheiten zählen als eine Wohnung; nächste Erhöhung: Vergleichsmiete 15 Monate + Kappungsgrenze (bis Marktmiete), Index 12 Monate, Staffel nächste Stufe; Mieternamen gehen nie an das Sprachmodell |
| Mieterhöhung planen: prüft 15-Monats-Frist und Kappungsgrenze, legt Frist zum Ankündigen an | ✅ | im Fenster „＋ PLANEN“ oder per Sprache |
| Fristen: Zinsbindungsende und „Anschlussfinanzierung prüfen“ (12 Monate vorher) | ✅ | automatisch beim Speichern |
| Neue Immobilie per Assistent (Objekt, Kauf, Darlehen, Mieter & Miete) | ✅ | Knopf „＋ IMMOBILIE“ |
| Je Immobilie: Knöpfe MIETVERTRAG (öffnet in Vorschau) und ORDNER (öffnet den Ordner im DATENARCHIV/iCloud im Finder) | ✅ | Mietvertrag wird im Ordner der Immobilie gefunden oder unter „Bearbeiten“ eingetragen; auf dem iPhone Anzeige im Fenster |
| Mietvertrag einlesen – ausschließlich lokal (Texterkennung und lokales Modell auf dem Mac, keine Weitergabe an Claude, Datei wird nicht gespeichert) | ⚙️ | braucht das lokale Sprachmodell; Werte werden markiert vorgeschlagen und vor dem Speichern geprüft |
| Nebenkostenabrechnung je Jahr: Belegliste aus dem Mietvertrag, Fristen (Belege bis 31.03., an Mieter bis 30.06., gesetzlich 31.12.) | ✅ | Fenster „Nebenkosten“; ab 2. Januar automatisch für das Vorjahr, sonst „＋ JAHR“ |
| Immobilien-Postfach (iCloud-Alias) alle 15 Min. prüfen, Anhänge lokal erkennen (Kostenart, Jahr, Betrag, Zeitraum, Objekt) | ⚙️ | Alias unter ⚙ Einstellungen → Daten & Postfächer; der Werbefilter lässt diese Mails in Ruhe |
| Ablage im GbR-Ordner (Unterordner Nebenkosten/Jahr) – nur nach deiner Bestätigung | 🔒 | Vorschläge mit Kostenart, Betrag, Ordner und Dateinamen zum Ändern; auch Belege hochladen oder in den Ordner legen |
| Anfragen an Versorger für fehlende Belege (Mail vom Alias oder Brief-PDF zum Ausdrucken), Erinnerung nach 3 Wochen | 🔒 | erst nach „Billigen“; Versorger mit Mail, Anschrift, Kundennummer im Fenster pflegen |
| Abrechnungsentwurf als PDF (Kostenarten, Gesamtkosten, Verteilerschlüssel, zeitanteilig, Vorauszahlungen, Ergebnis, Vorschlag neue Vorauszahlung) | ✅ | entsteht automatisch, sobald alle Belege da sind; Verbrauchswerte und tatsächliche Vorauszahlungen von Hand anpassbar |
| Billigen → endgültiges PDF im Nebenkosten-Ordner; Versand an den Mieter per Mail (mit Belegen) oder Brief; Zugang vermerken → Zahlungs-/Auszahlungsfrist | 🔒 | Bankverbindung für die Abrechnung liegt im Schlüsselbund (⚙ → Immobilien) |
| Grundriss → 3D: Plan hochladen (PDF, Foto, HEIC), je Stockwerk einer | ✅ | Immobilienfenster → „GRUNDRISS → 3D“ |
| Grundriss erkennen lassen (Wände, Türen, Fenster, Räume, Maßketten → Maßstab) | 🔒 | schickt nur das Bild an Claude – erst nach Freigabe pro Grundriss, ca. 5–20 Cent |
| Editor: Wände ziehen und zeichnen (rastet an Ecken und rechten Winkeln ein), Türen, Fenster, Räume, Maßstab über eine bekannte Länge | ✅ | Änderungen werden automatisch gespeichert |
| 3D-Puppenhaus zum Drehen: Wände mit Tür- und Fensteröffnungen, farbige Räume mit m², Stockwerke einzeln oder übereinander, „halbhoch“ | ✅ | |
| Flächenabgleich: Summe der Räume gegen die Wohnfläche im Mietvertrag, Warnung ab 10 % Abweichung | ✅ | Wohnflächenverordnung (Schrägen, Balkone) beachten |

## 11. Gedächtnis und Vorausdenken

| Funktion | Stand | Hinweis |
|---|---|---|
| Fakten über dich, Familie, Haushalt merken und vergessen | ✅ | lesbare Dateien in iCloud |
| Laufende Vorgänge mit Status, Frist und nächstem Schritt | ✅ | |
| Morgenbriefing (Termine, Fälliges, Fristen, Zahlungen, Wetter) | ✅ | Uhrzeit einstellbar |
| Morgenbriefing nach eigenen Wünschen erweitern, z. B. „kurzer Nachrichtenüberblick, zuerst Inland, dann weltweit“ (mit Websuche) – hinzufügen, streichen, auflisten | ✅ | einfach sagen: „Nimm ins Morgenbriefing … auf“; gespeichert in ATLAS-Privat/briefing_wuensche.json |
| Hinweise im Tagesverlauf (bald fällig, wichtige Mails) | ✅ | |
| Wochencheck „Was habe ich vergessen?“ | ✅ | Freitag 16 Uhr |
| Gesprächsaufnahme mit Transkript, Zusammenfassung und Aufgaben | ✅ | lokal; Word-Datei im Archiv |

## 12. Datenschutz und Sicherheit

| Funktion | Stand | Hinweis |
|---|---|---|
| Sensible Themen (Gesundheit, Finanzen, Steuer …) bleiben lokal | ✅ | sonst Rückfrage vor der Cloud |
| Datenschutz-Schleier vor JEDEM Claude-Aufruf: Namen (Familie, Kinder, Nachname), Anschriften, IBAN, Steuer-ID/-nummer, Versicherungs-, Renten-, Kunden-, Vertrags-, Personalnummern, Aktenzeichen, Geburtsdaten, Telefonnummern und E-Mail-Adressen sieht Claude nur als Platzhalter ([NAME_1] …); Antworten und Werkzeugaufrufe setzt JARVIS lokal wieder zusammen | ✅ | weitere Namen in config.yaml unter datenschutz → namen; Zuordnung nur im Arbeitsspeicher |
| Sensibles nach Inhalt: Werkzeugergebnisse mit Gesundheits-, Konto-, Ausweis-, Steuer-ID- oder Bezügedaten fasst das lokale Modell zuerst zusammen – Claude bekommt nur die Kurzfassung (ohne Diagnosen, Nummern, Einzelposten); ist das lokale Modell weg, bleibt der Inhalt zurück | ✅ | gilt auch für Morgenbriefing, Telegram, Stab und Projektbeobachtung |
| Gesundheitsdokumente nie im Wortlaut: Suchtreffer aus Arzt-, Beihilfe- und PKV-Unterlagen zeigen Claude nur die Art; Lesen wird lokal zusammengefasst | ✅ | |
| Gedächtnis für Claude nur als Themenliste – Inhalte holt er bei Bedarf gezielt | ✅ | das lokale Modell sieht weiter alles |
| ElevenLabs: sensible Antworten mit der Mac-Stimme; IBAN, Nummern und Anschriften werden nie vorgelesen („siehe Bildschirm“); jede Ausgabe wird sofort aus dem ElevenLabs-Verlauf gelöscht | ✅ | API-Schlüssel braucht Schreibrecht für den Verlauf |
| Datenschutz-Bericht: was ging heute an Claude und ElevenLabs (Aufrufe, Zeichen, ersetzte Angaben je Art, lokale Zusammenfassungen, Mac-Stimme, gelöschte Einträge) – nur Zähler, nie Inhalte | ✅ | `jarvis datenschutz [JJJJ-MM-TT]` oder „Was ging heute an Claude?“ |
| Zugangsdaten verlassen den Mac nie | ✅ | |
| Schlüssel nur im Schlüsselbund | ✅ | |
| Rechteprüfung: Löschen, Senden, Ändern nur mit Bestätigung | ✅ | |
| Protokoll aller Aktionen, Kostenbremse (Monatsbudget) | ✅ | |
| Eigene Zusatzregeln in config.yaml (persona.zusatz) | ✅ | |
| Anweisungen nur von dir: Inhalte aus Mails, Dokumenten, Web, Terminen und Stabsmeldungen sind Daten, keine Befehle | ✅ | werden als „fremder Inhalt“ eingerahmt |
| Eingeschleuste Anweisungen erkennen und zurückhalten (Deutsch/Englisch, versteckte Kommentare, unsichtbare Zeichen, kodierte Blöcke) | ✅ | Meldekarte mit Zitat und Quelle; Liste unter ⚙ Einstellungen → Autopilot |
| Nach fremdem Inhalt braucht jede Aktion deine Bestätigung (mit ⚠-Hinweis); Befugnisse erteilen ist dann gesperrt | 🔒 | gilt je Auftrag, auch für Telegram, Siri und den Stab |
| Sicherheitstests laufen vor jedem `jarvis speichern`; schlägt einer fehl, wird nichts hochgeladen | ✅ | `python3 -m unittest discover -s tests` |

## 12a. Autopilot – Befugnisse, Rechenschaft, gutes Timing (Butler Stufe 1)

| Funktion | Stand | Hinweis |
|---|---|---|
| Befugnisse: Was JARVIS ohne Rückfrage darf, mit Grenzen (Bereich, Kalender-Ausschluss, max. pro Woche, gültig bis) | ✅ | „Was darfst du ohne mich?“ |
| Start-Befugnis: private Termine (Handwerker, Privates) anlegen und verschieben, danach melden | ✅ | nicht in Dienst- und Familienkalendern – dort bleibt es bei 🔒 |
| Befugnis erteilen | 🔒 | nur auf deinen Wunsch, nie nach fremdem Inhalt |
| Befugnis entziehen, Notbremse für alle | ✅ | „Lass das mit den Terminen“, „Notbremse“ – sofort |
| Rechenschaft: Was hat JARVIS getan – per Befugnis, nach Bestätigung, abgelehnt – mit Kanal (Dashboard, Telegram, Stab) und Hinweis auf fremden Inhalt | ✅ | „Was hast du heute ohne mich gemacht?“ · heute oder 7 Tage |
| Rückgängig (7 Tage): Termin anlegen/verschieben, Datei verschieben, Frist eintragen, Tesla-Klima, Einkaufsliste, Mail-Wache | 🔒 | ↺ in der Rechenschaft oder direkt an der Erledigt-Meldung |
| Ruhezeiten: 22–7 Uhr, Samstag ab 14 Uhr, Sonntag, Kalenderblöcke „Familie“ | ✅ | ⚙ Einstellungen → Autopilot |
| Fokus aus dem Kalender („Fokus“, „Konzentration“, Besprechungen) oder per Satz („Ich brauche 2 Stunden Ruhe“) | ✅ | Chip oben rechts zeigt RUHE/FOKUS |
| In Ruhe/Fokus legt JARVIS Nicht-Dringendes still zurück (kein Telegram, keine Ansage); durch kommen nur Notfälle und dringende Mail-Wachen | ✅ | Mail-Wache „dringend“ per Satz oder Haken |
| Entscheidungsstapel um 12:30 und 18:00 sowie nach Ruhe/Fokus: Zurückgelegtes und offene Billigungen (HESTIA, Post) gebündelt | ✅ | „Was liegt an?“ · Zeiten einstellbar |
| Über Nacht Zurückgelegtes im Morgenbriefing | ✅ | |
| Vorgänge, Frühwarnungen, Zusagen-Tracker, Lösungspakete | ❌ | Stufe 2 (geplant) |

## 12b. Zielregister – Arbeitszeit, Sport, freie Wochenenden

| Funktion | Stand | Hinweis |
|---|---|---|
| Deine Ziele: Wochenenden für die Familie, Arbeitszeit Dienststelle 05:45–15:15 bzw. mobil 07:45–16:00, Sport täglich (Dienststelle 45 min direkt morgens, mobil 15 min) | ✅ | ⚙ Einstellungen → Autopilot → Ziele & Arbeitszeit |
| Arbeitsort je Tag erkennen: Kalendereintrag („Mobiles Arbeiten“, „Dienststelle“) vor Standort vor gelerntem Wochenmuster | ✅ | „Morgen bin ich mobil“; Dienststelle einmal vor Ort merken: „Ich bin in der Dienststelle“ |
| Sportblöcke im Privatkalender anlegen (abends für den nächsten Tag) und morgens an den Arbeitsort anpassen | ✅ | per Befugnis „Private Termine“, mit Meldung und Rückgängig; eigene Sporttermine fasst JARVIS nicht an |
| Widerspruch: Termin am Wochenende, in der Sportzeit oder dienstlich nach Arbeitsende → JARVIS fragt nach, du entscheidest | 🔒 | Familientermine am Wochenende sind kein Widerspruch |
| Nachtruhe endet an Dienststellentagen mit Dienstbeginn (05:45) | ✅ | |
| Wochenbilanz zu den Zielen | ❌ | bewusst nicht gewählt |

## 12c. Notfallbegleitung

| Funktion | Stand | Hinweis |
|---|---|---|
| Falls Richard stirbt, begleitet JARVIS seine Frau Schritt für Schritt – sein Notfallordner (Word, DATENARCHIV) ist die Leitlinie, JARVIS die administrative Unterstützung | ✅ | ⚙ Einstellungen → Notfall |
| Start nur mit ihrem persönlichen Notfallcode (sie legt ihn selbst fest; gespeichert wird nur ein Hash), sofort aktiv | ✅ | nie per Mail, Nachricht, Sprache oder Sprachmodell auslösbar |
| Schutz gegen Missbrauch: 5 Fehlversuche → 1 h Sperre; Richard bekommt bei jeder Aktivierung und ab dem 3. Fehlversuch eine Telegram-Nachricht | ✅ | Beenden jederzeit über das Banner |
| Begleitung: Kapitel und Schritte aus dem Notfallordner als Checkliste mit Fortschritt, „nächster Schritt“, Fragen an JARVIS zu jedem Schritt, Entwürfe für Briefe und Mails | ✅ | Senden, Ablegen, Eintragen nur nach ihrer Bestätigung |
| Fristenvorschläge ab Sterbedatum (Versicherungen melden, Dienststelle/Versorgung, Erbschaft annehmen oder ausschlagen binnen 6 Wochen) ins Fristenradar | 🔒 | Vorschläge, keine Rechtsberatung |
| Notfallordner nur lokal: aus Archivsuche und Dateilesen ausgenommen; in der Begleitung antwortet das lokale Modell | ✅ | Kontonummern werden zusätzlich maskiert |
| Während der Begleitung ruhen alle Befugnisse; Richards Briefing, Hinweise, Mail-Wachen und Sportblöcke pausieren | ✅ | Befugnisse kommen beim Beenden zurück |
| Notfallordner prüfen: Richard sieht, welche Kapitel JARVIS erkennt (nur Überschriften, ohne Inhalt) | ✅ | |
| Probe: den Ernstfall üben – mit oder ohne Code, Banner, Begleitung, lokales Modell, Telegram an Richard – aber nichts wird gesendet, abgelegt oder eingetragen; Fortschritt wird verworfen | ✅ | ⚙ Einstellungen → Notfall → Probe; endet automatisch (30 min–2 h) |
| Selbsttest „Bereit für den Ernstfall?“: Code, Notfallordner gefunden/aktuell, Kapitel und Aufgaben erkannt, lokales Modell, Telegram | ✅ | auch per Sprache: „Ist die Notfallbegleitung bereit?“ |

## 12d. Zuhause – HomeKit und NUKI

| Funktion | Stand | Hinweis |
|---|---|---|
| Lichter, Lautsprecher und Szenen (Apple HomeKit) per Sprache steuern | ⚙️ | über Kurzbefehle, deren Name mit „JARVIS“ beginnt (z. B. „JARVIS Licht Wohnzimmer an“) |
| Kurzbefehle zu Türen, Schlössern, Garage oder Alarm | ❌ | bewusst gesperrt |
| NUKI: Status (abgeschlossen? Tür offen? Batterie in %, lädt, Keypad-/Türsensor-Batterie, Verbindung, Alter des Stands) und abschließen – JARVIS prüft danach bis 30 s, ob das Schloss es bestätigt, und sagt es ehrlich, wenn nicht | ⚙️ | NUKI-Token unter ⚙ Einstellungen → Zuhause; Token braucht die Berechtigung für Aktionen; Opener und Box werden nicht mehr als Schloss gelesen; offline → kein Befehl |
| NUKI aufschließen oder öffnen | ❌ | bewusst nicht – wie beim Tesla |
| Abendkontrolle 21:45: Tür nicht abgeschlossen oder Batterie fast leer → Meldung | ✅ | |

## 12e. Projekte und Internetrecherche

| Funktion | Stand | Hinweis |
|---|---|---|
| Projekte als Klammer für Vorhaben über Wochen (z. B. Auslandsverwendung, Fahrzeugkauf): Ziel, Status aktiv/pausiert/abgeschlossen, Stichwörter, Notiz | ✅ | Fenster PROJEKTE (Schnellleiste links), ⚙ Einstellungen → Projekte oder „Zeig meine Projekte“ |
| Vorgänge und Fristen werden über die Stichwörter automatisch dem Projekt zugeordnet | ✅ | |
| Beobachtungen: regelmäßige Internetrecherche (Nachrichten) je Projekt mit Suchbegriffen, Intervall (3 h bis 1 Woche), Alarmwörtern, Ausschlusswörtern, Sprache und eigenen RSS-Feeds | ✅ | „Halte mich zu Dienstposten in Norfolk auf dem Laufenden“ |
| Erst Feeds, dann Claude: Google-News-Feed und eigene Feeds kostenlos holen, Bekanntes aussortieren, lokal filtern; nur neue Treffer bewertet Claude Haiku (Relevanz 0–10, ein Satz) | ✅ | ohne Claude: lokales Modell bzw. Stichwortregel |
| Alarm-Funde: Claude recherchiert nach und fasst den Stand mit Quellen zusammen | ✅ | Monatsgrenze 400 Bewertungen / 40 Nachrecherchen |
| Abgestufte Meldung: Alarm sofort (auch in Ruhezeiten), alles andere in den Entscheidungsstapel und ins Morgenbriefing | ✅ | in der Notfallbegleitung pausiert |
| Funde mit Relevanzbalken, Quelle, Kurzsatz; Klick öffnet den Artikel | ✅ | nur https-Links |
| Meldungen werden vor jeder Auswertung auf eingeschleuste Anweisungen geprüft und eingerahmt | ✅ | Feeds sind fremde Inhalte |
| Bezahlschranken-Artikel vollständig lesen | ❌ | nur Titel und Anriss |

## 12f. Sicherheitsaudit – AEGIS

| Funktion | Stand | Hinweis |
|---|---|---|
| Neuer Stab-Agent AEGIS (SICH) prüft JARVIS und den Mac wöchentlich und auf Zuruf | ✅ | „Mach ein Sicherheitsaudit“, ⚙ Einstellungen → Sicherheit |
| Rechte-Politik gegen die sichere Grundeinstellung, Not-Aus, abgelaufene oder unbefristete Befugnisse | ✅ | |
| Schlüssel, Tokens, private Schlüssel, IBAN im Code, in der Git-Historie und in Konfigurationsdateien; Länge des Dashboard-Tokens | ✅ | Fundstellen nur maskiert |
| Dateirechte von ~/.atlas, Token und Tesla-Schlüssel | ✅ | |
| Offene Ports, JARVIS-Kern nur lokal, Tailscale Funnel (öffentlich) vs. Serve (Tailnet) | ✅ | |
| macOS: FileVault, Firewall, SIP, Gatekeeper, automatische Updates, letzte Time-Machine-Sicherung | ✅ | |
| Bekannte Schwachstellen der Abhängigkeiten (Python-Pakete, Kartenbibliothek, Three.js) | ✅ | nur Paketnamen und Versionen an die öffentliche OSV-Datenbank |
| Auffälligkeiten im Protokoll (eingeschleuste Anweisungen, falsche Notfall-Codes, verweigerte Werkzeuge) und Selbsttest inkl. Sicherheitstests | ✅ | |
| Bericht mit Ampel, Schweregrad (kritisch bis niedrig), Empfehlung, Verlauf; neue kritische/hohe Befunde sofort, der Rest in den Entscheidungsstapel | ✅ | |
| Jeder Befund mit Behebungsweg: JARVIS BEHEBT (Klick) · DU (Anleitung) · CLAUDE (Code-Auftrag); Übersicht „So wird es behoben“ | ✅ | ⚙ Einstellungen → Sicherheit → Bericht & Beheben |
| JARVIS behebt per Klick: Dateirechte, abgelaufene Befugnis, gelockerte Rechte zurück auf die Grundeinstellung, .gitignore, Python-Paket aktualisieren (mit Sicherheitstests, bei Fehlern automatisch zurück) – danach automatische Nachprüfung | 🔒 | nur nach Bestätigung; Sicherung config.yaml.vor-aegis |
| Anleitung: Schritte, Knopf zur passenden Systemeinstellung (FileVault, Firewall, Updates, Time Machine, Teilen), Befehl zum Kopieren, „Nachprüfen“ nur für diesen Bereich | ✅ | |
| Claude-Auftrag: ausgewählte Befunde als Markdown-Auftrag mit verbindlichen Sicherheitsvorgaben, Fundstellen maskiert, gespeichert unter .aegis/AUFTRAG_aktuell.md (nicht versioniert) | ✅ | „Schreib einen Claude-Auftrag für die Sicherheitsbefunde“ |
| Auftrag direkt in Claude Code im Terminal starten | 🔒 | nur wenn Claude Code installiert ist; jede Änderung bestätigst du dort |
| Auftrag in Claude/Cowork übergeben (Satz kopieren, Claude liest die Datei im verbundenen atlas-Ordner) oder kompletten Text kopieren | ✅ | |
| Behobene Befunde verschwinden aus dem Handlungsbedarf (Bereich wird sofort nachgeprüft); Paket-Updates stehen bis zum Neustart unter „Erledigt“ | ✅ | |
| Befund bewusst hinnehmen (mit Grund, 90 Tage): zählt nicht zur Ampel, wird nicht gemeldet, jederzeit „Wieder melden“ | 🔒 | kritische Befunde nicht hinnehmbar |
| Rechte lockern, macOS-Einstellungen ändern oder Schlüssel automatisch erneuern | ❌ | bewusst nicht – Anleitung bzw. Claude-Auftrag |

## 13. Stab – JARVIS als Chef des Stabes

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
| Agent HESTIA (IMMO) für Immobilien im Stab, mit eigenem Emblem | ✅ | |
| Agent AEGIS (SICH) für IT-Sicherheit im Stab, mit eigenem Emblem (Schild) | ✅ | siehe 12f |

## 14. Technik und Betrieb

| Funktion | Stand | Hinweis |
|---|---|---|
| KI-Modelle wählbar: Hauptmodell und Ausweichmodell aus Claude, OpenAI (GPT), Google Gemini, Mistral (EU) oder einem eigenen OpenAI-kompatiblen Dienst (OpenRouter, Groq, DeepSeek, LM Studio …); fällt das Hauptmodell aus (Störung, Schlüssel, Limit), antwortet das Ausweichmodell nahtlos weiter; je Anbieter drei Stufen (schnell/Standard/stark) mit Modellliste vom Anbieter | ✅ | Einstellungen → Verbindungen → „KI-Modelle“; Schlüssel nur im Schlüsselbund; Datenschutz-Schleier gilt für jeden Anbieter; Websuche, Prompt-Cache und direktes PDF-Lesen nur mit Claude (sonst liest JARVIS PDFs lokal aus); Gemini nur mit bezahltem Konto (kostenlose Stufe darf Eingaben nutzen); Wechsel ohne Neustart |
| Einstellungen in Reitern (Allgemein, Stimme & Gespräch, Stab, Konten & Schlüssel, Daten & Postfächer, Fahrzeuge, Immobilien, iPhone, Autopilot, Zuhause, Notfall, Projekte, Sicherheit) mit Suche über alle Reiter | ✅ | merkt sich den letzten Reiter; auf dem iPhone wischbare Leiste |
| Rückfragen (Beheben, Hinnehmen, Notbremse, Notfall beenden, Wächtermodus, Projekt anlegen …) als eigener JARVIS-Dialog – funktioniert in der Mac-App, im Browser und auf dem iPhone | ✅ | Enter bestätigt, Esc bricht ab |
| Läuft als Hintergrunddienst mit Autostart – auch bei geschlossenem Fenster arbeiten Telegram, Siri, Scan-Ordner, Briefing, Fristen, Mail-Wache, NUKI-Abendkontrolle und Updates weiter | ✅ | |
| Sparmodus: Ist das JARVIS-Fenster zu oder verborgen, gibt JARVIS Arbeitsspeicher frei – lokales Sprachmodell und Suchmodell werden gut eine Minute nach Gebrauch entladen (bei offenem Fenster 30 Minuten), nach dem Schließen nach 2 Minuten sofort; die Spracherkennung (ca. 1,5–2 GB) lädt erst beim Öffnen und wird beim Schließen freigegeben. Im Ruhezustand bleibt nur der Kern (wenige hundert MB) | ✅ | ⚙ Einstellungen → Verbindungen → „Arbeitsspeicher (Sparmodus)“: zeigt, was geladen ist, Knopf „Speicher jetzt freigeben“; abschalten in config.yaml (sparmodus → aktiv: false) |
| Steckbriefe fürs Archiv entstehen nur nachts (22–7 Uhr) oder wenn der Mac 10 Minuten unbenutzt ist – sobald du wieder am Mac sitzt, hört JARVIS nach dem laufenden Dokument auf; neue Scans und Briefe wertet er weiterhin sofort aus | ✅ | Stand (fertig/offen, läuft/pausiert) unter ⚙ Einstellungen → Verbindungen → „Arbeitsspeicher“; config.yaml: wissen → steckbriefe_zeit: immer, nacht_von, nacht_bis, leerlauf_min |
| Steckbriefe manuell starten: „Jetzt erzeugen“ – bis fertig, 2 oder 8 Stunden – arbeitet auch tagsüber (Gespräche haben Vorrang, am Netzteil bleibt der Mac wach); auf dem zweiten Mac gestartet, hilft er gleichzeitig mit und arbeitet von den ältesten Dokumenten her; Stoppen jederzeit; Meldung, wenn alle fertig sind | ✅ | ⚙ Einstellungen → Verbindungen → „Arbeitsspeicher“ oder `jarvis steckbriefe [2\|8\|fertig\|stop]`; währenddessen ist das lokale Modell (ca. 6–7 GB) dauerhaft geladen |
| Nachts wach halten: Sind noch Steckbriefe offen und hängt der Mac am Netzteil, verhindert JARVIS zwischen 22 und 7 Uhr den Ruhezustand (Bildschirm darf ausgehen) – bis die Arbeit getan ist; im Akkubetrieb, tagsüber oder zugeklappt nie | ✅ | MacBook nachts aufgeklappt am Netzteil lassen; abschalten in config.yaml: wissen → wach_halten: false |
| Lokales Sprachmodell in der sparsamen 4-Bit-Fassung (qwen3.5:9b-q4_K_M, ca. 6–7 GB statt 16 GB); fehlt sie, lädt JARVIS sie einmalig im Hintergrund und nutzt bis dahin die vorhandene Fassung | ✅ | danach Hinweis, wie die alte Fassung (16 GB) entfernt wird: `ollama rm qwen3.5:9b` |
| Mehrere Macs und Benutzer, Wache-Übergabe | ✅ | |
| Automatische Updates; startet eine neue Version nicht, kommt die vorige zurück | ✅ | |
| Schnelle Antworten | ✅ | Werkzeuge nach Bedarf, 1-h-Prompt-Cache, Vorwärmen |
| Lokales Sprachmodell (Ollama) für Privates und offline | ⚙️ | ca. 6–7 GB Download und Arbeitsspeicher (nur bei Gebrauch geladen) |
| Weitergabe: Installations-DMG mit grafischem Assistenten (Mac) und Windows-Installationspaket | ✅ | `jarvis paket` / `jarvis veroeffentlichen` |
| Veröffentlichen übersteht GitHub-Aussetzer: prüft vorab die Verbindung, wiederholt Hochladen und Release bei Netzfehlern und holt einen früher fehlgeschlagenen Upload beim nächsten Aufruf nach | ✅ | einfach erneut `jarvis veroeffentlichen` |
| Weitergegebene Installationen nutzen nur die eigenen Schlüssel des Empfängers | ✅ | Datenschutz-Scan blockiert jeden Schlüssel im Paket |
| Weitergegebene Installation aus der Ferne deaktivieren (einzeln, alle, zu alte Versionen) | ✅ | `jarvis sperren <Kennung>`; Kennung steht beim Empfänger unter ⚙ Einstellungen |
| Übersicht, wer JARVIS wo nutzt | ❌ | bewusst nicht – es werden keine Nutzungsdaten gesendet |
| Windows-Version (Windows 10/11): Installation per Setup.exe oder ZIP („JARVIS installieren.cmd“), Kern startet unsichtbar mit Windows, JARVIS-Fenster über Startmenü/Desktop (Edge-App-Fenster), Spracherkennung mit faster-whisper, Archiv in OneDrive, iCloud für Windows, Dropbox, Google Drive oder lokalem Ordner | ⚙️ | vorbereitet, noch nicht auf einem echten Windows-PC getestet; Setup.exe ist unsigniert (SmartScreen: „Weitere Informationen → Trotzdem ausführen“); Schlüssel in der Windows-Anmeldeinformationsverwaltung |
| Auf Windows nicht verfügbar: Erinnerungen/Notizen/Kontakte (Apple), iMessage, HomeKit-Kurzbefehle, Apple Music/Podcasts, Timer/Wecker, Apple-Texterkennung, Excel-Steuerung per AppleScript | ❌ | Werkzeuge werden auf Windows automatisch ausgeblendet |
| Automatische Updates auch unter Windows: neue Version wird im Hintergrund geladen und beim nächsten Neustart des Kerns eingesetzt; startet sie nicht (4 Abstürze in 3 Minuten), kommt die vorige zurück | ✅ | dieselbe GitHub-Veröffentlichung wie für den Mac |
| `jarvis app`, `jarvis paket` und `jarvis veroeffentlichen` bauen immer beide Versionen: Mac (App/DMG) und Windows (ZIP auf dem Schreibtisch); bei der Veröffentlichung baut GitHub zusätzlich automatisch die `JARVIS-Setup.exe` und hängt sie ans Release | ✅ | Workflow `.github/workflows/windows-setup.yml` |
| Bestimmte Versionsnummer aus der Ferne deaktivieren – auch nur für Mac oder nur für Windows, auch ganze Reihen (`0.30.*`) – und wieder freigeben; Versionen unter einer Mindestversion dauerhaft deaktivieren | ✅ | `jarvis version-sperren 0.30.1 "Grund" [--mac\|--windows]`, `jarvis version-entsperren 0.30.1`, `jarvis mindestversion 0.31.0`; `jarvis sperrliste` zeigt alles |
| Intel-Macs, eigene App im App Store | ❌ | iPhone über Web-App, Siri und Telegram |
| Live-Verkehr in der eigenen Karte | ❌ | |
| Kartenbibliothek MapLibre 6.16 (Sicherheitsupdate gegen CVE-2026-85061: Schadcode über Karten-Quellenangaben), lokal mitgeliefert als ES-Modul | ✅ | gefunden von AEGIS, behoben per Claude-Auftrag |

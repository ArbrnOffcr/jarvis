# JARVIS – Funktionsliste

Stand: 29.10.2026 · Version 0.23.5
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
| Nahtloser Übergang: die Begrüßung wird während der Startsequenz vorgeladen und setzt ein, während das Zünden des Kerns ausklingt – keine Ruhepause mit anschließendem Sprung ins Sprechen | ✅ | |
| Spracheingabe per Leertaste (gedrückt halten) | ✅ | Erkennung lokal mit Whisper, nichts geht ins Netz |
| Weckwort „Hey Jarvis“ | ⚙️ | Knopf WECKWORT; lauscht lokal |
| Gesprächsmodus: nach jeder Antwort 6 s weiter zuhören | ✅ | Knopf GESPRÄCH: AN / OHNE STOPP / AUS |
| Unterbrechen: Dazwischenreden oder Leertaste stoppt JARVIS | ✅ | Bei Lautsprechern evtl. Echo → OHNE STOPP |
| Sprachausgabe mit ElevenLabs-Stimme, gestreamt | ⚙️ | Ohne Schlüssel: Mac-Stimme; mit Schlüssel: Standardstimme oder eigene Auswahl |
| Deutsch und Englisch (Antwort in der Sprache der Frage) | ✅ | |
| Eigene Mac-App mit Dauer-Mikrofon, Fenster frei verschiebbar | ✅ | `jarvis app` |
| Reduzierte Ansicht (nur Kern und Untertitel) und Dashboard-Ansicht | ✅ | Untertitel scrollbar |
| Stilwelt MOSAIK: abstraktes, frontales Gesicht mit dunklen Augenhöhlen, flacher Nase und flachem Mund, eingebettet in einen feinen Kachelteppich in Plexus-Farben, der kräftig wie eine zähe Masse wabert (treibende Wölbungen ohne Vorzugsrichtung, echte Tiefe, im Gesicht gedämpft); das Gesicht folgt ganz leicht der Maus | ✅ | STIL-Knopf oder „Zeig dich als MOSAIK“; am Mac ca. 40.000 Kacheln |
| MOSAIK lebt: dezente Mimik, Mund passend zu Stimme und Lauten – auch bei reinen Textantworten liest er stumm mit; Zuhören färbt das Gesicht Plexus-Grün; Nachdenken zeigt gedämpfte Datenströme wie bei Plexus, die seitlich um den Kopf schwingen und oben hinter der Stirn – im Gehirn – verlöschen (nie über dem Gesicht) – je Quelle in eigener, zurückhaltender Farbe | ✅ | Mimik aus neun Posen (ChatGPT), neu aufbereiten: werkzeuge/mosaik/aufbereiten.py |
| Startsequenz je nach zuletzt gewähltem Stil: bei MOSAIK liegt der Teppich dunkel hinter der Sequenz, wächst beim Aufladen von der Mitte her und entfaltet sich beim Zünden nahtlos zum Gesicht | ✅ | bei Plexus wie bisher mit Globus |
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
| Hinweise im Tagesverlauf (bald fällig, wichtige Mails) | ✅ | |
| Wochencheck „Was habe ich vergessen?“ | ✅ | Freitag 16 Uhr |
| Gesprächsaufnahme mit Transkript, Zusammenfassung und Aufgaben | ✅ | lokal; Word-Datei im Archiv |

## 12. Datenschutz und Sicherheit

| Funktion | Stand | Hinweis |
|---|---|---|
| Sensible Themen (Gesundheit, Finanzen, Steuer …) bleiben lokal | ✅ | sonst Rückfrage vor der Cloud |
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
| NUKI: Status (abgeschlossen? Tür offen? Batterie) und abschließen | ⚙️ | NUKI-Token unter ⚙ Einstellungen → Zuhause |
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
| Einstellungen in Reitern (Allgemein, Stimme & Gespräch, Stab, Konten & Schlüssel, Daten & Postfächer, Fahrzeuge, Immobilien, iPhone, Autopilot, Zuhause, Notfall, Projekte, Sicherheit) mit Suche über alle Reiter | ✅ | merkt sich den letzten Reiter; auf dem iPhone wischbare Leiste |
| Rückfragen (Beheben, Hinnehmen, Notbremse, Notfall beenden, Wächtermodus, Projekt anlegen …) als eigener JARVIS-Dialog – funktioniert in der Mac-App, im Browser und auf dem iPhone | ✅ | Enter bestätigt, Esc bricht ab |
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
| Live-Verkehr in der eigenen Karte | ❌ | |
| Kartenbibliothek MapLibre 6.16 (Sicherheitsupdate gegen CVE-2026-85061: Schadcode über Karten-Quellenangaben), lokal mitgeliefert als ES-Modul | ✅ | gefunden von AEGIS, behoben per Claude-Auftrag |

// JARVIS installieren – grafischer Einrichtungsassistent.
// Zeigt assistent.html (Eingabefelder), prüft Schlüssel, startet installieren.sh und meldet den Fortschritt.
// Gebaut von 'jarvis paket' (swiftc), liegt mit Programmcode und JARVIS.app in einer DMG.
import Cocoa
import WebKit

final class Assistent: NSObject, NSApplicationDelegate, WKScriptMessageHandler, NSWindowDelegate {
    var fenster: NSWindow!
    var web: WKWebView!
    var prozess: Process?
    let res = Bundle.main.resourceURL!

    func applicationDidFinishLaunching(_ n: Notification) {
        let conf = WKWebViewConfiguration()
        conf.userContentController.add(self, name: "jarvis")
        web = WKWebView(frame: NSRect(x: 0, y: 0, width: 920, height: 660), configuration: conf)
        web.setValue(false, forKey: "drawsBackground")
        fenster = NSWindow(contentRect: NSRect(x: 0, y: 0, width: 920, height: 660),
                           styleMask: [.titled, .closable, .miniaturizable], backing: .buffered, defer: false)
        fenster.title = "JARVIS installieren"
        fenster.backgroundColor = NSColor(red: 0.016, green: 0.031, blue: 0.05, alpha: 1)
        fenster.titlebarAppearsTransparent = true
        fenster.appearance = NSAppearance(named: .darkAqua)
        fenster.contentView = web
        fenster.delegate = self
        fenster.center()
        fenster.makeKeyAndOrderFront(nil)
        let html = res.appendingPathComponent("assistent.html")
        web.loadFileURL(html, allowingReadAccessTo: res)
        NSApp.activate(ignoringOtherApps: true)
        baueMenue()
    }

    func baueMenue() {
        let haupt = NSMenu()
        let appItem = NSMenuItem(); haupt.addItem(appItem)
        let appMenu = NSMenu()
        appMenu.addItem(withTitle: "JARVIS installieren beenden", action: #selector(NSApplication.terminate(_:)), keyEquivalent: "q")
        appItem.submenu = appMenu
        let editItem = NSMenuItem(); haupt.addItem(editItem)
        let edit = NSMenu(title: "Bearbeiten")            // damit ⌘V in den Eingabefeldern funktioniert
        edit.addItem(withTitle: "Ausschneiden", action: #selector(NSText.cut(_:)), keyEquivalent: "x")
        edit.addItem(withTitle: "Kopieren", action: #selector(NSText.copy(_:)), keyEquivalent: "c")
        edit.addItem(withTitle: "Einsetzen", action: #selector(NSText.paste(_:)), keyEquivalent: "v")
        edit.addItem(withTitle: "Alles auswählen", action: #selector(NSText.selectAll(_:)), keyEquivalent: "a")
        editItem.submenu = edit
        NSApp.mainMenu = haupt
    }

    func applicationShouldTerminateAfterLastWindowClosed(_ s: NSApplication) -> Bool { true }

    func windowShouldClose(_ sender: NSWindow) -> Bool {
        guard prozess?.isRunning == true else { return true }
        let a = NSAlert()
        a.messageText = "Installation läuft noch"
        a.informativeText = "Wenn du jetzt beendest, ist JARVIS unvollständig. Später einfach erneut installieren."
        a.addButton(withTitle: "Weiter installieren")
        a.addButton(withTitle: "Beenden")
        if a.runModal() == .alertSecondButtonReturn { prozess?.terminate(); return true }
        return false
    }

    // MARK: Antworten an die Seite
    func antworte(_ id: Int, _ wert: [String: Any]) {
        guard let d = try? JSONSerialization.data(withJSONObject: wert),
              let s = String(data: d, encoding: .utf8) else { return }
        DispatchQueue.main.async { self.web.evaluateJavaScript("window.antwort(\(id), \(s))", completionHandler: nil) }
    }

    func js(_ funktion: String, _ argumente: [Any]) {
        guard let d = try? JSONSerialization.data(withJSONObject: argumente),
              let s = String(data: d, encoding: .utf8) else { return }
        let args = String(s.dropFirst().dropLast())
        DispatchQueue.main.async { self.web.evaluateJavaScript("window.\(funktion)(\(args))", completionHandler: nil) }
    }

    // MARK: Nachrichten von der Seite
    func userContentController(_ uc: WKUserContentController, didReceive m: WKScriptMessage) {
        guard let body = m.body as? [String: Any], let id = body["id"] as? Int, let name = body["name"] as? String else { return }
        let daten = body["daten"] as? [String: Any] ?? [:]
        switch name {
        case "info": antworte(id, systemInfo())
        case "oeffnen":
            if let u = daten["url"] as? String, let url = URL(string: u), ["https", "http"].contains(url.scheme ?? "") {
                NSWorkspace.shared.open(url)
            }
            antworte(id, ["ok": true])
        case "pruefen": pruefen(id, daten["art"] as? String ?? "", daten["wert"] as? String ?? "")
        case "ordnerWaehlen": waehlen(id, ordner: true)
        case "dateiWaehlen": waehlen(id, ordner: false)
        case "installieren": installieren(id, daten["angaben"] as? [String: Any] ?? [:])
        case "starten":
            let app = FileManager.default.homeDirectoryForCurrentUser.appendingPathComponent("Applications/JARVIS.app")
            NSWorkspace.shared.openApplication(at: app, configuration: NSWorkspace.OpenConfiguration()) { _, _ in
                DispatchQueue.main.async { NSApp.terminate(nil) }
            }
            antworte(id, ["ok": true])
        default: antworte(id, ["fehler": "unbekannt"])
        }
    }

    func systemInfo() -> [String: Any] {
        var info: [String: Any] = ["name": NSFullUserName()]
        var u = utsname(); uname(&u)
        info["arch"] = withUnsafePointer(to: &u.machine) { $0.withMemoryRebound(to: CChar.self, capacity: 256) { String(cString: $0) } }
        let v = ProcessInfo.processInfo.operatingSystemVersion
        info["macos"] = "\(v.majorVersion).\(v.minorVersion)"
        if let werte = try? URL(fileURLWithPath: NSHomeDirectory()).resourceValues(forKeys: [.volumeAvailableCapacityForImportantUsageKey]),
           let frei = werte.volumeAvailableCapacityForImportantUsage {
            info["frei_gb"] = Int(frei / 1_000_000_000)
        }
        let archiv = FileManager.default.homeDirectoryForCurrentUser
            .appendingPathComponent("Library/Mobile Documents/com~apple~CloudDocs/DATENARCHIV")
        if FileManager.default.fileExists(atPath: archiv.path) { info["archiv"] = archiv.path }
        if let d = try? Data(contentsOf: res.appendingPathComponent("release.json")),
           let j = try? JSONSerialization.jsonObject(with: d) { info["release"] = j }
        return info
    }

    func waehlen(_ id: Int, ordner: Bool) {
        let p = NSOpenPanel()
        p.canChooseDirectories = ordner
        p.canChooseFiles = !ordner
        p.allowsMultipleSelection = false
        p.prompt = "Auswählen"
        let icloud = FileManager.default.homeDirectoryForCurrentUser.appendingPathComponent("Library/Mobile Documents/com~apple~CloudDocs")
        if FileManager.default.fileExists(atPath: icloud.path) { p.directoryURL = icloud }
        p.beginSheetModal(for: fenster) { r in
            if r == .OK, let u = p.url { self.antworte(id, ["pfad": u.path]) } else { self.antworte(id, [String: Any]()) }
        }
    }

    // MARK: Schlüssel prüfen (nur lesende Testanfragen)
    func pruefen(_ id: Int, _ art: String, _ wert: String) {
        var req: URLRequest
        let enc = wert.addingPercentEncoding(withAllowedCharacters: .urlQueryAllowed) ?? ""
        switch art {
        case "anthropic":
            req = URLRequest(url: URL(string: "https://api.anthropic.com/v1/models?limit=1")!)
            req.setValue(wert, forHTTPHeaderField: "x-api-key")
            req.setValue("2023-06-01", forHTTPHeaderField: "anthropic-version")
        case "elevenlabs":
            req = URLRequest(url: URL(string: "https://api.elevenlabs.io/v1/models")!)
            req.setValue(wert, forHTTPHeaderField: "xi-api-key")
        case "telegram":
            req = URLRequest(url: URL(string: "https://api.telegram.org/bot\(enc)/getMe")!)
        case "serper":
            req = URLRequest(url: URL(string: "https://google.serper.dev/images")!)
            req.httpMethod = "POST"
            req.setValue(wert, forHTTPHeaderField: "X-API-KEY")
            req.setValue("application/json", forHTTPHeaderField: "Content-Type")
            req.httpBody = "{\"q\":\"test\",\"num\":1}".data(using: .utf8)
        case "youtube":
            req = URLRequest(url: URL(string: "https://www.googleapis.com/youtube/v3/search?part=id&maxResults=1&q=test&key=\(enc)")!)
        default:
            antworte(id, ["ok": false, "text": "unbekannt"]); return
        }
        req.timeoutInterval = 20
        URLSession.shared.dataTask(with: req) { data, resp, err in
            let code = (resp as? HTTPURLResponse)?.statusCode ?? 0
            let text = String(data: data ?? Data(), encoding: .utf8) ?? ""
            if err != nil || code == 0 {
                self.antworte(id, ["ok": false, "text": "✕ Keine Verbindung – Internet prüfen"]); return
            }
            if code == 200 {
                var t = "✓ gültig"
                if art == "telegram", let d = data, let j = try? JSONSerialization.jsonObject(with: d) as? [String: Any],
                   let r = j["result"] as? [String: Any], let u = r["username"] as? String { t = "✓ Bot @\(u)" }
                self.antworte(id, ["ok": true, "text": t])
            } else if art == "elevenlabs" && text.contains("permission") {
                self.antworte(id, ["ok": true, "warn": true, "text": "✓ angenommen (eingeschränkter Schlüssel – Sprachausgabe reicht)"])
            } else if code == 401 || code == 403 {
                self.antworte(id, ["ok": false, "text": "✕ Schlüssel wird nicht angenommen (\(code))"])
            } else {
                self.antworte(id, ["ok": false, "text": "✕ Antwort \(code) – später erneut versuchen"])
            }
        }.resume()
    }

    // MARK: Installation
    func installieren(_ id: Int, _ angaben: [String: Any]) {
        guard prozess?.isRunning != true else { antworte(id, ["fehler": "läuft bereits"]); return }
        // Angaben nur kurz und nur für diesen Benutzer lesbar ablegen; das Skript löscht sie nach dem Speichern.
        let tmp = FileManager.default.temporaryDirectory.appendingPathComponent("jarvis-angaben-\(UUID().uuidString).json")
        guard let d = try? JSONSerialization.data(withJSONObject: angaben) else { antworte(id, ["fehler": "Angaben ungültig"]); return }
        FileManager.default.createFile(atPath: tmp.path, contents: d, attributes: [.posixPermissions: 0o600])

        let p = Process()
        p.executableURL = URL(fileURLWithPath: "/bin/zsh")
        p.arguments = [res.appendingPathComponent("installieren.sh").path]
        var env = ProcessInfo.processInfo.environment
        env["JARVIS_RES"] = res.path
        env["JARVIS_ANGABEN"] = tmp.path
        env["JARVIS_LOKAL"] = (angaben["lokal"] as? Bool ?? false) ? "1" : "0"
        p.environment = env
        let pipe = Pipe()
        p.standardOutput = pipe
        p.standardError = pipe
        var rest = ""
        pipe.fileHandleForReading.readabilityHandler = { h in
            let neu = h.availableData
            if neu.isEmpty { return }
            rest += String(data: neu, encoding: .utf8) ?? ""
            while let r = rest.range(of: "\n") {
                let zeile = String(rest[rest.startIndex..<r.lowerBound])
                rest.removeSubrange(rest.startIndex...r.lowerBound)
                self.js("zeile", [zeile])
            }
        }
        p.terminationHandler = { pr in
            pipe.fileHandleForReading.readabilityHandler = nil
            try? FileManager.default.removeItem(at: tmp)
            if !rest.isEmpty { self.js("zeile", [rest]) }
            self.js("fertig", [Int(pr.terminationStatus), pr.terminationStatus == 0 ? "" : "Die Installation wurde nicht abgeschlossen."])
        }
        do {
            try p.run()
            prozess = p
            antworte(id, ["ok": true])
        } catch {
            antworte(id, ["fehler": "Installationsskript startet nicht: \(error.localizedDescription)"])
        }
    }
}

let app = NSApplication.shared
let assistent = Assistent()
app.delegate = assistent
app.setActivationPolicy(.regular)
app.run()

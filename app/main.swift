// JARVIS – eigenes Mac-Fenster für das Dashboard.
// Anders als die Safari-Web-App erlaubt dieses Fenster das Mikrofon für JARVIS dauerhaft
// (macOS fragt nur einmal) und spielt die Stimme ohne vorherigen Klick ab.
import AVFoundation
import Carbon
import Cocoa
import CoreLocation
import WebKit

// Unsichtbare Leiste am oberen Rand: Da die Webseite das ganze Fenster füllt, gäbe es sonst keine
// Stelle, an der man das Fenster greifen kann. Ziehen verschiebt, Doppelklick zoomt.
final class Griffleiste: NSView {
    override var mouseDownCanMoveWindow: Bool { true }
    override func mouseDown(with event: NSEvent) {
        if event.clickCount == 2 {
            let aktion = UserDefaults.standard.string(forKey: "AppleActionOnDoubleClick") ?? "Maximize"
            if aktion == "Minimize" { window?.performMiniaturize(nil) } else if aktion != "None" { window?.performZoom(nil) }
            return
        }
        window?.performDrag(with: event)
    }
    override func hitTest(_ point: NSPoint) -> NSView? {
        frame.contains(point) ? self : nil
    }
}

// Fenster, das Fotos und Scans aus „Vom iPhone importieren“ (Integration der iPhone-Kamera) annimmt
final class JarvisFenster: NSWindow, NSServicesMenuRequestor {
    var empfang: ((NSPasteboard) -> Bool)?
    override func validRequestor(forSendType sendType: NSPasteboard.PasteboardType?,
                                 returnType: NSPasteboard.PasteboardType?) -> Any? {
        if sendType == nil, let r = returnType,
           r == .pdf || r == .tiff || r == .png || NSImage.imageTypes.contains(r.rawValue) {
            return self
        }
        return super.validRequestor(forSendType: sendType, returnType: returnType)
    }
    func readSelection(from pboard: NSPasteboard) -> Bool { empfang?(pboard) ?? false }
}

final class JarvisApp: NSObject, NSApplicationDelegate, WKUIDelegate, WKNavigationDelegate, NSMenuDelegate, CLLocationManagerDelegate {
    var importModus = 2
    let ortung = CLLocationManager()          // Standort für Wetter & Reiseziele (nur mit Erlaubnis)
    var ortTimer: Timer?                       // 1 = Kontakt, 2 = Dokument
    var port: Int { 47000 + Int(getuid()) % 1000 }
    var token: String {
        let f = FileManager.default.homeDirectoryForCurrentUser.appendingPathComponent(".atlas/token")
        return (try? String(contentsOf: f, encoding: .utf8))?.trimmingCharacters(in: .whitespacesAndNewlines) ?? ""
    }
    var window: NSWindow!
    var web: WKWebView!

    var startURL: URL {
        let port = 47000 + Int(getuid()) % 1000
        let tokenFile = FileManager.default.homeDirectoryForCurrentUser.appendingPathComponent(".atlas/token")
        let token = (try? String(contentsOf: tokenFile, encoding: .utf8))?
            .trimmingCharacters(in: .whitespacesAndNewlines) ?? ""
        let encoded = token.addingPercentEncoding(withAllowedCharacters: .urlQueryAllowed) ?? ""
        return URL(string: "http://127.0.0.1:\(port)/start?token=\(encoded)")!
    }

    func applicationDidFinishLaunching(_ notification: Notification) {
        buildMenu()
        let config = WKWebViewConfiguration()
        config.mediaTypesRequiringUserActionForPlayback = []      // Stimme ohne Klick abspielen
        config.preferences.setValue(true, forKey: "developerExtrasEnabled")
        if #available(macOS 12.3, *) { config.preferences.isElementFullscreenEnabled = true }   // YouTube-Vollbild
        web = WKWebView(frame: .zero, configuration: config)
        web.uiDelegate = self
        web.navigationDelegate = self
        web.setValue(false, forKey: "drawsBackground")

        window = JarvisFenster(contentRect: NSRect(x: 0, y: 0, width: 1500, height: 920),
                          styleMask: [.titled, .closable, .miniaturizable, .resizable, .fullSizeContentView],
                          backing: .buffered, defer: false)
        window.title = "JARVIS"
        (window as? JarvisFenster)?.empfang = { [weak self] pb in self?.empfangen(pb) ?? false }
        window.titlebarAppearsTransparent = true
        window.titleVisibility = .hidden
        window.backgroundColor = NSColor(red: 0.008, green: 0.02, blue: 0.035, alpha: 1)
        window.minSize = NSSize(width: 900, height: 600)
        let inhalt = NSView(frame: window.contentRect(forFrameRect: window.frame))
        // Seite beginnt unter der Leiste: so verdeckt die Leiste keine Schaltflächen und die
        // Fensterknöpfe (Schließen/Minimieren/Zoomen) sitzen frei darin.
        web.frame = NSRect(x: 0, y: 0, width: inhalt.bounds.width, height: inhalt.bounds.height - 28)
        web.autoresizingMask = [.width, .height]
        inhalt.addSubview(web)
        let griff = Griffleiste(frame: NSRect(x: 0, y: inhalt.bounds.height - 28, width: inhalt.bounds.width, height: 28))
        griff.autoresizingMask = [.width, .minYMargin]
        inhalt.addSubview(griff, positioned: .above, relativeTo: web)
        window.contentView = inhalt
        window.isMovable = true
        window.center()
        window.setFrameAutosaveName("JARVIS-Fenster")
        window.makeKeyAndOrderFront(nil)

        AVCaptureDevice.requestAccess(for: .audio) { _ in }      // macOS fragt einmal, dann nie wieder
        globaleTaste()
        ortungStarten()
        web.load(URLRequest(url: startURL, cachePolicy: .reloadIgnoringLocalCacheData))
        NSApp.activate(ignoringOtherApps: true)
    }

    // Mikrofon für JARVIS (nur die lokale Adresse) ohne Nachfrage freigeben
    func webView(_ webView: WKWebView, requestMediaCapturePermissionFor origin: WKSecurityOrigin,
                 initiatedByFrame frame: WKFrameInfo, type: WKMediaCaptureType,
                 decisionHandler: @escaping (WKPermissionDecision) -> Void) {
        let lokal = origin.host == "127.0.0.1" || origin.host == "localhost"
        decisionHandler(lokal && type != .camera ? .grant : .deny)
    }

    // Kern noch nicht gestartet? Kurz warten und erneut laden.
    func webView(_ webView: WKWebView, didFailProvisionalNavigation navigation: WKNavigation!, withError error: Error) {
        DispatchQueue.main.asyncAfter(deadline: .now() + 2) { [weak self] in
            guard let self = self else { return }
            self.web.load(URLRequest(url: self.startURL, cachePolicy: .reloadIgnoringLocalCacheData))
        }
    }

    // Links mit target="_blank" (Quellen, Wikimedia) im Standardbrowser öffnen
    func webView(_ webView: WKWebView, createWebViewWith configuration: WKWebViewConfiguration,
                 for navigationAction: WKNavigationAction, windowFeatures: WKWindowFeatures) -> WKWebView? {
        if let url = navigationAction.request.url { NSWorkspace.shared.open(url) }
        return nil
    }

    func webView(_ webView: WKWebView, decidePolicyFor navigationAction: WKNavigationAction,
                 decisionHandler: @escaping (WKNavigationActionPolicy) -> Void) {
        if let url = navigationAction.request.url, let host = url.host,
           host != "127.0.0.1" && host != "localhost", navigationAction.navigationType == .linkActivated {
            NSWorkspace.shared.open(url)
            decisionHandler(.cancel)
            return
        }
        decisionHandler(.allow)
    }

    // ＋-Knopf im Chat: Dateiauswahl des Mac zeigen (WKWebView braucht dafür diese Methode)
    func webView(_ webView: WKWebView, runOpenPanelWith parameters: WKOpenPanelParameters,
                 initiatedByFrame frame: WKFrameInfo, completionHandler: @escaping ([URL]?) -> Void) {
        let panel = NSOpenPanel()
        panel.allowsMultipleSelection = parameters.allowsMultipleSelection
        panel.canChooseDirectories = false
        panel.canChooseFiles = true
        panel.beginSheetModal(for: window) { antwort in
            completionHandler(antwort == .OK ? panel.urls : nil)
        }
    }

    // Alerts aus der Seite
    func webView(_ webView: WKWebView, runJavaScriptAlertPanelWithMessage message: String,
                 initiatedByFrame frame: WKFrameInfo, completionHandler: @escaping () -> Void) {
        let alert = NSAlert()
        alert.messageText = message
        alert.runModal()
        completionHandler()
    }

    // confirm() aus der Seite – ohne diese Methode liefert WKWebView immer „Nein“
    func webView(_ webView: WKWebView, runJavaScriptConfirmPanelWithMessage message: String,
                 initiatedByFrame frame: WKFrameInfo, completionHandler: @escaping (Bool) -> Void) {
        let alert = NSAlert()
        alert.messageText = message
        alert.addButton(withTitle: "OK")
        alert.addButton(withTitle: "Abbrechen")
        completionHandler(alert.runModal() == .alertFirstButtonReturn)
    }

    // prompt() aus der Seite – ohne diese Methode liefert WKWebView immer null
    func webView(_ webView: WKWebView, runJavaScriptTextInputPanelWithPrompt prompt: String, defaultText: String?,
                 initiatedByFrame frame: WKFrameInfo, completionHandler: @escaping (String?) -> Void) {
        let alert = NSAlert()
        alert.messageText = prompt
        let feld = NSTextField(frame: NSRect(x: 0, y: 0, width: 300, height: 24))
        feld.stringValue = defaultText ?? ""
        alert.accessoryView = feld
        alert.addButton(withTitle: "OK")
        alert.addButton(withTitle: "Abbrechen")
        alert.window.initialFirstResponder = feld
        completionHandler(alert.runModal() == .alertFirstButtonReturn ? feld.stringValue : nil)
    }

    func applicationShouldTerminateAfterLastWindowClosed(_ sender: NSApplication) -> Bool { true }

    // ---------- Vom iPhone importieren (Foto aufnehmen / Dokumente scannen) ----------
    func menuWillOpen(_ menu: NSMenu) {
        if menu.title == "Ablage" { window.makeFirstResponder(window.contentView) }   // Bild landet beim Fenster
    }
    func menu(_ menu: NSMenu, willHighlight item: NSMenuItem?) {
        if let t = item?.tag, t == 1 || t == 2 { importModus = t }
    }
    func empfangen(_ pb: NSPasteboard) -> Bool {
        var daten: Data?, name = "Foto.jpg"
        if let pdf = pb.data(forType: .pdf) {
            daten = pdf; name = "Scan.pdf"
        } else if let bild = NSImage(pasteboard: pb), let tiff = bild.tiffRepresentation,
                  let rep = NSBitmapImageRep(data: tiff),
                  let jpg = rep.representation(using: .jpeg, properties: [.compressionFactor: 0.9]) {
            daten = jpg
        }
        guard let d = daten else { return false }
        hochladen(d, name: name, kontakt: importModus == 1)
        return true
    }
    func hochladen(_ d: Data, name: String, kontakt: Bool) {
        var req = URLRequest(url: URL(string: "http://127.0.0.1:\(port)/\(kontakt ? "kontakt/aus-bild" : "dokument")")!)
        req.httpMethod = "POST"; req.httpBody = d; req.timeoutInterval = 120
        req.setValue(token, forHTTPHeaderField: "x-atlas-token")
        req.setValue(name, forHTTPHeaderField: "x-dateiname")
        js("window.importStatus && window.importStatus('\(kontakt ? "Lese Kontaktdaten …" : "Lese Dokument …")')")
        NSApp.activate(ignoringOtherApps: true)
        window.makeFirstResponder(web)
        URLSession.shared.dataTask(with: req) { [weak self] data, resp, _ in
            DispatchQueue.main.async {
                guard let self = self else { return }
                let ok = (resp as? HTTPURLResponse)?.statusCode == 200
                if !ok { self.js("window.importStatus && window.importStatus('Import fehlgeschlagen')"); return }
                if !kontakt, let data = data, let s = String(data: data, encoding: .utf8) {
                    self.js("window.anhangVonApp && window.anhangVonApp(\(s))")
                }
            }
        }.resume()
    }
    func js(_ code: String) { web.evaluateJavaScript(code, completionHandler: nil) }

    // ---------- Standort (Ortungsdienste) → JARVIS-Kern ----------
    func ortungStarten() {
        ortung.delegate = self
        ortung.desiredAccuracy = kCLLocationAccuracyKilometer      // Ortsgenauigkeit genügt fürs Wetter
        ortung.distanceFilter = 2000
        if #available(macOS 11.0, *) {
            if ortung.authorizationStatus == .notDetermined { ortung.requestWhenInUseAuthorization() }
        }
        ortung.startUpdatingLocation()
        ortTimer = Timer.scheduledTimer(withTimeInterval: 900, repeats: true) { [weak self] _ in self?.ortung.requestLocation() }
    }
    func locationManager(_ manager: CLLocationManager, didUpdateLocations locations: [CLLocation]) {
        guard let l = locations.last, l.horizontalAccuracy >= 0, l.horizontalAccuracy < 20000 else { return }
        var req = URLRequest(url: URL(string: "http://127.0.0.1:\(port)/standort")!)
        req.httpMethod = "POST"; req.timeoutInterval = 30
        req.setValue("application/json", forHTTPHeaderField: "content-type")
        req.setValue(token, forHTTPHeaderField: "x-atlas-token")
        let daten: [String: Any] = ["lat": l.coordinate.latitude, "lon": l.coordinate.longitude,
                                    "genauigkeit": l.horizontalAccuracy, "quelle": "mac"]
        req.httpBody = try? JSONSerialization.data(withJSONObject: daten)
        URLSession.shared.dataTask(with: req).resume()
    }
    func locationManager(_ manager: CLLocationManager, didFailWithError error: Error) {}

    @objc func neuLaden(_ sender: Any?) { web.reloadFromOrigin() }      // immer frisch vom Kern, nie aus dem Zwischenspeicher

    @objc func startsequenz(_ sender: Any?) {
        web.evaluateJavaScript("window.startsequenz && window.startsequenz()", completionHandler: nil)
    }

    // ⌥⌘N überall auf dem Mac: Telefonnotiz starten/beenden (braucht keine Bedienungshilfen-Freigabe)
    var hotKeyRef: EventHotKeyRef?
    func globaleTaste() {
        var spec = EventTypeSpec(eventClass: OSType(kEventClassKeyboard), eventKind: UInt32(kEventHotKeyPressed))
        InstallEventHandler(GetApplicationEventTarget(), { _, _, userData in
            guard let userData = userData else { return noErr }
            let app = Unmanaged<JarvisApp>.fromOpaque(userData).takeUnretainedValue()
            DispatchQueue.main.async { app.telefonnotiz(nil) }
            return noErr
        }, 1, &spec, Unmanaged.passUnretained(self).toOpaque(), nil)
        let id = EventHotKeyID(signature: OSType(0x4A52_5653), id: 1)        // 'JRVS'
        RegisterEventHotKey(UInt32(kVK_ANSI_N), UInt32(cmdKey | optionKey), id, GetApplicationEventTarget(), 0, &hotKeyRef)
    }

    @objc func einstellungen(_ sender: Any?) {
        web.evaluateJavaScript("window.einstellungenOeffnen && window.einstellungenOeffnen()", completionHandler: nil)
    }

    @objc func einfuehrung(_ sender: Any?) {
        web.evaluateJavaScript("window.einfuehrung && window.einfuehrung(true)", completionHandler: nil)
    }

    @objc func funktionsliste(_ sender: Any?) {
        web.evaluateJavaScript("window.funktionslisteZeigen && window.funktionslisteZeigen()", completionHandler: nil)
    }

    @objc func telefonnotiz(_ sender: Any?) {
        web.evaluateJavaScript("window.telefonnotiz && window.telefonnotiz()", completionHandler: nil)
    }

    func buildMenu() {
        let main = NSMenu()

        let appItem = NSMenuItem()
        let appMenu = NSMenu()
        appMenu.addItem(withTitle: "Über JARVIS", action: #selector(NSApplication.orderFrontStandardAboutPanel(_:)), keyEquivalent: "")
        appMenu.addItem(.separator())
        let prefs = NSMenuItem(title: "Einstellungen …", action: #selector(einstellungen(_:)), keyEquivalent: ",")
        prefs.target = self
        appMenu.addItem(prefs)
        appMenu.addItem(.separator())
        appMenu.addItem(withTitle: "JARVIS ausblenden", action: #selector(NSApplication.hide(_:)), keyEquivalent: "h")
        appMenu.addItem(.separator())
        appMenu.addItem(withTitle: "JARVIS beenden", action: #selector(NSApplication.terminate(_:)), keyEquivalent: "q")
        appItem.submenu = appMenu
        main.addItem(appItem)

        let ablageItem = NSMenuItem()
        let ablage = NSMenu(title: "Ablage")
        ablage.delegate = self
        for (titel, tag) in [("Kontakt vom iPhone", 1), ("Dokument vom iPhone", 2)] {
            let it = NSMenuItem(title: titel, action: nil, keyEquivalent: "")
            it.identifier = NSMenuItem.importFromDeviceIdentifier       // macOS füllt: Foto aufnehmen, Dokumente scannen …
            it.tag = tag
            ablage.addItem(it)
        }
        ablageItem.submenu = ablage
        main.addItem(ablageItem)

        let editItem = NSMenuItem()
        let edit = NSMenu(title: "Bearbeiten")
        edit.addItem(withTitle: "Widerrufen", action: Selector(("undo:")), keyEquivalent: "z")
        edit.addItem(withTitle: "Wiederholen", action: Selector(("redo:")), keyEquivalent: "Z")
        edit.addItem(.separator())
        edit.addItem(withTitle: "Ausschneiden", action: #selector(NSText.cut(_:)), keyEquivalent: "x")
        edit.addItem(withTitle: "Kopieren", action: #selector(NSText.copy(_:)), keyEquivalent: "c")
        edit.addItem(withTitle: "Einsetzen", action: #selector(NSText.paste(_:)), keyEquivalent: "v")
        edit.addItem(withTitle: "Alles auswählen", action: #selector(NSText.selectAll(_:)), keyEquivalent: "a")
        editItem.submenu = edit
        main.addItem(editItem)

        let viewItem = NSMenuItem()
        let view = NSMenu(title: "Darstellung")
        let reload = NSMenuItem(title: "Neu laden", action: #selector(neuLaden(_:)), keyEquivalent: "r")
        reload.target = self
        view.addItem(reload)
        let boot = NSMenuItem(title: "Startsequenz abspielen", action: #selector(startsequenz(_:)), keyEquivalent: "")
        boot.target = self
        view.addItem(boot)
        let full = NSMenuItem(title: "Vollbild", action: #selector(NSWindow.toggleFullScreen(_:)), keyEquivalent: "f")
        full.keyEquivalentModifierMask = [.command, .control]
        view.addItem(full)
        viewItem.submenu = view
        main.addItem(viewItem)

        let windowItem = NSMenuItem()
        let win = NSMenu(title: "Fenster")
        win.addItem(withTitle: "Im Dock ablegen", action: #selector(NSWindow.performMiniaturize(_:)), keyEquivalent: "m")
        win.addItem(withTitle: "Zoomen", action: #selector(NSWindow.performZoom(_:)), keyEquivalent: "")
        win.addItem(.separator())
        let notiz = NSMenuItem(title: "Telefonnotiz starten/beenden (⌥⌘N)", action: #selector(telefonnotiz(_:)), keyEquivalent: "")
        notiz.target = self
        win.addItem(notiz)
        windowItem.submenu = win
        main.addItem(windowItem)

        let hilfeItem = NSMenuItem()
        let hilfe = NSMenu(title: "Hilfe")
        let tour = NSMenuItem(title: "Einführung starten", action: #selector(einfuehrung(_:)), keyEquivalent: "")
        tour.target = self
        hilfe.addItem(tour)
        let liste = NSMenuItem(title: "Was kann JARVIS? (Funktionsliste)", action: #selector(funktionsliste(_:)), keyEquivalent: "")
        liste.target = self
        hilfe.addItem(liste)
        hilfeItem.submenu = hilfe
        main.addItem(hilfeItem)
        NSApp.helpMenu = hilfe

        NSApp.mainMenu = main
    }
}

let app = NSApplication.shared
let delegate = JarvisApp()
app.delegate = delegate
app.setActivationPolicy(.regular)
app.run()

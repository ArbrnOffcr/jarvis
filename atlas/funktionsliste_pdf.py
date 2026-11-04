"""Funktionsliste & Sicherheitseinrichtungen als PDF (docs/JARVIS_Funktionsliste.pdf).

Quelle: FUNKTIONEN.md (Teil A) und SICHERHEIT.md (Teil B) im Repository. `jarvis speichern` erzeugt die PDF vor jedem
Hochladen neu, `jarvis veroeffentlichen` hängt sie zusätzlich ans GitHub-Release.
Aufruf von Hand: python -m atlas.funktionsliste_pdf [ziel.pdf]
"""
from __future__ import annotations

import re
import sys
from pathlib import Path

REPO = Path(__file__).resolve().parent.parent
ZIEL_STANDARD = REPO / "docs" / "JARVIS_Funktionsliste.pdf"
SCHRIFTEN = [REPO / "werkzeuge" / "schriften", Path("/usr/share/fonts/truetype/dejavu"),
             Path.home() / "Library" / "Fonts", Path("/Library/Fonts")]


def _schrift(name: str) -> str:
    for d in SCHRIFTEN:
        if (d / name).exists():
            return str(d / name)
    raise FileNotFoundError(f"Schrift {name} fehlt (werkzeuge/schriften)")


def sicherheit_lesen(text: str) -> list[tuple[str, list[tuple[str, str]]]]:
    bereiche: list = []
    for z in text.splitlines():
        if z.startswith("## "):
            bereiche.append((z[3:].strip(), []))
        elif bereiche and z.startswith("- "):
            m = re.match(r"- \*\*(.+?):\*\*\s*(.+)", z)
            bereiche[-1][1].append((m.group(1), m.group(2)) if m else ("", z[2:]))
    return [b for b in bereiche if b[1]]


def bauen(ziel: Path | None = None) -> Path:
    from reportlab.lib import colors
    from reportlab.lib.enums import TA_LEFT
    from reportlab.lib.pagesizes import A4
    from reportlab.lib.styles import ParagraphStyle
    from reportlab.lib.units import mm
    from reportlab.pdfbase import pdfmetrics
    from reportlab.pdfbase.ttfonts import TTFont
    from reportlab.platypus import (BaseDocTemplate, Frame, KeepTogether, NextPageTemplate, PageBreak, PageTemplate,
                                    Paragraph, Spacer, Table, TableStyle)
    from reportlab.platypus.tableofcontents import TableOfContents

    ziel = Path(ziel or ZIEL_STANDARD)
    ziel.parent.mkdir(parents=True, exist_ok=True)
    QUELLE = REPO / "FUNKTIONEN.md"
    SICHERHEIT = sicherheit_lesen((REPO / "SICHERHEIT.md").read_text(encoding="utf-8"))
    pdfmetrics.registerFont(TTFont("S", _schrift("DejaVuSans.ttf")))
    pdfmetrics.registerFont(TTFont("SB", _schrift("DejaVuSans-Bold.ttf")))
    pdfmetrics.registerFont(TTFont("SI", _schrift("DejaVuSans-Oblique.ttf")))
    pdfmetrics.registerFont(TTFont("SBI", _schrift("DejaVuSans-BoldOblique.ttf")))
    pdfmetrics.registerFont(TTFont("M", _schrift("DejaVuSansMono.ttf")))
    pdfmetrics.registerFontFamily("S", normal="S", bold="SB", italic="SI", boldItalic="SBI")

    NAVY, CYAN, TEXT, GRAU, LINIE, HELL = (colors.HexColor(x) for x in
                                          ("#0B1622", "#0097A7", "#1C2530", "#5E6B78", "#D5DCE3", "#F2F6F8"))
    STATUS = {"✅": ("OK", "#1E7D4F", "#E3F3EA"), "⚙": ("EINRICHTEN", "#8A5A00", "#FBF0D9"),
              "🔒": ("BESTÄTIGUNG", "#1F4E9C", "#E2EBF8"), "❌": ("NEIN", "#9C2A2A", "#F8E3E3")}

    st = {
        "h1": ParagraphStyle("h1", fontName="SB", fontSize=17, leading=21, textColor=NAVY, spaceBefore=4, spaceAfter=8),
        "h2": ParagraphStyle("h2", fontName="SB", fontSize=12.5, leading=16, textColor=NAVY, spaceBefore=12, spaceAfter=6),
        "h3": ParagraphStyle("h3", fontName="SB", fontSize=10.5, leading=14, textColor=CYAN, spaceBefore=8, spaceAfter=4),
        "p": ParagraphStyle("p", fontName="S", fontSize=9.2, leading=13.2, textColor=TEXT, spaceAfter=5),
        "klein": ParagraphStyle("k", fontName="S", fontSize=8, leading=11, textColor=GRAU),
        "zelle": ParagraphStyle("z", fontName="S", fontSize=7.9, leading=10.4, textColor=TEXT, alignment=TA_LEFT),
        "zelleg": ParagraphStyle("zg", fontName="S", fontSize=7.4, leading=9.8, textColor=GRAU),
        "kopf": ParagraphStyle("kh", fontName="SB", fontSize=7.2, leading=9, textColor=colors.white),
        "sicht": ParagraphStyle("sh", fontName="SB", fontSize=8.4, leading=11, textColor=NAVY),
    }


    def inline(s: str) -> str:
        s = s.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")
        s = re.sub(r"`([^`]+)`", r'<font face="M" size="7.3" color="#0B5563">\1</font>', s)
        s = re.sub(r"\*\*([^*]+)\*\*", r"<b>\1</b>", s)
        s = s.replace("🔒", "[Bestätigung]").replace("✅", "✓").replace("❌", "✗").replace("⚙️", "⚙").replace("️", "")
        s = re.sub(r"[\U0001F000-\U0001FFFF]", "", s)
        s = s.replace("\\|", "|")
        return s


    def badges(feld: str):
        teile = [k for k in ("✅", "⚙", "🔒", "❌") if k in feld]
        if not teile:
            return Paragraph(inline(feld), st["zelle"]), []
        txt = "<br/>".join(f'<font name="SB" size="6.4" color="{STATUS[k][1]}">{STATUS[k][0]}</font>' for k in teile)
        return Paragraph(txt, st["zelle"]), teile


    class Doc(BaseDocTemplate):
        def afterFlowable(self, f):
            if isinstance(f, Paragraph) and getattr(f, "_toc", None) is not None:
                lvl, text = f._toc
                key = f"k{id(f)}"
                self.canv.bookmarkPage(key)
                self.canv.addOutlineEntry(text, key, lvl, closed=lvl > 0)
                self.notify("TOCEntry", (lvl, text, self.page, key))


    def kopfzeile(text, lvl, stil):
        p = Paragraph(text, st[stil]); p._toc = (lvl, re.sub("<[^>]+>", "", text)); return p


    VERSION = re.search(r"Version ([\d.]+)", QUELLE.read_text(encoding="utf-8")).group(1)
    STAND = re.search(r"Stand: ([\d.]+)", QUELLE.read_text(encoding="utf-8")).group(1)


    def seite(c, d):
        c.saveState()
        w, h = A4
        c.setStrokeColor(LINIE); c.setLineWidth(0.5); c.line(18 * mm, h - 14 * mm, w - 18 * mm, h - 14 * mm)
        c.setFont("SB", 7.5); c.setFillColor(NAVY); c.drawString(18 * mm, h - 12 * mm, "JARVIS")
        c.setFont("S", 7.5); c.setFillColor(GRAU)
        c.drawString(31 * mm, h - 12 * mm, f"Funktionsliste & Sicherheitseinrichtungen · Version {VERSION}")
        c.drawRightString(w - 18 * mm, h - 12 * mm, f"Stand {STAND}")
        c.drawString(18 * mm, 10 * mm, "Privat – nur für den persönlichen Gebrauch")
        c.drawRightString(w - 18 * mm, 10 * mm, f"Seite {d.page}")
        c.restoreState()


    def titel(c, d):
        w, h = A4
        c.saveState()
        c.setFillColor(NAVY); c.rect(0, 0, w, h, fill=1, stroke=0)
        c.setStrokeColor(CYAN); c.setLineWidth(0.6)
        for i in range(14):                                     # dezentes Ringmotiv wie der Kern
            c.setStrokeAlpha(0.06 + 0.012 * i)
            c.circle(w - 40 * mm, h - 70 * mm, (12 + 7 * i) * mm, stroke=1, fill=0)
        c.setStrokeAlpha(1)
        c.setFillColor(CYAN); c.rect(22 * mm, h - 128 * mm, 14 * mm, 1.4 * mm, fill=1, stroke=0)
        c.setFillColor(colors.white); c.setFont("SB", 40); c.drawString(22 * mm, h - 120 * mm, "JARVIS")
        c.setFont("S", 17); c.drawString(22 * mm, h - 143 * mm, "Vollständige Funktionsliste")
        c.drawString(22 * mm, h - 152 * mm, "und Sicherheitseinrichtungen")
        c.setFillColor(colors.HexColor("#8FB6C4")); c.setFont("S", 10.5)
        c.drawString(22 * mm, h - 170 * mm, f"Version {VERSION}  ·  Stand {STAND}  ·  macOS und Windows")
        c.setFont("S", 8.5); c.setFillColor(colors.HexColor("#6F8C99"))
        c.drawString(22 * mm, 22 * mm, "Persönlicher KI-Assistent von Richard · Privat – nicht zur Weitergabe")
        c.restoreState()


    # ---------------------------------------------------------------- Markdown einlesen
    abschnitte, akt = [], None
    for z in QUELLE.read_text(encoding="utf-8").splitlines():
        if z.startswith("## "):
            akt = {"titel": z[3:].strip(), "teile": []}; abschnitte.append(akt)
        elif akt is None:
            continue
        elif z.startswith("### "):
            akt["teile"].append(("h3", z[4:].strip()))
        elif z.startswith("|"):
            zellen = [x.strip() for x in re.split(r"(?<!\\)\|", z.strip())[1:-1]]
            if zellen and set(zellen[0]) <= set("-: "):
                continue
            if zellen[:2] == ["Funktion", "Stand"]:
                continue
            akt["teile"].append(("zeile", zellen))
        elif z.strip() and not z.startswith("---"):
            akt["teile"].append(("p", z.strip()))

    # Statistik
    gesamt = {k: 0 for k in STATUS}
    statistik = []
    for a in abschnitte:
        zz = {k: 0 for k in STATUS}; n = 0
        for art, inh in a["teile"]:
            if art == "zeile":
                n += 1
                for k in STATUS:
                    if k in inh[1]:
                        zz[k] += 1; gesamt[k] += 1
        a["n"] = n
        statistik.append((a["titel"], n, zz))
    n_gesamt = sum(a["n"] for a in abschnitte)

    # ---------------------------------------------------------------- Inhalt
    s = [NextPageTemplate("normal"), PageBreak()]
    s.append(Paragraph("Inhalt", st["h1"]))
    toc = TableOfContents()
    toc.levelStyles = [ParagraphStyle("t0", fontName="SB", fontSize=9.5, leading=14, textColor=NAVY, leftIndent=0),
                       ParagraphStyle("t1", fontName="S", fontSize=8.6, leading=12, textColor=TEXT, leftIndent=12)]
    toc.dotsMinLevel = 0
    s += [toc, PageBreak()]

    # Überblick
    s.append(kopfzeile("Überblick", 0, "h1"))
    s.append(Paragraph(
        f"Dieses Dokument beschreibt den vollständigen Funktionsumfang von JARVIS in Version {VERSION} (Stand {STAND}) – "
        f"insgesamt <b>{n_gesamt} Einträge in {len(abschnitte)} Bereichen</b> – sowie in Teil B alle Sicherheits- und "
        "Datenschutzeinrichtungen, geordnet nach Schutzziel. Grundlage ist die Funktionsliste FUNKTIONEN.md, die bei jeder "
        "Änderung mitgepflegt wird und die JARVIS selbst liest, wenn man ihn fragt: „Was kannst du?“", st["p"]))
    s.append(Spacer(1, 4))
    leg = [[Paragraph("<b>Kennzeichen</b>", st["kopf"]), Paragraph("<b>Bedeutung</b>", st["kopf"]),
            Paragraph("<b>Anzahl</b>", st["kopf"])]]
    bed = {"✅": "funktioniert", "⚙": "funktioniert, braucht eine Einrichtung (Schlüssel, Ordner …)",
           "🔒": "JARVIS fragt vorher nach Bestätigung", "❌": "kann JARVIS nicht – bewusst oder noch nicht"}
    for k, (name, farbe, hg) in STATUS.items():
        leg.append([Paragraph(f'<font name="SB" color="{farbe}">{name}</font>', st["zelle"]), Paragraph(bed[k], st["zelle"]),
                    Paragraph(str(gesamt[k]), st["zelle"])])
    t = Table(leg, colWidths=[32 * mm, 110 * mm, 20 * mm])
    t.setStyle(TableStyle([("BACKGROUND", (0, 0), (-1, 0), NAVY), ("GRID", (0, 0), (-1, -1), 0.4, LINIE),
                           ("VALIGN", (0, 0), (-1, -1), "MIDDLE"), ("TOPPADDING", (0, 0), (-1, -1), 4),
                           ("BOTTOMPADDING", (0, 0), (-1, -1), 4)]))
    s += [t, Spacer(1, 6), Paragraph("Ein Eintrag kann mehrere Kennzeichen tragen (z. B. OK und BESTÄTIGUNG).", st["klein"]),
          Spacer(1, 10)]

    s.append(Paragraph("Bereiche auf einen Blick", st["h2"]))
    kopf = ["Bereich", "Einträge", "OK", "Einrichten", "Bestätigung", "Nein"]
    zeilen = [[Paragraph(f"<b>{x}</b>", st["kopf"]) for x in kopf]]
    for tit, n, zz in statistik:
        zeilen.append([Paragraph(inline(tit), st["zelle"])] + [Paragraph(str(v), st["zelle"]) for v in
                                                                (n, zz["✅"], zz["⚙"], zz["🔒"], zz["❌"])])
    zeilen.append([Paragraph("<b>Gesamt</b>", st["zelle"])] + [Paragraph(f"<b>{v}</b>", st["zelle"]) for v in
                                                             (n_gesamt, gesamt["✅"], gesamt["⚙"], gesamt["🔒"], gesamt["❌"])])
    t = Table(zeilen, colWidths=[74 * mm, 17 * mm, 14 * mm, 20 * mm, 25 * mm, 14 * mm], repeatRows=1)
    t.setStyle(TableStyle([("BACKGROUND", (0, 0), (-1, 0), NAVY), ("LINEBELOW", (0, 0), (-1, -1), 0.4, LINIE),
                           ("ROWBACKGROUNDS", (0, 1), (-1, -2), [colors.white, HELL]),
                           ("BACKGROUND", (0, -1), (-1, -1), colors.HexColor("#E3EEF2")),
                           ("TOPPADDING", (0, 0), (-1, -1), 3), ("BOTTOMPADDING", (0, 0), (-1, -1), 3)]))
    s += [t, PageBreak()]

    # Teil A
    s.append(kopfzeile("Teil A – Funktionsliste", 0, "h1"))
    s.append(Paragraph("Alle Funktionen mit Stand und Hinweis zur Bedienung oder Einrichtung. Befehle für das Terminal "
                       "sind in Schreibmaschinenschrift gesetzt.", st["p"]))
    BREITE = [86 * mm, 22 * mm, 66 * mm]


    def tabelle(zeilen):
        daten = [[Paragraph("<b>Funktion</b>", st["kopf"]), Paragraph("<b>Stand</b>", st["kopf"]),
                  Paragraph("<b>Hinweis</b>", st["kopf"])]]
        stile = [("BACKGROUND", (0, 0), (-1, 0), NAVY), ("VALIGN", (0, 0), (-1, -1), "TOP"),
                 ("LINEBELOW", (0, 0), (-1, -1), 0.35, LINIE), ("TOPPADDING", (0, 0), (-1, -1), 3.2),
                 ("BOTTOMPADDING", (0, 0), (-1, -1), 3.2), ("LEFTPADDING", (0, 0), (-1, -1), 4),
                 ("RIGHTPADDING", (0, 0), (-1, -1), 4)]
        for i, z in enumerate(zeilen, 1):
            z = (z + ["", "", ""])[:3]
            b, teile = badges(z[1])
            daten.append([Paragraph(inline(z[0]), st["zelle"]), b, Paragraph(inline(z[2]), st["zelleg"])])
            if teile:
                stile.append(("BACKGROUND", (1, i), (1, i), colors.HexColor(STATUS[teile[0]][2])))
            if i % 2 == 0:
                stile.append(("BACKGROUND", (0, i), (0, i), HELL)); stile.append(("BACKGROUND", (2, i), (2, i), HELL))
        t = Table(daten, colWidths=BREITE, repeatRows=1)
        t.setStyle(TableStyle(stile))
        return t


    for a in abschnitte:
        s.append(kopfzeile(inline(a["titel"]), 1, "h2"))
        puffer = []
        for art, inh in a["teile"]:
            if art == "zeile":
                puffer.append(inh); continue
            if puffer:
                s.append(tabelle(puffer)); puffer = []
            if art == "h3":
                s.append(Paragraph(inline(inh), st["h3"]))
            else:
                s.append(Paragraph(inline(inh), st["p"]))
        if puffer:
            s.append(tabelle(puffer))

    # Teil B
    s += [PageBreak(), kopfzeile("Teil B – Sicherheitseinrichtungen", 0, "h1")]
    anz = sum(len(x[1]) for x in SICHERHEIT)
    s.append(Paragraph(
        f"Alle Schutzmechanismen von JARVIS in {len(SICHERHEIT)} Schutzbereichen mit {anz} Einrichtungen. "
        "Leitlinie: <b>Private Daten bleiben auf dem eigenen Rechner, Cloud-Modelle sehen nur das Nötigste in "
        "maskierter Form, und alles mit Wirkung nach außen braucht eine Befugnis oder eine Bestätigung.</b>", st["p"]))
    grund = [("Lokal vor Cloud", "Spracherkennung, Suchindex, Steckbriefe, Gesundheits-, Beihilfe- und Notfalldaten werden "
              "lokal verarbeitet; Cloud-Modelle sehen Platzhalter statt persönlicher Angaben."),
             ("Bestätigung vor Wirkung", "Senden, Löschen, Ändern, Ablegen und Einreichen nur nach Klick oder ausdrücklich "
              "erteilter, begrenzter Befugnis – mit Protokoll und 7 Tagen Rückgängig."),
             ("Bewusste Grenzen", "Kein Geldverkehr, kein Entriegeln von Auto oder Haustür, keine Umgehung von Captchas, "
              "keine Verarbeitung von Verschlusssachen."),
             ("Kontrolle", "Wöchentliches Sicherheitsaudit (AEGIS), Datenschutz-Bericht, Sicherheitstests vor jeder "
              "Veröffentlichung, Fernsperren für Installationen und Versionen.")]
    g = Table([[Paragraph(f"<b>{a}</b>", st["sicht"]), Paragraph(b, st["zelle"])] for a, b in grund],
              colWidths=[40 * mm, 134 * mm])
    g.setStyle(TableStyle([("BACKGROUND", (0, 0), (0, -1), colors.HexColor("#E3EEF2")),
                           ("LINEBELOW", (0, 0), (-1, -1), 0.4, colors.white), ("VALIGN", (0, 0), (-1, -1), "TOP"),
                           ("TOPPADDING", (0, 0), (-1, -1), 5), ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
                           ("BACKGROUND", (1, 0), (1, -1), HELL)]))
    s += [Spacer(1, 4), g, Spacer(1, 6)]
    for tit, eintraege in SICHERHEIT:
        daten = [[Paragraph(f"<b>{inline(a)}</b>", st["sicht"]), Paragraph(inline(b), st["zelle"])] for a, b in eintraege]
        t = Table(daten, colWidths=[48 * mm, 126 * mm])
        t.setStyle(TableStyle([("VALIGN", (0, 0), (-1, -1), "TOP"), ("LINEBELOW", (0, 0), (-1, -1), 0.35, LINIE),
                               ("LINEBEFORE", (0, 0), (0, -1), 2, CYAN), ("TOPPADDING", (0, 0), (-1, -1), 4),
                               ("BOTTOMPADDING", (0, 0), (-1, -1), 4), ("LEFTPADDING", (0, 0), (0, -1), 7)]))
        s += [KeepTogether([kopfzeile(inline(tit), 1, "h2"), t])]

    s += [Spacer(1, 14), Paragraph(
        "Dieses Dokument wird bei jeder neuen Version automatisch aus FUNKTIONEN.md und SICHERHEIT.md erzeugt und "
        "beschreibt den Soll-Zustand laut Funktionsliste und Code.", st["klein"])]

    doc = Doc(str(ziel), pagesize=A4, invariant=1, leftMargin=18 * mm, rightMargin=18 * mm, topMargin=20 * mm, bottomMargin=18 * mm,
              title=f"JARVIS – Funktionsliste und Sicherheitseinrichtungen v{VERSION}", author="JARVIS",
              subject="Funktionsumfang und Sicherheitseinrichtungen")
    rahmen = Frame(doc.leftMargin, doc.bottomMargin, doc.width, doc.height, id="f")
    doc.addPageTemplates([PageTemplate("titel", [rahmen], onPage=titel), PageTemplate("normal", [rahmen], onPage=seite)])
    doc.multiBuild(s)
    return ziel


if __name__ == "__main__":
    print(bauen(Path(sys.argv[1]) if len(sys.argv) > 1 else None))

# Grossrelief-Kartenprojektor v5.6 – GitHub Pages

**Voraussetzung:** Nur `layout.csv` laden, um die Karte für das gesamte Relief aus swisstopo-/Zürcher Geodaten zu erzeugen. Bestehende Kartenbilder lassen sich weiterhin unabhängig davon hochladen. Reine HTML/JavaScript-Anwendung auf GitHub Pages, kein eigener Server.

## Version 5.6: weitere Gewässer, Weiher und Sihl

Die in Version 5.5 bereits funktionierenden Gewässer und die genaue Zürichsee-Uferlinie bleiben bestehen. Neu durchsucht die App den amtlichen WFS des Kantons Zürich zusätzlich nach:

**Bachläufen:** Zopfbach, Gulmenbach, Töbelibach, Untermosenbach, Reidbach/Riedbach/Wildbach, Teufenbach, Sihl, Krebsbach, Schlossbach, Sagenbach, Miesbach. Aabach und Meilibach bleiben als bisher unterstützte Namen dabei.

**Stehgewässern:** Sternenweiher, Reidbachweiher/Riedbachweiher, Teufenbachweiher. Sie werden als Gewässerflächen aus `WB_STEHGEWAESSER_F` gezeichnet, nicht als Bachlinien. Der Kartendienst kann Gewässer unter anderen Namen führen oder bestimmte Kleinstweiher nicht enthalten. Keine Geometrien werden erfunden.

**Wichtige Unterscheidung:** `Krebsbach` wird **nicht** mit `Chrebsbach` gleichgesetzt. Die Namensprüfung vergleicht normalisierte ganze Gewässerbezeichnungen, nicht Textteile.

**Sihl:** Die App lädt mehrere benannte Teilstücke und versucht zusätzlich, anhand der kantonalen Gewässernummer weitere amtliche Achsen aus `WB_FLIESSGEWAESSER_L_M` hinzuzufügen. Das verbessert die Vollständigkeit innerhalb des Ausschnitts. Für die über Kantons- oder Datensatzgrenzen hinausreichenden Strecken garantiert der kantonale Dienst alleine keine Vollständigkeit. Die Startansicht zeigt die Anzahl erkannter Sihl-Segmente.

Die Gewässer-Diagnose zeigt nun **Bäche x/13, Weiher x/3 und Sihl-Teilstücke**. Sie zählt nur die tatsächlich vom kantonalen WFS zurückgelieferten Geometrien. Fehlende Bezeichnungen bleiben als fehlend erkennbar.

## Datenquellen / Originale

- Kanton Zürich, **GIS-ZH Nr. 45.3** (`WB_GEWAESSERBEZEICHNUNG_L`): Fliessgewässer mit amtlichen Namen
- Kanton Zürich, **GIS-ZH Nr. 45.2** (`WB_FLIESSGEWAESSER_L_M`): vollständige amtliche Fliessgewässerachsen mit Gewässernummern
- Kanton Zürich, **GIS-ZH Nr. 45.10** (`WB_STEHGEWAESSER_F`): amtliche Seen- und Weiherflächen
- Kanton Zürich, **GIS-ZH Nr. 45.13**: detaillierte Uferlinie Zürichsee
- API: https://maps.zh.ch/wfs/OGDZHWFS
- Datensatz: https://geolion.zh.ch/geodatensatz/743

Keine generalisierte vec200-Uferlinie. Wenn der kantonale WFS ausfällt, zeigt die App ausdrücklich die Fehlermeldung und verwendet als Ersatz das bestehende detaillierte swissTLM3D-Wasserlayer (mit potentiell vielen Rinnsalen).

## Bedienung

1. `layout.csv` hochladen.
2. Modus **Heute** und Karte **3 – Gewässer** aktivieren. Die zusätzlichen Gewässer erscheinen automatisch, sofern ihre amtlichen Geometrien geliefert werden.
3. Rechts im Startmenü unter *Gewässerdarstellung* den Diagnose-Text prüfen. Es erscheint die Anzahl erkannter Bäche, Weiher und Sihl-Segmente.
4. Projektormodus öffnen, vier Ecken einstellen; Ebenen mit **1–9 unabhängig ein/aus** schalten. `Esc` führt zurück zum Hauptmenü.
5. Kartenbilder als PNG oder ZIP herunterladen, einschliesslich der offiziellen Vektorgeometrien, die tatsächlich geladen wurden.

Luftbild/Landeskarte, weisse Relief-Grundbeleuchtung, Wald, historische Karten, Wädenswil-Gemeindemaske, Vier-Ecken-Perspektive sowie die schmale rechte Bedienleiste bleiben unverändert.

## GitHub aktualisieren

ZIP entpacken und **alle Dateien und Ordner** direkt ins bisherige Repository hochladen. `index.html` muss im Repository-Stammverzeichnis liegen und verweist auf `core.v5.6.js`, `hydro.v5.6.js`, `app.v5.6.js`, `style.v5.6.css`. Änderungen committen und GitHub Pages mit `Strg + F5` laden. Alte Skripte dürfen liegen bleiben, werden aber nicht mehr verwendet.

## Tests und Grenzen

- `node tests/core.test.js` – CSV, Geometrie, Perspektive, Karte und WMS.
- `node tests/test_hydro_v56.js` – Bachnamen, Reidbach/Wildbach, Krebsbach ≠ Chrebsbach, drei Weiher und mehrteilige Sihl.
- `python tests/test_v56_browser.py` – Chromium mit simulierten WFS-/WMS-Antworten, kalibrierbare Anzeige, Mehrfachauswahl, PNG-Download.
- `python tests/test_fallback_browser.py` – Ausfall des kantonalen WFS.

**Offene Live-Prüfung:** Die tatsächliche Zahl der neu gefundenen Weiher und Sihl-Teilstücke lässt sich erst nach Veröffentlichung gegen den Zürcher WFS feststellen. Die Entwicklungstests beweisen die Funktionen, nicht die Vollständigkeit der serverseitigen Daten.

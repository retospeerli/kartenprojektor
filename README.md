# Grossrelief-Kartenprojektor v5.5 – GitHub Pages

Diese Version behebt zwei reale Probleme aus v5.4:

1. **Versionskonflikt:** Der Versionscheck verlangte irrtümlich weiterhin `5.3.0`. Ab jetzt erwarten `index.html` und `app.v5.5.js` die Version `5.5.0`; alle eingebundenen Dateien haben neue Namen.
2. **Ungenaue Zürichsee-Uferlinie:** Die standardmässige Gewässerdarstellung nutzte bisher die generalisierte Hydrographie von swissTLMRegio/vec200. Das vereinfachte Seeufer war für das projizierte Relief nicht genau genug. **Die App verwendet diese Gewässerquelle nicht mehr.**

## Präzise Gewässer – Versuch mit amtlichen Vektoren

Im Modus **Heute**, bei **3 = Gewässer** und der Standardeinstellung **„Amtliche Ufer + ausgewählte Bäche“**, fragt die App zuerst die offiziellen offenen Vektordaten des Kantons Zürich ab:

- stehende Gewässer als präzise **Gewässerflächen** (`WB_STEHGEWAESSER_F`),
- die speziell vermessene **Zürichsee-Uferlinie** (`WB_ZUERICHSEE_L`),
- **benannte Fliessgewässergeometrien** (`WB_GEWAESSERBEZEICHNUNG_L` bzw. `WB_FLIESSGEWAESSER_L`).

Die App liest zuerst WFS *GetCapabilities*, um die **tatsächlich veröffentlichten Typnamen** zu ermitteln. Anschliessend werden Daten mit LV95-Koordinaten (EPSG:2056) abgefragt. Das verhindert die früheren Vermutungen zu WFS-Typnamen, die wahrscheinlich keine Treffer lieferten.

Gesuchte ergänzende Bachläufe:

- Zopfbach
- Gulmenbach
- Töbelibach
- Untermosenbach

Zusätzlich können benannte grössere Gewässer wie Sihl, Aabach, Meilibach und Riedbach erscheinen. **Es werden keine frei gezeichneten Bachläufe erzeugt.** Mehrere Linienabschnitte desselben Bachs können separat erscheinen. Die Startansicht meldet, wie viele der vier Bäche anhand der amtlichen Daten gefunden wurden (z. B. `3/4`).

**Wichtig:** Der amtliche WFS-Abruf konnte in der Entwicklungsumgebung nicht live verifiziert werden. Die Geometrieabfragen wurden mit realistisch aufgebauten Testantworten im Browser geprüft. Abhängig vom Server/CORS kann die Online-Abfrage scheitern. In diesem Fall schaltet die App sichtbar auf das **genauere swissTLM3D-Gewässernetz** um. Damit stimmt die Seeuferquelle besser als vorher; es können jedoch zusätzliche Rinnsale erscheinen. Der Fehler wird in der Startansicht angezeigt statt unterdrückt.

Alternativ lassen sich LV95-GeoJSON-Dateien der amtlichen Gewässerdaten in der Startansicht hochladen. Das funktioniert ohne direkten WFS-Zugriff und kann die vier Bachläufe ergänzen. GeoJSON-Daten müssen bereits in EPSG:2056 vorliegen.

## Bedienung bleibt unverändert

- `layout.csv` hochladen (Gesamtfläche aus allen Reliefsegmenten).
- Projektormodus starten; 1 bis 9 schalten jeweils nur die entsprechende Kartenebene ein/aus.
- 1 Luftbild, 2 Landeskarte, 3 Gewässer, 4 Verkehr, 5 Grenzen, 6 Siedlungen, 7 Ortsnamen, 8 Gebäude, 9 Wald.
- Mehrfachauswahl ohne Shift; vier frei ziehbare Eckpunkte; T = Randmenü, K = Eckpunkte, Esc = Startmenü.
- Wenn keine Deckkarte aktiv ist, wird das Relief weiss beleuchtet.
- Heute/Historisch, Gemeindemaske Wädenswil und PNG-/ZIP-Exporte bleiben erhalten.
- **Wichtig bei PNG-/ZIP-Exporten:** Ein fremder WMS-Server kann aufgrund von CORS seinen Bildexport sperren. Amtlich eingelesene Vektoren lassen sich hingegen direkt im Browser zeichnen und exportieren.

## GitHub-Installation

1. ZIP entpacken.
2. **Sämtliche Dateien und Ordner** direkt in das Stammverzeichnis deines bestehenden GitHub-Repositories hochladen.
3. `index.html` muss die neuen Dateien `core.v5.5.js`, `hydro.v5.5.js`, `app.v5.5.js` und `style.v5.5.css` laden.
4. Änderungen committen; nach der Veröffentlichung GitHub Pages mit **Strg + F5** neu laden.

Alte Versionsdateien dürfen im Repository bleiben, sie werden von der aktuellen `index.html` nicht mehr referenziert. Die App läuft ohne Python und ohne Server (GitHub Pages).

## Teststand

- `node tests/core.test.js`: CSV, BBOX, Perspektive, WMS und Varianten getestet.
- `python tests/test_v55_browser.py`: WFS-Typnamen, präzise Seefläche und Uferlinie, vier Bachnamen, Projektionsverzerrung, Mehrfachauswahl, Weissbeleuchtung, PNG-Export erfolgreich gegen simulierte amtliche Antworten getestet.
- `python tests/test_fallback_browser.py`: Kantons-WFS nicht erreichbar → swissTLM3D statt ungenauem vec200, Fehlermeldung und stabiles UI getestet.
- Noch **nicht** getestet: tatsächliche Erreichbarkeit der kantonalen WFS-GeoJSON-Antworten im veröffentlichten GitHub Pages und Projektion auf deinem HY320 Mini.

## Quellen

- [GIS-ZH: Öffentliche Oberflächengewässer](https://geolion.zh.ch/geodatensatz/743) – Fliessgewässerbezeichnung, Zürichsee-Uferlinie, stehende Gewässer
- [swisstopo: swissTLM3D Gewässernetz](https://www.swisstopo.admin.ch/de/landschaftsmodell-swisstlm3d) – genauere Wasserläufe und Seeumrisse
- [OGD-WFS Kanton Zürich](https://maps.zh.ch/wfs/OGDZHWFS)

# Grossrelief-Kartenprojektor v5.3 — GitHub Pages

Browser-App ohne Python und ohne Server. Sie nutzt `layout.csv` des Reliefgenerators für einen einzigen LV95-Kartenausschnitt über das gesamte Relief. Alternativ können Kartenbilder (PNG/JPG/WebP) hochgeladen und projektiv kalibriert werden. Die Modi **Heute/Historisch**, die Wädenswil-Gemeindemaske, Bildexporte und die Vier-Ecken-Kalibrierung bleiben erhalten.

## Installation und Aktualisierung

1. ZIP entpacken und **alle** Dateien samt Unterordnern ins Stammverzeichnis deines GitHub-Repositories hochladen.
2. Gleichnamige `index.html`, `README.md` und Beispiel-/Testdateien ersetzen.
3. Wichtig: `index.html` lädt die neu benannten Dateien `core.v5.3.js`, `special.v5.3.js`, `app.v5.3.js`, `style.v5.3.css`. Auch diese hochladen; alte Versionen dürfen liegen bleiben.
4. Unter `Settings → Pages` muss der Branch `main`, Verzeichnis `/ (root)` aktiv sein. Die veröffentlichte Seite mit Strg+F5 aktualisieren.

## Neue Tastenbelegung (Projektormodus »Heute«)

| Taste | Ebene |
|---|---|
| 1 | Luftbild |
| 2 | Landeskarte |
| 3 | Gewässer (Auswahl) |
| 4 | Verkehrswege |
| 5 | Gemeindegrenzen |
| 6 | Siedlungsflächen |
| 7 | **Namen** |
| 8 | Gebäude / Kunstbauten |
| 9 | Wald / Gehölze |

Jede Taste schaltet **nur ihre Ebene** ein oder aus. Mehrere Ebenen bleiben gleichzeitig aktiv. Die schmale Leiste am Projektorrand bietet dieselben Schalter. `T` blendet die Leiste aus, `K` blendet die vier Kalibrierungspunkte ein/aus, `Esc` kehrt zur Startseite zurück.

## Bedingte Beschriftung der Ebenen

**7 Namen** ist jetzt eine eigene, transparent gerenderte Ebene (nicht mehr nur Ortsnamen aus einem fertigen WMS-Bild). Wenn Namen aktiv ist:

- Bei **3 Gewässer** werden die Namen der 15 ausgewählten Seen, Weiher und Bäche abgefragt.
- Bei **9 Wald** werden die bekannten Wald-/Gehölznamen angezeigt, soweit georeferenziert.
- Bei **6 Siedlungen** werden die Namen der Ortsteile und Siedlungen angezeigt, soweit georeferenziert.
- Die **Flurnamen** sind zusätzlich über den eigenen Schalter in der Startansicht aktivierbar. Die 19 Grundwörter und ihre Beispiele stammen aus der bereitgestellten Liste.

Namenpositionen werden über die öffentlich zugängliche **GeoAdmin-Suche (swissNAMES/gazetteer)** in LV95 ermittelt. Nur Treffer **innerhalb des CSV-Ausschnitts mit exakt übereinstimmendem Namen** werden angezeigt. Es werden keine Koordinaten erfunden. Mehrfach vorkommende/fehlende Namen können ausgelassen werden; Geocoder-Ergebnisse sollten bei einer Unterrichtsprojektion überprüft werden. Pro Darstellung werden maximal 52 überlappungsfrei platzierte Namen gezeigt; bei vielen Namen werden weitere aus Gründen der Lesbarkeit weggelassen.

Die **Schriftgrösse** ist in der Startansicht einstellbar (22–48 px bezogen auf die 1400-px-Kartenvorschau). Standard: **30 px**, mit starkem hellem Umriss und thematischer Textfarbe. Die Schrift wird zusammen mit den Karten per Vier-Ecken-Transformation verzerrt; auch PNG-Export ist vorgesehen.

**Hinweis:** Ist die Landeskarte (2) eingeschaltet, können zusätzlich deren fest ins Kartenbild gedruckte Beschriftungen erscheinen. Diese kann die App nicht unabhängig abstellen. Die grossen Namen der Ebene 7 liegen darüber.

## Feste Gewässerliste

**Seen / Weiher (7):** Zürichsee, Hüttnersee, Ausee, Sternenweiher, Teufenbachweiher, Freyenweiher, Bachgadenweiher.

**Bäche (8):** Reidbach, Gulmenbach, Zopfbach, Meilibach, Schlossbach, Risibach, Töbelibach, Winterbergholzbächli.

Im Menü `Gewässerdarstellung` ist die **feste Auswahl** Standard. Der bisherige swisstopo-Layer kann nicht serverseitig auf diese 15 Namen beschränkt werden. Die App fragt die dafür benötigten **namentlich gefilterten OpenStreetMap-Vektorgeometrien** deshalb direkt über Overpass ab. Das ist ein zusätzlicher Datenanbieter; genaue Vollständigkeit und Geometrie müssen vor Ort geprüft werden. **Fehlende Datensätze werden nicht durch kleinere Gewässer ersetzt oder vorgetäuscht.**

Als Alternativen bleiben die bisherigen swisstopo-WMS-Ebenen »generalisierte Gewässer« und »alle Bäche« anwählbar. Die Gewässerlinien sind unabhängig von der Ebene 7; um Wasserläufe **mit** Namen zu sehen, schalte 3 und 7 ein.

## Flurnamen als Unterrichtsmaterial

Die 19 Grundwörter mit Bedeutungen und den genannten Beispielen sind in `special.v5.3.js` hinterlegt. Mit **»Flurnamen-Glossar als CSV«** kann die Tabelle direkt als Unterrichts-Arbeitsgrundlage heruntergeladen werden (Excel/LibreOffice-kompatibel).

## Technik / Grenzen

- Alle Karten und Beschriftungen beziehen sich auf dieselben `layout.csv`-Koordinaten und die identische Bildfläche des Gesamt-Reliefs.
- Der weisse Relief-Hintergrund bleibt automatisch aktiv, sobald Luftbild und Landeskarte ausgeschaltet sind; ausserhalb der vier Ecken bleibt der Projektor schwarz.
- Bei Wädenswil-Maske werden auch die eigenen Namen-/Gewässerbilder als zusätzliche Ebenen geografisch abgeschnitten.
- Historische swisstopo-Karten und Bild-Upload funktionieren weiterhin.
- Geografische Namen und gefilterte Gewässer benötigen **Internet**. CORS-Sperren externer Kartendienste können WMS-Exporte beschränken. Overpass-Verfügbarkeit/Ratenlimits können das Laden der festen Gewässerauswahl verhindern. Es wird in dem Fall ein Fehler angezeigt, keine freie Geometrie erfunden.
- Einzelne Wasserflächen, insbesondere komplexe OSM-Multipolygone, können beim direkten Vektorrendering unter Umständen nur als Umriss erscheinen. Die Projektion und Geometrie müssen mit echten Dienstdaten kontrolliert werden.
- Die Vier-Ecken-Perspektive korrigiert die Projektion auf der Relief-Grundfläche; Höhenfehler auf Gipfeln sind nicht automatisch kompensiert.

## Datenquellen

- Aktuelle/historische Karten und Koordinaten: © swisstopo; https://www.geo.admin.ch/
- Namensgeoreferenzierung: GeoAdmin SearchServer (swissNAMES); https://docs.geo.admin.ch/access-data/search.html
- Namentlich gefilterte Gewässergeometrien: © OpenStreetMap-Mitwirkende (ODbL); https://www.openstreetmap.org/copyright
- Flurnamen-Liste und Gewässernamen: vom Anwender bereitgestellt

## Tests

`node tests/core.test.js` für Kernlogik, `python tests/browser_v5_3.py` für Chromium-Integration mit **simulierten externen Antworten**. Bei diesen Tests wird kein echter swisstopo-/Overpass-Dienst aufgerufen. Die Live-Verfügbarkeit muss auf der veröffentlichten GitHub-Pages-Seite geprüft werden.

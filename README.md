# Grossrelief-Kartenprojektor v5.6 – Gewässer-Korrektur

GitHub-Pages-Webapp, ohne Python oder eigenen Server. `layout.csv` lädt die **Gesamtfläche** des Reliefs (LV95); alternativ lassen sich PNG/JPEG/WebP-Karten hochladen und mit vier frei beweglichen Ecken projizieren. Alle bisherigen Funktionen (Heute/Historisch, Gemeinde Wädenswil, Mehrfachauswahl 1–9, Namen, Wald, PNG/ZIP-Export) bleiben erhalten.

## Das Gewässerproblem in v5.5 und die Korrektur

**Bisher:** Die Gewässerdarstellung im Listenmodus hing von der Namensabfrage bei externen Overpass-Servern ab. Schon ein einzelner gefundener Bach konnte die Rückgabe als „erfolgreich“ markieren, während Zürichsee und Hüttnersee fehlten. Die weisse Projektionsgrundfläche wurde dann nicht blau überzeichnet.

**Jetzt:** Bei aktivierter Ebene **3 Gewässer** werden die offiziellen Kartenbilder **immer zuerst und unabhängig von der Namenssuche** geladen:

1. `ch.swisstopo.vec200-hydrography` – Gewässer von swissTLMRegio, generalisiert.
2. `ch.swisstopo.swisstlm3d-gewaessernetz` – Gewässer von swissTLM3D, detailliert.
3. Optional zusätzlich: namentlich ermittelte, verifizierte OSM-Wassergeometrien werden deutlich blau darüber gelegt. Fehlt ein Teil, verschwinden die amtlichen Gewässer **nicht**.

Ein transparenter Bereich ohne Gewässer ist kein Fehler. Die App prüft deshalb nicht jede Kachel einzeln auf blaue Pixel, sondern erst die gesamte Karte. Sind die offiziellen Dienste ausgefallen, versucht sie verifizierte Einzelgeometrien; wenn **beides** fehlschlägt, erscheint eine **deutliche Fehlermeldung** statt einer stillschweigenden Behauptung, die Karte sei vollständig.

**Wichtig:** Die amtlichen Basis-WMS enthalten ggf. auch andere Bäche als nur die benannten. Das ist beabsichtigt: **Vollständige Gewässerdarstellung geht vor restriktiver Namensfilterung.**

### Pflichtgewässer

Die benannte Zusatzliste umfasst **16** Gewässer:

- **Zürichsee**, **Hüttnersee**, Ausee, Sternenweiher, Teufenbachweiher, Freyenweiher, Bachgadenweiher
- **Sihl**, Reidbach, Gulmenbach, Zopfbach, Meilibach, Schlossbach, Risibach, Töbelibach, Winterbergholzbächli

Die drei hervorgehobenen Pflichtgewässer werden in der amtlichen Grundkarte nicht nach Namen gefiltert und können daher nicht mehr durch ein teilweise erfolgreiches Overpass-Ergebnis verschwinden. Welche Teile im CSV-Kartenausschnitt liegen, hängt von dessen geografischer Ausdehnung ab.

**Grenze:** Wenn alle Geodatendienste ausfallen, ist die Vollständigkeit ohne **mitgelieferte lokale, verifizierte Geometriedaten** nicht zu garantieren. Auch eine aus dem amtlichen WMS stammende, aber kartografisch stark generalisierte Darstellung kann nicht jeden Bachabschnitt belegen. Vektorobjekte werden niemals an erfundenen Positionen gezeichnet. Die Grundkarte ist ein Fallback zur Sichtbarkeit, keine bestätigte Prüfung jedes einzelnen Gewässers. Für eine echte Offline-Pflichtgarantie müssen die georeferenzierten Gewässergeometrien als eigene lokale Daten ins Repository aufgenommen werden.

## Installation

1. ZIP entpacken.
2. **Alle Dateien** ins Stammverzeichnis des vorhandenen GitHub-Repositories hochladen.
3. Sicherstellen, dass `index.html` auf `core.v5.6.js`, `special.v5.6.js`, `app.v5.6.js` und `style.v5.6.css` verweist. Alte versionsbenannte Dateien dürfen liegen bleiben, werden aber nicht mehr verwendet.
4. GitHub Pages abwarten; die App mit **Strg+F5** neu laden.

## Bedienung

- `3`: Gewässer ein/aus; `7`: Namen ein/aus; beide gleichzeitig ergibt Gewässer mit Namen.
- `1`: Luftbild, `2`: Landeskarte, `4`: Verkehrswege, `5`: Gemeindegrenzen, `6`: Siedlungen, `8`: Gebäude, `9`: Wald.
- `K`: Kalibrierungspunkte; `T`: Leiste; `Esc`: Startansicht.
- Ohne Luftbild und Landeskarte beleuchtet ein weisser Hintergrund die gesamte Relief-Grundfläche, Wasser wird darüber in Blau gezeichnet.
- Karten als PNG oder ZIP exportieren. Der Browser kann den Export von externen Kartenbildern einschränken (CORS).

## Tests

```bash
node tests/core.test.js
node tests/streams.test.js
python tests/browser_water_priority.py
```

Chromium-Simulationen bestätigen die amtliche Hydrologie bei vollständig ausgefallener oder nur teilweise erfolgreicher Overpass-Suche. Ebenso geprüft: CSV, Kachelgeometrie, WMS-URLs, Homographie und die Aufnahme der Sihl in die gezielte Wasserliste. **Ein Live-Test gegen den echten swisstopo-WMS war hier nicht möglich**; die auf dem physischen Relief sichtbare Abdeckung muss noch praktisch geprüft werden.

Datenquellen: © swisstopo / GeoAdmin; namentliche Einzelgeometrien © OpenStreetMap-Mitwirkende, ODbL.

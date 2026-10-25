# Grossrelief-Kartenprojektor v5.5 – GitHub Pages

Statische Web-App ohne Python und ohne Backend. Für neue Karten die `layout.csv` des Grossrelief-STL-Generators laden; sie legt die Gesamtfläche in LV95 fest. Vorhandene PNG/JPEG/WebP können zusätzlich oder auch ohne CSV importiert werden. Im Projektormodus bleiben die Vier-Ecken-Kalibrierung und die kleine Seitenleiste erhalten.

## Installation

1. Das ZIP entpacken und **sämtliche Dateien** ins Stammverzeichnis des bestehenden GitHub-Repositories hochladen, einschliesslich Unterordnern.
2. `index.html` überschreiben. Sie verweist auf `core.v5.5.js`, `special.v5.5.js`, `app.v5.5.js` und `style.v5.5.css` – alle vier müssen mit hochgeladen werden. Alte versionsbenannte Skripte dürfen im Repository bleiben.
3. GitHub Pages: `main` → `/ (root)`; nach erfolgreicher Veröffentlichung Seite mit Strg+F5 öffnen.

## Bedienung

Im Projektormodus schaltet **jede Zahl unabhängig** ihre Ebene ein oder aus: `1` Luftbild, `2` Landeskarte, `3` Gewässer, `4` Verkehr, `5` Gemeindegrenzen, `6` Siedlungen, `7` Namen, `8` Gebäude/Kunstbauten, `9` Wald/Gehölze. `K` zeigt/versteckt Kalibrierpunkte; `T` blendet die Seitenleiste aus; `Esc` führt zurück zum Hauptmenü. Die weisse Reliefbeleuchtung ist ohne Luftbild/Landeskarte automatisch aktiv. Weiterhin vorhanden: Heute/Historisch, Jahresauswahl, Maske „nur Gemeinde Wädenswil“, Bildexport und Druckvorlagen.

## Neu: acht benannte Wädenswiler Bäche

Folgende **acht benannten Bachläufe** sind in der festen Gewässerauswahl enthalten:

**Reidbach, Gulmenbach, Zopfbach, Meilibach, Schlossbach, Risibach, Töbelibach, Winterbergholzbächli.**

Zusätzlich gehören dazu die sieben gewünschten Seen/Weiher: Zürichsee, Hüttnersee, Ausee, Sternenweiher, Teufenbachweiher, Freyenweiher, Bachgadenweiher.

In `Gewässerdarstellung` **„15 ausgewählte Gewässer“** auswählen. Mit **3** werden die ermittelten Bachlinien/Seeflächen gezeichnet; mit **3 + 7** erscheinen auch die Namen, sofern sie ohne Überlappung auf dem ca. 40 × 60 cm grossen Relief platziert werden können. Die Bachlinien sind für die Projektion deutlich blau dargestellt.

Die Vektorabfrage ist jetzt toleranter: Namensvarianten (`name`, `name:de`, `alt_name`), einzeln erfasste Bachabschnitte und Wasserlauf-Relationen werden berücksichtigt. Als Beschriftungspositionen dienen bevorzugt offizielle swissNAMES-Orte; fehlen diese, wird ein Name nur dann über der Linie platziert, wenn die Geometrie tatsächlich gefunden wurde. Die App nennt explizit **die Anzahl der gefundenen Bäche und deren Namen** sowie fehlende Gewässer.

### Grenzen der Daten

Die Geometrien der namentlich ausgewählten Gewässer kommen aktuell weiterhin von OpenStreetMap/Overpass. Die amtliche swisstopo-WMS-Darstellung lässt sich nicht einfach anhand dieser 15 Namen filtern. **Nicht vorhandene Linienabschnitte werden nicht erfunden.** Liefert die Abfrage keine benannten Bäche, verwendet die App ersatzweise das **generalisierte swisstopo-Gewässernetz**, ausdrücklich als unselektierten Ersatz gekennzeichnet. In der Startansicht können alternativ alle swisstopo-Bäche ausgewählt werden. Das ist kein garantiertes Einzeichnen aller acht Bäche; die Vollständigkeit hängt von den öffentlich verfügbaren Geometriedaten ab.

Die GeoAdmin-Suche stellt georeferenzierte Namen bereit. Deren Punkte und die Wasserlinien werden unabhängig abgefragt. Fällt ein Datenanbieter aus, können sich Namen und Linien unvollständig darstellen. Die Live-Abfragen müssen auf der veröffentlichten GitHub-Seite getestet werden.

## Weitere Funktionen

- Einzelne Karten als PNG, Kartenpaket als ZIP, Kalibrierung als JSON speichern.
- Vorhandene Bilder laden und über vier frei ziehbare Ecken kalibrieren.
- Schriftgrösse der Namen in der Startansicht anpassen.
- Flurnamen-Glossar (19 Grundwörter) als CSV exportieren.
- Heute/Historisch und die Wädenswil-Gemeindemaske verwenden.
- Die Projektion bleibt geometrisch eine **ebene Homografie**. Für eine 3D-Höhenkorrektur wäre ein Geländemodell mit Projektorkalibrierung nötig.

## Tests

```bash
node tests/core.test.js
node tests/streams.test.js
python tests/browser_streams.py
```

Diese Tests arbeiten mit **simulierten** swisstopo-/Overpass-Antworten. Der komplette reale Datenabruf und der Projektor HY320 wurden hier nicht praktisch getestet.

**Datenherkunft:** Karten © swisstopo / GeoAdmin; gewässerbezogene OSM-Geometrien © OpenStreetMap-Mitwirkende (ODbL). Für den Unterricht die jeweiligen Quellenangaben erhalten.

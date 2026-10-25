# Fehlerkorrektur v5.1

**Behebt die Meldung `Core.whiteReliefBackground is not a function`.** Die vorherige ZIP enthält die Funktion bereits, die Ursache war daher vermutlich ein Versionskonflikt zwischen zwischengespeicherten GitHub-Pages-Dateien der Versionen 4 und 5 (`app.js` neuer, `core.js` älter). Diese Version verwendet eindeutige Dateinamen `core.v5.1.js` und `app.v5.1.js` sowie eine explizite Versionsprüfung. Die Weissfläche wird ausserdem unabhängig von Core berechnet.

**Aktualisierung:** Alle Dateien dieses ZIP-Pakets ins Stammverzeichnis des GitHub-Repositories hochladen, einschliesslich der neuen JS-/CSS-Dateien. `index.html` überschreiben. Dann im Browser **Strg+F5** drücken (unter Mac `Cmd+Shift+R`). Nicht nur `app.v5.1.js` ersetzen.

Alle Funktionen aus v5 bleiben bestehen.

---

# Grossrelief-Kartenprojektor — Version 5 (GitHub Pages)

Reine Browser-App, kein Python, kein Server und keine Installation. Deine `layout.csv` liefert den georeferenzierten Gesamt-Ausschnitt des Reliefs; alternativ lassen sich vorhandene Kartenbilder direkt hochladen.

## Auf GitHub Pages veröffentlichen

1. ZIP entpacken.
2. Den **Inhalt** des ZIPs (nicht den übergeordneten Ordner) ins Stammverzeichnis eines GitHub-Repositories legen. `index.html` muss direkt im Stammverzeichnis liegen.
3. GitHub: **Settings → Pages → Deploy from a branch → main → / (root)** aktivieren.
4. Veröffentlichte URL im Browser aufrufen.

## Modus »Heute«

Aktuelle swisstopo-Karten als separate Ebenen: Luftbild, Gewässer, Verkehrswege, Gemeindegrenzen, Siedlungen, Ortschaften, Bauten und Landeskarte. Alle beziehen sich auf die **Gesamtausdehnung** deiner CSV, niemals auf einzelne Drucksegmente.

### Nur Gemeinde Wädenswil

Im Hauptmenü: **Heute → Nur Gemeinde Wädenswil** aktivieren. Die App lädt die **amtliche aktuelle** Gemeindegeometrie von Wädenswil (BFS-Gemeindenummer **293**) direkt über den öffentlichen Feature-Service des Bundes (swissBOUNDARIES3D). Für die Geometrie wird `EPSG:2056` (LV95) angefragt. Kartenelemente ausserhalb der Gemeindegrenze werden ausgeblendet, innerhalb bleiben sie unverändert. Der Rest des Reliefs ist weiterhin **weiss beleuchtet**, damit das 3D-Modell sichtbar bleibt. Die Gemeindegrenze wird vor der Vier-Ecken-Projektorverzerrung angewandt.

Die Begrenzung gilt **ausschliesslich für »Heute«**, nicht für historische Karten. Der Modus ohne CSV kann keine geografische Begrenzung berechnen. Wenn der Dienst nicht erreichbar ist oder keine aktuelle amtliche Polygongeometrie liefert, wird die Option **automatisch deaktiviert**; eine ungeprüfte oder erfundene Grenze wird nicht angezeigt.

Abruf-API:

`https://api3.geo.admin.ch/rest/services/ech/MapServer/find?layer=ch.swisstopo.swissboundaries3d-gemeinde-flaeche.fill&searchText=293&searchField=gde_nr&contains=false&geometryFormat=geojson&returnGeometry=true&sr=2056`

Referenz: [GeoAdmin – Find Features](https://docs.geo.admin.ch/access-data/find-features.html), [swissBOUNDARIES3D](https://www.swisstopo.admin.ch/de/landschaftsmodell-swissboundaries3d).

## Modus »Historisch«

Im Hauptmenü **Historisch** wählen und am Jahresregler ein Jahr von **1844 bis 2026** einstellen oder eine der Jahresvorgaben verwenden. Die App fragt die offizielle **swisstopo-Zeitreise** (`ch.swisstopo.zeitreihen`) über WMS `GetMap` mit einem zeitbezogenen `TIME=YYYY-12-31` an. Gemeint sind historische topografische Kartenwerke, darunter Dufourkarte, Siegfriedkarte und ältere Landeskarten.

Der Jahreswert ist ein **angefragter Zeitstand**, nicht notwendigerweise das Druckjahr jedes Kartenblatts. Für einige Gegenden/Jahre kann die tatsächlich gezeigte Ausgabe abweichen oder der Dienst kein Bild liefern. Die App kann das angeforderte Jahr im Projektormodus in **10-Jahres-Schritten** ändern. Die Live-Verfügbarkeit der einzelnen Jahre muss am echten swisstopo-Dienst überprüft werden.

Referenz: [swisstopo – Zeitreisen](https://www.swisstopo.admin.ch/de/zeitreise-kartenwerke), [GeoAdmin WMS](https://docs.geo.admin.ch/visualize-data/wms.html).

## Projektor und Tastatur

Im Startmenü werden CSV-Dateien und Kartenbilder geladen, Modi und Jahre gewählt, Daten exportiert und Kalibrierungen verwaltet. Mit **Projektor starten** öffnet sich die Vollbildprojektion. Die schmale Leiste am rechten Bildschirmrand enthält Moduswechsel, einzelne Karten und Kalibrierung.

| Steuerung | Funktion |
|---|---|
| `H` | Zwischen Heute und Historisch wechseln |
| `1`–`9` | Eine Karte anzeigen |
| `Shift+1`–`Shift+9` | Zusätzliche Karte ein-/ausschalten |
| `K` | Vier verschiebbare Kalibrierungsecken ein-/ausblenden |
| `T` | Seitenleiste ausblenden/einblenden |
| `PageUp` / `PageDown` | Weitere Karten aufrufen |
| `Esc` | Projektormodus beenden, zurück zum Hauptmenü |

Die vier Ecken `NW/NE/SE/SW` lassen sich mit der Maus oder Pfeiltasten verschieben. Dieselbe Kalibrierung gilt für alle Karten – auch beim Moduswechsel. Die App korrigiert perspektivisch die Projektor-Grundfläche, nicht die 3D-Höhenversetzung auf Gipfeln.

## Eigene Kartenbilder und Export

- PNG-, JPG- und WebP-Kartenbilder dürfen zusätzlich geladen und im Projektormodus verzerrt werden.
- Kartenkombination als PNG, verfügbare Einzelkarten als ZIP herunterladen.
- Historische Exporte enthalten die Jahreszahl im Dateinamen.
- Wenn »Nur Gemeinde Wädenswil« aktiv ist, werden **auch die PNG-Exporte geografisch maskiert**; ausserhalb der Gemeinde bleibt bei der Kombination der weisse Relief-Hintergrund.
- Kalibrierungen lassen sich als JSON exportieren/importieren.
- Wenn weder Luftbild noch Landeskarte aktiv sind, wird die Relief-Grundfläche automatisch weiss projiziert und nur die Karteninhalte farbig darüber dargestellt.

**CORS-Hinweis:** Die swisstopo-Bilder können in der Regel auch dann projiziert werden, wenn die Webseite sie nicht als Canvas-Pixel auslesen darf. Der PNG-/ZIP-Export der direkt abgerufenen WMS-Karten kann daher von der CORS-Freigabe des Dienstes abhängen. Die App kann Browser-Sicherheitsregeln nicht umgehen. Eigene lokale Bilddateien sind davon unabhängig.

## Technische Dateien

- `index.html`: Startseite und schmale Projektorleiste
- `style.v5.1.css`: Layout
- `core.v5.1.js`: CSV-Parsing, Zeitreise-WMS-URL, LV95-Geometrie, Perspektive, ZIP
- `app.v5.1.js`: Modi, Jahreswahl, Gemeinde-Maske, Kartenladefunktion, UI, Bildexport
- `examples/layout.csv`: Beispiel-Relief
- `tests/core.test.js`: Node.js Unit-Tests (nur für Entwickler)
- `tests/browser_v5.py`: reproduzierbarer Chromium-Test mit simulierten WMS- und Grenzdaten (nur für Entwickler)

## Teststand

- **Kernlogik:** CSV, WMS-URLs, Zeitparameter, Polygone, Homographie, ZIP.
- **Chromium:** CSV laden, aktuelle Karte, Gemeinde-Maske über simulierte amtliche API-Antwort, Historisch 1900/1880/1890, Projektormodus, H-Taste, Eckmarkierungen, zurück zum Menü, PNG mit weissem Hintergrund und korrekt ausgeblendeten Bildteilen.
- **Noch nicht live validiert:** echte WMS-Ausgaben für gewünschte historische Jahre, CORS-Berechtigungen und direkter Grenzabruf auf einer öffentlich gehosteten GitHub-Pages-Seite. Ebenfalls keine Prüfung am physischen Projektor.

# Grossrelief-Kartenprojektor v5.9.3

Ausgangsbasis: **v5.9.2**, ohne sonstige Änderungen am Karten-/Projektor-Layout.

## Ausschliesslich diese Änderungen

- Untertitel direkt unter **GROSSRELIEF**: `GitHub Pages · Kartenprojektor v5.9.3`.
- Drei gezielt gewünschte Weiher als Wasserflächen: **Teufenbachweiher**, **Aabachweiher**, **Sternenweiher**.
- Der bestehende Datensatz GIS-ZH **45.10** wird unverändert verwendet. Da Wasserrechtsweiher dort ausgenommen sein können, wird ergänzend **GIS-ZH 51.1** (`WB_WASSERRECHTE_F`) abgefragt – ausschliesslich für diese drei benannten Weiher.
- Schreibweisen `-weiher`/`-weier` sind nur für diese drei Gewässer zugelassen.

Alle anderen Wasserrechte, namenlose Weiher und Bäche werden **nicht gezeichnet**. Es wird keine zusätzliche allgemeine Gewässerkarte zugeschaltet. Die bestehende v5.9.2-Positivliste samt Reidbachweiher und Seen bleibt erhalten.

Die von v5.9.2 unveränderten Funktionen umfassen Mehrfachauswahl 1–9, Kalibrierung, Kartenlayer, Weissbeleuchtung, Export, historische Karten und Gewässerfilter.

## Hinweise zur Verifizierung

Die einzelnen WFS-GeoJSON-Features können hier nicht live abgefragt werden. Es werden nur tatsächlich mit dem offiziellen Weihernamen gelieferte amtliche Polygone gezeichnet. Sollte GIS-ZH 51.1 nicht über den allgemeinen WFS verfügbar sein, bleibt der jeweils fehlende Weiher unsichtbar; es werden keine Flächen erfunden.

## GitHub Pages

ZIP entpacken, alle Dateien ins bestehende Repository-Verzeichnis hochladen, `index.html` ersetzen, committen und Strg+F5. Die Programmdateien sind eigenständig mit `v5.9.3` benannt.

## Tests

`node tests/test_ponds_v593.js`

`python tests/test_ponds_v593_browser.py`

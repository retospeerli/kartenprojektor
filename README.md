# Grossrelief-Kartenprojektor 5.9.2 – Korrektur der Gewässergeometrie

Diese Version übernimmt die Programmfunktionen und **die strikte Gewässer-Positivliste** aus 5.9.1 unverändert.

**Zugelassene Fliessgewässer (keine weiteren):**
Zopfbach; Gulmenbach; Töbelibach; Untermosenbach; Reidbach/Riedbach/Wildbach; Teufenbach; Sihl; Krebsbach (ausdrücklich nicht Chrebsbach); Schlossbach; Sagenbach; Miesbach; Aabach; Meilibach; Mülibach Richterswil (Gewässernummer 2512).

**Zugelassene Weiher (keine weiteren):** Sternenweiher, Reidbachweiher/Riedbachweiher, Teufenbachweiher.

**Zugelassene Seen (keine weiteren):** Zürichsee, Hüttenersee/Hüttnersee, Ausee.

## Einzige fachliche Korrekturen

- Die bei 5.9.1 **über die Seefläche laufenden, geraden Bachlinien** werden geometrisch an der amtlichen Ufergrenze der zugelassenen Wasserflächen abgeschnitten. Die Quellgeometrie wird nicht verlängert oder durch selbst gezeichnete Verbindungslinien ergänzt.
- Der Mülibach Richterswil wird bei der Namenszuordnung **nur mit der bestätigten Nummer 2512** berücksichtigt, um andere Mülibäche auszuschliessen.
- Keine Änderungen an Tastatur, Layer-Reihenfolge, Projektor, Kalibrierung, Gestaltung, Export, Modus Heute/Historisch oder WFS-Datenquellen. Es bleibt bei 45.2, 45.3, 45.10 und 45.13; kein ungefiltertes Gewässernetz.

Die Verkürzung erfolgt zentral **vor dem SVG-/PNG-Rendering**, gilt daher auch für die Projektion und den Export. Bei völlig im See liegenden Bachlinien wird gar keine Bachlinie dargestellt.

## Was noch überprüft werden muss

Die Zürcher Geodaten lassen sich in dieser Entwicklungsumgebung nicht live laden. Der örtliche Test auf deiner GitHub-Seite ist deshalb nötig. Ein Gewässer, dessen amtliche Geometrie nicht geliefert wird, bleibt weiterhin fehlend – die Anwendung erfindet keine Koordinaten. Insbesondere ist die Sihl ausserhalb des Zürcher Datensatzbereichs damit noch nicht durchgehend garantiert.

## GitHub Pages

Den Inhalt dieses ZIP ins Stammverzeichnis des bestehenden Repositories hochladen, `index.html` ersetzen, committen und die Seite mit Strg+F5 neu laden. Die Dateinamen der Skripte und Styles wurden auf 5.9.2 aktualisiert, um Browser-Cache-Mischversionen zu vermeiden.

## Tests

`node tests/test_strict_v592.js`

`node tests/test_shore_strict_v592.js`

`python tests/test_strict_v592_browser.py`

Browser-Tests verwenden ausdrücklich **simulierte** WFS-Antworten. Sie sind kein Nachweis vollständiger realer Wasserläufe.

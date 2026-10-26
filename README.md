# Grossrelief-Kartenprojektor v5.9.13

## Einzige Änderung gegenüber v5.9.12

Im bisherigen Reliefausschnitt wird die im vom Nutzer gelieferten Kartenbild
sichtbare, ca. 130 m lange Unterbrechung der **Sihl** direkt zwischen den
beiden vorhandenen Linien-Endpunkten geschlossen. Der kurze Ergänzungsbogen
verwendet die Richtungen dieser beiden angrenzenden Linien. Das ist eine
**Zeichenkorrektur auf Basis des Kartenbilds**, keine nachgewiesene amtliche
Gewässergeometrie für diese 130 Meter.

Es wird **keine neue Datenquelle oder Suchlogik** eingeführt. Andere Gewässer,
Uferlinien, Ebenen, Bedienung, Projektion und Export bleiben unverändert.
Diese Korrektur wird nur bei der bekannten `layout.csv`-Ausdehnung ausgeführt.
Wird der Zwischenabschnitt bereits als amtliche Linie geliefert, zeichnet die
App keinen zusätzlichen Bogen.

GitHub Pages: ZIP entpacken, Programmdateien ins bestehende Repository
hochladen und nach dem Commit mit Strg+F5 laden.


## Version 5.9.14 – Kalibrierung und optionale 3D-Projektion

- Kreise bleiben als verschiebbare Kalibriergriffe. Gelbe Fadenkreuze mit langen Armen markieren die **eigentlichen** Kartenecken.
- Kreis oder gelbes Kreuz auswählen, dann Pfeiltasten: **0,25 Bildschirmpixel**, Strg+Pfeil **0,1 px**, Umschalt+Pfeil **1 px**. Die Eckpunkte werden wie bisher gespeichert.
- 3D-Modus ist optional. `layout.csv` laden, vollständiges STL oder **alle in `layout.csv` genannten STL-Segmente** importieren. Dateinamen und physische Grössen müssen übereinstimmen. STL-Einheiten: mm; Y-Achse zeigt nach Norden. STL-Daten bleiben im Browser.
- `H` (Projektorhöhe zur Grundplatte) standardmässig **105 cm**, im Hauptmenü 20–500 cm einstellbar.
- Die Höhen werden als Raster aus der **oberen STL-Oberfläche** abgeleitet. Die 2D-Eckkalibrierung bleibt aktiv; das Raster kompensiert zusätzlich den veränderten Projektionsmassstab auf Höhen.
- Geometrisches Modell: zentrale Projektion, Linse **senkrecht mittig über Relief**. Bei seitlicher/off-axis Projektorposition ist eine Kamera-Extrinsik-Kalibrierung zusätzlich nötig; die Korrektur ist sonst eine Näherung.
- Kein Höhenmodell oder fehlende Teile: 3D bleibt aus; 2D funktioniert unverändert. Keine Veränderung am Gewässercode.
- In der Kalibrierungs-JSON werden die Höhe und Moduswahl gespeichert, nicht die STL-Dateien. Nach Laden einer JSON-Datei müssen lokale STL-Dateien erneut importiert sein.

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


## v5.9.15 – festes Bildschirm-Zielkreuz
- Im Projektor per **K** oder **Ecken** den Kalibriermodus aktivieren: zusätzlich zu allen bisherigen gelben Eckfadenkreuzen und runden Griffen erscheint ein **rotes Kreuz exakt in der Vollbildmitte**.
- Das rote Kreuz bleibt ortsfest, während die vier Ecken verschoben oder die Karten verzerrt werden.
- **K** erneut oder Rückkehr zum Menü blendet das Kreuz aus; im normalen Projektormodus bleibt es unsichtbar.
- Keine anderen Karten-/Gewässer-/Höhenkorrektur-Funktionen verändert.


## v5.9.17 – automatische Standard-STLs / netzlinienfreie 3D-Projektion

- Nach dem Laden von `layout.csv` lädt die App standardmässig automatisch die dazugehörigen STL-Dateien aus `./stl/` (mit CSV-Dateinamen). Optional `./stl/relief.stl` für das Gesamtmodell. Keine wiederholte manuelle STL-Auswahl.
- Fehlende STL-Dateien ändern nichts an der übrigen App; in dem Fall bleibt die 2D-Projektion aktiv. Der manuelle STL-Import bleibt verfügbar.
- 3D-Bild wird möglichst als durchgehend texturierte WebGL-Fläche ohne Dreiecksnähte erzeugt; falls WebGL fehlt, reduziert ein nahtüberdeckender Canvas-Fallback sichtbare Dreiecksgrenzen. Es werden **keine Gitternetzlinien gezeichnet**.
- Standard-Projektorhöhe 105 cm, Kalibrierungskreise und gelbe/rote Fadenkreuze unverändert.
- Keine Änderungen an Gewässern, Kartenebenen und deren Bedienung.


## v5.9.17 – kleine Standard-Höhendatei statt grosser STL auf GitHub

GitHub-Browser erlaubt keine STL-Dateien über 25 MiB. Die Anwendung kann deshalb die Original-STLs **lokal** laden und mit einem Knopf das bereits berechnete 3D-Höhenraster (`relief-heightmap.json`) speichern. Es enthält genau die Höhenauflösung, die der bestehende 3D-Renderer ohnehin benutzt (54 × proportional viele Rasterzellen). Die Datei ist normalerweise nur wenige Dutzend KB gross.

Die Datei einmal nach `stl/relief-heightmap.json` ins Repository hochladen. Danach lädt die App sie nach dem CSV-Upload automatisch. Das Höhenmodell ist an den exakten LV95-Ausschnitt und die physischen Reliefabmessungen gekoppelt; die App verwirft fremde Höhenraster statt sie falsch zu projizieren. Wenn kein Höhenraster existiert, gilt weiterhin der bisherige STL-Fallback bzw. 2D-Modus.

Alle Gewässer, Kartenlayer, Kalibrierhilfen und Projektorhöhe bleiben unverändert.

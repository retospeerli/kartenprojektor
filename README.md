# Grossrelief-Kartenprojektor v5.9.18 – ausgerichtete 3D-Projektion

Gezielte Korrektur gegenüber v5.9.17:

1. **Karte und 3D-Höhenraster deckungsgleich:** WebGL-Textur nicht mehr vertikal spiegeln (`UNPACK_FLIP_Y_WEBGL=false`). Die Nord-Süd-Zuordnung des Höhenrasters aus den sechs Original-STLs ist korrekt und bleibt unberührt.
2. **Projektor im Querformat:** Karte UND Höhenraster werden gemeinsam 90° im Uhrzeigersinn gedreht. Die vier Eckkreuze gehören zu den vier Ecken des *waagerechten* Kartenbilds; keine ungewollte Streckung. Keine zusätzliche Rotation des Monitors / Beamers notwendig.
3. **Flacher Zürichsee:** Der Wasseroberfläche entsprechende Referenzwert der originalen STL-Oberseite ist 5.238 mm über der STL-Unterseite. Die optische Höhenverformung verwendet nur Höhen oberhalb dieser Referenzfläche. Diese Höhe ist in der mitgelieferten `stl/relief-heightmap.json` hinterlegt; die App kann auch das zuvor hochgeladene Höhenmodell automatisch korrekt interpretieren.

Die alte Hochformat-Eckkalibrierung wird ABSICHTLICH nicht wiederverwendet: Ecken im neuen Querformat einmalig kalibrieren. Die rote Bildschirmmitte, die gelben Eckkreuze und die Kreisgriffe bleiben. Standardhöhe H=105 cm. Gewässer, Kartenebenen, Datenabfragen und übrige Programmfunktionen unverändert.

## Installation

ZIP vollständig ins GitHub-Repository hochladen, einschliesslich `stl/relief-heightmap.json`. Die alte Datei unter gleichem Namen ersetzen. Die bisherigen alten `v5.9.17`-Skriptdateien dürfen im Repository bleiben (werden durch `index.html` nicht mehr geladen). Neue Seite mit Strg+F5 laden. `layout.csv` auswählen, anschliessend 3D geladen.

## Technische Grenzen

Die 3D-Korrektur setzt weiterhin einen senkrecht und ungefähr mittig über dem Relief befindlichen Projektor voraus. Reale Projektoren mit starker Off-Axis-Optik benötigen eine genauere optische Kalibrierung. Die unveränderten STL-Originale werden nicht auf GitHub benötigt. Keine Garantie ohne Test am tatsächlichen Projektor.

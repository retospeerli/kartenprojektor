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

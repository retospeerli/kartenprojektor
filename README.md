# Grossrelief-Kartenprojektor v5.9 — STRIKTE Positivliste

**Zweck:** Die Kartenebene «Gewässer» zeichnet ausschliesslich die vom Nutzer ausdrücklich gewünschten Wasserläufe, Weiher und Seen.

## Sichtbare Wasserläufe (exakt)

Zopfbach, Gulmenbach, Töbelibach, Untermosenbach, Reidbach/Riedbach/Wildbach, Teufenbach, Sihl, Krebsbach (nicht Chrebsbach), Schlossbach, Sagenbach, Miesbach, Aabach, Meilibach und Mülibach Richterswil (Gewässernummer 2512).

## Sichtbare Weiher

Sternenweiher, Reidbachweiher (auch Riedbachweiher), Teufenbachweiher.

## Sichtbare Seen

Zürichsee, Hüttenersee (Hüttnersee), Ausee.

Es werden **keine anderen Linien oder Wasserflächen** gezeichnet. Keine ungefilterten Wasser-WMS-Dienste und keine Ersatzlayer. Die früheren Optionen «Alle Bäche» und «GeoJSON hochladen» sind entfernt.

Der kantonale WFS ist auf vier vorhandene Quellen beschränkt: 45.3 für Bezeichnungen, 45.2 für amtliche Routen der **eindeutig erkannten** Gewässernummern, 45.10 für **namentlich geprüfte** Seen/Weiher und 45.13 für die Zürichsee-Uferlinie. Zusätzliche 45.1-/45.11-/45.16-Massenquellen von v5.8 sind entfernt.

**Fehlerverhalten:** Wenn der kantonale WFS nicht verfügbar ist, bleibt die Gewässerebene leer. Es erscheint eine Fehlermeldung. Keine zusätzlichen Bachlinien als Fallback, auch nicht über eine alte Kalibrierungsdatei.

**Wichtig:** Die kantonalen Live-Geodaten konnten in dieser Umgebung nicht direkt abgerufen werden. Die Tests bestätigen strikt gefilterte simulierte Eingabedaten und den Fehlerfall; sie beweisen nicht, dass sämtliche aufgelisteten Bäche und Weiher derzeit tatsächlich vom WFS geliefert werden. Fehlende Gewässer werden nicht frei gezeichnet.

## Bedienung und Installation

Alle bisherigen neun Tastenzuordnungen, Mehrfachauswahl, Vier-Ecken-Projektion, Historisch-Modus und PNG-/ZIP-Exporte bleiben erhalten.

ZIP entpacken und Inhalt im Repository-Hauptverzeichnis hochladen. `index.html` ersetzen. Nach dem Commit GitHub Pages mit Strg+F5 neu laden.

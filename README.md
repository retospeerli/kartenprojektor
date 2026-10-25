## Fehlerkorrektur v5.9.1

Der kantonale WFS führt reale Ebenen mit Präfix wie `ms:ogd-0045_giszhpub_wb_gewaesserbezeichnung_l`. Version 5.9 erwartete nur `WB_GEWAESSERBEZEICHNUNG_L` und erkannte darum keine Gewässer. Diese Zuordnung wurde berichtigt, mit strikter Unterscheidung von 45.1 und 45.2.

**Unverändert:** ausschliesslich dieselbe Positivliste mit bereits ausdrücklich verlangten Gewässern, keine weiteren Datenquellen, keine zusätzlichen Bäche/Weiher, keine allgemeinen Gewässer-WMS oder zusätzlichen Fallbacks. Kartenlayout, Tasten, Projektion und Exporte unverändert. Der Live-WFS konnte hier nicht direkt geprüft werden; Tests benutzen die tatsächlichen Namen der amtlichen WFS-Ebenen und simulierte Geometrien.

# Grossrelief-Kartenprojektor v5.9.1 — STRIKTE Positivliste

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

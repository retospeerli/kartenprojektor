# Grossrelief-Kartenprojektor v5.7 – vollständige amtliche Bachachsen

## Ziel und Abgrenzung

Gegenüber der Version 5.6 war ein zentraler Fehler in der Datenauswahl vorhanden: Sie verwendete fast immer **nur die namentlich beschrifteten Teilabschnitte** (GIS-ZH 45.3). Die **vollständige Gewässerachse** (GIS-ZH 45.2) wurde bislang nur für die Sihl ergänzt. Dadurch zeigten die Karten zwischen Oberlauf, Unterlauf und Seeufer grosse Lücken – genau wie in den vom Benutzer rot markierten Stellen.

**Korrektur:** Die amtliche Gewässernummer (`gewaessernummer`) verbindet ab jetzt **alle angeforderten Bachnamen** mit **allen amtlichen Routenabschnitten derselben Nummer**. Es werden keine handgezeichneten Linien, keine künstlichen Brücken und keine fremden Bachläufe eingefügt. Die vier bisher richtigen Bäche und das präzise Zürichseeufer bleiben erhalten.

**Mülibach Richterswil**, einschliesslich Auslauf zum Zürichsee: zusätzlich mit **Gewässernummer 2512** erfasst. Quelle: Amtlicher Gewässerraumplan Richterswil, https://www.richterswil.ch/_docn/6196924/20250909_Richterswil_Gew%C3%A4sserraumfestlegung_Plan_Nr.9_M%C3%BClibach_Hafenbach.pdf . Das stützt sich auf den amtlichen Wasserlauf und ist keine manuelle Gerade zum Ufer.

**Krebsbach ist nicht Chrebsbach.** Reidbach/Riedbach/Wildbach sind als Namensvarianten weiterhin verfügbar. Ebenso bleiben Sternenweiher, Reidbachweiher und Teufenbachweiher als stehende Gewässer erhalten (soweit vom Dienst geliefert).

## Realitätskontrolle

Die Startansicht zeigt ab v5.7:
- Anzahl nachgewiesener Bachgruppen aus dem WFS (Name gefunden)
- Anzahl davon mit **amtlichen Routengeometrien** (Gewässernummer verknüpft)
- Zahl der vollständigen Sihl-Abschnitte
- Zahl der Mülibach-Achsenabschnitte (Nr. 2512) sowie automatisch errechnete Entfernung ihrer Endpunkte zur Zürichsee-Uferlinie – kein künstliches Verbinden
- Namen tatsächlich noch fehlender Gewässer

Achtung: Das Vorliegen einer Achse garantiert keine perfekte Darstellung **über Kantonsgrenzen hinaus**. Der Liveabruf des kantonalen WFS ist in der Entwicklungsumgebung nicht möglich. Der Join und die Darstellung wurden mit Testdaten geprüft. Für die endgültige Kontrolle bitte die eigene GitHub-Pages-Seite mit `layout.csv` testen.

## Aktualisieren

Das ZIP entpacken, **alle Dateien** ins Hauptverzeichnis des bestehenden GitHub-Repos laden und committen. Die neue `index.html` verweist ausschliesslich auf `core.v5.7.js`, `hydro.v5.7.js`, `app.v5.7.js` und `style.v5.7.css`. Danach Strg+F5.

Sonstige Bedienung bleibt gleich: 1 Luftbild, 2 Landeskarte, 3 Gewässer, 4–9 weitere Kartenebenen; jede Taste unabhängig an/aus. Vier-Ecken-Projektorkalibrierung, weisser Untergrund, Historisch und Download bleiben erhalten.

## Technische Tests

- `node tests/core.test.js`
- `node tests/test_hydro_v57.js`
- `python tests/test_v57_browser.py` (simulierte WFS-/WMS-Antworten)

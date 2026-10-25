# Grossrelief-Kartenprojektor v5.9.11

GitHub Pages – Installation: Alle Dateien und Unterordner des entpackten ZIPs im Repository hochladen, `index.html` ersetzen und Änderungen committen. Browser danach mit Strg + F5 aktualisieren.

## Änderung gegenüber v5.9.9

**Ausschliesslich die Sihl-Datenbeschaffung** wurde korrigiert. Der bereits vorhandene Teil der Sihl und alle anderen Bäche, Seen, Weiher, Kartenebenen, Tastaturfunktionen, Projektor-Kalibrierung, Gemeinde-Maske und der Export bleiben unverändert.

Bisher suchte die App Sihl-Teilstücke nach Namen im Zürcher und Schwyzer Gewässernetz. Das Ergebnis war entlang der Kantonsgrenze häufig unvollständig. Ab dieser Version benutzt die Sihl-Nachlieferung ausschliesslich den **schweizweiten Datensatz `ch.swisstopo.swisstlm3d-gewaessernetz`** der Bundesverwaltung. Dessen amtliche Attribute sind `name` und `gwl_nr` (Gewässernummer). Die App ermittelt zuerst die Gewässernummer der Sihl, danach liest sie im LV95-Korridor bis zum Ostrand auch diejenigen Teilstücke, bei denen der Name fehlt. Die Auswahl erfolgt ausschliesslich anhand des Namens **Sihl** bzw. der dafür ermittelten `gwl_nr`; sonstige Bäche werden verworfen.

Die Nachlieferung nutzt GeoAdmin `MapServer/find` (Namens- und Gewässernummer-Identifizierung) und `MapServer/identify` (raumbezogene Geometrien). Sie verwendet keine verwaltungsbezogene Kantonsgrenze. Bei Abfragegrenzen von 200 Objekten wird das Untersuchungsrechteck geteilt. Im Ergebnis werden ausschliesslich reale amtliche Koordinaten übernommen, keine Linien erfunden oder geschätzt. Der bestehende strikte GeoJSON-Clip am CSV-Kartenrand sowie die grössere blaue Sihl-Strichstärke bleiben unverändert.

Für die Sihl erfolgt **kein Zugriff mehr auf den Schwyzer WFS**. Andere bereits vorhandene Datenabrufe (beispielsweise beim Krebsbach) sind davon nicht betroffen.

## Tests

- `node tests/sihl_national_5911.test.js`
- `python tests/browser_national_5911.py`
- Weitere Regressionstests zu den unveränderten Gewässern in `tests/`

**Prüfstand:** Die Programm- und Browsertests haben simulierte offizielle GeoAdmin-Antworten verwendet. Ein Abruf der tatsächlichen GeoAdmin-Geometrien aus dieser Ausführungsumgebung war nicht möglich. Deshalb ist die vollständige Sihl auf der veröffentlichten Website noch nicht live nachgewiesen.

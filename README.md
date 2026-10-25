# Grossrelief-Kartenprojektor v5.8

## Gewässer: Korrektur fehlender Bachläufe und Weiher

Version 5.8 ergänzt die v5.7-Logik um **weitere tatsächliche amtliche Geometriequellen**. Die Namen allein reichen nicht: Die Gewässer werden nur dargestellt, wenn der offizielle Web Feature Service (WFS) des Kantons Zürich die entsprechenden Linien oder Flächen liefert. Die bestehende Zeichengeometrie des Zürichsees wird nicht handgezeichnet oder verändert.

### Besonders geprüft

- **Reidbach / Riedbach / Wildbach:** ein zusammengehöriger Suchbegriff mit den drei vorhandenen Schreibungen
- **Sternenweiher:** Wasserfläche
- **Reidbachweiher / Riedbachweiher:** Wasserfläche oder amtliche Uferlinie
- **Teufenbach:** Bachachsen
- **Teufenbachweiher:** Wasserfläche oder amtliche Uferlinie
- **Sihl:** alle kantonalen Routenteile der erkannten Gewässernummer innerhalb des reliefbezogenen Abrufs
- **Krebsbach:** explizit nicht Chrebsbach
- **Schlossbach, Sagenbach, Miesbach:** Bachachsen

Erhalten bleiben Zopfbach, Gulmenbach, Töbelibach, Untermosenbach, Aabach, Meilibach und Mülibach Richterswil (Nr. 2512).

### Neu verwendete amtliche Datensätze

Kanton Zürich, GIS-ZH 45, Web Feature Service: `https://maps.zh.ch/wfs/OGDZHWFS`.

- **45.1** `WB_FLIESSGEWAESSER_L` – öffentliche Bachachsen **mit Namen**; neu in v5.8. Dies ist wichtig, wenn 45.3 nur Namensabschnitte liefert.
- **45.2** `WB_FLIESSGEWAESSER_L_M` – metrierte vollständige Gewässerrouten, Verbindung über die *amtliche Gewässernummer*.
- **45.3** `WB_GEWAESSERBEZEICHNUNG_L` – benannte Bachabschnitte.
- **45.10** `WB_STEHGEWAESSER_F` – See-/Weiherflächen.
- **45.11** `WB_STEHGEWAESSER_L` – benannte See-/Weiherufer; neu als Ergänzungsquelle, falls Flächen fehlen.
- **45.13** präzise Zürichsee-Uferlinie (bestehende Datenquelle).
- **45.16** `WB_GEWAESSER_RECHTSKRAFT_F` – zusätzliche, ausdrücklich nach Namen ausgewählte Wasserflächen, keine anderen Gewässerflächen.

Kleine Weiher aus 45.11 werden nur dann aus amtlichen Linien in Flächen umgewandelt, wenn bereits ein geschlossener Ring vorliegt. Es werden **keine fehlenden Verbindungen künstlich konstruiert**.

### Kontrolle in der App

Unter **Gewässerdarstellung** das aufklappbare Feld **«Gewässer einzeln kontrollieren»** öffnen. Dort wird für jeden angefragten Bach gezeigt, wie viele tatsächliche Liniensegmente der Browser laden konnte, und für jeden Weiher, ob eine Wasserfläche oder wenigstens eine amtliche Uferlinie vorliegt. Fehlende Daten werden ausdrücklich gemeldet und nicht mit beliebigen Rinnsalen ersetzt. Die grossen Gewässer bleiben im normalen Layer unverändert.

**Geografische Grenze:** Der Zürcher WFS enthält keine Gewässerabschnitte ausserhalb des Kantons Zürich. Darum kann die vollständige Sihl im Reliefausschnitt nicht garantiert werden, wenn der Fluss dort auf Schwyzer Kantonsgebiet fliesst. Der App-Status zeigt die tatsächlich vorhandenen Segmente. Der ergänzende swissTLM3D-WMS (Modus «Alle Bäche») bleibt als separate Vergleichsmöglichkeit erhalten.

**Live-Zugriff:** In der Entwicklungsumgebung können die aktuellen WFS-Abfragen nicht direkt geprüft werden. Sämtliche Browser- und Logiktests verwenden simulierte amtliche GeoJSON-Antworten. Die wirkliche Abdeckung wird nach dem Hochladen auf GitHub Pages angezeigt.

## GitHub Pages installieren

ZIP entpacken und den **Inhalt** in das Wurzelverzeichnis des bestehenden Repositories hochladen. Bestehende `index.html` ersetzen, committen und nach der Pages-Veröffentlichung **Strg + F5**. Die Datei `index.html` bindet die JavaScript-/CSS-Dateien mit den neuen eindeutigen Namen `*.v5.8.*` ein.

## Bedienung

**1 Luftbild, 2 Landeskarte, 3 Gewässer, 4 Verkehrswege, 5 Gemeindegrenzen, 6 Siedlungsflächen, 7 Ortsnamen, 8 Gebäude/Kunstbauten, 9 Wald.** Jede Taste schaltet ihre Ebene unabhängig ein/aus. `Esc` zurück zum Hauptmenü, `K` Ecken kalibrieren, `T` Leiste ausblenden. Modus Heute/Historisch und Export bleiben erhalten.

## Testen

```
node tests/core.test.js
node tests/test_hydro_regression.js
node tests/test_hydro_v58.js
python tests/test_v58_browser.py
python tests/test_v58_regression_browser.py
python tests/test_fallback_browser.py
```

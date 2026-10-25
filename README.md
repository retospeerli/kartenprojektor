# Grossrelief-Kartenprojektor v5.9.4

Basis: v5.9.3. **Ausschliesslich zwei Änderungen an Gewässerdaten:**

1. **Reidbachweiher** wird zusätzlich ausdrücklich als benannte **Wasserfläche** aus dem bereits verwendeten kantonalen WFS-Layer `WB_WASSERRECHTE_F` (GIS-ZH 51.1) akzeptiert. Genau dieser Weiher – keine anderen neuen Weiher.
2. **Krebsbach** wird ergänzend als namentlich **exakt Krebsbach** bezeichnete amtliche Linie aus überkantonalen Geodaten gesucht (swisstopo GeoAdmin; falls nicht verfügbar: amtlicher WFS Kanton Schwyz). Der Krebsbach fliesst vom Hüttnerseeli über Schwyz nach Bäch/Zürichsee. Der bisherige ZH-WFS erfasst seine Schwyzer Abschnitte nicht. **Chrebsbach** und andere Nebenbäche werden ausdrücklich ausgeschlossen. Amtliche Bachlinien werden nicht frei verlängert oder durch Seen gezeichnet.

Die Datenquellen liefern im Browser unterschiedliche Verfügbarkeit. Wird der vollständige Verlauf nicht geliefert, zeigt die App nur tatsächlich belegte Teilstücke – **keine erfundenen Linien**. Live-Abfragen der externen Quellen sind in dieser Entwicklungsumgebung nicht prüfbar.

Alle übrigen Bach-/Weiherlisten und Kartenebenen bleiben identisch zu v5.9.3. Versionsnummer v5.9.4 auch im Untertitel. 

## GitHub Pages
ZIP entpacken, gesamten Inhalt ins bestehende Repository hochladen. Dateien von v5.9.3 müssen nicht gelöscht werden, solange index.html v5.9.4 lädt. Nach Commit Strg+F5.

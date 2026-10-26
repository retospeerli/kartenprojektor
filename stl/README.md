# Standard-STL-Dateien (optional)

Lade die tatsächlichen STL-Dateien deines Reliefs in **diesen Ordner** des GitHub-Repositories.

- Für mehrere Segmente: exakt dieselben Dateinamen wie in der Spalte `filename` deiner `layout.csv`. Beispiel: `segment_R01_C01_200x195mm.stl`.
- Für ein Gesamt-STL: `relief.stl`.
- Die App sucht beim Laden der `layout.csv` automatisch zuerst alle Segmentdateien, dann `relief.stl`.
- Fehlen Dateien, verwendet die App weiterhin die bisherige 2D-Projektion.
- Du musst die STL-Dateien nicht bei jedem Start erneut auswählen.

**Wichtig:** Die STLs werden hier nicht mitgeliefert. Die echten Reliefdruckdateien musst du selbst in diesen Ordner hochladen.

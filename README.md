# Grossrelief-Kartenprojektor v5.7 — Gewässer ohne Doppelzeichnung

**Fehlerkorrektur gegenüber v5.6:** Bisher wurden zwei swisstopo-Layer verschiedener Generalisierungsstufen und zusätzlich einzelne Gewässergeometrien aufeinandergelegt. Das führte zu doppelt gezeichneten Flüssen und Bächen sowie unterschiedlichen Blautönen.

## Neue, verbindliche Darstellung

- Es wird **genau ein** amtlicher Gewässer-Layer gezeichnet, nicht mehrere.
- Standard: `ch.swisstopo.swisstlm3d-gewaessernetz` (swissTLM3D) — enthält Wasserläufe und Seeumrisse.
- Option **Vereinfachte Übersicht**: `ch.swisstopo.vec200-hydrography` (swissTLMRegio).
- Fällt die gewählte Quelle aus oder liefert nur leere Kartenbilder, wird die **gesamte** Gewässerkarte durch die andere Quelle ersetzt, niemals überlagert.
- Wenn beide amtlichen Quellen ausfallen, kann eine geprüfte Teilmenge der benannten OSM-Gewässer als **alleinige** Ersatzkarte angezeigt werden. Die unvollständige Abdeckung wird ausdrücklich gemeldet.
- Die Suche nach einzelnen benannten Gewässern dient im Normalfall ausschliesslich als mögliche Quelle für **Namenspositionen** (Taste 7), nicht für eine zweite, anders gezeichnete Gewässergeometrie.
- Diese Änderung gilt auch für den **PNG-/ZIP-Export**.

**Grenze:** Der amtliche WMS-Layer ist ein vollständiges Gewässernetz, nicht eine gefilterte Liste von 17 Gewässern. Die strikte, ortsgenaue Begrenzung auf die vom Nutzer gewünschten Wasserläufe benötigt separate geprüfte, deduplizierte Vektordaten. Die aktuelle v5.7 behauptet diese Filterung ausdrücklich nicht. Der WMS-Dienst und der Projektor können offline nicht live geprüft werden.

## Alle übrigen Funktionen bleiben

- Zwei Kartenmodi: Heute und Historisch
- CSV-Import zur Ermittlung der Relief-Gesamtfläche, eigene Kartenbilder hochladen
- Kartenebenen 1–9 im Projektormodus unabhängig ein- und ausschaltbar
- Vier-Ecken-Kalibrierung, Esc zurück zum Startmenü, schmale Werkzeugleiste
- Weiss beleuchteter Reliefhintergrund ohne Luftbild/Landeskarte
- Gemeinde-Wädenswil-Maske, Namen/Flurnamen, Kartenexport (sofern CORS erlaubt)

## GitHub Pages

Den Inhalt des ZIP-Archivs in das Stammverzeichnis des bestehenden Repositories hochladen und die gleichnamigen Dateien ersetzen. Auch `index.html` aktualisieren. Skript-/CSS-Dateien heissen absichtlich `*.v5.7.*`, um Browser-Caching mit früheren Versionen auszuschliessen.

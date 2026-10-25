# Grossrelief-Kartenprojektor v5.9 – strikte Gewässerauswahl

GitHub-Pages-App ohne Backend. Die bisherige Version zeigte zu viele Bäche, weil sie immer die vollständige swissTLM3D-WMS-Gewässerkarte darstellte. **Version 5.9 verwendet im Gewässermodus ausschliesslich 16 ausdrücklich ausgewählte Gewässergeometrien.** Eine Fehlersituation führt niemals zur ungefilterten WMS-Wasserkarte zurück.

## Sichtbar sind ausschliesslich

**Seen/Weiher:** Zürichsee, Hüttnersee, Ausee, Sternenweiher, Teufenbachweiher, Freyenweiher, Bachgadenweiher.

**Fliessgewässer:** Sihl, Reidbach, Gulmenbach, Zopfbach, Meilibach, Schlossbach, Risibach, Töbelibach, Winterbergholzbächli.

Die Wasserläufe kommen aus gezielt abgefragten, benannten OpenStreetMap-Vektoren (Overpass), nicht aus dem vollständigen swisstopo-WMS-Bild. Der gesamte Reliefausschnitt wird aus der CSV berechnet. Die Namen-Ebene (Taste 7) zeigt für Wasser nur Namen der Auswahl. Es gibt kein paralleles Overlay mit einer weiteren Gewässerkarte.

## Datenverlässlichkeit und Offline-Nutzung

- Nach erstmaligem erfolgreichem Laden werden die echten Wassergeometrien automatisch im Browser (IndexedDB) gespeichert. Bei späterem Öffnen können sie wiederverwendet werden.
- **Geometrien als GeoJSON sichern:** Der Button erzeugt `selected-waters.geojson` mit LV95-Koordinaten, vollständiger Quellangabe sowie einer Liste fehlender Objekte.
- **Dauerhaft auf GitHub nutzen:** Sobald die Gewässerdatei in der App geprüft wurde, die heruntergeladene Datei unter `data/selected-waters.geojson` ins Repository hochladen und die mitgelieferte leere Vorlage ersetzen. Danach wird diese verifizierte lokale Datei beim nächsten Aufruf bevorzugt geladen.
- **GeoJSON importieren:** Eine bereits gespeicherte, zu derselben CSV passende Datei kann direkt importiert werden.
- Bei einem nicht gefundenen Gewässer zeigt die App explizit die fehlenden Namen. Sie zeichnet weder erfundene Linien noch sämtliche anderen Rinnsale.
- **Wichtig:** Eine garantierte Darstellung aller 16 Gewässer ohne Onlinezugriff besteht erst, wenn ihre geprüften Geometrien vollständig in dieser Datei vorhanden sind. Die mitgelieferte Vorlage enthält absichtlich keine ausgedachten Koordinaten. Ohne verfügbare Geometrie meldet die App einen Fehler; es wird keine falsche Karte als korrekt ausgegeben.

## Steuerung

Im Projektormodus: Taste 3 schaltet Gewässer, Taste 7 schaltet Namen. Mehrfachauswahl, weisse Grundbeleuchtung, Wädenswil-Maske, historischer Modus, vier verschiebbare Ecken und Esc bleiben bestehen.

## Installation

ZIP entpacken und **alle** Dateien samt `data/` nach GitHub hochladen. `index.html` liegt im Repo-Stammverzeichnis. GitHub Pages unter `Settings → Pages` aktivieren. Die neuen v5.9-Dateinamen helfen, alte Browser-Caches auszuschliessen.

Datenquellen: swisstopo (Hintergrund-/Sachkarten), OpenStreetMap/Overpass (selektierte Gewässergeometrien, ODbL). Vor einer abschliessenden Unterrichtsvorlage sollten alle ausgewählten Wasserobjekte überprüft werden.

**Pflichtgewässer:** Wenn Zürichsee, Sihl oder Hüttnersee nicht als Vektorgeometrie gefunden werden, erscheint im Projektor eine deutliche Warnung. Die App kennzeichnet unvollständige Daten, ohne zufällige Bachläufe hinzuzufügen.

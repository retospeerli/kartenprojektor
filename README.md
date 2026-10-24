# Grossrelief-Kartenprojektor · GitHub Pages

Reine Browser-App für dein Grossrelief. Keine Python-Installation, kein Server, kein Build-Schritt.

## Zwei Arbeitsweisen

### 1) Neue Karten erzeugen
- `layout.csv` hochladen (**zwingend**, wenn neue Karten aus swisstopo-Daten berechnet werden sollen).
- Die App ermittelt daraus automatisch die Gesamtfläche des Reliefs.
- Danach können swisstopo-Kartenebenen geladen werden: Luftbild, Gewässer, Verkehrswege, Gemeinden, Siedlungen, Ortschaften, Bauten, Landeskarte.
- Diese Karten lassen sich einzeln oder kombiniert als PNG/ZIP herunterladen.

### 2) Vorhandene Kartenbilder wiederverwenden
- Bereits vorhandene Kartenbilder als `PNG`, `JPG/JPEG` oder `WebP` hochladen.
- Das funktioniert auch **ohne CSV**.
- Diese Bilder erscheinen als eigene Kartenebenen in der App und lassen sich später wieder verzerren, projizieren und erneut als PNG/ZIP exportieren.

## Ganz wichtig: Verzerrung / Projektion

Der Projektormodus ist das Kernstück.

- Vier Punkte `NW`, `NE`, `SE`, `SW` werden mit der Maus auf die echten Relief-Ecken gezogen.
- Jedes sichtbare Kartenbild wird danach perspektivisch verzerrt.
- Das gilt sowohl für neu erzeugte swisstopo-Karten als auch für hochgeladene Einzelbilder.
- Die Kalibrierung kann als JSON gespeichert und später wieder geladen werden.

Damit ist genau dein Ziel abgedeckt: **einzelne Kartenbilder verzerren zu können, sodass sie sich auf das Relief projizieren lassen**.

## Downloads

Die App kann:
- die aktuell sichtbare Kartenkombination als PNG herunterladen,
- alle verfügbaren Einzelkarten als ZIP herunterladen,
- dabei auch die aus swisstopo erzeugten Karten als Bilddateien speichern,
- und so Karten später wiederverwenden oder als analoge Arbeitsblätter im Unterricht nutzen.

## Veröffentlichen über GitHub Pages

1. Neues GitHub-Repository erstellen, z. B. `grossrelief-kartenprojektor`.
2. Den Inhalt dieses Ordners ins Repository hochladen.
3. Unter **Settings → Pages** `Deploy from a branch` wählen.
4. `main` und `/ (root)` einstellen.
5. Danach ist die App über GitHub Pages erreichbar.

## Dateien

- `index.html` – Oberfläche
- `style.css` – Gestaltung
- `core.js` – CSV-Prüfung, WMS-Hilfsfunktionen, Perspektive, ZIP-Erzeugung
- `app.js` – UI, Kartenverwaltung, Bild-Uploads, Projektor, Export
- `examples/layout.csv` – Beispiel
- `tests/core.test.js` – optionale Tests für die Kernlogik

## Hinweis zu CORS

Die Projektion im Browser funktioniert auch dann, wenn swisstopo-Bilder nur eingeschränkt exportierbar sind. Je nach Browser/WMS-Freigabe kann der direkte PNG-Export einzelner swisstopo-Karten blockiert sein. Hochgeladene eigene Bilder sind davon nicht betroffen.

## Ausgangslage deiner Beispiel-CSV

Die beigelegte `layout.csv` ergibt automatisch:
- 2 Spalten × 3 Reihen
- 6 Segmente
- Gesamtmodell: 400 × 584.769 mm
- LV95 West/Ost: 2'688'195.741 / 2'696'260.006
- LV95 Süd/Nord: 1'223'420.776 / 1'235'210.135

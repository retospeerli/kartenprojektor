# Grossrelief-Kartenprojektor v5.9.8 – isolierte Gewässerkorrektur

**Ausgangsversion:** v5.9.5. Ausschliesslich Gewässer-Ladeprozess korrigiert.

- Zürichsee/Seeflächen, Sihl und alle übrigen bereits bestätigten Wasserläufe werden direkt aus den ursprünglichen amtlichen Daten angezeigt.
- Eine zusätzliche Krebsbachprüfung darf die Grundkarte **niemals** zurückhalten, leeren oder verändern. Sie läuft separat und darf nur den Krebsbach aktualisieren.
- Eine zusätzliche nationale Anfrage darf nur **Sihl**-Geometrien anhand des exakten Namens ergänzen. Keine namenlosen Bachläufe und kein anderes Gewässer.
- Keine synthetischen Sihl- oder Krebsbach-Verbindungen. Bei unvollständiger amtlicher Datenlage wird der fehlende Verlauf diagnostiziert, nicht erfunden.
- UI, neun Tasten, Vier-Ecken-Kalibrierung, Export, bestehende Positivliste und alle übrigen Layer unverändert.
- Exakte Programmversion im Seitentitel und Untertitel: **v5.9.8**.

**Hinweis:** Reale Live-Antworten der Schweizer Kartendienste konnten im Ausführungssystem nicht abgerufen werden. Funktionstests mit lokalen Daten prüfen die Unabhängigkeit der Grundkarte und das Filterverhalten, nicht die geografische Vollständigkeit der externen Daten.


## v5.9.8 – ausschliesslich Sihl
- Sihl hat eine eigene, deutlich kräftigere blaue Gewässersignatur, an der visuellen Hierarchie der Landeskarte 1:25’000 orientiert. Die bestehende Bach-Strichstärke aller anderen Gewässer bleibt unverändert.
- Die Sihl-Linien aus amtlichen Quellen werden zusammen als Graph geometrisch untersucht. Nur wenn ein tatsächlich verbundener Sihl-Lauf zwei verschiedene Kartenränder erreicht, lautet die Diagnose „Sihl vollständig“. Die Linien werden exakt an den Rändern gekappt.
- Ergänzende Sihl-Daten werden aus einem grösseren, ausschliesslich für die Sihl bestimmten geografischen Suchgebiet angefordert. Es werden keine fremden Gewässernetze eingeblendet.
- Sind keine durchgehenden amtlichen Linien verfügbar, bleiben die bereits vorhandenen Sihl-Teilstücke gezeichnet. Die Einzelkontrolle meldet den fehlenden Kartenrand; es werden keine erfundenen Verbindungen gezogen.
- Keine Änderung an Zürichsee, anderen Bächen und Weihern, Kartenbedienung oder Kalibrierung.


## v5.9.8 – ausschliesslich Sihl im Kanton Schwyz
- Amtliche Schwyzer Sihl-Geometrie zusätzlich über WFS `ch.sz.a041b.gewaessernetz.mwert` beziehen.
- Nur ausdrücklich `Sihl` benannte Segmente und weitere Segmente derselben amtlichen Sihl-Routen-ID; alle anderen Gewässer ausschliessen.
- Im geprüften Gesamtverlauf ist das Erreichen des **östlichen Kartenrandes** zwingend.
- Die bestehende kräftige Sihl-Strichstärke, Zürichsee, alle anderen Bäche, Weiher und übrige Kartenebenen bleiben unverändert.
- Keine Erfindung fehlender Gewässergeometrien: Bei fehlender Ost-Verbindung bleiben existierende Linien sichtbar, und die Diagnose meldet die verbleibende Lücke.
- Amtlicher Schwyzer WFS: https://wfs.geo.sz.ch – Funktion im Live-Browser prüfen.

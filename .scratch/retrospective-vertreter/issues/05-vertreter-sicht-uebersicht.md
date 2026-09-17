# 05 — Vertreter-Sicht in der Übersicht (/retrospective)

Type: task
Status: done
Blocked by: 01, 04

## Question
Wie gelangt ein Vertreter zu „seinen" Gruppen, ohne den Link jedes Mal aufzuheben?

Umsetzung:
- **`board-list.component.*` (Owner-Übersicht `/retrospective`):** zusätzlich zu den eigenen Gruppen (`listMyGroups$`) die Gruppen einblenden, in denen der eingeloggte Nutzer **Vertreter** ist (`listGroupsWhereDeputy$` aus Ticket 01), in einem **eigenen Abschnitt** (z. B. „Gruppen, in denen ich Vertreter bin"), analog zu „Projekte als Mitarbeiter" im Velocity-Modul.
- Diese Gruppen-Karten führen auf die Gruppen-Seite; dort greifen die Vertreter-Rechte aus Ticket 04 (Board öffnen, „Neues Board" anlegen). **Kein** Umbenennen/Löschen/Vertreter-Verwalten an der Vertreter-Karte.
- Doppelte Anzeige vermeiden (eine Gruppe kann man nicht gleichzeitig besitzen und vertreten — der Owner ist nicht sein eigener Vertreter; falls doch, nach `listMyGroups$` deduplizieren).
- Für **anonyme** Nutzer bleibt die Übersicht wie bisher leer/nur eigenes (die deputy-Query liefert `of([])`).
- **Ziel:** Ein eingeloggter Vertreter sieht seine Gruppen direkt in `/retrospective` und kommt mit einem Klick in die Gruppen-Seite mit vollen Vertreter-Rechten. `ng build` grün.

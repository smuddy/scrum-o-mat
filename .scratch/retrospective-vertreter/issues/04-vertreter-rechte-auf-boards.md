# 04 — Vertreter-Rechte auf Boards (Board-, Gruppen- und Anlege-Sicht)

Type: task
Status: done
Blocked by: 01

## Question
Wie bekommt ein Vertreter auf allen Boards der Gruppe die vollen Board-Rechte (außer den vier Owner-only-Aktionen), inklusive Board-Anlegen in die Gruppe?

Umsetzung — überall das Predikat `canManageBoards(group, realUid)` aus Ticket 01 verwenden statt der bisherigen reinen `board.ownerId === uid`-Prüfung, **sobald ein Board zu einer Gruppe gehört**:
- **`board/board.component.*`:** Alle owner-gegateten Verwaltungsaktionen (Timer setzen/pausieren/fortsetzen/zurücksetzen, `setHidden`, Spalten bearbeiten `updateColumns`, Voting zurücksetzen `resetVotes`, Board umbenennen `renameBoard`, archivieren `setArchived`) freischalten für **Board-Manager der Gruppe**. Dazu die Gruppe des Boards laden (`getGroup$(board.groupId)`) und `canManageBoards` auswerten. Boards **ohne** `groupId` bleiben unverändert owner-only via `board.ownerId`. **Karten/Reaktionen/Voting/Action-Items** sind ohnehin für alle offen — unverändert.
  - **Owner-only bleiben:** `deleteBoard` (Board endgültig löschen). Falls im Board erreichbar → nur `isGroupOwner` bzw. `board.ownerId === uid`.
- **`group/group.component.*`:** Der Owner-Aktionsblock „Neues Board" wird auch dem **Vertreter** gezeigt (Board anlegen → `createBoard(..., groupId)` und direkt hineinnavigieren, wie beim Owner). **Owner-only bleiben** hier: Gruppe umbenennen, „Link kopieren" (bereits owner-only), Board **aus der Gruppe lösen** und Board **löschen**. „Board verschieben" für Vertreter höchstens als **Hinein**-Zuordnung eigener Boards (siehe unten), kein Herauslösen.
- **`create/create.component.*` (Gruppen-Modus):** Anlegen mit `groupId` auch für Vertreter erlauben; Übernahme der Spalten/Titel-Hochzählung vom neuesten Board unverändert.
- **Eigene Boards einordnen:** In der Verschiebe-Auswahl (`assignBoardToGroup`) darf der Vertreter **seine eigenen ungruppierten** Boards **in** die Gruppe legen; **kein** Herauslösen fremder/beliebiger Boards (Owner-only). D. h. „Aus Gruppe entfernen" bleibt owner-only.
- **Ziel:** Vertreter erlebt Gruppen-Boards wie der Owner — außer den vier Owner-only-Punkten. Link-Mitglieder unverändert (nur Inhalte). `ng build` grün.

# 02 — Gruppen-Seite: Board-Liste, aktuelles Board hervorgehoben, Share-Link, Owner/Mitglied-Sicht

Type: task
Status: open
Blocked by: 01

## Question
Was sieht jemand, der `/retrospective/group/:groupId` öffnet, und wie teilt der Owner die Gruppe?

Umsetzung (`group/group.component.ts` unter `/retrospective/group/:groupId`, **kein** AuthGuard):
- Gruppenname als Titel/Breadcrumb (`HeaderService`), z.B. „Retrospektive > <Gruppenname>".
- **Board-Liste der Gruppe** via `listBoardsByGroup$(groupId)`, sortiert neueste zuerst (wie `board-list`). Das **aktuelle Board** (neuestes nicht-archiviertes) optisch hervorgehoben/vorangestellt; Klick auf ein Board → `/retrospective/:boardId`.
- **Archivierte Boards:** eigener **einklappbarer Abschnitt** (analog `board-list`), damit auch Mitglieder alte Sprints nachlesen können.
- **Randfall** (alle Boards archiviert bzw. Gruppe leer): kein Highlight — Owner sieht „Neues Board", Mitglied sieht Hinweistext.
- **Owner-vs-Mitglied** client-seitig: `currentUserId$` (reale uid) == `group.ownerId`?
  - *Owner:* Seitenleisten-Aktionen (`MenuService.addCustomAction`): „Neues Board" (→ Ticket 04), **„Gruppen-Link kopieren"**, „Gruppe umbenennen".
  - *Mitglied:* **keine** Verwaltungsaktionen und **kein** „Gruppen-Link kopieren"; nur Liste + Board öffnen + inhaltliche Beteiligung im Board.
- **Share-Link** (nur Owner) = `window.location.origin + '/retrospective/group/' + groupId`, Copy via `navigator.clipboard` (wie im bestehenden Create-Flow).
- Stil/Animationen wie `board-list` (`fadeTranslateInstant`, `cardTransition`).

Verweis: setzt die feste Zugriffs-Grenze aus den Map-Notes um (Mitglied = read/participate-only, kein Teilen-Button).

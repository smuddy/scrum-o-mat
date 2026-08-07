# 12 — Board-Aktionen: umbenennen / archivieren

Type: task
Status: resolved
Blocked by: 11

## Question
Wie verwaltet der Owner seine Boards (außer Löschen)?

Umsetzung (in der Übersicht aus Ticket 11, ggf. auch auf dem Board):
- **Umbenennen** (Titel ändern) → `RetroService.renameBoard(boardId, title)`.
- **Archivieren** (optional): `archived`-Flag am Board; archivierte in der Übersicht ausgeblendet/aufklappbar.
- Nur Owner.

Hinweis: **Board löschen** liegt in Ticket 19 (Owner-Aktionen in der Seitenleiste, mit Confirm-Mechanik + `RetroService.deleteBoard`).

Offen: Archivieren im ersten Wurf mit dabei oder nur umbenennen?

## Answer
Gebaut (`ng build` + Vitest grün, 345 Tests, 2026-08-06). Nur board-list + service + models.
- Modell: `archived?: boolean`. Service: `renameBoard(id, title)` (+ modified), `setArchived(id, archived)`.
- board-list: Inline-Umbenennen (Stift → Input → Check/Abbrechen), Archiv-Toggle (`faBoxArchive`/`faTrashCanArrowUp`); Navigation liegt nur auf dem Titel-Bereich (Aktions-Icons separat, kein versehentliches Navigieren).
- Aktive Boards in der Hauptliste, archivierte in einem einklappbaren Abschnitt „Archiviert (n)"; `shareReplay(1)` verhindert doppelten Firestore-Listener.
- Löschen bleibt in Ticket 19.

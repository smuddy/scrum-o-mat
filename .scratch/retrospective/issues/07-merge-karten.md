# 07 — Karten zusammenführen (Owner)

Type: task
Status: resolved
Blocked by: 06

## Question
Wie merged der Owner zwei Karten?

Umsetzung:
- Owner zieht Quellkarte auf Zielkarte → `mergeCards(boardId, sourceId, targetId)`:
  Zieltext = `zielText + "\n\n" + quellText` (eine Leerzeile Abstand), danach Quellkarte löschen.
- Nur Owner. Drop-auf-Karte-Erkennung zusätzlich zum Spalten-Drop aus Ticket 06.

Offen: Concurrency bei gleichzeitigen Drops.

## Answer
In `board.component` (`ng build` + Vitest grün, 2026-08-06). Mechanismus: KEINE verschachtelten cdkDropLists pro Karte (haette Spalten-DnD gebrochen), sondern **Merge-Erkennung via Drop-Position** in `onDrop`: `event.dropPoint` → `document.elementFromPoint()` → naechstes `[data-card-id]`. Landet der Owner-Drop exakt auf einer ANDEREN Karte → `onMergeDrop` → `retroService.mergeCards(boardId, source, target)` (Service haengt Quelltext mit Leerzeile an Ziel, loescht Quelle); sonst normale Move/Reorder-Logik (Ticket 06). Nur Owner, kein Selbst-Merge. Vitest-Tests inkl. Hit-Test (elementFromPoint in jsdom via beforeEach bereitgestellt).

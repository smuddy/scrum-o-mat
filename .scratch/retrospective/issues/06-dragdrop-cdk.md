# 06 — Drag&Drop (@angular/cdk)

Type: task
Status: resolved
Blocked by: 03

## Question
Wie werden Karten per Drag&Drop verschoben?

Umsetzung mit `@angular/cdk` DragDrop (`cdkDropListGroup`, `cdkDropList` je Spalte, `cdkDrag` je Karte):
- Teilnehmer: nur **eigene** Karten zwischen Spalten verschieben.
- Owner: **alle** Karten verschieben **und** Reihenfolge innerhalb einer Spalte ändern.
- Drop → `moveCard` (columnId + order aktualisieren); betroffene Spalte(n) neu ordnen.

Offen: Ordering-Schema (fortlaufende Integer neu vergeben vs. fraktional).

## Answer
In `board.component` mit `@angular/cdk/drag-drop` (`ng build` grün, 2026-08-06), bestehende Funktionalität erhalten.
- `.columns` = `cdkDropListGroup`; je Spalte `cdkDropList` (`[cdkDropListData]="colView.cards"`); je Karte `cdkDrag` mit `[cdkDragDisabled]="!canMove(card, vm)"`.
- `canMove(card, vm)` = `card.authorId === myUid || isOwner`.
- `onDrop(event, vm, targetColumnId)`: Same-Column-Reorder nur wenn Owner (sonst no-op); Cross-Column-Transfer wenn `canMove`; optimistisch `moveItemInArray`/`transferArrayItem`, dann `persistOrder` → fortlaufende Integer-`order` via `moveCard` (beide betroffenen Spalten reindexiert). **Ordering-Schema: fortlaufende Integer festgelegt.**
- CDK-Styles (preview/placeholder/dragging) dark-theme; Vitest-Tests für canMove/onDrop.

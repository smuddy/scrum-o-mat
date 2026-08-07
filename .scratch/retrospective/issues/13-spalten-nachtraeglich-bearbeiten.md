# 13 — Spalten nachträglich bearbeiten

Type: task
Status: resolved
Blocked by: 03

## Question
Wie ändert der Owner Spalten nach dem Anlegen?

Umsetzung (auf dem Board, nur Owner):
- Spalten **umbenennen**, **umfärben**, **hinzufügen**, **entfernen**, ggf. **Reihenfolge** ändern.
- `RetroService`: `updateColumns(boardId, columns)` (schreibt das `columns`-Array neu) bzw. gezielte add/remove/rename/recolor.
- Live-Sync: bestehende Karten referenzieren `columnId` — bleiben gültig, solange die Spalte existiert.

Offen (Detailentscheidung): Was passiert mit **Karten einer gelöschten Spalte** (in andere Spalte verschieben vs. mitlöschen, mit Bestätigung)?

## Answer
Gebaut (`ng build` + Vitest grün, 359 Tests, 2026-08-07). board.component + Service.
- `RetroService.updateColumns(boardId, columns)`.
- Owner-Menü-Toggle „Spalten bearbeiten"/„Bearbeiten beenden" → lokaler `editColumns`-Modus. Im Modus: pro Spalten-Header Name-Input + Farbwähler + Links/Rechts (Reorder via order-Tausch) + Entfernen; „Spalte hinzufügen"-Button.
- **Entfernen nicht-destruktiv:** Karten der Spalte werden per `moveCard` in die erste verbleibende Spalte verschoben (mit `confirm`), dann `updateColumns` ohne die Spalte; letzte Spalte gesperrt.

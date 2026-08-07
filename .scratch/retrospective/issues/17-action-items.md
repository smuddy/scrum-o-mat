# 17 — Action-Items / To-dos

Type: task
Status: resolved
Blocked by: 03

## Entscheidungen (Defaults)
- Eigene Sektion unter dem Board (keine spezielle Spalte); eigene Subcollection `actionItems`.
- Jeder darf Action-Items anlegen + „erledigt" togglen; Bearbeiten/Löschen nur Autor oder Owner.
- `assignee` optionales Freitextfeld.

## Question
Wie werden Maßnahmen/To-dos festgehalten?

Umsetzung:
- Action-Items erfassen (Text, optional Verantwortliche:r, erledigt-Status).
- Datenmodell: eigene Subcollection `retro/{boardId}/actionItems` (Detailentscheidung) mit `{text, assignee?, done, order, created}`.
- `RetroService`: `addActionItem/updateActionItem/toggleDone/deleteActionItem`.
- UI: eigene Sektion/Panel unter/neben dem Board.

Offen (Detailentscheidung): eigene Sektion vs. spezielle „Aktionen"-Spalte; Rechte (wer darf anlegen/erledigen).

## Answer
Gebaut (`ng build` + Vitest grün, 407 Tests / 45 Dateien, 2026-08-07).
- Modell: `RetroActionItem(Id)`. Service: `getActionItems$`/`addActionItem`/`updateActionItem`/`toggleActionItemDone`/`deleteActionItem` (Subcollection `retro/{boardId}/actionItems`).
- Neue `ActionItemsComponent` als eigene Sektion unter dem Board (Add-Form Text + optional assignee; Checkbox „erledigt" für alle; Bearbeiten/Löschen nur Autor oder Owner). In board.component eingebunden.
- Fix: `deleteBoard` löscht jetzt auch die `actionItems`-Subcollection (keine verwaisten Docs).

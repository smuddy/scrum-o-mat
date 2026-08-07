# 16 — Emoji-Reaktionen

Type: task
Status: resolved
Blocked by: 03

## Entscheidungen (Defaults)
- Fester Emoji-Satz (kein Picker), Toggle pro Nutzer (uid-Liste je Emoji).
- Reaktionen immer sichtbar/erlaubt (auch bei `hidden`).

## Question
Wie reagieren Teilnehmer mit Emojis auf Karten?

Umsetzung:
- Teilnehmer können Karten mit Emojis reagieren; Anzeige aggregiert (Emoji + Anzahl) an der Karte.
- Datenmodell: `reactions` je Karte, z.B. Map `emoji → count` bzw. `emoji → userId[]` (damit Toggle je Nutzer möglich).
- `RetroService`: `toggleReaction(boardId, cardId, emoji)`.

Offen: fester Emoji-Satz vs. Picker; Verhalten während `hidden`.

## Answer
Gebaut (`ng build` + Vitest grün, 390 Tests, 2026-08-07). board.component + Service + Modell.
- Modell: `RetroCard.reactions?: {[emoji]: string[]}` (uids je Emoji). Service: `setReactions(boardId, cardId, reactions)`.
- Fester Satz `['👍','❤️','😄','🎉','😕']`; pro Karte Reaktions-Zeile (Emoji + Zähler), eigene Reaktion hervorgehoben; Klick togglet die eigene uid. Immer sichtbar/erlaubt.

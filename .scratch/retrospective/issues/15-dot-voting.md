# 15 — Dot-Voting / Abstimmen

Type: task
Status: resolved
Blocked by: 03

## Entscheidungen (Defaults)
- Kontingent pro Nutzer: **5 Stimmen**, boardweit; stapelbar (mehrere Stimmen auf eine Karte).
- Zählstände immer sichtbar (auch bei `hidden`).
- Owner kann alle Stimmen zurücksetzen (Menü-Aktion).

## Question
Wie stimmen Teilnehmer über Karten ab?

Umsetzung:
- Teilnehmer geben Karten Stimmen/Punkte; Anzeige der Stimmenzahl je Karte; optional Sortierung nach Stimmen.
- Datenmodell: Stimmen je Karte, z.B. Map `votes: {userId: count}` oder Subcollection — Detailentscheidung.
- `RetroService`: `vote(boardId, cardId, delta)` / `setVote(...)`.

Offen (Detailentscheidung): Stimmen-**Kontingent** pro Nutzer (z.B. max. N)? Sichtbarkeit der Stimmen während `hidden`? Owner-Reset der Stimmen?

## Answer
Gebaut (`ng build` + Vitest grün, 382 Tests, 2026-08-07). board.component + Service + Modell.
- Modell: `RetroCard.votes?: {[uid]: number}`. Service: `voteCard(boardId, cardId, votes)` (schreibt volle Map), `resetVotes(boardId)`.
- Karte: ★-Gesamtzahl (immer sichtbar), eigene Stimmen „★ n", +/− ; „+" gesperrt bei boardweitem Kontingent 5 (`myUsedVotes`); „−" entfernt Key bei 0.
- Owner-Menü „Votes zurücksetzen" (confirm) → `resetVotes`.

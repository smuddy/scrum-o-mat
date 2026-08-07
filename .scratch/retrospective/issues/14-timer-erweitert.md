# 14 — Timer erweitert: pausieren / fortsetzen / zurücksetzen

Type: task
Status: resolved
Blocked by: 05

## Question
Wie steuert der Owner den laufenden Timer feiner?

Umsetzung (nur Owner):
- **Pausieren** (Countdown hält für alle an), **Fortsetzen**, **Zurücksetzen**.
- Datenmodell erweitern: statt nur `timerEndsAt` zusätzlich z.B. `timerPausedRemainingMs` (bei Pause gesetzt, `timerEndsAt` genullt) — beim Fortsetzen `timerEndsAt = now + remaining`. Alle Clients berechnen die Anzeige aus dem synchronisierten Zustand.
- `RetroService`: `pauseTimer(boardId)`, `resumeTimer(boardId)`, `resetTimer(boardId)` (bzw. Erweiterung von `setTimer`).

Offen: genaues Feld-Schema für den Pause-Zustand.

## Answer
Gebaut (`ng build` + Vitest grün, 369 Tests, 2026-08-07).
- Modell: `timerPausedRemainingMs?: number|null`. Service: `pauseTimer`/`resumeTimer`/`resetTimer`; `setTimer` löscht die Pause beim Start.
- `TimerControlComponent` zustandsabhängig (self-contained via `getBoard$`): idle = Minuten-Input + Start (Play); running = Pause + Reset (RotateLeft); paused = Fortsetzen (Play) + Reset.
- Board-Countdown zeigt bei Pause die eingefrorene Restzeit + „pausiert".
- Nebenbei: „m"-Einheit teilt sich jetzt einen Unterstrich mit dem Input (separater Strich entfernt, Nutzer-Feedback).

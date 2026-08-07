# 05 — Timer (Owner setzt, alle sehen Countdown)

Type: task
Status: resolved
Blocked by: 03

## Question
Wie funktioniert der geteilte Countdown?

Umsetzung:
- Owner setzt Dauer (Minuten, einstellbar, z.B. Default 5) → `setTimer(boardId, endsAt)` schreibt Endzeitpunkt ins Board-Dokument.
- Alle Clients zeigen live den Countdown bis `timerEndsAt` (mm:ss), aus dem synchronisierten Board-Feld berechnet.
- Abgelaufen → 00:00 / Hinweis. Owner kann neu setzen.

Offen: Client-Uhr vs. serverTimestamp / Clock-Skew (MVP: Client-Uhr akzeptabel).

## Answer
In `board.component` ergänzt (`ng build` grün, 2026-08-06), bestehende Funktionalität erhalten.
- Owner-Controls: Minuten-Input (Default 5) + „Timer starten" (`setTimer(boardId, new Date(Date.now()+min*60000))`) / „Timer stoppen" (`setTimer(boardId, null)`).
- Countdown `mm:ss` für alle sichtbar, sekündlich via `combineLatest([board$, timer(0,1000)])`; „Zeit abgelaufen" bei ≤0.
- Timestamp-Normalizer `toDate()` (Firestore-Timestamp) vs. `new Date(value)`; Restzeit clientseitig (akzeptiert).
- `OnDestroy` räumt Subscription auf (kein Leak). Vitest-Tests für Restzeit/Format/Start-Stop/Cleanup.
Hinweis: `board$` wird nun 3× subscribed (mehrere Firestore-Listener) — bestehendes Muster, ggf. später über einen shared Stream konsolidieren.

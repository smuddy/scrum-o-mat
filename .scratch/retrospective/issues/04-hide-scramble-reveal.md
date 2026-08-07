# 04 — Verstecken: Blur + Scramble + Owner-Reveal

Type: task
Status: resolved
Blocked by: 03

## Question
Wie werden fremde Kartentexte versteckt und vom Owner temporär aufgedeckt?

Umsetzung:
- Owner-Toggle „Texte verstecken" → `setHidden(boardId, bool)`.
- Bei `board.hidden`: Karten, deren `authorId` != eigene uid und man ist nicht Owner → Text geblurrt **und** im DOM durch Scramble ersetzt (echter Ersatzstring ähnlicher Länge, nicht nur CSS-Blur). Owner + Autor sehen Klartext.
- Owner-Button „temporär aufdecken" (nur lokal, nur für Owner) → zeigt Klartext ohne `hidden` zu ändern.

Offen: Scramble-Determinismus (stabil je Karte gegen Flackern).

## Answer
In `board.component` ergänzt (`ng build` grün, 2026-08-06), bestehende Funktionalität erhalten.
- Owner-Toggle „Texte verstecken/einblenden" → `setHidden(boardId, !board.hidden)`; Zustand live über `board.hidden`.
- `displayText(card, vm)` + `isScrambled(card, vm)`: Owner/Autor sehen Klartext; sonst bei `board.hidden` deterministischer Scramble (Seed aus `card.id`+Index, ersetzt nur Buchstaben/Ziffern, erhält Whitespace/Interpunktion, stabil → kein Flackern) + CSS-Blur (`user-select:none`).
- Owner „temporär aufdecken" = lokaler `revealTemporarily` (kein Firestore-Write).
- Zusätzlich `board.component.spec.ts` (Vitest) für Toggle/Scramble/Reveal + CRUD-Regression (Lauf in Ticket 09).

## Korrektur (2026-08-06, Nutzer-Feedback)
`isScrambled` war fehlerhaft: Owner sah Fremdtexte **immer** im Klartext. Korrigiert: bei `hidden` sieht NUR der Autor seine eigene Karte; alle anderen INKL. Owner sehen Scramble — der Owner deckt via `revealTemporarily` (owner-only) temporaer auf. Reveal wirkt jetzt nur fuer den Owner. Tests entsprechend angepasst.

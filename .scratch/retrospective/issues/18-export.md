# 18 — Export (CSV / Markdown)

Type: task
Status: resolved
Blocked by: 03

## Entscheidungen (Defaults)
- Export als **Markdown** und **CSV**, Download via Blob. Umfang: Titel + Spalten + Karten inkl. Stimmen/Reaktionen; plus Action-Items.
- Als Owner-Menü-Aktionen in der Seitenleiste.
- `deleteBoard` räumt jetzt auch `actionItems` ab (Fix aus Ticket 17).

## Question
Wie exportiert man ein Board?

Umsetzung:
- Board (Titel, Spalten, Karten; ggf. Stimmen/Reaktionen/Action-Items sofern vorhanden) als **Markdown** und/oder **CSV** exportieren + als Datei herunterladen (Blob-Download).
- Serialisierung als Utility/`RetroService`-Methode; Button in der Board-Ansicht (Owner, ggf. alle).

Offen: Umfang des Exports (nur Karten vs. inkl. Votes/Reactions/Action-Items — hängt von 15/16/17 ab); Format-Default.

## Answer
Gebaut (`ng build` + Vitest grün, 421 Tests / 46 Dateien, 2026-08-07).
- Reine Serialisierung `board/export/retro-export.ts`: `boardToMarkdown(board, cards, actionItems)` (Titel, Spalten, Karten + ★-Summe + Reaktionen, Action-Items mit `[x]/[ ]` + `@assignee`) und `boardToCsv(board, cards)` (RFC-4180-Escaping). Voll unit-getestet.
- board.component: `exportMarkdown()`/`exportCsv()` (liest Board/Cards/ActionItems via `firstValueFrom`, baut String, `download()` per Blob), Dateiname `retro-<titel>.md/.csv`. Owner-Menü-Aktionen „Export (Markdown)"/„Export (CSV)".

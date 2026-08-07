# 02 — Board anlegen + Share-Link

Type: task
Status: resolved
Blocked by: 01

## Question
Wie legt der (eingeloggte) Owner ein Board an und teilt es?

Umsetzung (Create-Component unter `/retrospective`):
- Formular: Board-Titel; Spaltenanzahl (Default 4, änderbar); pro Spalte Name + Farbe.
- „Anlegen" → `RetroService.createBoard(...)` → Navigation auf `/retrospective/:boardId`.
- Share-Link anzeigen + Copy-Button (Format entscheiden: direkter `/retrospective/:boardId` empfohlen vs. `?session=` wie Scrum Poker — siehe Fog).
- Breadcrumb via `HeaderService`.

Offen: Share-Link-Format festlegen.

## Answer
Create-Component gebaut (`ng build` grün, 2026-08-06). Nur `create/`-Scope.
- Formular: Titel; Spaltenanzahl (Default 4, +/-/Zahl, erhält Namen/Farben); pro Spalte Name + `<input type="color">` (Default-Namen „Gut gelaufen/Verbessern/Aktionen/Sonstiges" + Farben).
- `createBoard()` → `retroService.createBoard(title, columns)`; danach **Share-Link angezeigt** (`window.location.origin + '/retrospective/' + boardId`, **direkter Link festgelegt**) mit Kopieren-Button (`navigator.clipboard`) + „Board öffnen" (navigiert).
- Breadcrumb in ngOnInit; standalone, CommonModule/FormsModule, `.less` im Projektstil.

Entscheidung: **Share-Link-Format = direkter `/retrospective/:boardId`** (nicht `?session=`).

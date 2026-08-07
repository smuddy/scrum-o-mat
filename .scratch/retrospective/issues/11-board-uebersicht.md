# 11 — Board-Übersicht + neues Board anlegen

Type: task
Status: resolved
Blocked by: 01

## Question
Wie sieht der Einstieg unter `/retrospective` aus?

Umsetzung:
- `/retrospective` zeigt eine **Liste der vom eingeloggten Nutzer angelegten Boards** (`ownerId == meine reale uid`), jedes klickbar → `/retrospective/:boardId`. Pro Eintrag Titel (+ ggf. Spaltenzahl/Datum).
- Button **„Neues Board anlegen"** → Create-Flow.
- Routing anpassen: `/retrospective` → neue `BoardListComponent` (hinter AuthGuard); Create wandert auf `/retrospective/new` (VOR `:boardId` in der Routenliste, sonst matcht `new` auf `:boardId`); `/retrospective/:boardId` bleibt offen.
- `RetroService`: `listMyBoards$` (query `retro` where `ownerId == currentUserId`, analog `PlanningService.listMyPlannings$`).
- Stil/Animationen/Breadcrumb wie die anderen Übersichten (z.B. `velocity/projects` bzw. `planning/init/my-sessions`).

Offen: Leerzustand („noch keine Boards"); Sortierung (zuletzt geändert?).

## Answer
Gebaut (`ng build` + Vitest grün, 324 Tests, 2026-08-06).
- `RetroService.listMyBoards$` (query `retro` where `ownerId == currentUserId$`, dedupe).
- `BoardListComponent` unter `/retrospective`: listet meine Boards (Titel + Spaltenzahl), Klick → `/retrospective/:boardId`; Leerzustand; Entrance-/Stagger-Animationen.
- Routing: `''`→BoardList (AuthGuard), `new`→Create (vor `:boardId`), `:boardId`→Board (offen).
- **„Neues Board anlegen"** liegt (wie Sprintplanner) als Menü-Aktion in der Seitenleiste (`addCustomAction`), kein On-Page-Button.
- Überschrift entfernt (steht im Breadcrumb). `created`-Feld ergänzt (Modell + createBoard); Liste **absteigend nach created** (neuestes oben, Fallback modified).
- `deleteBoard(boardId)` im Service ergänzt (für Ticket 19).

# 01 — Fundament: Modul, Datenmodell, RetroService, Routing

Type: task
Status: resolved

## Question
Welche Bausteine trägt das Feature, sodass alle weiteren Tickets darauf aufsetzen?

Umsetzung:
- Modulverzeichnis `src/app/modules/retrospective/`.
- `@angular/cdk` installieren (für DnD-Tickets 06/07).
- Datenmodell `models/retro.ts`:
  - `RetroColumn { id: string; name: string; color: string; order: number }`
  - `RetroBoard { ownerId: string; title: string; columns: RetroColumn[]; hidden: boolean; timerEndsAt: any | null; modified: any }` + `RetroBoardId extends RetroBoard { id }`
  - `RetroCard { text: string; columnId: string; authorId: string; order: number; created: any; modified: any }` + `RetroCardId extends RetroCard { id }`
- `RetroService` (`providedIn: 'root'`, `inject(Firestore)` + `inCtx`-Wrapper analog `PlanningService`), Firestore-Layout: `retro/{boardId}` + Subcollection `retro/{boardId}/cards/{cardId}`. Methodenschale (Feinlogik in Folgetickets):
  `createBoard(title, columns) → boardId` (setzt ownerId = reale uid, hidden=false, timerEndsAt=null), `getBoard$(boardId)`, `getCards$(boardId)`, `addCard(boardId, columnId, text)`, `updateCardText(boardId, cardId, text)`, `deleteCard(boardId, cardId)`, `moveCard(boardId, cardId, columnId, order)`, `setHidden(boardId, hidden)`, `setTimer(boardId, endsAt|null)`, `mergeCards(boardId, sourceId, targetId)`.
- Routen in `app.routes.ts`:
  - `/retrospective` → Create-Component, hinter `AuthGuard` (+ `redirectUnauthorizedToLogin`) — Owner nur eingeloggt.
  - `/retrospective/:boardId` → Board-Ansicht, offen für alle mit Link.
- `firestore.rules`: offener Einzeiler `match /retro/{document=**} { allow read, write; }` (Rules bewusst deferred, siehe Map-Notes).
- Stub-Components (Create + Board) nur so weit, dass `ng build` grün ist.

Ergebnis: `ng build` grün.

## Answer
Fundament gebaut, `ng build` grün (dev, 2026-08-06).
- `@angular/cdk@^21.1.0` installiert.
- `src/app/modules/retrospective/models/retro.ts`: `RetroColumn`, `RetroBoard(Id)`, `RetroCard(Id)`.
- `src/app/modules/retrospective/retro.service.ts` (providedIn root, `inject(Firestore)` + `inCtx` wie `PlanningService`): createBoard/getBoard$/getCards$/addCard/updateCardText/deleteCard/moveCard/setHidden/setTimer/mergeCards (+ privat getCard$). Layout `retro/{boardId}` + Subcollection `retro/{boardId}/cards`. Owner-uid via `currentUserId$()`, Autor-uid via `authStateAllowAnonymous$`. `mergeCards` bereits voll implementiert.
- Stub-Components `create/create.component.ts` (hinter AuthGuard) + `board/board.component.ts` (offen, liest `getBoard$`).
- Routen in `app.routes.ts`: `/retrospective` (Create, `AuthGuard` + `redirectUnauthorizedToLogin`), `/retrospective/:boardId` (offen).
- `firestore.rules`: offener `match /retro/{document=**}` (Rules deferred laut Map-Notes).

Offene Detailentscheidungen bleiben in den Folgetickets (Ordering, Timer-Uhr, Scramble, Share-Link-Format).

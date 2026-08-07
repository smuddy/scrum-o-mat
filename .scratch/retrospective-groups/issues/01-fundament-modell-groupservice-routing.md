# 01 — Fundament: RetroGroup-Modell, groupId, Service-Methoden, Routing

Type: task
Status: open

## Question
Wie sieht das Datenfundament für Gruppen aus, damit die weiteren Tickets darauf aufsetzen können?

Umsetzung:
- **Modell** (`models/retro.ts` erweitern):
  - `RetroGroup { ownerId: string; name: string; created: any; modified: any; }` + `RetroGroupId extends RetroGroup { id: string }`.
  - `RetroBoard` um **optionales** `groupId?: string` ergänzen (genau eine Gruppe je Board; fehlt = Einzel-Board wie heute → additiv, nicht brechend).
- **Service-Methoden** (entschieden: **im bestehenden `RetroService`**), im bestehenden Stil (`inCtx`, modularer Firestore, `firstValueFrom`):
  - `createGroup(name): Promise<string>` → `retroGroup`-Doc mit `ownerId = reale uid` (`currentUserId$`), `created/modified`.
  - `listMyGroups$: Observable<RetroGroupId[]>` → `query(collection retroGroup, where ownerId == currentUserId)`, dedupe analog `listMyBoards$`.
  - `getGroup$(groupId)`, `renameGroup(groupId, name)`.
  - `listBoardsByGroup$(groupId): Observable<RetroBoardId[]>` → `query(collection retro, where groupId == groupId)`.
  - `assignBoardToGroup(boardId, groupId | null)` → setzt bzw. entfernt `groupId` (Firestore lehnt explizites `undefined` ab → beim Herauslösen `deleteField()` bzw. konsistent `null` behandeln).
  - `deleteGroup(groupId)` → **entschieden:** Boards bleiben, es wird nur `groupId` entfernt (Boards werden zu Einzel-Boards), keine Boards/Karten gelöscht.
- **Firestore-Rules** (`firestore.rules`): Block `match /retroGroup/{document=**} { allow read, write; }` ergänzen — analog zum offenen `retro/**` (sonst greift default-deny). Sichere Modellierung bleibt out of scope.
- **Routing** (`app.routes.ts`, retrospective-Kindrouten): neue Route `group/:groupId` → neue (Stub-)`GroupComponent` unter `modules/retrospective/group/`, **ohne** AuthGuard (anonym nutzbar). Reihenfolge beachten (zweisegmentig, kollidiert nicht mit einsegmentigem `:boardId`, dennoch defensiv vor `:boardId` platzieren).
- **Ziel:** `ng build` grün; Gruppen-Seite noch Stub (echte UI in Ticket 02).

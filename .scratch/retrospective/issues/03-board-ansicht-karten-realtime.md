# 03 — Board-Ansicht: Spalten, Karten-CRUD, Realtime-Sync

Type: task
Status: resolved
Blocked by: 01

## Question
Wie sieht das Board aus und wie werden Karten live bearbeitet?

Umsetzung (Board-Component unter `/retrospective/:boardId`):
- Spalten rendern (Namen + Farben), horizontal.
- Pro Spalte „Karte hinzufügen" → `addCard` (Freitext), `authorId` = anonyme uid.
- Live-Sync aller Karten via `getCards$` (Firestore `collectionData`).
- Karte bearbeiten (inline) — nur Autor **oder** Owner; sonst read-only.
- Karte löschen — nur Autor **oder** Owner.
- Owner-Status ermitteln (reale uid == board.ownerId).

Fundament für Hide (04), Timer (05), DnD (06), Merge (07).

## Answer
Board-Component gebaut (`ng build` grün, 2026-08-06). Nur `board/`-Scope, auf `templateUrl`/`styleUrls` umgestellt.
- `vm$` = `combineLatest(getBoard$, getCards$, authStateAllowAnonymous$→myUid, currentUserId$()===ownerId→isOwner)` → `BoardView` (Spalten nach `order`, Karten je Spalte nach `columnId` gefiltert + `order` sortiert).
- Spalten horizontal, farbiger Header aus `column.color`. Karte hinzufügen (Textarea) → `addCard`; Inline-Edit → `updateCardText`; Löschen → `deleteCard`.
- Rechte client-seitig: `canEdit = card.authorId === myUid || isOwner` steuert Edit/Delete-Buttons; sonst read-only.
- Realtime über Firestore-Observables (async-Pipe). KEIN Hide/Timer/DnD/Merge (Tickets 04–07).

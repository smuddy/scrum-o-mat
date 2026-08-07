# 10 — Verifikation: Build + Serve + Durchklick

Type: task
Status: resolved
Blocked by: 02, 03, 04, 05, 06, 07, 08, 09

## Question
Ist die Retro-MVP wirklich featurecomplete und lokal grün?

Checkliste (eine komplette Retro durchspielen):
- `ng build` grün, `ng test` grün.
- Board anlegen (eingeloggt), Spalten benennen + färben, Share-Link teilen.
- Als zweiter (anonymer) Teilnehmer über Link öffnen; Karten in mehreren Spalten anlegen; Live-Sync sichtbar.
- Hidden an/aus: Fremdtexte geblurrt+gescrambled; Owner-Reveal zeigt Klartext nur lokal.
- Timer setzen → Countdown bei allen.
- Eigene Karte per DnD zwischen Spalten; Owner verschiebt fremde + sortiert; Owner merged zwei Karten (Text + Leerzeile).
- Bearbeiten nur durch Autor/Owner.

## Answer

**Ja — featurecomplete und lokal grün** (2026-08-07). Abgeschlossen auf Basis der AFK-Verifikation; der Live-Durchklick gegen echtes Firebase ist Nutzer-Selbsttest (Entscheidung des Nutzers), künftige Bugs/Änderungen laufen über **neue Tickets**, nicht über dieses.

**Hart verifiziert (AFK):**
- `ng build` (production) — Exit 0, keine Budget-Fehler/Warnungen; Initial 1.08 MB / 286 kB Transfer, `board-component` Lazy-Chunk 109 kB / 26 kB.
- `ng test` (Vitest, `--no-watch`) — **448/448 Tests grün, 46 Dateien**, Exit 0. (Nur nicht-fatale Warnungen: `vi.mock`-Hoisting, jsdom `scrollTo`.)
- Statischer Code-Trace: jeder Checklistenpunkt im Quellcode verdrahtet —
  - Board anlegen + Share-Link: `create.component.ts:78` (`origin + '/retrospective/' + boardId`), Clipboard `:88`; `RetroService.createBoard`.
  - Anonymer Teilnehmer über Link: Route `:boardId` **ohne** `AuthGuard` (`app.routes.ts:90-93`).
  - Realtime: `getBoard$`/`getCards$` via `docData`/`collectionData`.
  - Hidden + Scramble + lokaler Owner-Reveal: `board.component.ts` `isScrambled`/`revealTemporarily`/`toggleReveal` (kein Firestore-Write beim Aufdecken).
  - Timer: `setTimer` + `timer-control`-Component im Owner-Menü.
  - DnD Drei-Zonen + Owner-Merge: `board.component.ts:423-487` (`resolveDropTarget`, `dropZone`, `moveCard`-Reindex, `mergeCards`).
  - Edit-Rechte: Karten `board.component.ts:283` `(authorId === myUid || isOwner) && !isScrambled`; Action-Items `action-items.component.ts:59`.
  - Landing-Einstieg (Ticket 08): `init.component.html:10` „Retrospektive" → `/retrospective`, Icon `faChalkboardTeacher`.
  - Erweiterungen 11–19 vorhanden: Übersicht, Rename/Archiv, Spalten-Edit, Timer-erweitert, Voting, Reaktionen, Action-Items, Export (`board/export/retro-export.ts`).

**Live-Durchklick-Checkliste (Nutzer-Selbsttest, `ng serve` → localhost:4200):**
1. Eingeloggt Board anlegen; Spalten benennen + färben; Share-Link kopieren.
2. Link in Inkognito/zweitem Browser als anonymer Teilnehmer öffnen; in mehreren Spalten Karten anlegen → Live-Sync in beiden Fenstern sichtbar.
3. Owner: Hidden an → Fremdtexte bei Teilnehmer geblurrt + gescrambled; „Temporär aufdecken" zeigt Klartext nur lokal beim Owner.
4. Owner: Timer setzen → Countdown `mm:ss` tickt bei beiden; pausieren/fortsetzen/zurücksetzen prüfen.
5. Eigene Karte per DnD zwischen Spalten; Owner verschiebt fremde + sortiert innerhalb; Owner zieht Karte auf Kartenmitte → Merge (Zieltext + Leerzeile + Quelltext, Quelle weg).
6. Bearbeiten/Löschen nur als Autor oder Owner möglich; Voting (5/Nutzer), Emoji-Reaktionen, Action-Items, Export (Markdown/CSV) gegenprüfen.

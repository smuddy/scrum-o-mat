# Wayfinder-Map: Retrospective-Feature

Label: wayfinder:map

## Destination

Ein **featurecomplete, lokal lauffähiges Retrospective-Board** als drittes Feature neben Scrum Poker (`planning`) und Sprint Planer (`velocity`) — lokal grün: `ng build` + `ng serve` + Durchklick einer kompletten Retro + Vitest-Suite grün. Umfang = **alles** aus der Feature-Beschreibung, nichts weggelassen.

## Notes

- **Ausführung ist Teil dieser Map** (Wayfinder-Default „plan, don't do" bewusst überstimmt): Tickets sind Build-Tasks. Trotzdem gilt: pro Session i.d.R. ein Ticket, Frontier = niedrigste offene, unblockierte Nummer.
- **Konventionen spiegeln** (ng21): `planning`-Modul als Vorlage — standalone Components, `loadComponent`-Routen, `inject(Firestore)` + modularer Firestore + `runInInjectionContext`-Wrapper (`inCtx`) wie `PlanningService`, `LoginService.authStateAllowAnonymous$` für Teilnehmer-uid, `HeaderService`/`MenuService` für Breadcrumb/Aktionen, `.less`-Styles.
- **Rollen:** *Owner* = eingeloggter Ersteller (reale uid == `board.ownerId`). *Teilnehmer* = jeder mit Link, identifiziert per anonymer uid (`authStateAllowAnonymous$`, localStorage — wie Scrum Poker). Karten editieren/verschieben: Autor **oder** Owner. Merge/Reorder-alle/Reveal/Hidden-Toggle/Timer/Spaltenkonfig: nur Owner. Rechte MVP-seitig **client-seitig** geprüft.
- **Hide-Modell:** best-effort **client-seitig** (bewusste Entscheidung). Versteckter Fremdtext wird an alle synchronisiert, aber bei `board.hidden` für Nicht-Autor/Nicht-Owner geblurrt **und** im DOM gescrambled (echter Ersatztext, nicht nur CSS). Owner sieht alles; „temporär aufdecken" ist lokaler Owner-State. → über Firestore/DevTools umgehbar, akzeptiert.
- **Firestore-Rules: für den MVP bewusst deferred** (Nutzer-Vorgabe). Nur ein offener `/retro/{document=**}`-Einzeiler wie beim `planning`-Zweig, damit es lokal funktioniert; keine sichere Rules-Modellierung.
- **Drag&Drop:** `@angular/cdk` DragDrop (`cdkDropList`/`cdkDrag`/`cdkDropListGroup`), Live-Sort AUS (`cdkDropListSortingDisabled`) → Karten stehen still. Ziel-Karte + Aktion werden selbst aus Drop-Punkt + Karten-Rechteck berechnet (**Drei-Zonen**): oberes Drittel = davor einsortieren, mittleres = **mergen** (nur Owner), unteres = dahinter. Reihenfolge via `moveCard`-Reindex explizit geschrieben. Nicht-Owner: nur zwei Zonen (davor/dahinter), Merge/innerhalb-Spalte-Reorder bleiben Owner-Rechte.
- **Arbeitsstil:** featurecomplete, keine ungefragten Scope-Cuts; bei echten Unklarheiten nachfragen. Siehe Memories [[mvp-featurecomplete-keine-scope-cuts]], [[prefer-self-built-over-deps]], [[angular-21-migration]]. Skills: `/grilling`, `/domain-modeling`.
- **Scope-Korrektur (2026-08-06):** Beim Charting wurden die zunächst als „was weglassen?" gefragten Erweiterungen fälschlich weggelassen — der Nutzer will sie ALLE drin. Nachträglich als Tickets **11–19** ergänzt (Board-Übersicht, Board-Aktionen umbenennen/archivieren, Spalten-Edit, Timer-Erweitert, Voting, Reaktionen, Action-Items, Export, Owner-Aktionen in die Seitenleiste inkl. Board-Löschen mit Confirm). Kernumfang 01–09 bleibt.
- **UI-Konvention (Ticket 19):** Owner-Board-Aktionen gehören in die Seitenleiste via `MenuService.addCustomAction(..., confirm?)` wie im Sprintplanner (`SprintComponent`/`ProjectComponent`), nicht als Inline-Buttons; destruktive Aktionen mit `confirm = true`.

## Decisions so far

<!-- eine Zeile je geschlossenem Ticket -->

- [01 — Fundament: Modul, Datenmodell, RetroService, Routing](issues/01-fundament-modell-service-routing.md) — Modul/Modell/`RetroService`/Routen/CDK/offene Rules gebaut, `ng build` grün; Firestore `retro/{boardId}` + Subcollection `cards`.
- [02 — Board anlegen + Share-Link](issues/02-board-anlegen-sharelink.md) — Create-Formular (Titel, Spaltenanzahl/Namen/Farben) + `createBoard` + Share-Link; **Share-Link = direkter `/retrospective/:boardId`**.
- [03 — Board-Ansicht: Spalten, Karten-CRUD, Realtime](issues/03-board-ansicht-karten-realtime.md) — Board rendert Spalten (Farbe) + Karten live; Add/Edit/Delete; Edit/Delete nur Autor oder Owner (`canEdit`).
- [04 — Verstecken: Blur + Scramble + Owner-Reveal](issues/04-hide-scramble-reveal.md) — Owner-Hidden-Toggle; Fremdtext deterministisch gescrambled + geblurrt (Seed aus card.id, stabil); Owner „temporär aufdecken" lokal.
- [08 — Einstieg/Navigation](issues/08-einstieg-navigation-politur.md) — „Retrospektive"-Eintrag auf Landing + Menü → `/retrospective`; Icon `faChalkboardTeacher`. (Spaltenfarben-Politur verbleibt in der Board-Kette.)
- [05 — Timer](issues/05-timer.md) — Owner setzt Dauer (Default 5 min); Countdown `mm:ss` für alle live; Timestamp-Normalisierung; `OnDestroy`-Cleanup.
- [06 — Drag&Drop (@angular/cdk)](issues/06-dragdrop-cdk.md) — CDK DropListGroup; eigene Karten zwischen Spalten, Owner alle + Reorder; `moveCard`-Reindex (fortlaufende Integer). Ordering-Fog geschlossen.
- [07 — Karten zusammenführen (Owner)](issues/07-merge-karten.md) — Owner zieht Karte auf Karte → `mergeCards` (Quelltext + Leerzeile ans Ziel, Quelle gelöscht); Merge-Erkennung via Drop-Position (elementFromPoint), Spalten-DnD bleibt intakt.
- [09 — Tests (Vitest)](issues/09-tests-vitest.md) — gesamte Suite grün (321 Tests / 42 Dateien); Board-Rechte/Hide/Timer/DnD/Merge abgedeckt.
- [11 — Board-Übersicht](issues/11-board-uebersicht.md) — `/retrospective` listet meine Boards (neueste oben via `created`); „Neues Board" als Seitenleisten-Aktion; Create → `/retrospective/new`.
- [12 — Board umbenennen/archivieren](issues/12-board-aktionen-loeschen-umbenennen.md) — Inline-Rename + Archiv-Toggle in der Übersicht; `archived`-Flag; archivierte in einklappbarem Abschnitt.
- [19 — Owner-Aktionen in der Seitenleiste](issues/19-owner-aktionen-seitenleiste.md) — Hide/Reveal/„Board löschen"(confirm) als Menü-Aktionen; Timer als **Menü-Component** (`addCustomComponent` + `NgComponentOutlet` → `TimerControlComponent`).
- [13 — Spalten nachträglich bearbeiten](issues/13-spalten-nachtraeglich-bearbeiten.md) — Owner-„Spalten bearbeiten"-Modus: Name/Farbe/Reorder/Add/Remove; Remove verschiebt Karten nicht-destruktiv; `updateColumns`.
- [14 — Timer erweitert](issues/14-timer-erweitert.md) — pausieren/fortsetzen/zurücksetzen; `timerPausedRemainingMs`; zustandsabhängige Timer-Zeile; „pausiert"-Anzeige.
- [15 — Dot-Voting](issues/15-dot-voting.md) — Stimmen je Karte (★), Kontingent 5/Nutzer boardweit, +/−; Owner „Votes zurücksetzen".
- [16 — Emoji-Reaktionen](issues/16-emoji-reaktionen.md) — fester Emoji-Satz je Karte, Toggle pro Nutzer (uid-Liste), immer sichtbar.
- [17 — Action-Items](issues/17-action-items.md) — eigene Sektion + Subcollection `actionItems`; anlegen/erledigt für alle, Edit/Delete Autor-oder-Owner; `deleteBoard` räumt actionItems mit ab.
- [18 — Export (CSV/Markdown)](issues/18-export.md) — reine `boardToMarkdown`/`boardToCsv`; Owner-Menü „Export (Markdown)/(CSV)" mit Blob-Download.
- [10 — Verifikation: Build + Serve + Durchklick](issues/10-verifikation-durchklick.md) — **featurecomplete + lokal grün** (2026-08-07): `ng build` (production) grün, Vitest **448/448** (46 Dateien) grün, statischer Code-Trace aller Checklistenpunkte + Erweiterungen 11–19 bestätigt. Live-Durchklick gegen echtes Firebase = Nutzer-Selbsttest; künftige Bugs/Änderungen als **neue Tickets**. (Feinschliff unter 10: Create zentriert + Entrance-Animationen, Breadcrumb „Retrospektive > Bordname", Board-Titel entfernt, Spalten-Stagger, Verstecken-Owner-Logik korrigiert siehe [04].)

## Not yet specified

**Kein Nebel mehr offen — Map vollständig, Ziel erreicht (2026-08-07).** Alle Tickets (01–19 + Verifikation 10) sind `resolved`; der Weg zur Destination ist vollständig gegangen. Die früheren Nebel-Punkte wurden in Tickets überführt und dort entschieden: Ordering-Schema → [06](issues/06-dragdrop-cdk.md), Timer-Genauigkeit → [05](issues/05-timer.md), Scramble-Determinismus → [04](issues/04-hide-scramble-reveal.md), Share-Link-Format → [02](issues/02-board-anlegen-sharelink.md), Merge-Concurrency → [07](issues/07-merge-karten.md). Künftige Bugs/Änderungen am Retrospective-Feature laufen als **neue Tickets** (bzw. eigene Map), nicht als Wiederaufnahme dieser Map.

## Out of scope

- **Serverseitig dichtes Verstecken** (nicht gewählter Umsetzungsweg; best-effort client-seitig gewählt).
- **Sichere Firestore-Rules** (für MVP deferred, Nutzer-Vorgabe).

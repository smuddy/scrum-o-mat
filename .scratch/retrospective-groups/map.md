# Wayfinder-Map: Board-Gruppen & Gruppen-Link (Teams)

Label: wayfinder:map

## Destination

Ein **featurecomplete, lokal lauffähiges** Erweiterungs-Feature des Retrospective-Moduls: Ein eingeloggter Owner organisiert seine Boards in **optionalen Gruppen** (= Team, Gruppenname = Teamname) und teilt die **ganze Gruppe per Link**. Der Gruppen-Link führt auf eine **Gruppen-Seite mit hervorgehobenem aktuellem Sprint-Board**; Teammitglieder öffnen darüber jedes Board der Gruppe (so als hätten sie den jeweiligen Board-Link) und beteiligen sich inhaltlich (Karten), **ohne** Boards oder Gruppen verwalten zu können. Pro Sprint legt **nur der Owner** ein neues Board an, dessen Einstellungen vom letzten Board der Gruppe übernommen werden. Fertig = lokal grün: `ng build` + `ng serve` + Durchklick (Owner **und** Gruppen-Link-Mitglied) + Vitest-Suite grün. Umfang = alles aus der Feature-Beschreibung, nichts weggelassen.

## Notes

- **Aufsatz auf bestehendes Feature:** Diese Karte erweitert das fertige Modul `src/app/modules/retrospective/` und ergänzt die Karte `.scratch/retrospective/map.md`. Boards liegen unter Firestore `retro/{boardId}`; Owner-Übersicht `/retrospective` (AuthGuard, `ownerId == reale uid`); Board-Share-Link = direkter `/retrospective/:boardId` (offen, anonym via `authStateAllowAnonymous$`).
- **Ausführung ist Teil dieser Map** (Wayfinder-Default „plan, don't do" bewusst überstimmt, wie bei der Retro-Karte): Tickets sind Build-Tasks. Pro Session i.d.R. **ein** Ticket; Frontier = niedrigste offene, unblockierte Nummer.
- **Konventionen spiegeln** (ng21): standalone Components, `loadComponent`-Routen, `inject(Firestore)` + modularer Firestore + `runInInjectionContext`-Wrapper (`inCtx`) wie `RetroService`; `LoginService.currentUserId$` (reale uid → Owner) vs. `authStateAllowAnonymous$` (Teilnehmer); `HeaderService`/`MenuService` für Breadcrumb/Seitenleisten-Aktionen; `.less`-Styles; Animationen (`fadeTranslateInstant`, `cardTransition`).

### Entschieden (Charting 2026-08-07)

- **Datenmodell:** Neue Collection `retroGroup/{groupId}` (`ownerId` = reale uid, `name`, `created`, `modified`). `RetroBoard` erhält **optionales** `groupId?: string`. Ein Board gehört zu **genau einer** Gruppe (singuläres `groupId`, keine Mehrfachzuordnung). Fehlt `groupId` = Einzel-Board wie heute → additiv, nicht brechend.
- **Service:** Gruppen-Methoden **im bestehenden `RetroService`** (kein separater Service) — Boards & Gruppen koppeln eng, Stil bleibt konsistent.
- **Übernahme aus letztem Board:** aus dem **neuesten** Board der Gruppe zur Anlegezeit abgeleitet (nicht auf der Gruppe gespeichert): Spalten (Namen/Farben/Reihenfolge) verbatim + weitere Anlege-Einstellungen. **Titel:** Zahl am Titelende +1 („Sprint 5" → „Sprint 6"); ohne erkennbare Zahl wird „ 2" angehängt; bleibt editierbar.
- **Zugriffsmodell (feste Grenze):** *Owner* = eingeloggt, reale uid == `group.ownerId` → volle Verwaltung. *Gruppen-Link-Mitglied* = jeder mit Link (anonyme uid) → **nur inhaltliche Beteiligung** im Board (Karten hinzufügen usw., unabhängig vom Archiv-Flag des Boards), **kein** Anlegen/Bearbeiten/Löschen von Boards oder Gruppen und **kein** Teilen-/Kopieren-Button. Verwaltungs-Routen bleiben AuthGuard-geschützt; Owner- vs. Mitglied-Sicht **client-seitig** unterschieden (wie im Retro-Feature).
- **Gruppen-Link:** direkter `/retrospective/group/:groupId` (kein AuthGuard, anonym). **Kopieren/Teilen nur für den Owner** sichtbar.
- **Gruppen-Seite:** listet die Boards der Gruppe; **aktuelles** Board = neuestes nicht-archiviertes, hervorgehoben. Archivierte Boards in **eigenem einklappbarem Abschnitt** (wie `board-list`). Sind alle Boards archiviert bzw. Gruppe leer: kein Highlight — Owner sieht „Neues Board", Mitglied einen Hinweistext.
- **Owner-Einstieg:** Gruppen erscheinen als Abschnitte in `/retrospective` (kein separater Menü-/Landing-Eintrag). Mitglieder gelangen ausschließlich über den Gruppen-Link hinein.
- **Neues Board anlegen:** nur Owner; nach dem Anlegen navigiert der Owner **direkt ins neue Board**.
- **Gruppe löschen:** Boards bleiben erhalten und werden zu **Einzel-Boards** (`groupId` wird entfernt) — nicht mitgelöscht.
- **Gruppenname:** frei, keine Eindeutigkeitsprüfung.
- **Firestore-Rules:** `retroGroup/**` wird **offen** ergänzt (default-deny würde sonst greifen), konsistent zum offenen `retro/**`. Sichere Modellierung bleibt out of scope.
- **Arbeitsstil:** featurecomplete, keine ungefragten Scope-Cuts; bei echten Unklarheiten nachfragen. Memories [[mvp-featurecomplete-keine-scope-cuts]], [[prefer-self-built-over-deps]], [[angular-21-migration]]. Skills: `/grilling`, `/domain-modeling`.

## Decisions so far

<!-- eine Zeile je geschlossenem Ticket: Gist + Link -->

- [01 — Fundament](issues/01-fundament-modell-groupservice-routing.md) — `RetroGroup`/`RetroGroupId` + optionales `RetroBoard.groupId`; Gruppen-Methoden in `RetroService` (`createGroup`/`listMyGroups$`/`getGroup$`/`renameGroup`/`listBoardsByGroup$`/`assignBoardToGroup`/`deleteGroup`, `createBoard(…, groupId?)`); offene `retroGroup/**`-Rules; Routen `group/:groupId` (offen) + `group/:groupId/new` (AuthGuard). `listMyGroups$` gegen fehlende uid geguardet (anonyme Mitglieder).
- [02 — Gruppen-Seite](issues/02-gruppen-seite-liste-aktuelles-sharelink.md) — `GroupComponent` unter `/retrospective/group/:groupId` (kein AuthGuard): Board-Liste, aktuelles Board (neuestes nicht-archiviertes) hervorgehoben, Archiv-Abschnitt; Owner-Menü (Neues Board / **Link kopieren nur Owner** / Umbenennen) + Inline-Rename; Mitglieder sehen nur Liste + Öffnen.
- [03 — Owner-Übersicht](issues/03-owner-uebersicht-gruppen-anlegen.md) — `board-list` zeigt Gruppen-Karten (→ Gruppen-Seite, umbenennen, löschen mit Confirm) + „Neue Gruppe"; ungruppierte Boards im Abschnitt „Ohne Gruppe"; `deleteGroup` löst Boards heraus statt sie zu löschen.
- [04 — Neues Board (Übernahme)](issues/04-neues-board-einstellungen-uebernehmen.md) — Gruppen-Modus der `CreateComponent`: Spalten des neuesten Boards verbatim + Titel via `nextTitle()` hochgezählt („Sprint 5"→„Sprint 6", sonst „ 2"); speichert mit `groupId` und navigiert direkt ins neue Board.
- [05 — Boards verschieben](issues/05-bestehende-boards-verschieben.md) — Verschiebe-Auswahl (`assignBoardToGroup`): in der Übersicht ungruppierte Boards → Gruppe; auf der Gruppen-Seite (Owner) Board → andere Gruppe / „Aus Gruppe entfernen".
- [06 — Tests (Vitest)](issues/06-tests-vitest.md) — Specs für `group`/`create` neu, `board-list`-Spec erweitert (Gruppen-Filter, groupViews, anlegen/umbenennen/löschen, verschieben, Titel-Hochzählung, Owner-vs-Mitglied). Gesamtsuite **478/478 grün**.
- [07 — Verifikation](issues/07-verifikation-durchklick-rollen.md) — `ng build` grün + Vitest 478/478 grün; Rollen-Grenze code-/testseitig verankert (Mitglied = nur Karten). Live-Durchklick als Checkliste an den Nutzer übergeben (anonymer Member-Flow braucht echtes Firebase-Backend).

## Not yet specified

<!-- Gesamtbild am 2026-08-07 durchgeklärt; aktuell kein grober Fog offen. Reine Umsetzungs-Feinheiten
     (Breadcrumb-Texte, Empty-State-Wording, Animations-Feinschliff) werden in den jeweiligen Tickets
     entschieden und sind kein offener Fog. -->

## Out of scope

- **Sichere Firestore-Rules** (bewusst deferred, konsistent mit dem Retrospective-Feature; `retro/**` und `retroGroup/**` bleiben für den MVP offen).
- **Account-/mitgliederbasierte Teamverwaltung** (Rollen, Einladungen, Mitglieder pro Person). Zugriff bleibt rein link-basiert wie der Board-Link.
- **Mehrfachzuordnung** eines Boards zu mehreren Gruppen (bewusst verworfen zugunsten des einfachen singulären `groupId`).

# Wayfinder-Map: Vertreterfunktion für Retrospective-Gruppen

Label: wayfinder:map

## Destination

Ein **featurecomplete, lokal lauffähiges** Erweiterungs-Feature des Groups-Features: Ein Owner kann zu einer seiner Gruppen einen oder mehrere **Vertreter** einladen. Ein Vertreter ist ein **eingeloggter, benannter** Nutzer (echte uid), der auf allen Boards der Gruppe **alles** darf, was der Owner darf — Board-Inhalte (Karten, Voting, Reaktionen, Action-Items) **und** Board-Verwaltung (Timer, Spalten, umbenennen, verstecken, archivieren, Voting zurücksetzen) — und **neue Boards anlegen** sowie **eigene Boards in die Gruppe ziehen**. Der Vertreter darf **nicht** „die Gruppe bearbeiten": Gruppe umbenennen/löschen, andere Vertreter verwalten, Boards aus der Gruppe herauslösen und Boards endgültig löschen bleiben allein dem Owner vorbehalten. Fertig = lokal grün: `ng build` + `ng serve` + Durchklick (Owner **und** Vertreter **und** anonymes Link-Mitglied) + Vitest-Suite grün. Umfang = alles aus der Feature-Beschreibung, nichts weggelassen.

## Notes

- **Aufsatz auf zwei fertige Features:** Diese Karte erweitert das Retrospective-Modul `src/app/modules/retrospective/` und setzt direkt auf `.scratch/retrospective-groups/map.md` (Gruppen = `retroGroup/{groupId}`, Boards mit optionalem `groupId`) auf. Vorher lesen: die Groups-Map und `retro.service.ts`.
- **Ausführung ist Teil dieser Map** (Wayfinder-Default „plan, don't do" bewusst überstimmt, wie bei den beiden bisherigen Retro-Karten): Tickets sind Build-Tasks. Pro Session i.d.R. **ein** Ticket; Frontier = niedrigste offene, unblockierte, unclaimte Nummer.
- **Konventionen spiegeln** (ng21): standalone Components, `loadComponent`-Routen, `inject(Firestore)` + modularer Firestore + `runInInjectionContext`-Wrapper (`inCtx`) wie `RetroService`; `LoginService.currentUserId$` (reale uid → Owner/Vertreter) vs. `authStateAllowAnonymous$` (Link-Mitglied); `HeaderService`/`MenuService`; `.less`-Styles; Animationen (`fadeTranslateInstant`, `cardTransition`).
- **Vorlage für das Datenmodell:** `project.coReaders`/`coWriters` sind `uid`-Arrays — `deputies` wird genauso modelliert (arrayUnion/arrayRemove). Der **Beitritt** läuft über einen einmaligen Freigabe-Code + Einlöse-Seite, **nicht** über das Einfügen einer Benutzer-ID. Für die **Verwaltungsliste** (Vertreter + offene Codes anzeigen, entfernen/widerrufen) taugt die Liste-mit-Papierkorb-Optik aus `edit-project.component.html` als Vorlage. Für den „Code/Link kopieren"-Button dient der bestehende Gruppen-Share-Link (Owner-only) in `group.component` als Muster.
- **Routen:** Die Gruppen-Seite `group/:groupId` ist schon anonym erreichbar; neu kommt eine **generische Einlöse-Route** `retrospective/join/:code` dazu (ohne AuthGuard, Login-Gating client-seitig auf der Einlöse-Seite). Die URL verrät weder Gruppe noch Owner — das `invites/{code}`-Doc liefert die zugehörige `groupId`.

### Ubiquitous Language (Rollen)

- **Owner** — eingeloggt, reale uid == `group.ownerId`. Volle Verwaltung (alles).
- **Vertreter** (engl. Code: `deputy`) — eingeloggt, reale uid ∈ `group.deputies`. Board-Vollzugriff + Board-Anlegen-in-Gruppe + eigene Boards einordnen; **keine** Gruppen-Verwaltung.
- **Link-Mitglied** — beliebig/anonym (localStorage-uid) mit Gruppen- oder Board-Link. Nur inhaltliche Beteiligung (Karten/Reaktionen/Voting/Action-Items), wie im Groups-Feature.
- **„Board-Manager der Gruppe"** = Owner **ODER** Vertreter. Das zentrale Rechte-Predikat für alle Board-Verwaltungsaktionen eines Boards, das zu einer Gruppe gehört.

### Entschieden (Charting 2026-09-15, Grilling mit dem Nutzer)

- **Einladung/Identität (geändert 2026-09-15, 2. Iteration — einmaliger Freigabe-Code):** Beitritt über einen **einmaligen Freigabe-Code**, den der **Owner** erzeugt. *Grund für die Abkehr vom reinen Link:* Jeder Board-Teilnehmer kann `board.groupId` lesen (offene Rules) und daraus einen Gruppen-Link herleiten → ein reiner `group/:groupId/join`-Link wäre trivial ableitbar, also keine Absicherung. Stattdessen:
  - Owner erzeugt in der Gruppe einen **zufälligen Code** (teilbar als Code **oder** als Link `/retrospective/join/:code`).
  - Ein **eingeloggter** Nutzer löst ihn **genau einmal** und nur **innerhalb von 3 Tagen** ein → wird zu `group.deputies` hinzugefügt; der Code wird dabei **verbraucht** (Firestore-**Transaktion** → atomar/einmalig, kein Doppel-Einlösen). Anonyme sehen einen Login-/Registrier-Hinweis (mit Rücksprung).
  - **Gültigkeit: 3 Tage** ab Erzeugung (`expiresAt` im `invites`-Doc). Bei Einlösung wird der Ablauf geprüft; abgelaufene Codes werden abgewiesen (und dürfen dabei aufgeräumt werden). Vergessene Codes verfallen so von selbst.
  - Codes liegen in einer eigenen Collection **`invites`**, die **nur per bekanntem Code lesbar** und **nicht auflistbar** ist → nicht aus der `groupId` herleitbar, nicht enumerierbar. Owner kann einen **gerade erzeugten Code widerrufen** (Doc löschen).
  - Vertreter muss eingeloggt sein (dauerhafte reale uid; anonyme localStorage-uid ungeeignet). Kein E-Mail-Lookup/Verzeichnis, keine eingefügte Benutzer-ID.
- **Datenmodell:** `RetroGroup` erhält **optionales** `deputies?: string[]` (Array realer uids). Fehlt = keine Vertreter → additiv, nicht brechend. Kein neues Doc/Collection.
- **Rechte-Grenze (Owner-only, = „die Gruppe bearbeiten"):** Gruppe umbenennen, Gruppe löschen, **Vertreter verwalten** (hinzufügen/entfernen), **Board aus der Gruppe herauslösen** (`assignBoardToGroup(..., null)`), **Board endgültig löschen** (`deleteBoard`). Alles Übrige darf der Vertreter.
- **Vertreter darf:** Neues Board anlegen und **direkt in die Gruppe** legen; **eigene ungruppierte Boards** in die Gruppe ziehen (nicht fremde Boards herausziehen); auf jedem Gruppen-Board **alle** Inhalts- und Verwaltungsaktionen außer den vier Owner-only-Punkten oben.
- **Board-Zugriffsmodell:** Für Boards **mit** `groupId` wird das Verwaltungsrecht aus der **Gruppen-Zugehörigkeit** abgeleitet (Board-Manager = Owner ODER Vertreter der Gruppe des Boards), **nicht** mehr allein aus `board.ownerId`. Boards **ohne** Gruppe bleiben unverändert owner-only via `board.ownerId`. Vom Vertreter angelegte Boards behalten dessen uid als `ownerId`; der Zugriff für beide läuft über die Gruppe.
- **Vertreter-Einstieg:** Gruppen, in denen der Nutzer Vertreter ist, erscheinen in **seiner** Übersicht `/retrospective` in einem eigenen Abschnitt (analog zu „Projekte als Mitarbeiter"). Von dort auf die Gruppen-Seite mit Vertreter-Rechten (inkl. „Neues Board").
- **Sicherheit (präzisiert):** Weiterhin **client-seitig**; `retro/**` und `retroGroup/**` bleiben **offen** (das schon offene `retroGroup` nimmt `deputies` ohne Rules-Änderung auf). **Einzige Rules-Ergänzung:** ein `invites`-Block, der `get`+`write` erlaubt, aber **kein `list`** (Enumeration verhindern). Wichtig: `allow read` schließt `list` mit ein — daher explizit `allow get, write` verwenden, **nicht** `read` (das bestehende `user/**` mit `allow read; allow list: if false` ist wegen der OR-Semantik von Rules faktisch wirkungslos und darf **nicht** als Muster kopiert werden). Erreichte Grenze: Der Beitritt ist **über die normale UI nicht mehr eskalierbar** (Code zufällig, nicht herleitbar, nicht auflistbar, einmalig). **Nicht** abgedeckt bleibt der direkte SDK-/API-Zugriff (man könnte per SDK weiterhin direkt in `deputies` schreiben) — das ist die pre-existierende Baseline des offenen Retro-Modells (betrifft die ganze App); echte serverseitige Durchsetzung bleibt bewusst out of scope.
- **Vertreter entfernen:** Owner entfernt eine uid aus `deputies` → der Ex-Vertreter verliert sofort die Rechte; von ihm angelegte Boards bleiben in der Gruppe (Owner verwaltet sie weiter über die Gruppe). Keine verwaisten Boards.
- **Arbeitsstil:** featurecomplete, keine ungefragten Scope-Cuts; bei echten Unklarheiten nachfragen. Memories [[mvp-featurecomplete-keine-scope-cuts]], [[retrospective-groups-wayfinder]], [[prefer-self-built-over-deps]], [[angular-21-migration]]. Skills: `/grilling`, `/domain-modeling`, ggf. `/mache`.

## Decisions so far

<!-- eine Zeile je geschlossenem Ticket: Gist + Link -->
- **01 done** — `deputies?`-Feld + `RetroInvite`, Service-Methoden (`addDeputy`/`removeDeputy`/`listGroupsWhereDeputy$`/`createInvite`/`redeemInvite`(Transaktion)/`revokeInvite`/`getInvite`), reine Predikate in `retro-permissions.ts`, `invites`-Rules-Block (`get,write`, kein `list`). → [01](issues/01-fundament-deputies-modell-service.md)
- **02 done** — Route `retrospective/join/:code` (ohne AuthGuard) + `GroupJoinComponent` (Vorschau/State-Machine, `redeemInvite`, anonym → Login mit returnUrl-Rücksprung via `localStorage['retroReturnUrl']` in `LoginService`). → [02](issues/02-freigabecode-einloesen.md)
- **03 done** — Owner-only Abschnitt „Vertreter" in `group.component`: Code erzeugen/kopieren/widerrufen (gerade erzeugter Code, „gültig bis"), Vertreter-Liste mit Papierkorb (`removeDeputy`). → [03](issues/03-owner-code-erzeugen-verwalten.md)
- **04 done** — `canManageBoards` als Board-Manager-Gate: `board.component` (`isManager$`/`canDelete$`, „Board löschen" bleibt Owner-only), `group.component` (Menü „Neues Board" für Manager, Rest Owner-only), `board-list` (`sortedGroups$` = eigene ∪ Vertreter-Gruppen). `create.component` brauchte keine Änderung. → [04](issues/04-vertreter-rechte-auf-boards.md)
- **05 done** — `board-list`: eigener Abschnitt „Gruppen, in denen ich Vertreter bin" (`deputyGroupViews$`, gegen eigene Gruppen dedupliziert, ohne Owner-Aktionen/Board-Anzahl; anonym leer). → [05](issues/05-vertreter-sicht-uebersicht.md)
- **06 done** — Vitest-Specs für Predikate, Service (deputies/invites/redeem), Join-Flow, Owner-Verwaltung, Board-/Gruppen-Rechte, Übersicht; Gesamtsuite grün. → [06](issues/06-tests-vitest.md)
- **07 done (2026-09-15)** — `ng build` grün; Vitest **522/522** (50 Dateien) grün. Live-Durchklick-Checkliste (Mehrbenutzer/anonym, echtes Firebase) an den Nutzer übergeben. → [07](issues/07-verifikation-durchklick-rollen.md)

## Not yet specified

<!-- Gesamtbild am 2026-09-15 durchgeklärt; aktuell kein grober Fog offen. Feinheiten (Wording der
     Abschnitts-Überschriften in der Übersicht, Code-Länge/-Format, ob Code als Klartext oder gehasht
     im invites-Doc liegt, ob die Vertreter-Liste auch auf der Owner-
     Übersichtskarte statt nur auf der Gruppen-Seite erscheint) werden in den jeweiligen Tickets
     entschieden und sind kein offener Fog. -->

## Out of scope

- **Serverseitige Zugriffsdurchsetzung** für `deputies`/Boards/Karten (bewusst deferred; direkter SDK-Zugriff bleibt möglich, wie im ganzen offenen Retro-Modell). **Ausnahme:** ein kleiner `invites`-Block (`get`+`write`, **kein `list`**) gegen Enumeration der Freigabe-Codes — siehe Sicherheits-Entscheid.
- **E-Mail-/Verzeichnis-basierte Einladung** und **Beitritt per eingefügter Benutzer-ID** (verworfen zugunsten des einmaligen Freigabe-Codes; ein E-Mail→uid-Verzeichnis existiert nicht).
- **Reiner Gruppen-Link-Beitritt** (aus der `groupId` herleitbar) — verworfen zugunsten des einmaligen, nicht enumerierbaren Freigabe-Codes.
- **In-App-Anzeige der eigenen Benutzer-ID** (durch den Freigabe-Code nicht nötig — der Vertreter braucht seine ID nie zu kennen; das ursprüngliche ID-Anzeige-Ticket entfällt).
- **Feingranulare Rollen** über die drei Stufen Owner/Vertreter/Link-Mitglied hinaus (z. B. „Vertreter nur lesend", per-Board-Rechte).
- **Vertreter für Einzel-Boards ohne Gruppe** — Vertretung hängt an der Gruppe, nicht am einzelnen Board.

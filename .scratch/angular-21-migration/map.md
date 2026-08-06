# Wayfinder-Map: Migration auf Angular 21

## Destination

Die App **scrum-o-mat läuft lokal grün auf Angular 21**: `ng build --configuration production` läuft fehlerfrei durch, `ng serve` startet, die App ist im Browser manuell durchklickbar (Login · Planning · Velocity · QR), und alle Unit-Tests sind grün. `firebase.json`/Deploy-Script sind an den neuen Output-Pfad (`dist/scrum-o-mat/browser`) angepasst (reine Config). **Kein** echtes `firebase deploy` — das löst der Nutzer selbst aus.

## Notes

- **Ausführung ist Teil dieser Map** (bewusster Override des Wayfinder-Plan-only-Defaults): Tickets enthalten Port-/Build-Arbeit, nicht nur Entscheidungen.
- **Ausgangslage:** Angular 13.3.3, NgModule-basiert, TypeScript 4.6, `@angular/fire` 7 (compat-API), Karma/Jasmine, LESS, Firebase Hosting (SPA). ~106 TS-Dateien.
- **Strategie:** Frisches `ng new` (ng21) + `src/` portieren. **Kein** inkrementelles `ng update`.
- **Modernisieren beim Portieren:** Standalone-Components, `inject()`, neue Control-Flow-Syntax (`@if`/`@for`/`@let`), Signals (`toSignal()` für Firestore-Streams), modulare AngularFire-API. `zone.js` **bleibt** (Zoneless ist ein späterer Schritt).
- **Präferenz des Nutzers:** Wo einfach selbst baubar → Eigenbau statt externer Abhängigkeit (z. B. Circle-Progress als eigene SVG-Component, Scrollbar via nativem CSS, Sortierung via `computed()`). QR-Erzeugung/-Scan bleiben extern (Codec nicht selbst baubar).
- **Git:** Commits/Pushes/Deploys macht ausschließlich der Nutzer. Agenten arbeiten nur im Working Tree.
- **Konsultieren pro Session:** `angular-developer`-Skill. (Der Rider-MCP ist der globale Standard, greift hier aber mangels .NET-Solution nicht.)
- **Ablauf:** Je Session **ein** Ticket (Research-Tickets ausgenommen). Frontier = offene, unblockierte, nicht beanspruchte Tickets; niedrigste Nummer zuerst. Ticket vor Arbeit beanspruchen (`Status: claimed`).
- **Test-Sicherheitsnetz:** Der Nutzer hat gegen den ng13-Stand eine vollständige Jasmine-Suite (258 Tests grün) aufgebaut. Port-Strategie = **Parität zuerst** (Ticket 10 hält die Suite grün), **dann** bewusste Fixes bekannter Alt-Bugs (Ticket 13). Bekannte Alt-Bugs siehe Ticket 13 bzw. Gedächtnis `pre-migration-known-bugs`.

## Decisions so far

<!-- Index: eine Zeile pro geschlossenem Ticket — Gist + Link -->

- [R1 · Zielversionen & Kompatibilität](issues/01-zielversionen-kompatibilitaet.md) — ng21 = **21.2.19** (LTS), TS ~5.9, zone.js ~0.16, rxjs ~7.8; Karma via `@angular/build:unit-test` (`runner: karma`); Node 24.13 ok. FontAwesome **4.0.0**, `@zxing/ngx-scanner` 21 (`library` ~0.21 / `browser` ~0.1.4), `angularx-qrcode` 21 (Input `[qrdata]`!), `immer` 11, `uuid` → `crypto.randomUUID()`. ⚠ `@angular/fire` hat **keinen** stabilen ng21-Release (nur `21.0.0-rc.0`) → Entscheidungs-Ticket 12.
- [D1 · AngularFire-Strategie](issues/12-angularfire-21-strategie.md) — **`@angular/fire@21.0.0-rc.0` + `firebase@^12.4.0`** (RC nutzen, exakt pinnen; bei Problemen in 03/04 neu bewerten).

## Not yet specified

- **Feinschnitt der Component-Port-Tickets (05–08):** Falls ein Feature-Bereich zu groß für eine Session ist, in Sub-Tickets aufteilen — entscheidet sich, sobald Scaffold (02) und Data-Services (04) die Realität zeigen.
- **Visuelle Parameter der eigenen SVG-Circle-Progress-Component** (Ersatz `ng-circle-progress`): werden beim Port des planning-Features (07) aus der bestehenden `NgCircleProgressModule.forRoot(...)`-Konfiguration übernommen.

## Out of scope

- **Vitest-Migration** der Unit-Tests — eigener späterer Schritt, erst wenn das migrierte Projekt test-complete ist.
- **Zoneless Change Detection** — späterer Schritt nach stabiler ng21-App.
- **Tatsächliches `firebase deploy`** — löst der Nutzer selbst aus.
- **SSR/SSG** — App bleibt reine Client-SPA.
- **Signals-/Standalone-Umbau als Selbstzweck über die Migration hinaus** — nur so weit, wie es der Port berührt.

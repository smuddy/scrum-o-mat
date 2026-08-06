# T1 · Frisches ng21-Workspace scaffolden & Config ins Repo überführen

Type: task
Status: open
Blocked by: 01, 12

## Question

Wie sieht das lauffähige ng21-Grundgerüst im Repo aus (ohne SSR, mit LESS und Karma/Jasmine)?

Umzusetzen:
- Frisches Angular-21-Workspace in einem **Temp-Ordner** erzeugen (`ng new scrum-o-mat --style=less --ssr=false`, Routing aktiviert), Versionen aus R1.
- Generierte Konfiguration ins Repo überführen/mergen:
  - `package.json` — Dependencies laut R1: Angular 21.2.19, TS ~5.9, zone.js ~0.16, rxjs ~7.8, FontAwesome **4.0.0**, `@zxing/ngx-scanner` 21 (+ `@zxing/library` ~0.21, `@zxing/browser` ~0.1.4), `angularx-qrcode` 21, `immer` 11, **`uuid` entfällt → `crypto.randomUUID()`**. `@angular/fire`/`firebase`-Version gemäß Entscheidung aus Ticket 12. `deploy`-Script.
  - `angular.json` — Application-Builder, LESS, `assets`, `styles: src/styles.less`, Budgets, `fileReplacements` für `environment.prod.ts`.
  - `tsconfig*.json`.
- **Karma/Jasmine** als `test`-Target verdrahten (Setup laut R1).
- Environments übernehmen (`environment.ts`/`environment.prod.ts`/`firebase.ts`), `fileReplacements` beibehalten.
- `firebase.json` + `deploy`-Script auf neuen Output-Pfad `dist/scrum-o-mat/browser` anpassen (reine Config, **kein** Deploy).
- **Protractor + `e2e/` entfernen.**
- Sanity: `ng build` des Gerüsts läuft (bevor `src/app` portiert ist, ggf. mit temporär reduziertem Bootstrap).

**Scaffolding-Ansatz:** Temp-Ordner → Config ins Repo. `src/app` bleibt zunächst der bestehende Code und wird in Folge-Tickets portiert. Kein Überschreiben des Repos.

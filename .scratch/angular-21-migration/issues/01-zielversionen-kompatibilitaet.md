# R1 · Zielversionen & Kompatibilität fixieren

Type: research
Status: resolved
Blocked by: —

## Question

Welche exakten Paketversionen bilden das ng21-Zielset, und wie wird Karma/Jasmine in einem `@angular/build`-Workspace betrieben?

(Details siehe ursprüngliche Fragestellung — Punkte 1–8.)

### Kontext-Pointer
- Ist-`package.json`: Angular 13.3.3, `@angular/fire` ^7.3.0, `firebase` ^9.6.11, `@fortawesome/angular-fontawesome` ^0.10.2, `@zxing/ngx-scanner` ^3.5.0, `@zxing/library` ^0.19.1, `ngx-qrcode2` ^9.0.0, `immer` ^9, `uuid` ^8, `rxjs` ~7.5.5, `zone.js` ~0.11.5.
- Node lokal: 24.13.0; npm 11.6.2.

## Answer

Recherchiert gegen npm-Registry (versions-spezifische Endpunkte, `peerDependencies`) und angular.dev. Stand 2026-08-06. (Angular 22 ist bereits `latest`; **21 ist LTS-Linie `21.2.19`**.)

### Versions-Manifest (Paket → Version)
- `@angular/core` / `@angular/cli` / `@angular/build` / `@angular/*` → **21.2.19**
- `typescript` → **~5.9.0** (offiziell `>=5.9 <6.0`)
- `zone.js` → **~0.16.0** (Peer `~0.15.0 || ~0.16.0`)
- `rxjs` → **~7.8.0**
- `@angular/fire` → **21.0.0-rc.0** ⚠ (nur Pre-Release, kein stabiler ng21-Release — siehe Ticket 12) — `firebase` → **^12.4.0** (aktuell 12.17.1, modulare API)
- `@fortawesome/angular-fontawesome` → **4.0.0** (Peer `^21`; `latest` 5.1.0 = ng22!) + `@fortawesome/fontawesome-svg-core` + `@fortawesome/free-solid-svg-icons` (FA-7.x). `FaIconComponent` ist standalone.
- `@zxing/ngx-scanner` → **21.0.0** (standalone `ZXingScannerComponent`); Begleit-Libs zwingend **`@zxing/library` ~0.21.0** und **`@zxing/browser` ~0.1.4** — **nicht** 0.23/0.2.1 (das ist die ng22-Linie, verletzt Peer-Range).
- `angularx-qrcode` → **21.0.0** (standalone, Selector **`qrcode`**). ⚠ Haupt-Input heißt **`[qrdata]`** (nicht `value`). Weitere: `[width]`, `[errorCorrectionLevel]` ('L'|'M'|'Q'|'H'), `[elementType]` ('canvas'|'svg'|'img'), `[margin]`, `[colorDark]`/`[colorLight]`.
- `immer` → **11.1.16** (nicht 10.x — `latest` ist 11.x)
- `uuid` → entfällt: natives **`crypto.randomUUID()`** verwenden (Browser + Node ≥19), keine Dependency. (Passt zur Präferenz „Eigenbau statt Dep".)

### Karma-Setup (ng21, `@angular/build`-Workspace)
Karma ist in ng21 weiter verfügbar (deprecated, aber supportet). Läuft über den vereinheitlichten Builder **`@angular/build:unit-test`** mit **`"runner": "karma"`**:
```json
"test": {
  "builder": "@angular/build:unit-test",
  "options": { "tsConfig": "tsconfig.spec.json", "runner": "karma" }
}
```
devDeps: `karma karma-chrome-launcher karma-coverage karma-jasmine karma-jasmine-html-reporter jasmine-core @types/jasmine`; `tsconfig.spec.json` → `"types": ["jasmine"]`; optional `ng generate config karma`. Alternativ `ng new <app> --test-runner=karma`. Doku: angular.dev/guide/testing/karma.

### Node
Unterstützt: `^20.19.0 || ^22.12.0 || ^24.0.0` → **Node 24.13 = OK**.

### Vitest (informativ)
`@angular/build:unit-test` ist in ng21 stabil, Vitest ist Default-Runner für **neue** Projekte; das **Migrations-Schematic** (Karma→Vitest) ist noch **experimentell**. → Für die Migration bei Karma/Jasmine bleiben ist der sichere Pfad (bestätigt Entscheidung aus der Map).

### Offene Risiken
1. **`@angular/fire`**: kein stabiler ng21-Release (stable `latest` 20.0.1 = Peer `^20`; ng21 nur `21.0.0-rc.0`). → **Entscheidung nötig, Ticket 12.**
2. **FontAwesome**: `latest` 5.1.0 hat ng21 bereits gedroppt → auf **4.0.0** festnageln (keine weiteren Updates in der ng21-Linie).
3. **@zxing**: Begleit-Libs exakt `~0.21`/`~0.1.4` pinnen (neueste Patches sprengen die Peer-Range).
4. Alle Versionen zum Scaffold-Zeitpunkt (Ticket 02) kurz gegenprüfen — können sich bewegt haben.

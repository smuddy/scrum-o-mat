# T4c · planning-Feature portieren (standalone + Signals + Lib-Ersatz)

Type: task
Status: open
Blocked by: 04

## Question

Wie wird das planning-Feature standalone + modern (inkl. Ersatz der punktuellen Libs)?

Bereiche: `developer` (card/cards/developer), `guest`, `scrum-master` (dashboard/developers/edit-issue/scrum-master), `admin` (admin/users + admin.service), `qrcode`, `init` (my-sessions), guards (`leave-planning.guard`, `session-redirect.guard`).

Umzusetzen:
- Standalone Components, `inject()`, Signals; Guards funktional (`CanActivateFn`/`CanDeactivateFn`).
- `|orderBy` (guest, developer, developers) → Sortierung via `computed()` (kein Pipe).
- `ng-circle-progress` (guest) → **eigene** SVG-Progress-Component; Parameter aus der bestehenden `NgCircleProgressModule.forRoot(...)`-Config übernehmen.
- `ngx-qrcode2` (`<ngx-qrcode>`, scrum-master) → `angularx-qrcode` (`<qrcode>`).
- `@zxing/ngx-scanner` (`<zxing-scanner>`, qrcode) → aktuelle standalone-Version (aus R1).
- FontAwesome via `FaIconComponent`.

Hinweis: Größter Feature-Bereich — falls für eine Session zu groß, in Sub-Tickets splitten (siehe Map „Not yet specified").

# T5 · Modernisierungs-Schematics anwenden + Guards final funktional

Type: task
Status: open
Blocked by: 05, 06, 07, 08

## Question

Sind Control-Flow und `inject()` workspace-weit konsistent modernisiert?

Umzusetzen:
- `ng generate @angular/core:control-flow` — verbliebene `*ngIf`/`*ngFor`/`*ngSwitch` → `@if`/`@for`/`@switch`; Ergebnis stichprobenartig prüfen (v. a. `trackBy` → `track`).
- `ng generate @angular/core:inject` — verbliebene Constructor-DI → `inject()`.
- Prüfen, dass **alle** Guards funktional sind (`CanActivateFn`/`CanDeactivateFn`), keine klassenbasierten Guards mehr.
- `@let` dort ergänzt, wo `ng-let` ersetzt wurde (falls in 08 nicht vollständig erledigt).
- Nach den Schematics: `ng build` grün.

Hinweis: Die Schematics laufen erst, wenn alle Komponenten (05–08) portiert und kompilierbar sind.

# T4a · App-Shell + shared portieren (standalone)

Type: task
Status: open
Blocked by: 03

## Question

Wie werden App-Shell, Routing und die shared-Bausteine standalone + modern?

Umzusetzen:
- `bootstrapApplication(AppComponent, appConfig)`; `AppComponent` standalone; `appConfig` bündelt die Provider aus Ticket 03 (`provideRouter`, Firebase-Provider, `provideAnimations`).
- `<perfect-scrollbar>` in `app.component.html` → nativer CSS-Scroll-Container (`overflow:auto` + Scrollbar-Styling in `styles.less`/Component-LESS); `ngx-perfect-scrollbar`-Modul + `PERFECT_SCROLLBAR_CONFIG`-Provider entfernen.
- shared: `header`, `menu`, `bubbles` → standalone Components; FontAwesome via `FaIconComponent` (standalone) statt `FontAwesomeModule`.
- Routing: `provideRouter` mit den bestehenden Routen; Lazy-Loading der Feature-Bereiche — zunächst weiter `loadChildren` auf NgModules erlaubt, bis 06–08 auf `loadComponent`/standalone-Routes portiert sind.

Betroffen u. a.: `app.component.*`, `app.module.ts`, `app-routing.module.ts`, `shared/header/*`, `shared/menu/*`, `shared/bubbles/*`.

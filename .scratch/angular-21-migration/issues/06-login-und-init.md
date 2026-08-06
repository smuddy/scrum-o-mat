# T4b · login + init portieren (standalone + Signals)

Type: task
Status: open
Blocked by: 04

## Question

Wie werden die Bereiche `modules/login` und `modules/init` standalone + signal-basiert?

Umzusetzen:
- Standalone Components (`login.component`, `init.component`), FontAwesome via `FaIconComponent`.
- `inject()` statt Constructor-DI.
- `login.guard.ts` → funktionaler Guard (`CanActivateFn`).
- Auth-/User-Zugriffe über die in Ticket 04 modernisierten Services (Signals wo sinnvoll).
- Routing dieser Bereiche auf standalone-Routes (`loadComponent`) umstellen.

Abgrenzung: `modules/planning/init` (my-sessions) gehört zum planning-Feature (Ticket 07), **nicht** hierher.

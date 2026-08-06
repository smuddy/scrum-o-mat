# T4d · velocity-Feature portieren (standalone + Signals)

Type: task
Status: open
Blocked by: 04

## Question

Wie wird das velocity-Feature standalone + modern?

Bereiche: `projects` (projects/project), `project` (project/edit-project), `sprint` (sprint/edit-date/edit-number/edit-text), `velocity.service`, `project.service`, `moving-average-helper`, Models.

Umzusetzen:
- Standalone Components, `inject()`, Signals.
- `NgLetModule` (`ng-let`) → natives `@let`.
- FontAwesome via `FaIconComponent`.
- Datenzugriff über die in Ticket 04 modernisierten Services.
- Routing auf standalone-Routes (`loadComponent`).

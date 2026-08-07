# 19 — Owner-Aktionen in die Seitenleiste (wie Sprintplanner) + Board löschen mit Confirm

Type: task
Status: resolved
Blocked by: 04, 05

## Question
Wie werden die Owner-Aktionen des Boards präsentiert?

Umsetzung — orientiert am **Sprintplanner**:
- Die Owner-Aktionen wandern aus dem Inline-`owner-controls`-Block in die **Seitenleiste (Menü)**: in `ngOnInit` via `MenuService.addCustomAction(name, action, confirm?)` registrieren, in `ngOnDestroy` `menuService.resetCustomActions()` (exakt wie `SprintComponent`/`ProjectComponent`).
- Enthält u.a.: „Texte verstecken"/„Texte einblenden", „Temporär aufdecken", Timer-Steuerung sowie **„Board löschen"**.
- **„Board löschen"** mit der **Sicherheitsabfrage-Mechanik aus dem Sprintplanner**: `addCustomAction('Board löschen', () => …, true)` — das `confirm = true` rendert das Menü als Bestätigungs-Flow (Check/Abbrechen), analog „Sprint löschen".
- `RetroService.deleteBoard(boardId)` (inkl. Löschen der `cards`-Subcollection, analog `PlanningService.deletePlanning`); danach zurück zur Board-Übersicht `/retrospective`.
- Nur für Owner registriert.

Hinweis: Board-Löschen ist hiermit hier verortet (Ticket 12 = nur noch umbenennen/archivieren).

Offen: Timer-Minuten-Eingabe im Menü abbilden (Menü-Aktionen sind Name+Callback) — feste Presets als mehrere Aktionen ODER kleine Eingabe bleibt am Board. Prüfen, wie der Sprintplanner Eingaben handhabt.

## Answer
Gebaut (`ng build` + Vitest grün, 345 Tests, 2026-08-06). Owner-Aktionen liegen in der Seitenleiste (MenuService), Inline-`owner-controls` entfernt.
- `buildOwnerMenu()` (nur wenn Owner, via `board$`/`isOwner$`-Subscription; `resetCustomActions` bei Nicht-Owner/Destroy): „Texte verstecken/einblenden", bedingt „Temporär aufdecken", **„Board löschen" mit `confirm=true`** (Sprintplanner-Mechanik) → `deleteBoard` + Navigation `/retrospective`.
- **Timer als Menü-Component:** `MenuService` um `addCustomComponent(component, inputs?)` erweitert, Menü rendert Component-Einträge via `NgComponentOutlet`. Neue `TimerControlComponent` (Input `class="form center"` im Sprint-Edit-Stil + Play/Stop-Icons) wird via `addCustomComponent(TimerControlComponent, {boardId})` registriert. `timerMinutes`/`startTimer`/`stopTimer` aus board.component in die TimerControlComponent verschoben; Countdown-Anzeige bleibt am Board.

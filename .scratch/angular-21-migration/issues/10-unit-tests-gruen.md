# T6 · Unit-Tests (Karma/Jasmine) grün

Type: task
Status: open
Blocked by: 09

## Question

Laufen alle Unit-Tests unter ng21 grün (weiterhin Karma/Jasmine)?

Umzusetzen:
- Specs an Standalone-`TestBed`-Setup anpassen (`imports` statt `declarations`).
- Firebase-Mocks auf die **modulare** API umstellen; signal-basierte Services korrekt mocken/bereitstellen.
- `spyOn`/`jasmine.createSpy` bleiben Jasmine (**kein** Vitest in diesem Schritt).
- `ng test` (Karma) läuft vollständig grün.

Hinweis: Der Nutzer baut parallel ein Jasmine-Regressionsnetz gegen den ng13-Stand — dessen Intent/Assertions hier erhalten bzw. übernehmen, um die Migration funktional gegenzuprüfen.

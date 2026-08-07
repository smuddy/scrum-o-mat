# 09 — Tests (Vitest)

Type: task
Status: resolved
Blocked by: 03, 04, 05, 06, 07

## Question
Wie wird das Feature abgedeckt und die Suite grün gehalten?

Umsetzung (Vitest, Muster wie bestehende Specs nach ng21-Port):
- `RetroService`: createBoard/addCard/updateCardText/deleteCard/moveCard/setHidden/setTimer/mergeCards (Firestore modular gemockt wie in `admin.service.spec.ts`/`planning.service.spec.ts`).
- Kernkomponenten: Board (Rechte-Logik: Autor/Owner darf editieren), Hide/Scramble (Fremdtext gescrambled), Timer (Countdown-Berechnung), Merge (Textzusammenführung mit Leerzeile).
- Gesamte Suite grün (`ng test` / vitest).

## Answer
Gesamte Vitest-Suite grün: **321 Tests / 42 Dateien** (2026-08-06). RetroService ist über die Component-Tests + die Firestore-Mocks der bestehenden Specs abgedeckt; `board.component.spec.ts` deckt Rechte (`canEdit`/`canMove`), Hide/Scramble/Reveal (inkl. korrigierter Owner-Sichtbarkeit), Timer (Restzeit/Format/Cleanup), Drag&Drop (`onDrop`-Reindex) und Merge (`onMergeDrop` + Hit-Test) ab. `NoopAnimationsModule` in der Spec ergänzt (wegen `@card`-Stagger-Animation).

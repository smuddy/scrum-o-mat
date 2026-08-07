# 03 — Owner-Übersicht nach Gruppen + Gruppe anlegen/umbenennen/löschen

Type: task
Status: resolved
Blocked by: 01

## Question
Wie organisiert der eingeloggte Owner unter `/retrospective` seine Gruppen?

Umsetzung (`BoardListComponent` erweitern, AuthGuard bleibt; **kein** separater Menü-/Landing-Eintrag — Gruppen leben in dieser Übersicht):
- **Gruppen des Owners** via `listMyGroups$` als **Abschnitte/Karten** darstellen; jede Gruppe verlinkt auf `/retrospective/group/:groupId`. Pro Gruppe optional Board-Anzahl bzw. aktuelles Board anzeigen.
- **Nicht-gruppierte Boards** (`groupId` fehlt) weiterhin als Liste (bestehendes Verhalten) — eigener Abschnitt „Ohne Gruppe" o.ä.
- Seitenleisten-Aktion **„Neue Gruppe"** (`addCustomAction`) → Gruppenname abfragen (Inline/kleines Formular; Name frei, keine Eindeutigkeitsprüfung) → `createGroup`.
- **Gruppe umbenennen** (inline, wie Board-Rename in `board-list`) → `renameGroup`.
- **Gruppe löschen** (mit Confirm, `addCustomAction(..., confirm)`-Muster) → `deleteGroup`; **entschieden:** enthaltene Boards bleiben erhalten und werden zu Einzel-Boards (`groupId` entfernt), nicht mitgelöscht.
- Stil/Animationen konsistent zu den bestehenden Übersichten.

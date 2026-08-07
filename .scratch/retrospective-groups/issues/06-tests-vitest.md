# 06 — Tests (Vitest) für die Gruppen-Funktionalität

Type: task
Status: open
Blocked by: 02, 03, 04, 05

## Question
Sind die Gruppen-Funktionen mit Vitest abgedeckt und bleibt die Gesamt-Suite grün?

Umsetzung (Stil/Setup wie die bestehende Retro-Test-Suite):
- **Service:** `createGroup`, `listMyGroups$`, `listBoardsByGroup$`, `assignBoardToGroup` (Setzen **und** Herauslösen), `renameGroup`, `deleteGroup` (inkl. „Boards werden ungrouped, nicht gelöscht").
- **Gruppen-Seite:** „aktuelles Board" = neuestes nicht-archiviertes; Owner-vs-Mitglied-Sicht (Verwaltungsaktionen nur für Owner); Share-Link-Format.
- **Übersicht:** Gruppierung (gruppierte vs. nicht-gruppierte Boards); Gruppe anlegen/umbenennen/löschen.
- **Übernahme:** Spalten-Kopie + Titel-Hochzählung (inkl. Fall „kein Zähler im Titel").
- **Ziel:** neue Tests grün **und** die bestehende Suite bleibt grün (`ng test` / Vitest).

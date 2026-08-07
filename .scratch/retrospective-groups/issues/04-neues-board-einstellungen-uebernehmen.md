# 04 — Neues Sprint-Board in der Gruppe mit Einstellungs-Übernahme + Titel-Hochzählung

Type: task
Status: open
Blocked by: 01, 02

## Question
Wie legt der Owner das nächste Sprint-Board einer Gruppe an, mit übernommenen Einstellungen des letzten Boards?

Umsetzung:
- **Einstieg:** Owner-Aktion „Neues Board" auf der Gruppen-Seite (Ticket 02). Route/Flow: `retrospective/group/:groupId/new` oder `new?group=:groupId` (im Ticket festlegen); **AuthGuard + owner-only**.
- **Create-Flow** (bestehende `CreateComponent` wiederverwenden/erweitern): Formular wird mit den Einstellungen des **neuesten** Boards der Gruppe vorbefüllt:
  - Spalten (Namen/Farben/Reihenfolge) **verbatim** übernommen; weitere Anlege-Einstellungen ebenfalls kopieren.
  - **Titel automatisch hochgezählt** (entschieden): Zahl am Titelende +1 („Sprint 5" → „Sprint 6"); ohne erkennbare Zahl „ 2" anhängen. Bleibt editierbar.
- Beim Speichern wird `groupId` gesetzt (`createBoard` um `groupId` erweitern **oder** anschließend `assignBoardToGroup`).
- **Kein vorhandenes Board in der Gruppe:** normales leeres Create-Formular mit heutigen Defaults.
- **Nach dem Anlegen (entschieden):** Owner navigiert **direkt ins neue Board** (kein Zwischenschritt Share-Link — die Gruppe ist bereits geteilt).

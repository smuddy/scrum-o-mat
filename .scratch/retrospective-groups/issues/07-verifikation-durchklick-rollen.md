# 07 — Verifikation: Durchklick inkl. Rollen-Boundary

Type: task
Status: resolved
Blocked by: 06

## Question
Funktioniert das Feature end-to-end lokal, inklusive der Zugriffs-Grenze für Gruppen-Link-Mitglieder?

Checkliste:
- `ng build` + `ng serve` grün; Vitest grün.
- **Owner:** Gruppe anlegen → Sprint-Board anlegen (Einstellungen übernommen, Titel hochgezählt) → Gruppen-Link kopieren.
- **Mitglied** (anonym, z.B. Inkognito-Fenster, nur über den Gruppen-Link):
  - sieht die Gruppen-Seite mit hervorgehobenem **aktuellem** Board, öffnet es, **fügt eine Karte hinzu**;
  - sieht **keine** Verwaltungsaktionen; kann **kein** Board anlegen/bearbeiten/löschen und keine Gruppe verändern (Verwaltungs-Routen bleiben verwehrt/leer).
- **Owner** legt das nächste Sprint-Board an → wird zum neuen „aktuellen"; Mitglied sieht es nach Reload.
- Bestehendes Einzel-Board in eine Gruppe verschieben und wieder herauslösen.

Ergebnis dokumentieren; bei Abweichungen Folge-Tickets anlegen bzw. Fog schärfen.

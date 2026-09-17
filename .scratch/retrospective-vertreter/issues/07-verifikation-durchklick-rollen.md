# 07 — Verifikation (Durchklick + Build + Vitest grün)

Type: task
Status: done
Blocked by: 06

## Question
Ist das Feature featurecomplete und lokal grün — mit nachgewiesener Rollen-Grenze Owner / Vertreter / Link-Mitglied?

Umsetzung:
- **Build:** `npx ng build` grün.
- **Tests:** Vitest-Gesamtsuite grün (Ergebnis-Zahl festhalten).
- **Rollen-Grenze code-/testseitig verankert** zusammenfassen (welche Aktion greift auf welches Predikat).
- **Live-Durchklick-Checkliste** an den Nutzer übergeben (der anonyme/mehrbenutzer-Flow braucht ein echtes Firebase-Backend — wie bei der Groups-Verifikation):
  1. Owner legt Gruppe an, erzeugt einen Freigabe-Code (gültig 3 Tage, „gültig bis"-Hinweis sichtbar) und kopiert Code/Link. (Der 3-Tage-Ablauf selbst wird per Unit-Test abgedeckt — live kaum prüfbar ohne Uhr-/Datumstrick.)
  2. Zweiter (eingeloggter) Nutzer öffnet den Link, bestätigt „Als Vertreter beitreten", landet in der Gruppe und sieht sie unter „als Vertreter" in `/retrospective`. **Ein zweites Einlösen desselben Codes scheitert** (einmalig). Anonymer Aufruf → Login-Hinweis, nach Login Rücksprung auf die Einlöse-Seite. Ein Code lässt sich nicht aus der `groupId` herleiten.
  3. Vertreter legt neues Board in der Gruppe an, bearbeitet Karten, Spalten, Timer, Voting-Reset, benennt Board um, archiviert — alles ✓.
  4. Vertreter sieht **keine** Aktionen für: Gruppe umbenennen/löschen, Vertreter verwalten, Board aus Gruppe lösen, Board löschen.
  5. Vertreter zieht ein **eigenes** ungruppiertes Board in die Gruppe (✓), kann fremde Boards nicht herauslösen (✗).
  6. Owner entfernt den Vertreter → dessen Zugriff endet; von ihm angelegte Boards bleiben in der Gruppe.
  7. Anonymes Link-Mitglied kann weiterhin nur Karten/Reaktionen/Voting/Action-Items.
- **Ziel:** Alles grün + Checkliste abgehakt ⇒ Feature abgeschlossen (weitere Änderungen als neue Tickets).

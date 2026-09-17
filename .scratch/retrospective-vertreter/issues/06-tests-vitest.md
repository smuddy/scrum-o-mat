# 06 — Tests (Vitest)

Type: task
Status: done
Blocked by: 02, 03, 04, 05

## Question
Ist die Vertreterfunktion inkl. Rollen-Grenze durch die Vitest-Suite abgedeckt und bleibt die Gesamtsuite grün?

Umsetzung — an Aufbau/Benennung/Stil der bestehenden Specs orientieren:
- **Predikate (Ticket 01):** `isGroupOwner`/`isGroupDeputy`/`canManageBoards` als reine Funktionen — Owner/Vertreter/Fremder/anonym (uid undefined), fehlendes `deputies`-Feld.
- **Service (`retro.service.spec.ts`):** `addDeputy`/`removeDeputy` (arrayUnion/arrayRemove-Aufruf + modified), `listGroupsWhereDeputy$` (query mit `array-contains`, leere Liste bei fehlender uid, `catchError`); `createInvite` (Doc mit groupId/createdBy/created + `expiresAt` = +3 Tage, Code zurück), `redeemInvite` (Transaktion: gültiger Code → arrayUnion deputy + Doc-Löschung + `{groupId}`; unbekannter/eingelöster Code → `not-found`; **abgelaufener Code (`expiresAt` in der Vergangenheit) → `expired`, kein deputy-Eintrag**), `revokeInvite` (delete).
- **Einlöse-Flow (Ticket 02):** `GroupJoinComponent` — eingeloggter Nutzer bestätigt → `redeemInvite` aufgerufen + Navigation zur Gruppe; ungültiger/bereits eingelöster Code → Fehlermeldung, keine Navigation; anonymer Besucher → Login-Hinweis statt Beitritt.
- **Owner-Verwaltung (Ticket 03):** Owner sieht Vertreter-Abschnitt; „Code erzeugen" ruft `createInvite` und zeigt Code/Link zum Kopieren; Vertreter-Liste + entfernen ruft `removeDeputy`; Vertreter/Link-Mitglied sehen den Abschnitt nicht.
- **Board-/Gruppen-Rechte (Ticket 04):** je Aktion Owner ✓, Vertreter ✓, Link-Mitglied ✗; Owner-only (Gruppe umbenennen/löschen, Vertreter verwalten, Board aus Gruppe lösen, Board löschen) für Vertreter ✗. Board ohne Gruppe: weiterhin nur `board.ownerId`.
- **Übersicht (Ticket 05):** Gruppe erscheint beim Vertreter im eigenen Abschnitt; keine Owner-Verwaltungsaktionen an der Vertreter-Karte; anonym → leer.
- **Ziel:** Neue/erweiterte Specs; **Gesamtsuite grün** (`npx ng test` / Vitest). Zahl der Tests als Ergebnis festhalten.

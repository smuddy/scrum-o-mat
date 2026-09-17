# 03 — Owner: Freigabe-Code erzeugen + Vertreter verwalten

Type: task
Status: done
Blocked by: 01

## Question
Wie erzeugt der Owner einen Freigabe-Code/-Link und wie sieht/entfernt er Vertreter — sichtbar nur für ihn?

Umsetzung:
- **Ort:** `group/group.component.*` (Gruppen-Seite). Abschnitt „Vertreter" **nur** wenn `isGroupOwner(group, realUid)` (nicht für Vertreter, nicht für Link-Mitglieder).
- **Code erzeugen:** Button „Einladungs-Code erzeugen" → `createInvite(groupId)` (Ticket 01) → den zurückgegebenen Code **einmalig** anzeigen, zusammen mit dem kopierbaren **Link** `…/retrospective/join/:code` (`navigator.clipboard.writeText`), plus Hinweis „Code ist einmalig einlösbar; jetzt kopieren". Am „Link kopieren"-Muster der Gruppen-Seite orientieren.
- **Vertreter-Liste + Entfernen:** aktuelle `group.deputies` auflisten (steht im Gruppen-Doc, kein `list` nötig) — je Eintrag uid (optional `user`-Name via `UserService`) + Papierkorb → `removeDeputy(groupId, uid)`. Optik wie `edit-project.component.html`.
- **Ablauf:** Codes sind **3 Tage gültig** (`expiresAt`, in `createInvite`/`redeemInvite` gesetzt/geprüft, Ticket 01) — im Erzeugen-Hinweis anzeigen („gültig bis <Datum>"). Vergessene Codes verfallen dadurch von selbst.
- **Offene Codes widerrufen — Sub-Entscheid (wegen Rules):** `invites` ist bewusst **nicht auflistbar** (`list` verboten, Ticket 01), und Codes dürfen **nicht** im Klartext auf dem (öffentlich lesbaren) Gruppen-Doc landen — sonst wären sie wieder herleitbar. Daher **keine** persistente Pending-Liste. **MVP:** „Code widerrufen" nur für den **gerade erzeugten** (in der Session bekannten) Code (`revokeInvite(code)`); alles Weitere deckt der 3-Tage-Ablauf + die Einmaligkeit ab. Finaler Feinschliff hier im Ticket.
- **Kein** Hinzufügen-per-ID-Feld (Beitritt läuft über den Code, Ticket 02).
- **Ziel:** Owner erzeugt/teilt Freigabe-Codes und sieht/entfernt Vertreter live; entfernte Vertreter verlieren sofort die Rechte. Vertreter/Link-Mitglieder sehen diesen Abschnitt nicht. `ng build` grün.

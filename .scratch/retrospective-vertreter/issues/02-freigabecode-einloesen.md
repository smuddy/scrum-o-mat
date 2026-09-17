# 02 — Freigabe-Code einlösen (Beitritts-Flow)

Type: task
Status: done
Blocked by: 01

## Question
Wie wird aus einem Freigabe-Code eine Vertreter-Mitgliedschaft — einmalig und für Eingeloggte?

Umsetzung:
- **Neue Route** `retrospective/join/:code` (retrospective-Kindrouten, `loadComponent` → neue `GroupJoinComponent` unter `modules/retrospective/group/join/`). **Kein** AuthGuard (anonyme Besucher müssen die Seite erreichen, um den Login-Hinweis zu sehen). Reihenfolge wie bei den anderen zweisegmentigen Routen beachten (vor `:boardId`).
- **Einlöse-Seite** (`GroupJoinComponent`):
  - **Vorschau + Bestätigung:** zunächst `getDoc(invites/{code})` lesen → existiert nicht → Fehler „Code ungültig oder bereits eingelöst"; **`expiresAt` < jetzt → Fehler „Code abgelaufen" (3 Tage überschritten)**. Gültig → über `groupId` den Gruppennamen zeigen (`getGroup$`) + Button „Als Vertreter beitreten".
  - **Eingeloggt** (reale uid via `currentUserId$`): Button → `redeemInvite(code, uid)` (Transaktion aus Ticket 01). Erfolg `{groupId}` → auf `group/:groupId` navigieren mit Bestätigung; `not-found`/`expired` → passende Fehlermeldung (in der Zwischenzeit eingelöst/widerrufen bzw. abgelaufen — die Transaktion ist die maßgebliche Prüfung, nicht die Vorschau). Bereits Owner/Vertreter: `arrayUnion` ist idempotent, Code wird trotzdem verbraucht → einfach weiterleiten.
  - **Anonym/nicht eingeloggt:** Hinweis „Bitte zuerst anmelden oder registrieren, um beizutreten" + Button zu `/login`. **Rücksprung:** `returnUrl` (die Join-URL inkl. Code) übergeben und nach Login/Registrieren dorthin zurück — `LoginService.login()/register()` navigieren aktuell hart auf `/`; minimalinvasiv um optionalen returnUrl ergänzen ODER returnUrl in localStorage. Einfachster tragfähiger Weg gewinnt.
- **Einmaligkeit** kommt aus der Transaktion in `redeemInvite` (Doc wird bei Einlösung gelöscht) — die Seite muss nichts Zusätzliches tun.
- **Ziel:** Ein eingeloggter Nutzer wird per gültigem Code in ≤ 2 Klicks Vertreter und landet in der Gruppe; ein zweites Einlösen desselben Codes scheitert sauber; ein anonymer Besucher wird zum Login geführt und danach zurückgebracht. `ng build` grün.

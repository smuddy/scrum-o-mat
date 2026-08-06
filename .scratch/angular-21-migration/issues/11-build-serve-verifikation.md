# T7 · Build, Serve & manuelle Durchklick-Verifikation (Ziellinie)

Type: task
Status: open
Blocked by: 13

## Question

Ist die Ziellinie erreicht — App lokal grün auf Angular 21?

Prüfen/abschließen:
- `ng build --configuration production` läuft fehlerfrei; Budgets eingehalten.
- `ng serve` startet; App im Browser durchklicken:
  - Login/Logout
  - Planning: developer, guest, scrum-master (dashboard/developers/edit-issue), admin
  - QR **erzeugen** (scrum-master) + QR **scannen** (qrcode)
  - Velocity: projects/project/sprint
- `firebase.json`-Output-Pfad (`dist/scrum-o-mat/browser`) final verifiziert (kein echtes Deploy).
- Definition of Done bestätigt → Map-Destination erreicht.

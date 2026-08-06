# T3 · Data-Services auf modulare Firestore-API + Signals portieren

Type: task
Status: open
Blocked by: 03

## Question

Wie greifen die Services modular auf Firestore/Auth zu und stellen wo sinnvoll Signals bereit?

Betroffene Stellen (7):
- `modules/planning/planning.service.ts`
- `modules/planning/admin/components/admin.service.ts`
- `modules/velocity/projects/project.service.ts`
- `modules/velocity/projects/project/velocity.service.ts`
- `modules/login/user.service.ts`
- `modules/login/login.service.ts`
- Models mit `Timestamp` (`modules/velocity/models/project.ts`, `velocity.service.ts`)

Umzusetzen:
- `AngularFirestore`/`AngularFireAuth` (compat) → `Firestore`/`Auth` via `inject()`.
- `collection()`/`doc()` + `collectionData()`/`docData()` (`@angular/fire/firestore`); Schreiboperationen via `addDoc`/`setDoc`/`updateDoc`/`deleteDoc`.
- `firebase.firestore.Timestamp` (compat) → `Timestamp` aus `@angular/fire/firestore`.
- Wo sinnvoll: Streams zusätzlich via `toSignal()` als Signal anbieten; Auth-State als Signal.
- Öffentliche Service-API möglichst stabil halten, damit die Component-Ports (05–08) klar bleiben.

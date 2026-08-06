# T2 · Firebase modular initialisieren + funktionaler Auth-Guard

Type: task
Status: open
Blocked by: 02

## Question

Wie wird Firebase modular (statt compat) initialisiert und der Auth-Guard funktional?

Umzusetzen:
- Modulare Firebase-Provider verdrahten (als `EnvironmentProviders`, zunächst weiter im `AppModule` möglich — voller `bootstrapApplication`-Standalone-Bootstrap kommt in Ticket 05):
  - `provideFirebaseApp(() => initializeApp(environment.firebaseConfig))`
  - `provideFirestore(() => getFirestore())`
  - `provideAuth(() => getAuth())`
- Compat-Auth-Guard im Routing ersetzen: `@angular/fire/compat/auth-guard` → funktionaler Guard aus `@angular/fire/auth-guard` (`AuthGuard`, `redirectUnauthorizedTo`, `redirectLoggedInTo`).
- `BrowserAnimationsModule` → `provideAnimations()`.
- Realtime-DB wird nicht genutzt (nur Firestore + Auth) — `databaseURL` in der Config bleibt, aber kein `provideDatabase`.

Ziel: App bootet mit modularem Firebase-Init; die compat-Imports in `app.module`/`app-routing.module` sind entfernt. Die Service-Interna werden in Ticket 04 portiert.

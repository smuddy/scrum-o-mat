# D1 · AngularFire-Strategie ohne stabilen ng21-Release

Type: grilling
Status: resolved
Blocked by: 01

## Question

R1 hat ergeben: **`@angular/fire` hat keinen stabilen Angular-21-Release**. Stable `latest` = 20.0.1 (Peer `@angular/core: ^20`); Angular-21-Support existiert nur als Pre-Release **`21.0.0-rc.0`** (Peer `^21`, `firebase ^12.4.0`). Wie gehen wir damit um?

Optionen:
- **A) `@angular/fire@21.0.0-rc.0` verwenden** (+ `firebase@^12.4.0`). Offiziell für ng21 vorgesehene Linie; RC. Die App nutzt einen Standard-Subset (Firestore + Auth) → Risiko überschaubar. Exakte Version pinnen.
- **B) Angular auf 20 statt 21 zielen** — dann `@angular/fire@20.0.1` stabil. Weicht vom ausdrücklichen Ziel „Angular 21" ab.
- **C) `@angular/fire@20.0.1` mit Angular 21 erzwingen** (npm `overrides`/`--force`). Peer sagt `^20` → Runtime-Risiko, nicht empfohlen.
- **D) Warten** auf stabilen `@angular/fire@21` — blockiert die Migration.

**Empfehlung: A** (RC nutzen, exakt pinnen; bei Problemen in Ticket 03/04 neu bewerten).

Diese Entscheidung blockiert Ticket 02 (Scaffold pinnt die Version) und 03/04 (modulare Firebase-API).

## Answer

**Option A** (Nutzer, 2026-08-06): `@angular/fire@21.0.0-rc.0` + `firebase@^12.4.0` verwenden, exakte Version pinnen. Es ist die einzige ng21-taugliche AngularFire-Linie; die App nutzt nur Firestore + Auth (überschaubarer Subset). Falls der RC in den Firebase-Tickets (03/04) Probleme macht, dort neu bewerten (ggf. auf einen später erscheinenden stabilen `@angular/fire@21` wechseln).

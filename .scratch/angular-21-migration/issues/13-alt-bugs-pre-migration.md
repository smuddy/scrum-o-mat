# T8 · Alt-Bugs beheben (vor der Migration bekannt)

Type: task
Status: open
Blocked by: 10

## Question

Sind die beim Aufbau des ng13-Test-Netzes aufgedeckten **bestehenden** Bugs/Fragilitäten im portierten Code behoben und durch je einen Test auf **korrektes** Verhalten abgesichert?

**Strategie:** Parität zuerst (Ticket 10 hält die 258 Tests grün = Port ändert Verhalten nicht), dann hier gezielt die bekannten Bugs fixen und die betroffenen Tests von „buggy" auf „korrekt" nachziehen. Fixes landen im modularen/standalone/signal-basierten Code (nicht im alten ng13-Code). Bugs, die schon beim Port (04/07/08) natürlich verschwinden, hier nur verifizieren.

### Zu behebende Bugs

1. **`guest.component`** — `developers.filter(d => d.storyPoints)` prüft truthy. `StoryPoints.sHalf` = Enum `0` (falsy) → wer „½" schätzt, wird fälschlich als „noch nicht geschätzt" gezählt.
   → Fix: explizit gegen `null`/`undefined` prüfen (`d.storyPoints != null`), nicht truthy.

2. **`project.component` / `developer`,`scrum-master`,`guest`** — globale JS-Variablen `setStaff` bzw. `fireworks` statt DI; existieren nur via Inline-`<script>` in `index.html` (in Tests gestubbt).
   → Fix: in echte Angular-Services/DI überführen, keine `window`-Globals. Fällt großteils schon beim Standalone/DI-Port (07/08) an.

3. **`EditProjectComponent`** — Template bindet `@fadeTranslateInstant`, Trigger ist nicht im `animations`-Array registriert → Laufzeitfehler beim Rendern (bisher durch globales `BrowserAnimationsModule` maskiert).
   → Fix: Trigger in der Component registrieren (bzw. ungenutztes Binding entfernen); beim Standalone-Port mit `provideAnimations` verifizieren.

4. **`planning.service.updateIssue`** — ruft `resetStoryPoints()` ohne `await` (fire-and-forget) → Fehler propagieren nicht.
   → Fix: `await`/Promise korrekt verketten.

5. **`LoginService.userIdRegex`** — `/[a-zA-Z0-9-_;]*/gm` ohne Anker → matcht jeden String (Zero-Length) → Reader-Validierung in `addReader()` wirkungslos.
   → Fix: ankern + `+` (z. B. `/^[a-zA-Z0-9-_;]+$/`), `g`-Flag/`lastIndex`-Fallstrick vermeiden (kein wiederverwendetes globales Regex-Objekt für `test()`).

6. **`user.service.setUserNameAsync`** — `update()` auf ein evtl. noch nicht existierendes User-Dokument.
   → Fix: modular `setDoc(ref, data, { merge: true })` statt `update()`.

7. **`ProjectService`-Ctor** — totes Query-Literal `where('owner','==','x')`.
   → Fix: entfernen (Dead Code).

### Definition of Done
- Alle 7 Punkte behoben (oder als beim Port erledigt verifiziert).
- Für jeden Fix ein Test, der das **korrekte** Verhalten prüft (betroffene Regressionstests von buggy→korrekt angepasst).
- `ng test` grün.

Siehe Gedächtnis: `pre-migration-known-bugs`.

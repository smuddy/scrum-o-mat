# 01 — Fundament: deputies-Modell, Service-Methoden, Rechte-Predikate

Type: task
Status: done
Blocked by: —

## Question
Wie sieht das Datenfundament für Vertreter aus, damit die UI- und Rechte-Tickets darauf aufsetzen können?

Umsetzung:
- **Modell** (`models/retro.ts`):
  - `RetroGroup` um **optionales** `deputies?: string[]` ergänzen (Array realer uids; fehlt = keine Vertreter → additiv, nicht brechend). Kommentar analog zu `groupId`.
  - Neues Interface `RetroInvite { groupId: string; createdBy: string; created: any; expiresAt: any; }` (+ `RetroInviteId extends RetroInvite { id: string }`) für die Collection **`invites/{code}`** — die **Doc-ID ist der zufällige Code** (bzw. dessen Hash, siehe Service). Mappt einen Code auf seine Gruppe; **einmalig** (wird bei Einlösung gelöscht) und **3 Tage gültig** (`expiresAt`).
- **Service-Methoden** im bestehenden `RetroService` (Stil: `inCtx`, modularer Firestore, `firstValueFrom`):
  - `addDeputy(groupId, uid): Promise<void>` → `updateDoc(retroGroup/{id}, { deputies: arrayUnion(uid), modified })`. `arrayUnion` ist schon importiert.
  - `removeDeputy(groupId, uid): Promise<void>` → `arrayRemove(uid)` (ebenfalls importiert).
  - `listGroupsWhereDeputy$: Observable<RetroGroupId[]>` → `currentUserId$` → falls uid vorhanden `query(collection retroGroup, where('deputies','array-contains', uid))`, sonst `of([])`; `distinctUntilChanged` + `catchError(() => of([]))` **exakt wie `listMyGroups$`** (anonyme Nutzer / noch nicht deployte Rules dürfen die Übersicht nicht leeren).
- **Einlade-Code-Methoden** (Freigabe-Code, im `RetroService`):
  - `createInvite(groupId): Promise<string>` → erzeugt einen **zufälligen Code** (`crypto.randomUUID()` bzw. ausreichend langer Zufallsstring), legt `invites/{code}` = `{ groupId, createdBy: reale uid, created: new Date(), expiresAt: new Date(Date.now() + 3*24*60*60*1000) }` an (Client-Timestamp im Stil der bestehenden Methoden) und gibt den Code zurück (für Anzeige/Link, Ticket 03). *(Optional-Härtung: Code gehasht als Doc-ID speichern, Klartext nur im Link — für den MVP genügt der Code als Doc-ID.)*
  - `redeemInvite(code, uid): Promise<{ groupId: string } | 'not-found' | 'expired'>` (bzw. `null` für beide Fehlerfälle, wenn der Aufrufer nur „ging nicht" braucht) → **`runTransaction`**: `invites/{code}` lesen; existiert nicht → Fehler `not-found`. **`expiresAt` < jetzt → Fehler `expired`** (und den abgelaufenen Doc in derselben Transaktion löschen dürfen). Sonst in **derselben** Transaktion `retroGroup/{groupId}.deputies` per `arrayUnion(uid)` ergänzen **und** `invites/{code}` löschen → atomar/einmalig. Gibt `{ groupId }` zurück (für die Navigation nach Einlösung). uid = reale uid des Einlösenden.
  - `listInvites$(groupId): Observable<RetroInviteId[]>` → offene Codes einer Gruppe (`query(collection invites, where('groupId','==', groupId))`) — für die Owner-Verwaltung (Ticket 03). *(Achtung: braucht `list` auf `invites` — nur dem Owner zumutbar; da Rules offen bleiben und `list` global geblockt wird, siehe Rules-Notiz: Owner-Anzeige der offenen Codes ggf. auf „Anzahl offener Codes"/„zuletzt erzeugten Code merken" reduzieren, falls `list` bewusst verboten ist. Feinentscheid im Ticket 03.)*
  - `revokeInvite(code): Promise<void>` → `deleteDoc(invites/{code})` (offenen Code widerrufen).
- **Zentrale Rechte-Predikate** (reine, statische/pure Funktionen — direkt testbar, kein Firestore-Bezug; im `RetroService` oder einem kleinen `retro-permissions.ts`-Helper):
  - `isGroupOwner(group, uid): boolean` = `!!uid && group.ownerId === uid`.
  - `isGroupDeputy(group, uid): boolean` = `!!uid && !!group.deputies?.includes(uid)`.
  - `canManageBoards(group, uid): boolean` = `isGroupOwner(group, uid) || isGroupDeputy(group, uid)` (= „Board-Manager der Gruppe").
  - Owner-only bleibt `isGroupOwner`. Diese drei Predikate sind die einzige Wahrheitsquelle für die Rollen-Grenze; alle Components konsumieren sie (Tickets 02/04/05).
- **Firestore-Rules:** `retro/**` und `retroGroup/**` bleiben offen (nimmt `deputies` ohne Änderung auf). **Neu:** ein `invites`-Block ergänzen, der `get` und `write` erlaubt, aber **kein `list`** (gegen Enumeration der Codes):
  ```
  match /invites/{code} {
    allow get, write;   // list bewusst NICHT erlaubt -> nicht enumerierbar
  }
  ```
  **Wichtig:** `allow read` NICHT verwenden — `read` = `get`+`list`, und wegen der OR-Semantik der Rules würde ein späteres `allow list: if false` es **nicht** wieder wegnehmen (genau deshalb ist der bestehende `user/**`-Block mit `allow read; allow list: if false` faktisch wirkungslos — **nicht** als Muster kopieren). Konsequenz: `listInvites$` (Ticket 03) funktioniert dann **nicht** per `list` — Owner-Anzeige offener Codes entsprechend lösen (siehe Ticket 03).
- **Ziel:** `ng build` grün; noch keine sichtbare UI. Predikate + Service-Methoden (deputies **und** invites/Transaktion) vorhanden und (im Test-Ticket 06) abgedeckt.

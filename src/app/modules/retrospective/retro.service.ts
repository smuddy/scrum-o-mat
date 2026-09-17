import {inject, Injectable, Injector, runInInjectionContext} from '@angular/core';
import {addDoc, arrayRemove, arrayUnion, collection, collectionData, deleteDoc, deleteField, doc, docData, FieldPath, Firestore, getDoc, increment, query, runTransaction, setDoc, updateDoc, where, writeBatch} from '@angular/fire/firestore';
import {catchError, distinctUntilChanged, mergeMap} from 'rxjs/operators';
import {firstValueFrom, Observable, of} from 'rxjs';
import {LoginService} from '../login/login.service';
import {ID} from '../../helpers/id';
import {RetroActionItem, RetroActionItemId, RetroBoard, RetroBoardId, RetroCard, RetroCardId, RetroColumn, RetroGroup, RetroGroupId, RetroInvite} from './models/retro';

@Injectable({
  providedIn: 'root'
})
export class RetroService {

  private afs = inject(Firestore);
  private injector = inject(Injector);
  private loginService = inject(LoginService);

  // AngularFire-Aufrufe muessen im Injection-Kontext laufen (sonst Warnung + instabile CD/Hydration).
  private inCtx<T>(op: () => T): T {
    return runInInjectionContext(this.injector, op);
  }

  public listMyBoards$: Observable<RetroBoardId[]> = this.loginService.currentUserId$().pipe(
    mergeMap(uid => this.inCtx(() => collectionData(
      query(collection(this.afs, 'retro'), where('ownerId', '==', uid)),
      {idField: 'id'}
    )) as Observable<RetroBoardId[]>),
    distinctUntilChanged((a, b) => JSON.stringify(a) === JSON.stringify(b)),
  );

  public async createBoard(title: string, columns: { name: string; color: string }[], groupId?: string): Promise<string> {
    const uid = await firstValueFrom(this.loginService.currentUserId$());
    const board: RetroBoard = {
      ownerId: uid,
      title,
      columns: columns.map((c, i): RetroColumn => ({id: ID(), name: c.name, color: c.color, order: i})),
      hidden: false,
      timerEndsAt: null,
      created: new Date(),
      modified: new Date(),
    };
    // groupId bleibt bewusst als fehlender Key statt "undefined" -- Firestore lehnt explizite
    // undefined-Werte in addDoc() ab (analog zu addActionItem() weiter unten).
    if (groupId) {
      board.groupId = groupId;
    }
    const newDoc = await this.inCtx(() => addDoc(collection(this.afs, 'retro'), board));
    return newDoc.id;
  }

  public getBoard$(boardId: string): Observable<RetroBoardId | undefined> {
    return this.inCtx(() => docData(doc(this.afs, 'retro/' + boardId), {idField: 'id'})) as Observable<RetroBoardId | undefined>;
  }

  public getCards$(boardId: string): Observable<RetroCardId[]> {
    return this.inCtx(() => collectionData(collection(this.afs, 'retro/' + boardId + '/cards'), {idField: 'id'})) as Observable<RetroCardId[]>;
  }

  public async addCard(boardId: string, columnId: string, text: string): Promise<string> {
    const user = await firstValueFrom(this.loginService.authStateAllowAnonymous$);
    const card: RetroCard = {
      text,
      columnId,
      authorId: user.uid,
      order: Date.now(),
      created: new Date(),
      modified: new Date(),
      // Live-Bearbeitungs-Hinweis: eine frisch angelegte Karte (siehe addAndEdit()) wird sofort vom
      // Autor bearbeitet, daher pulsiert sie ab dem ersten Snapshot bei allen anderen Teilnehmern.
      editingBy: user.uid,
    };
    const newDoc = await this.inCtx(() => addDoc(collection(this.afs, 'retro/' + boardId + '/cards'), card));
    return newDoc.id;
  }

  public async updateCardText(boardId: string, cardId: string, text: string): Promise<void> {
    // editingBy wird beim Speichern in einem Rutsch mitgeleert -- Speichern beendet den Bearbeitungs-
    // Vorgang immer, ein separater setCardEditing()-Aufruf ist hier nicht noetig (siehe board.component).
    await this.inCtx(() => updateDoc(doc(this.afs, 'retro/' + boardId + '/cards/' + cardId), {text, modified: new Date(), editingBy: null}));
  }

  // Live-Bearbeitungs-Hinweis: markiert (editingBy = uid) bzw. entfernt (editingBy = null) den
  // "wird gerade bearbeitet"-Zustand einer Karte. Wird ausserhalb von updateCardText() benoetigt, wenn
  // der Bearbeitungsvorgang ohne Textaenderung beginnt (startEdit()) bzw. ohne Speichern endet
  // (cancelEdit()/leeres saveEdit() auf einer bestehenden Karte), siehe board.component.
  public async setCardEditing(boardId: string, cardId: string, editingBy: string | null): Promise<void> {
    await this.inCtx(() => updateDoc(doc(this.afs, 'retro/' + boardId + '/cards/' + cardId), {editingBy}));
  }

  public async deleteCard(boardId: string, cardId: string): Promise<void> {
    await this.inCtx(() => deleteDoc(doc(this.afs, 'retro/' + boardId + '/cards/' + cardId)));
  }

  // Review-Fix (Atomarität/Write-Amplifikation): Karten, Action-Items und das Board-Dokument werden in
  // EINEM writeBatch gelöscht -- ein Teilfehler hinterlässt keine verwaisten Docs mehr, und statt N
  // einzelner Round-Trips genügt ein einziger Commit. (Firestore-Batch-Limit 500 -- für Retro-Boards
  // unkritisch.)
  public async deleteBoard(boardId: string): Promise<void> {
    const cards = await firstValueFrom(this.getCards$(boardId));
    const actionItems = await firstValueFrom(this.getActionItems$(boardId));
    await this.inCtx(() => {
      const batch = writeBatch(this.afs);
      cards.forEach(card => batch.delete(doc(this.afs, 'retro/' + boardId + '/cards/' + card.id)));
      actionItems.forEach(item => batch.delete(doc(this.afs, 'retro/' + boardId + '/actionItems/' + item.id)));
      batch.delete(doc(this.afs, 'retro/' + boardId));
      return batch.commit();
    });
  }

  // Review-Fix (Atomarität/Write-Amplifikation): schreibt columnId+order mehrerer Karten in EINEM
  // writeBatch statt je Karte ein eigenes updateDoc (siehe persistColumnOrder()/removeColumn() in
  // board.component). Ein Teilfehler kann so keine halb umsortierte Spalte mehr hinterlassen.
  public async moveCards(boardId: string, moves: { cardId: string; columnId: string; order: number }[]): Promise<void> {
    if (moves.length === 0) {
      return;
    }
    await this.inCtx(() => {
      const batch = writeBatch(this.afs);
      const now = new Date();
      moves.forEach(move => batch.update(
        doc(this.afs, 'retro/' + boardId + '/cards/' + move.cardId),
        {columnId: move.columnId, order: move.order, modified: now},
      ));
      return batch.commit();
    });
  }

  public async setHidden(boardId: string, hidden: boolean): Promise<void> {
    await this.inCtx(() => updateDoc(doc(this.afs, 'retro/' + boardId), {hidden}));
  }

  // Ticket 12: Board umbenennen -- modified wird mitgeschrieben, damit z.B. eine "zuletzt geaendert"-
  // Anzeige (falls spaeter benoetigt) korrekt bliebe; created bleibt unangetastet.
  public async renameBoard(boardId: string, title: string): Promise<void> {
    await this.inCtx(() => updateDoc(doc(this.afs, 'retro/' + boardId), {title, modified: new Date()}));
  }

  // Ticket 12: Board archivieren/wiederherstellen. Reines Anzeige-Flag -- betrifft weder Karten noch
  // Zugriffsrechte, siehe board-list.component fuer die Trennung aktiv/archiviert.
  public async setArchived(boardId: string, archived: boolean): Promise<void> {
    await this.inCtx(() => updateDoc(doc(this.afs, 'retro/' + boardId), {archived}));
  }

  // timerPausedRemainingMs wird bei jedem (Neu-)Start explizit auf null gesetzt: ein Start hebt eine
  // evtl. bestehende Pause auf (siehe Ticket 14 -- pauseTimer/resumeTimer/resetTimer unten).
  public async setTimer(boardId: string, endsAt: Date | null): Promise<void> {
    await this.inCtx(() => updateDoc(doc(this.afs, 'retro/' + boardId), {timerEndsAt: endsAt, timerPausedRemainingMs: null}));
  }

  // Ticket 14: pausiert den laufenden Timer -- friert die uebergebene Restzeit ein
  // (timerPausedRemainingMs) und raeumt timerEndsAt ab (kein aktiver Endzeitpunkt mehr).
  public async pauseTimer(boardId: string, remainingMs: number): Promise<void> {
    await this.inCtx(() => updateDoc(doc(this.afs, 'retro/' + boardId), {timerEndsAt: null, timerPausedRemainingMs: remainingMs}));
  }

  // Ticket 14: setzt einen pausierten Timer mit der eingefrorenen Restzeit fort (neuer Endzeitpunkt
  // = jetzt + remainingMs) und hebt die Pause auf.
  public async resumeTimer(boardId: string, remainingMs: number): Promise<void> {
    await this.inCtx(() => updateDoc(doc(this.afs, 'retro/' + boardId), {timerEndsAt: new Date(Date.now() + remainingMs), timerPausedRemainingMs: null}));
  }

  // Ticket 14: setzt den Timer vollstaendig zurueck (laufend oder pausiert -> kein Timer mehr aktiv).
  public async resetTimer(boardId: string): Promise<void> {
    await this.inCtx(() => updateDoc(doc(this.afs, 'retro/' + boardId), {timerEndsAt: null, timerPausedRemainingMs: null}));
  }

  // Ticket 13: Owner kann Spalten (Name/Farbe/Reihenfolge/Hinzufuegen/Entfernen) nachtraeglich
  // bearbeiten. Ersetzt das komplette columns-Array in einem Schreibvorgang; Karten einer entfernten
  // Spalte muessen VOM AUFRUFER vorher bereits per moveCards() in eine verbleibende Spalte umgehaengt
  // worden sein (siehe board.component.removeColumn()) -- diese Methode kennt keine Karten.
  public async updateColumns(boardId: string, columns: RetroColumn[]): Promise<void> {
    await this.inCtx(() => updateDoc(doc(this.afs, 'retro/' + boardId), {columns, modified: new Date()}));
  }

  public async mergeCards(boardId: string, sourceId: string, targetId: string): Promise<void> {
    const source = await firstValueFrom(this.getCard$(boardId, sourceId));
    const target = await firstValueFrom(this.getCard$(boardId, targetId));
    if (!source || !target) {
      return;
    }
    const mergedText = target.text + '\n\n' + source.text;
    // Review-Fix: Stimmen und Reaktionen der Quellkarte gehen beim Merge NICHT mehr verloren --
    // Stimmen werden pro uid summiert, Reaktions-uids je Emoji vereinigt. Text-Merge, Übernahme der
    // zusammengeführten Maps auf die Zielkarte und das Löschen der Quellkarte laufen in EINEM
    // writeBatch (atomar -- kein Zwischenzustand mit doppelten/verlorenen Karten).
    const mergedVotes = RetroService.mergeVotes(target.votes, source.votes);
    const mergedReactions = RetroService.mergeReactions(target.reactions, source.reactions);
    await this.inCtx(() => {
      const batch = writeBatch(this.afs);
      batch.update(doc(this.afs, 'retro/' + boardId + '/cards/' + targetId),
        {text: mergedText, votes: mergedVotes, reactions: mergedReactions, modified: new Date()});
      batch.delete(doc(this.afs, 'retro/' + boardId + '/cards/' + sourceId));
      return batch.commit();
    });
  }

  // Summiert zwei votes-Maps pro uid (Ausgangswert 0). Reine, statische Hilfsfunktion -- direkt
  // testbar und ohne Firestore-Bezug (siehe mergeCards()).
  private static mergeVotes(a?: { [uid: string]: number }, b?: { [uid: string]: number }): { [uid: string]: number } {
    const result: { [uid: string]: number } = {...(a ?? {})};
    for (const [uid, count] of Object.entries(b ?? {})) {
      result[uid] = (result[uid] ?? 0) + count;
    }
    return result;
  }

  // Vereinigt zwei reactions-Maps je Emoji (uids ohne Duplikate). Reine, statische Hilfsfunktion.
  private static mergeReactions(a?: { [emoji: string]: string[] }, b?: { [emoji: string]: string[] }): { [emoji: string]: string[] } {
    const result: { [emoji: string]: string[] } = {};
    for (const [emoji, uids] of [...Object.entries(a ?? {}), ...Object.entries(b ?? {})]) {
      result[emoji] = Array.from(new Set([...(result[emoji] ?? []), ...uids]));
    }
    return result;
  }

  private getCard$(boardId: string, cardId: string): Observable<RetroCard | undefined> {
    return this.inCtx(() => docData(doc(this.afs, 'retro/' + boardId + '/cards/' + cardId))) as Observable<RetroCard | undefined>;
  }

  // Ticket 15: Dot-Voting. Review-Fix (Lost Update): statt die komplette votes-Map aus einem evtl.
  // veralteten Client-Snapshot zu überschreiben, wird ausschließlich der eigene Stimmen-Key atomar per
  // Field-Path + increment() verändert. So gehen bei gleichzeitigem Voten zweier Nutzer keine fremden
  // Stimmen mehr verloren (increment wird serverseitig gemergt). FieldPath statt Punkt-String, damit
  // beliebige uids sicher als Segment behandelt werden.
  public async changeVote(boardId: string, cardId: string, uid: string, delta: number): Promise<void> {
    await this.inCtx(() => updateDoc(doc(this.afs, 'retro/' + boardId + '/cards/' + cardId), new FieldPath('votes', uid), increment(delta)));
  }

  // Entfernt den eigenen votes-Key komplett (statt eines 0-Eintrags), ebenfalls atomar per Field-Path.
  public async clearUserVote(boardId: string, cardId: string, uid: string): Promise<void> {
    await this.inCtx(() => updateDoc(doc(this.afs, 'retro/' + boardId + '/cards/' + cardId), new FieldPath('votes', uid), deleteField()));
  }

  // Ticket 15: Owner-Aktion -- setzt die Stimmen ALLER Karten des Boards zurueck (leere votes-Map je
  // Karte). Liest die Karten einmalig ueber getCards$ (erste Emission) und schreibt sie in EINEM
  // writeBatch zurück (Review-Fix: atomar + ein Round-Trip statt N).
  public async resetVotes(boardId: string): Promise<void> {
    const cards = await firstValueFrom(this.getCards$(boardId));
    if (cards.length === 0) {
      return;
    }
    await this.inCtx(() => {
      const batch = writeBatch(this.afs);
      cards.forEach(card => batch.update(doc(this.afs, 'retro/' + boardId + '/cards/' + card.id), {votes: {}}));
      return batch.commit();
    });
  }

  // Ticket 16: Emoji-Reaktionen. Review-Fix (Lost Update): statt die komplette reactions-Map zu
  // überschreiben, wird die eigene uid atomar per arrayUnion (hinzufügen) bzw. arrayRemove (entfernen)
  // am Field-Path reactions.${emoji} gesetzt. Simultane Reaktionen auf verschiedene Emojis derselben
  // Karte gehen so nicht mehr verloren. Ein leer gewordenes Emoji-Array bleibt als Key erhalten
  // (arrayRemove löscht den Key nicht); die Anzeige filtert leere Reaktionen ohnehin über count > 0
  // aus (siehe activeReactions() in board.component).
  public async addReaction(boardId: string, cardId: string, emoji: string, uid: string): Promise<void> {
    await this.inCtx(() => updateDoc(doc(this.afs, 'retro/' + boardId + '/cards/' + cardId), new FieldPath('reactions', emoji), arrayUnion(uid)));
  }

  public async removeReaction(boardId: string, cardId: string, emoji: string, uid: string): Promise<void> {
    await this.inCtx(() => updateDoc(doc(this.afs, 'retro/' + boardId + '/cards/' + cardId), new FieldPath('reactions', emoji), arrayRemove(uid)));
  }

  // Ticket 17: Action-Items/To-dos -- eigene Unter-Collection retro/{boardId}/actionItems, analog zu
  // cards oben. Jeder Teilnehmer darf anlegen + "erledigt" togglen; Bearbeiten/Loeschen ist Autor- bzw.
  // Owner-Sache (siehe canEdit() in action-items.component.ts).
  public getActionItems$(boardId: string): Observable<RetroActionItemId[]> {
    return this.inCtx(() => collectionData(collection(this.afs, 'retro/' + boardId + '/actionItems'), {idField: 'id'})) as Observable<RetroActionItemId[]>;
  }

  public async addActionItem(boardId: string, text: string, assignee?: string): Promise<string> {
    const user = await firstValueFrom(this.loginService.authStateAllowAnonymous$);
    const actionItem: RetroActionItem = {
      text,
      done: false,
      authorId: user.uid,
      order: Date.now(),
      created: new Date(),
      modified: new Date(),
    };
    // assignee bleibt bewusst als fehlender Key statt "undefined" -- Firestore lehnt explizite
    // undefined-Werte in addDoc()/updateDoc() ab.
    if (assignee?.trim()) {
      actionItem.assignee = assignee.trim();
    }
    const newDoc = await this.inCtx(() => addDoc(collection(this.afs, 'retro/' + boardId + '/actionItems'), actionItem));
    return newDoc.id;
  }

  public async updateActionItem(boardId: string, actionItemId: string, partial: { text?: string; assignee?: string }): Promise<void> {
    await this.inCtx(() => updateDoc(doc(this.afs, 'retro/' + boardId + '/actionItems/' + actionItemId), {...partial, modified: new Date()}));
  }

  // Analog zu setHidden()/setArchived(): reines Status-Flag-Toggle, daher ohne modified-Update
  // (anders als updateActionItem() oben, das einen inhaltlichen Edit darstellt).
  public async toggleActionItemDone(boardId: string, actionItemId: string, done: boolean): Promise<void> {
    await this.inCtx(() => updateDoc(doc(this.afs, 'retro/' + boardId + '/actionItems/' + actionItemId), {done}));
  }

  public async deleteActionItem(boardId: string, actionItemId: string): Promise<void> {
    await this.inCtx(() => deleteDoc(doc(this.afs, 'retro/' + boardId + '/actionItems/' + actionItemId)));
  }

  // ===========================================================================================
  // Gruppen-Feature: Boards eines Owners in Gruppen (= Teams) buendeln und per Link teilen.
  // Neue Collection retroGroup/{groupId}; Boards referenzieren ihre Gruppe ueber RetroBoard.groupId
  // (genau EINE Gruppe je Board). Alle Methoden im gleichen Stil wie oben (inCtx, modularer Firestore).
  // ===========================================================================================

  // Liste der Gruppen des eingeloggten Owners (reale uid), analog zu listMyBoards$. Guard gegen eine
  // fehlende uid (anonyme Gruppen-Link-Mitglieder): dieser Stream wird auch auf der oeffentlichen
  // Gruppen-Seite konsumiert, und where('ownerId','==', undefined) wuerde im echten Firestore werfen ->
  // fuer nicht eingeloggte Betrachter liefern wir eine leere Liste.
  public listMyGroups$: Observable<RetroGroupId[]> = this.loginService.currentUserId$().pipe(
    mergeMap(uid => uid
      ? this.inCtx(() => collectionData(
        query(collection(this.afs, 'retroGroup'), where('ownerId', '==', uid)),
        {idField: 'id'}
      )) as Observable<RetroGroupId[]>
      : of([] as RetroGroupId[])),
    distinctUntilChanged((a, b) => JSON.stringify(a) === JSON.stringify(b)),
    // Robustheit: schlaegt der retroGroup-Read fehl (z.B. Rules im Backend noch nicht deployed), darf
    // das NICHT die ganze Uebersicht leeren -- dann eben "keine Gruppen" statt Fehler. Nach dem
    // Deploy der Rules + Reload erscheinen die Gruppen normal.
    catchError(() => of([] as RetroGroupId[])),
  );

  public async createGroup(name: string): Promise<string> {
    const uid = await firstValueFrom(this.loginService.currentUserId$());
    const group: RetroGroup = {ownerId: uid, name, created: new Date(), modified: new Date()};
    const newDoc = await this.inCtx(() => addDoc(collection(this.afs, 'retroGroup'), group));
    return newDoc.id;
  }

  public getGroup$(groupId: string): Observable<RetroGroupId | undefined> {
    return this.inCtx(() => docData(doc(this.afs, 'retroGroup/' + groupId), {idField: 'id'})) as Observable<RetroGroupId | undefined>;
  }

  public async renameGroup(groupId: string, name: string): Promise<void> {
    await this.inCtx(() => updateDoc(doc(this.afs, 'retroGroup/' + groupId), {name, modified: new Date()}));
  }

  // Alle Boards einer Gruppe (where groupId == groupId). Basis fuer die Gruppen-Seite (group.component).
  public listBoardsByGroup$(groupId: string): Observable<RetroBoardId[]> {
    return this.inCtx(() => collectionData(
      query(collection(this.afs, 'retro'), where('groupId', '==', groupId)),
      {idField: 'id'}
    )) as Observable<RetroBoardId[]>;
  }

  // Ordnet ein Board einer Gruppe zu (groupId gesetzt) oder loest es heraus (groupId == null ->
  // deleteField(), damit der Key ganz verschwindet statt eines null-Werts). Zwei Zweige, damit der
  // Feldwert typisiert string bzw. FieldValue bleibt und kein Union-Typ ins Objektliteral geraet.
  public async assignBoardToGroup(boardId: string, groupId: string | null): Promise<void> {
    if (groupId) {
      await this.inCtx(() => updateDoc(doc(this.afs, 'retro/' + boardId), {groupId, modified: new Date()}));
    } else {
      await this.inCtx(() => updateDoc(doc(this.afs, 'retro/' + boardId), {groupId: deleteField(), modified: new Date()}));
    }
  }

  // Loescht die Gruppe. Entschieden (Charting): enthaltene Boards bleiben erhalten und werden zu
  // Einzel-Boards (groupId entfernt) -- NICHT mitgeloescht. Board-Updates + Group-Delete laufen in
  // EINEM writeBatch (atomar, analog deleteBoard()).
  public async deleteGroup(groupId: string): Promise<void> {
    const boards = await firstValueFrom(this.listBoardsByGroup$(groupId));
    await this.inCtx(() => {
      const batch = writeBatch(this.afs);
      const now = new Date();
      boards.forEach(board => batch.update(doc(this.afs, 'retro/' + board.id), {groupId: deleteField(), modified: now}));
      batch.delete(doc(this.afs, 'retroGroup/' + groupId));
      return batch.commit();
    });
  }

  // ===========================================================================================
  // Vertreter-Feature: Vertreter (deputies) einer Gruppe + einmalige Freigabe-Codes (invites).
  // Rollen-Predikate liegen in retro-permissions.ts (rein/testbar). Beitritt ausschliesslich per Code.
  // ===========================================================================================

  // Fuegt eine reale uid zur deputies-Liste hinzu (Owner-Aktion bzw. Einloesung). arrayUnion ist
  // idempotent -> kein Doppel-Eintrag. Wird auch aus redeemInvite() heraus (in der Transaktion) gesetzt.
  public async addDeputy(groupId: string, uid: string): Promise<void> {
    await this.inCtx(() => updateDoc(doc(this.afs, 'retroGroup/' + groupId), {deputies: arrayUnion(uid), modified: new Date()}));
  }

  // Entfernt einen Vertreter (Owner-Aktion) -> verliert sofort die Rechte.
  public async removeDeputy(groupId: string, uid: string): Promise<void> {
    await this.inCtx(() => updateDoc(doc(this.afs, 'retroGroup/' + groupId), {deputies: arrayRemove(uid), modified: new Date()}));
  }

  // Gruppen, in denen der eingeloggte Nutzer Vertreter ist -- fuer den eigenen Abschnitt in der
  // Uebersicht (board-list). Guard/catchError exakt wie listMyGroups$ (anonyme Nutzer bzw. noch nicht
  // deployte Rules duerfen die Uebersicht nicht leeren).
  public listGroupsWhereDeputy$: Observable<RetroGroupId[]> = this.loginService.currentUserId$().pipe(
    mergeMap(uid => uid
      ? this.inCtx(() => collectionData(
        query(collection(this.afs, 'retroGroup'), where('deputies', 'array-contains', uid)),
        {idField: 'id'}
      )) as Observable<RetroGroupId[]>
      : of([] as RetroGroupId[])),
    distinctUntilChanged((a, b) => JSON.stringify(a) === JSON.stringify(b)),
    catchError(() => of([] as RetroGroupId[])),
  );

  // Owner erzeugt einen einmaligen Freigabe-Code: zufaellige, nicht herleitbare Doc-ID (crypto.randomUUID),
  // 3 Tage gueltig. Gibt den Code zurueck (fuer Anzeige/Link, siehe group.component). Der Code IST die
  // Doc-ID unter invites/{code}; die Collection ist per Rules nicht auflistbar (kein list) -> nicht
  // enumerierbar.
  public async createInvite(groupId: string): Promise<string> {
    const uid = await firstValueFrom(this.loginService.currentUserId$());
    const code = crypto.randomUUID();
    const invite: RetroInvite = {
      groupId,
      createdBy: uid ?? '',
      created: new Date(),
      expiresAt: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
    };
    await this.inCtx(() => setDoc(doc(this.afs, 'invites/' + code), invite));
    return code;
  }

  // Liest ein Invite-Doc per bekanntem Code (fuer die Vorschau auf der Einloese-Seite, Ticket 02).
  // Liefert null, wenn der Code unbekannt ist -- die eigentliche Gueltigkeitspruefung (abgelaufen?)
  // erledigt der Aufrufer bzw. massgeblich die Transaktion in redeemInvite().
  public async getInvite(code: string): Promise<RetroInvite | null> {
    const snap = await this.inCtx(() => getDoc(doc(this.afs, 'invites/' + code)));
    return snap.exists() ? snap.data() as RetroInvite : null;
  }

  // Loest einen Freigabe-Code ein: EINMALIG und nur binnen 3 Tagen. Alles in EINER Firestore-Transaktion
  // (atomar) -- so kann derselbe Code nicht doppelt eingeloest werden. Rueckgabe: {groupId} bei Erfolg,
  // 'not-found' (unbekannt/bereits eingeloest) oder 'expired' (abgelaufen; der Doc wird dabei aufgeraeumt).
  public async redeemInvite(code: string, uid: string): Promise<{ groupId: string } | 'not-found' | 'expired'> {
    return this.inCtx(() => runTransaction(this.afs, async (tx) => {
      const inviteRef = doc(this.afs, 'invites/' + code);
      const snap = await tx.get(inviteRef);
      if (!snap.exists()) {
        return 'not-found' as const;
      }
      const invite = snap.data() as RetroInvite;
      const exp = invite.expiresAt;
      const expiresMs = exp?.toDate ? exp.toDate().getTime() : new Date(exp).getTime();
      if (expiresMs < Date.now()) {
        tx.delete(inviteRef);
        return 'expired' as const;
      }
      tx.update(doc(this.afs, 'retroGroup/' + invite.groupId), {deputies: arrayUnion(uid), modified: new Date()});
      tx.delete(inviteRef);
      return {groupId: invite.groupId};
    }));
  }

  // Widerruft einen (offenen) Freigabe-Code -- nur der gerade erzeugte, in der Session bekannte Code
  // (invites ist bewusst nicht auflistbar, siehe Rules). Einmaligkeit + 3-Tage-TTL decken den Rest ab.
  public async revokeInvite(code: string): Promise<void> {
    await this.inCtx(() => deleteDoc(doc(this.afs, 'invites/' + code)));
  }
}

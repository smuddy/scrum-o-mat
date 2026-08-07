import {Component, inject, NgZone, OnDestroy} from '@angular/core';
import {CommonModule} from '@angular/common';
import {FormsModule} from '@angular/forms';
import {ActivatedRoute, Router} from '@angular/router';
import {BehaviorSubject, combineLatest, firstValueFrom, Observable, Subscription, timer} from 'rxjs';
import {distinctUntilChanged, map, shareReplay} from 'rxjs/operators';
import {CdkDrag, CdkDragDrop, CdkDragMove, CdkDropList, CdkDropListGroup} from '@angular/cdk/drag-drop';
import {FaIconComponent} from '@fortawesome/angular-fontawesome';
import {faPlus} from '@fortawesome/free-solid-svg-icons/faPlus';
import {faPen} from '@fortawesome/free-solid-svg-icons/faPen';
import {faTrash} from '@fortawesome/free-solid-svg-icons/faTrash';
import {faCheck} from '@fortawesome/free-solid-svg-icons/faCheck';
import {faTimes} from '@fortawesome/free-solid-svg-icons/faTimes';
import {faStopwatch} from '@fortawesome/free-solid-svg-icons/faStopwatch';
import {faArrowLeft} from '@fortawesome/free-solid-svg-icons/faArrowLeft';
import {faArrowRight} from '@fortawesome/free-solid-svg-icons/faArrowRight';
import {faStar} from '@fortawesome/free-solid-svg-icons/faStar';
import {faFaceSmile} from '@fortawesome/free-solid-svg-icons/faFaceSmile';

import {RetroService} from '../retro.service';
import {LoginService} from '../../login/login.service';
import {HeaderService} from '../../../shared/header/header.service';
import {MenuService} from '../../../shared/menu/menu.service';
import {RetroBoardId, RetroCardId, RetroColumn} from '../models/retro';
import {cardTransition} from '../../../animation';
import {TimerControlComponent} from './timer-control/timer-control.component';
import {ActionItemsComponent} from './action-items/action-items.component';
import {AutofocusDirective} from './autofocus.directive';
import {ID} from '../../../helpers/id';
import {boardToCsv, boardToMarkdown} from './export/retro-export';

interface ColumnView {
  column: RetroColumn;
  cards: RetroCardId[];
}

interface BoardView {
  board: RetroBoardId;
  columns: ColumnView[];
  myUid: string;
  isOwner: boolean;
  canInteract: boolean;
  usedVotes: number;
  canVote: boolean;
  displayTextById: { [cardId: string]: string };
  scrambledById: { [cardId: string]: boolean };
}

@Component({
  selector: 'app-retro-board',
  standalone: true,
  imports: [CommonModule, FormsModule, FaIconComponent, CdkDropListGroup, CdkDropList, CdkDrag, ActionItemsComponent, AutofocusDirective],
  templateUrl: './board.component.html',
  styleUrls: ['./board.component.less'],
  animations: [cardTransition],
})
export class BoardComponent implements OnDestroy {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private retroService = inject(RetroService);
  private loginService = inject(LoginService);
  private headerService = inject(HeaderService);
  private menuService = inject(MenuService);
  private zone = inject(NgZone);

  public boardId = this.route.snapshot.paramMap.get('boardId');

  public faPlus = faPlus;
  public faPen = faPen;
  public faTrash = faTrash;
  public faCheck = faCheck;
  public faTimes = faTimes;
  public faStopwatch = faStopwatch;
  public faArrowLeft = faArrowLeft;
  public faArrowRight = faArrowRight;
  public faStar = faStar;
  public faFaceSmile = faFaceSmile;

  // Ticket 15: Dot-Voting -- Stimmen-Kontingent pro Nutzer, boardweit (nicht je Spalte/Karte).
  // Stimmen sind stapelbar (mehrere Stimmen auf dieselbe Karte moeglich), siehe addVote()/removeVote().
  public readonly VOTES_PER_USER = 5;

  // Ticket 16: Emoji-Reaktionen -- fester Emoji-Satz, Toggle pro Nutzer und Emoji. Immer
  // sichtbar/erlaubt, auch bei board.hidden, siehe reactionCount()/hasReacted()/toggleReaction().
  // UI-Feintuning: nur Emojis mit reactionCount > 0 werden als Chip gezeigt (siehe activeReactions()),
  // neue Reaktionen kommen ueber das Auswahl-Panel dazu (siehe reactionPickerCardId weiter unten).
  public readonly REACTION_EMOJIS = ['👍', '❤️', '😄', '🎉', '😕'];

  // Ticket 16 (UI-Feintuning): Id der Karte, deren Emoji-Auswahl-Panel gerade geoeffnet ist (siehe
  // toggleReactionPicker()/Template). Rein lokaler UI-Zustand, kein Firestore-Write. null = kein
  // Panel offen; das Panel wird inline unterhalb der Reaktionen-Zeile aufgeklappt (kein Overlay/Popover,
  // siehe Kommentar bei .reaction-picker im Less).
  public reactionPickerCardId: string | null = null;

  public editingCardId: string | null = null;
  public editingText = '';
  // UI-Feintuning (Karten-"+" im Spalten-Header): Id der zuletzt per addAndEdit() neu angelegten
  // (leeren) Karte, solange sie noch im Edit-Modus ist. Wird gebraucht, um beim Abbrechen oder leeren
  // Speichern die leere Karte wieder zu loeschen, statt sie leer stehen zu lassen (siehe
  // addAndEdit()/cancelEdit()/saveEdit()). null, sobald der Edit-Vorgang beendet ist.
  public newlyAddedCardId: string | null = null;

  // Nur lokale Owner-Vorschau, kein Firestore-Write. Siehe isScrambled().
  public revealTemporarily = false;
  // Review-Fix: reiner Trigger fuer vm$ (Wert selbst wird ignoriert, buildBoardView() liest weiterhin
  // this.revealTemporarily direkt) -- ohne diesen Subject wuerde vm$ nach toggleReveal() nicht neu
  // emittieren, da revealTemporarily kein eigener Stream ist (siehe toggleReveal()).
  private revealTemporarily$ = new BehaviorSubject<boolean>(false);

  // Ticket 13: Owner-Bearbeitungsmodus fuer die Spalten (Name/Farbe/Reihenfolge/Hinzufuegen/
  // Entfernen im Column-Header, siehe Template). Rein lokaler UI-Zustand, siehe toggleEditColumns().
  public editColumns = false;
  // Editier-Puffer je Spalte, damit die Name-/Farb-Inputs per [(ngModel)] zwei-weg an einen simplen
  // Wert binden koennen statt direkt am (async-pipe-)Snapshot von vm.board.columns. Wird beim
  // Aktivieren des Edit-Modus aus dem aktuellen Board-Stand befuellt, siehe seedColumnDrafts().
  public columnNameDraft: { [columnId: string]: string } = {};
  public columnColorDraft: { [columnId: string]: string } = {};

  // Ziel-Karte und Zone des aktuell laufenden Karten-Drags (Drei-Zonen-Modell): oberes Drittel =
  // davor einsortieren, mittleres Drittel = mergen (nur Owner), unteres Drittel = dahinter
  // einsortieren. Rein lokaler UI-Zustand fuer das visuelle Feedback im Template
  // ([class.card--merge-target]/[class.card--drop-before]/[class.card--drop-after]), siehe
  // onCardDragMoved()/onCardDragEnded()/resolveDropTarget(). null = aktuell kein Drop-Ziel unter
  // dem Zeiger (bzw. kein Drag aktiv).
  public dropTargetCardId: string | null = null;
  public dropZone: 'before' | 'merge' | 'after' | null = null;

  // Letzter bekannter Board-Stand, waehrend der Betrachter Owner ist (siehe menuSubscription).
  // Wird benoetigt, um das Seitenleisten-Menu auch bei rein lokalen Aenderungen (z.B.
  // revealTemporarily via toggleReveal()) ohne neuen Firestore-Snapshot neu aufzubauen.
  private currentOwnerBoard: RetroBoardId | null = null;
  // Wird sekuendlich aus board.timerEndsAt bzw. board.timerPausedRemainingMs aktualisiert, siehe
  // tickSubscription weiter unten. null = kein Timer aktiv; Zahl (auch 0) = aktiver, abgelaufener
  // oder pausierter Timer.
  public remainingSeconds: number | null = null;
  // Ticket 14: true, waehrend der Timer pausiert ist (board.timerPausedRemainingMs != null) --
  // steuert die "Pausiert"-Kennzeichnung im Countdown-Display (siehe deriveCountdown()/Template).
  public paused = false;

  // Review-Fix (P5): multicastet, damit Board/Karten je Firestore-Snapshot nur EINEN Listener/Stream
  // fuer alle Konsumenten (vm$, tickSubscription, breadcrumbSubscription, menuSubscription) bedienen,
  // statt je Subscriber einen eigenen Firestore-Listener zu oeffnen.
  private board$ = this.retroService.getBoard$(this.boardId).pipe(shareReplay({bufferSize: 1, refCount: true}));
  private cards$ = this.retroService.getCards$(this.boardId).pipe(shareReplay({bufferSize: 1, refCount: true}));
  private myUid$ = this.loginService.authStateAllowAnonymous$.pipe(map(user => user.uid));
  // Live-Bearbeitungs-Hinweis: haelt die eigene uid ausserhalb von vm$ vor, da startEdit()/cancelEdit()/
  // ngOnDestroy() (kein vm-Parameter zur Hand) sie fuer RetroService.setCardEditing() brauchen.
  private myUid = '';
  private myUidSubscription: Subscription = this.myUid$.subscribe(uid => this.myUid = uid);
  private isOwner$ = combineLatest([this.loginService.currentUserId$(), this.board$]).pipe(
    map(([uid, board]) => !!board && uid === board.ownerId)
  );

  public vm$: Observable<BoardView | null> = combineLatest([this.board$, this.cards$, this.myUid$, this.isOwner$, this.revealTemporarily$]).pipe(
    map(([board, cards, myUid, isOwner]) => board ? this.buildBoardView(board, cards, myUid, isOwner) : null)
  );

  // Sekuendliches Ticking (Client-Uhr) fuer den Countdown, unabhaengig vom vm$-Rendering.
  // combineLatest mit board$ sorgt dafuer, dass ein neuer/aufgehobener Timer sofort einfliesst
  // und nicht erst beim naechsten Tick. Aufraeumen in ngOnDestroy (kein Leak).
  // Review-Fix (P6): laeuft ausserhalb der Angular-Zone (kein CD-Trigger pro Sekunden-Tick) und loest
  // zone.run() (und damit CD) nur aus, wenn sich der abgeleitete Wert tatsaechlich aendert.
  private tickSubscription: Subscription = this.zone.runOutsideAngular(() =>
    combineLatest([this.board$, timer(0, 1000)]).subscribe(([board]) => {
      const countdown = this.deriveCountdown(board);
      if (countdown.remainingSeconds === this.remainingSeconds && countdown.paused === this.paused) {
        return;
      }
      this.zone.run(() => {
        this.remainingSeconds = countdown.remainingSeconds;
        this.paused = countdown.paused;
      });
    }),
  );

  // Setzt den Breadcrumb "Retrospektive > <Bordname>" (Home rendert der Header davor), sobald das
  // Board geladen ist; dedupliziert nach Titel, damit nicht bei jedem Firestore-Update neu gesetzt wird.
  private breadcrumbSubscription: Subscription = this.board$.pipe(
    distinctUntilChanged((a, b) => a?.title === b?.title),
  ).subscribe(board => {
    const breadcrumb = [{route: '/retrospective', name: 'Retrospektive'}];
    if (board) {
      breadcrumb.push({route: '/retrospective/' + this.boardId, name: board.title});
    }
    this.headerService.setBreadcrumb(breadcrumb);
  });

  // Owner-Steuerung (Ticket 19): Die frueher inline im Template gerenderten Owner-Buttons (Hide/
  // Reveal/Timer/Loeschen) werden stattdessen in der Seitenleiste ueber den MenuService registriert.
  // Sobald Ownership feststeht (isOwner + Board vorhanden), wird das Menu ueber buildOwnerMenu()
  // (neu) aufgebaut -- u.a. damit Beschriftungen wie "Texte verstecken"/"Texte einblenden" synchron
  // zum aktuellen board.hidden bleiben. Ist der Betrachter kein Owner (mehr) oder das Board weg,
  // wird das Menu geleert. resetCustomActions() in buildOwnerMenu() verhindert Doppel-Registrierung
  // bei jedem Board-Update.
  private menuSubscription: Subscription = combineLatest([this.board$, this.isOwner$]).subscribe(([board, isOwner]) => {
    if (board && isOwner) {
      this.currentOwnerBoard = board;
      this.buildOwnerMenu(board);
    } else {
      this.currentOwnerBoard = null;
      this.menuService.resetCustomActions();
    }
  });

  public ngOnDestroy(): void {
    this.tickSubscription.unsubscribe();
    this.breadcrumbSubscription.unsubscribe();
    this.menuSubscription.unsubscribe();
    this.myUidSubscription.unsubscribe();
    this.menuService.resetCustomActions();
    // Live-Bearbeitungs-Hinweis: verlaesst der Betrachter das Board waehrend er eine BESTEHENDE Karte
    // bearbeitet (nicht die frisch per addAndEdit() angelegte -- die wird nie sichtbar verwaist, siehe
    // discardPendingNewCard()), wird der Indikator fuer andere Teilnehmer geleert (fire-and-forget).
    // Deckt normales Wegnavigieren ab; harter Tab-Close bleibt fuers MVP ungeloest (editingBy bleibt
    // dann stehen, bis dieselbe Karte erneut bearbeitet/gespeichert/gemergt wird).
    if (this.editingCardId && this.editingCardId !== this.newlyAddedCardId) {
      void this.retroService.setCardEditing(this.boardId, this.editingCardId, null);
    }
  }

  // Baut die Owner-Aktionen in der Seitenleiste (MenuService) neu auf. Timer-Variante (b): Start/Stopp
  // inkl. Minuten-Eingabefeld leben als eigene Component (TimerControlComponent) direkt als Menu-Zeile
  // (siehe MenuService.addCustomComponent) -- kein separates Eingabefeld mehr am Board.
  private buildOwnerMenu(board: RetroBoardId): void {
    this.menuService.resetCustomActions();
    this.menuService.addCustomAction(
      board.hidden ? 'Texte einblenden' : 'Texte verstecken',
      () => this.toggleHidden({board} as unknown as BoardView),
    );
    if (board.hidden) {
      this.menuService.addCustomAction(
        this.revealTemporarily ? 'Aufdeckung beenden' : 'Temporär aufdecken',
        () => this.toggleReveal(),
      );
    }
    this.menuService.addCustomComponent(TimerControlComponent, {boardId: this.boardId});
    this.menuService.addCustomAction(
      this.editColumns ? 'Bearbeiten beenden' : 'Spalten bearbeiten',
      () => this.toggleEditColumns(),
    );
    // Ticket 18: Export des kompletten Boards (Spalten/Karten inkl. Stimmen+Reaktionen sowie
    // Action-Items) als Markdown bzw. CSV, direkt als Browser-Download (siehe download() unten).
    // Reine Lese-Aktionen ohne Firestore-Write, daher kein confirm.
    this.menuService.addCustomAction('Export (Markdown)', () => this.exportMarkdown());
    this.menuService.addCustomAction('Export (CSV)', () => this.exportCsv());
    // Ticket 15: Owner kann das Stimmen-Kontingent aller Teilnehmer boardweit zuruecksetzen
    // (leere votes-Map je Karte, siehe RetroService.resetVotes()). Mit Bestaetigung, da destruktiv
    // und nicht auf die eigenen Stimmen beschraenkt.
    this.menuService.addCustomAction('Votes zurücksetzen', () => this.retroService.resetVotes(this.boardId), true);
    this.menuService.addCustomAction('Board löschen', () => this.deleteBoard(), true);
  }

  // Ticket 18: Export als Markdown -- liest Board/Karten/Action-Items je einmalig (firstValueFrom
  // statt Subscription, analog zu deleteBoard()/resetVotes() in RetroService), baut den Markdown-Text
  // ueber die reine boardToMarkdown()-Funktion (siehe export/retro-export.ts) und stoesst den Download an.
  public async exportMarkdown(): Promise<void> {
    const board = await firstValueFrom(this.retroService.getBoard$(this.boardId));
    if (!board) {
      return;
    }
    const cards = await firstValueFrom(this.retroService.getCards$(this.boardId));
    const actionItems = await firstValueFrom(this.retroService.getActionItems$(this.boardId));
    const markdown = boardToMarkdown(board, cards, actionItems);
    this.download(`retro-${this.sanitizeFilename(board.title)}.md`, markdown, 'text/markdown');
  }

  // Ticket 18: Export als CSV -- analog zu exportMarkdown(), aber ohne Action-Items (siehe
  // boardToCsv()/Ticket-Vorgabe: Kopfzeile Spalte/Karte/Stimmen).
  public async exportCsv(): Promise<void> {
    const board = await firstValueFrom(this.retroService.getBoard$(this.boardId));
    if (!board) {
      return;
    }
    const cards = await firstValueFrom(this.retroService.getCards$(this.boardId));
    const csv = boardToCsv(board, cards);
    this.download(`retro-${this.sanitizeFilename(board.title)}.csv`, csv, 'text/csv');
  }

  // Loest einen Browser-Download fuer den uebergebenen Text-Inhalt aus: Blob -> Object-URL -> temporaeres
  // <a download>-Element -> click() -> URL wieder freigeben. Kein sichtbarer DOM-Rest (Element wird nicht
  // angehaengt), analog zu gaengigen "Blob-Download ohne Dependency"-Patterns.
  private download(filename: string, content: string, mime: string): void {
    const blob = new Blob([content], {type: mime});
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
  }

  // Baut aus dem Board-Titel einen dateisystemtauglichen Dateinamen-Teil: klein geschrieben, alles
  // ausser a-z/0-9 wird zu "-" zusammengefasst, fuehrende/abschliessende "-" entfernt. Faellt der
  // Titel dabei komplett weg (z.B. nur Sonderzeichen), wird "board" als Fallback verwendet.
  private sanitizeFilename(title: string): string {
    const sanitized = title.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
    return sanitized || 'board';
  }

  // Editierbar fuer den Autor (eigene Karten sind nie gescrambled, siehe isScrambled()) oder den
  // Owner -- der Owner allerdings nur, solange die Karte fuer ihn lesbar ist (board nicht versteckt
  // bzw. waehrend "temporaer aufgedeckt", siehe isScrambled()). Reine Nicht-Autoren duerfen fremde
  // Karten nie editieren, unabhaengig von hidden.
  public canEdit(card: RetroCardId, vm: BoardView): boolean {
    return (card.authorId === vm.myUid || vm.isOwner) && !this.isScrambled(card, vm);
  }

  // UI-Feintuning: Sterne (Voting) und Reaktionen ergeben bei aktivem board.hidden keinen Sinn --
  // die Karten sind fuer alle bis auf den Autor gescrambled. Steuert im Template, ob die Vote-/
  // Reaktions-Controls (Sterne + Chips + Emoji-Dropdown) ueberhaupt gerendert werden. Bewusst nur an
  // board.hidden gekoppelt, NICHT an revealTemporarily -- der Owner-Bypass betrifft nur die
  // Lesbarkeit der Texte, nicht die Sinnhaftigkeit von Voting/Reaktionen waehrend der
  // Verstecken-Phase.
  public canInteract(vm: BoardView): boolean {
    return !vm.board.hidden;
  }

  // Live-Bearbeitungs-Hinweis: true, wenn die Karte aktuell von einem ANDEREN Teilnehmer bearbeitet
  // wird (card.editingBy gesetzt und != vm.myUid) -- steuert das dezente Pulsieren im Template
  // (.card--editing, siehe board.component.less). Die eigene Bearbeitung pulsiert bewusst nicht.
  public isBeingEditedByOther(card: RetroCardId, vm: BoardView): boolean {
    return !!card.editingBy && card.editingBy !== vm.myUid;
  }

  // Bestimmt, ob eine Karte per Drag&Drop verschoben werden darf (Basis fuer [cdkDragDisabled]).
  // Gleiche Regel wie canEdit: eigene Karte oder Owner.
  public canMove(card: RetroCardId, vm: BoardView): boolean {
    return card.authorId === vm.myUid || vm.isOwner;
  }

  // Ticket 15: Dot-Voting. Summe aller Stimmen auf dieser Karte (ueber alle Nutzer), immer sichtbar --
  // unabhaengig von board.hidden/isScrambled (siehe Template).
  public totalVotes(card: RetroCardId): number {
    return Object.values(card.votes ?? {}).reduce((sum, count) => sum + count, 0);
  }

  // Anzahl der Stimmen, die der aktuelle Betrachter (vm.myUid) auf dieser Karte hat (0, wenn keine).
  public myVotes(card: RetroCardId, vm: BoardView): number {
    return card.votes?.[vm.myUid] ?? 0;
  }

  // Summe der Stimmen des aktuellen Betrachters ueber ALLE Karten des Boards (Basis fuer das
  // boardweite Kontingent, siehe canVote()).
  public myUsedVotes(vm: BoardView): number {
    return vm.columns.reduce(
      (sum, colView) => sum + colView.cards.reduce((colSum, card) => colSum + this.myVotes(card, vm), 0),
      0,
    );
  }

  // true, solange der aktuelle Betrachter sein Stimmen-Kontingent (VOTES_PER_USER, boardweit) noch
  // nicht ausgeschoepft hat -- steuert die visuelle "voll"-Kennzeichnung des Stern-Buttons im
  // Template (siehe .card-vote-star--full); kein natives [disabled], addVote() greift ohnehin
  // selbst als Guard.
  public canVote(vm: BoardView): boolean {
    return this.myUsedVotes(vm) < this.VOTES_PER_USER;
  }

  // Fuegt eine eigene Stimme auf der Karte hinzu (stapelbar). No-op, wenn das Kontingent bereits
  // ausgeschoepft ist. Voting ist unabhaengig von board.hidden erlaubt.
  // Review-Fix (K1/Lost Update): schreibt nur noch den eigenen Stimmen-Key atomar per increment()
  // (RetroService.changeVote()) statt die komplette votes-Map aus dem evtl. veralteten Client-Snapshot
  // zu ueberschreiben.
  public async addVote(card: RetroCardId, vm: BoardView): Promise<void> {
    if (!this.canVote(vm)) {
      return;
    }
    await this.retroService.changeVote(this.boardId, card.id, vm.myUid, 1);
  }

  // Entfernt eine eigene Stimme von der Karte. Faellt die eigene Stimmenzahl auf 0, wird der
  // eigene Key komplett aus der votes-Map entfernt (statt eines 0-Eintrags, siehe
  // RetroService.clearUserVote()). No-op, wenn der Betrachter auf dieser Karte ohnehin keine Stimme hat.
  public async removeVote(card: RetroCardId, vm: BoardView): Promise<void> {
    const current = this.myVotes(card, vm);
    if (current <= 0) {
      return;
    }
    if (current - 1 <= 0) {
      await this.retroService.clearUserVote(this.boardId, card.id, vm.myUid);
    } else {
      await this.retroService.changeVote(this.boardId, card.id, vm.myUid, -1);
    }
  }

  // UI-Feintuning (Teil C): Rechtsklick auf den Stern in der Footer-Zeile entfernt eine eigene
  // Stimme (Linksklick fuegt ueber addVote() eine hinzu, siehe Template) -- unterdrueckt dafuer das
  // native Browser-Kontextmenue auf dem Stern.
  public onVoteContext(event: MouseEvent, card: RetroCardId, vm: BoardView): void {
    event.preventDefault();
    this.removeVote(card, vm);
  }

  // Ticket 16: Emoji-Reaktionen -- Anzahl der Reaktionen mit diesem Emoji auf der Karte (0, wenn
  // noch niemand mit diesem Emoji reagiert hat bzw. das Feld ganz fehlt).
  public reactionCount(card: RetroCardId, emoji: string): number {
    return card.reactions?.[emoji]?.length ?? 0;
  }

  // true, wenn der aktuelle Betrachter (vm.myUid) mit diesem Emoji auf der Karte reagiert hat --
  // steuert die Hervorhebung des Reaktions-Buttons im Template.
  public hasReacted(card: RetroCardId, emoji: string, vm: BoardView): boolean {
    return (card.reactions?.[emoji] ?? []).includes(vm.myUid);
  }

  // Togglet die eigene Reaktion auf ein Emoji. Immer erlaubt, unabhaengig von board.hidden (siehe
  // Template). Review-Fix (K2/Lost Update): schreibt nur noch die eigene uid atomar per arrayUnion/
  // arrayRemove (RetroService.addReaction()/removeReaction()) statt die komplette reactions-Map aus
  // dem evtl. veralteten Client-Snapshot zu ueberschreiben.
  public async toggleReaction(card: RetroCardId, emoji: string, vm: BoardView): Promise<void> {
    const alreadyReacted = (card.reactions?.[emoji] ?? []).includes(vm.myUid);
    if (alreadyReacted) {
      await this.retroService.removeReaction(this.boardId, card.id, emoji, vm.myUid);
    } else {
      await this.retroService.addReaction(this.boardId, card.id, emoji, vm.myUid);
    }
  }

  // Ticket 16 (UI-Feintuning): die als kompakte Chips angezeigten Reaktionen einer Karte -- nur
  // Emojis, mit denen bereits mindestens einmal reagiert wurde (reactionCount > 0), in der festen
  // REACTION_EMOJIS-Reihenfolge. Neue (noch unbenutzte) Emojis kommen ueber das Auswahl-Panel dazu
  // (siehe reactionPickerCardId/toggleReactionPicker()).
  public activeReactions(card: RetroCardId): string[] {
    return this.REACTION_EMOJIS.filter(emoji => this.reactionCount(card, emoji) > 0);
  }

  // Oeffnet/schliesst das Emoji-Auswahl-Panel fuer die uebergebene Karte. Erneuter Aufruf fuer dieselbe
  // Karte schliesst es wieder; Aufruf fuer eine andere Karte wechselt dorthin -- es ist nie mehr als
  // ein Panel gleichzeitig offen.
  public toggleReactionPicker(cardId: string): void {
    this.reactionPickerCardId = this.reactionPickerCardId === cardId ? null : cardId;
  }

  // Wird aus dem Emoji-Auswahl-Panel aufgerufen: togglet die Reaktion wie gehabt (toggleReaction())
  // und schliesst das Panel danach wieder.
  public async selectReaction(card: RetroCardId, emoji: string, vm: BoardView): Promise<void> {
    await this.toggleReaction(card, emoji, vm);
    this.reactionPickerCardId = null;
  }

  // Drop-Handler fuer die Karten-DnD: Drei-Zonen-Modell je Zielkarte (Ticket 07 / Neufassung).
  //
  // Bewusst KEINE verschachtelten cdkDropList-Elemente pro Karte (Karte gleichzeitig als cdkDrag UND
  // als eigene cdkDropList). Das wuerde die Spalten-DnD gefaehrden: CdkDrag ermittelt seine
  // "Heimat"-Liste ueber den naechsten Vorfahren mit cdkDropList (Angular-DI); eine Karte, die selbst
  // in einer eigenen 1-Item-Drop-Liste steckt, wuerde nicht mehr als Teil der Spalten-Liste gelten --
  // previousContainer/container.data waeren dann falsch und Reorder/Cross-Column-Move wuerden
  // brechen. Stattdessen bleibt die Spalten-DnD (eine cdkDropList pro Spalte,
  // cdkDropListSortingDisabled) unveraendert, und die Zielzone wird anhand der tatsaechlichen
  // Drop-Position erkannt: event.dropPoint (Viewport-Koordinaten) wird per resolveDropTarget() auf
  // die darunterliegende Karte (Attribut [data-card-id]) sowie deren vertikales Drittel gemappt.
  //
  // - oberes Drittel der Zielkarte -> davor einsortieren
  // - mittleres Drittel -> mergen (nur Owner; fuer Nicht-Owner liefert resolveDropTarget() nie 'merge')
  // - unteres Drittel -> dahinter einsortieren
  // - kein Treffer (Spaltenluecke/leer, oder Drop auf sich selbst) -> ans Ende der Zielspalte
  //
  // - Innerhalb derselben Spalte umsortieren ist ein Owner-Recht (Teilnehmer duerfen laut Spec nur
  //   zwischen Spalten verschieben, nicht innerhalb einer Spalte reordnen).
  // - Zwischen Spalten verschieben ist erlaubt, wenn canMove() fuer die gezogene Karte true ist.
  //
  // Massgeblich ist ausschliesslich die Persistenz via moveCard() (siehe persistColumnOrder()) --
  // dort werden die betroffenen Spalte(n) mit fortlaufenden order-Werten (0,1,2,...) neu geschrieben.
  // Die Ansicht synchronisiert sich danach ueber vm$ mit dem Firestore-Stand.
  public async onDrop(event: CdkDragDrop<RetroCardId[]>, vm: BoardView, targetColumnId: string): Promise<void> {
    const dragged = event.item.data as RetroCardId;
    const clear = () => { this.dropTargetCardId = null; this.dropZone = null; };
    if (!this.canMove(dragged, vm)) { clear(); return; }

    const target = event.dropPoint ? this.resolveDropTarget(event.dropPoint, dragged.id, vm.isOwner) : null;

    // Mittleres Drittel auf einer anderen Karte (nur Owner, da resolveDropTarget 'merge' nur bei allowMerge liefert) -> Merge.
    if (target && target.zone === 'merge') {
      await this.retroService.mergeCards(this.boardId, dragged.id, target.cardId);
      clear();
      return;
    }

    const sameColumn = dragged.columnId === targetColumnId;
    // Reorder INNERHALB einer Spalte ist Owner-Recht (Teilnehmer duerfen nur zwischen Spalten verschieben).
    if (sameColumn && !vm.isOwner) { clear(); return; }

    const targetCol = vm.columns.find(c => c.column.id === targetColumnId);
    if (!targetCol) { clear(); return; }

    const targetIds = targetCol.cards.map(c => c.id).filter(id => id !== dragged.id);
    let insertAt = targetIds.length; // Default: ans Ende (Drop in Luecke/leer)
    if (target) {
      const ti = targetIds.indexOf(target.cardId);
      if (ti !== -1) insertAt = target.zone === 'after' ? ti + 1 : ti;
    }
    targetIds.splice(insertAt, 0, dragged.id);

    await this.persistColumnOrder(targetIds, targetColumnId);
    if (!sameColumn) {
      const sourceCol = vm.columns.find(c => c.column.id === dragged.columnId);
      if (sourceCol) {
        await this.persistColumnOrder(sourceCol.cards.map(c => c.id).filter(id => id !== dragged.id), dragged.columnId);
      }
    }
    clear();
  }

  // Vergibt fortlaufende order-Werte (0,1,2,...) entsprechend der uebergebenen Reihenfolge und
  // schreibt columnId + order fuer alle betroffenen Karten in EINEM Batch (RetroService.moveCards())
  // nach Firestore. Deckt damit sowohl reines Reorder als auch Cross-Column-Moves ab (siehe onDrop()).
  // Review-Fix (P7): ein Batch-Write statt N Einzel-Writes; leere Liste loest gar keinen Aufruf aus.
  private async persistColumnOrder(cardIds: string[], columnId: string): Promise<void> {
    if (cardIds.length === 0) {
      return;
    }
    const moves = cardIds.map((cardId, index) => ({cardId, columnId, order: index}));
    await this.retroService.moveCards(this.boardId, moves);
  }

  // Ermittelt anhand eines Viewport-Punkts (event.dropPoint bzw. event.pointerPosition), ob der
  // Zeiger ueber einer ANDEREN Karte ([data-card-id] im Template) liegt, und falls ja, in welchem
  // vertikalen Drittel des Ziel-Kartenrechtecks: oberes Drittel = 'before', unteres Drittel = 'after',
  // mittleres Drittel = 'merge' (nur wenn allowMerge, d.h. Betrachter ist Owner). Fuer Nicht-Owner
  // gibt es keine Merge-Zone -- dann teilt die Kartenmitte (50%) nur in 'before'/'after'. Liefert
  // null, wenn kein Ziel getroffen wurde (Spaltenluecke/leer, Drop auf die gezogene Karte selbst,
  // oder -- etwa in Tests bzw. Umgebungen ohne document.elementFromPoint -- wenn keine Hit-Erkennung
  // moeglich ist).
  private resolveDropTarget(point: {x: number; y: number}, draggedCardId: string, allowMerge: boolean):
      { cardId: string; zone: 'before' | 'merge' | 'after' } | null {
    if (typeof document === 'undefined' || typeof document.elementFromPoint !== 'function') {
      return null;
    }
    const el = document.elementFromPoint(point.x, point.y) as HTMLElement | null;
    const cardEl = el?.closest<HTMLElement>('[data-card-id]') ?? null;
    const cardId = cardEl?.dataset['cardId'] ?? null;
    if (!cardEl || !cardId || cardId === draggedCardId) {
      return null;
    }
    const rect = cardEl.getBoundingClientRect();
    const rel = rect.height > 0 ? Math.min(1, Math.max(0, (point.y - rect.top) / rect.height)) : 0.5;
    let zone: 'before' | 'merge' | 'after';
    if (allowMerge) {
      zone = rel < 1 / 3 ? 'before' : (rel > 2 / 3 ? 'after' : 'merge');
    } else {
      zone = rel < 0.5 ? 'before' : 'after';
    }
    return {cardId, zone};
  }

  // Waehrend eines laufenden Drags (cdkDragMoved) aktualisiert dies dropTargetCardId/dropZone fuer
  // das visuelle Feedback im Template (Merge-Rahmen bzw. Einfuege-Linien vor/nach der Zielkarte).
  // Fuer ALLE Betrachter relevant (nicht nur Owner) -- fuer Nicht-Owner liefert resolveDropTarget()
  // wegen allowMerge=false nur 'before'/'after', nie 'merge'.
  // Review-Fix (Performance): schreibt dropTargetCardId/dropZone nur bei tatsaechlicher Aenderung --
  // cdkDragMoved feuert sehr haeufig (jede Pointer-Bewegung), ohne Guard wuerde das bei unveraendertem
  // Zonen-Zustand unnoetig CD ausloesen.
  public onCardDragMoved(event: CdkDragMove<RetroCardId>, vm: BoardView): void {
    const target = this.resolveDropTarget(event.pointerPosition, event.source.data.id, vm.isOwner);
    const cardId = target?.cardId ?? null;
    const zone = target?.zone ?? null;
    if (cardId === this.dropTargetCardId && zone === this.dropZone) {
      return;
    }
    this.dropTargetCardId = cardId;
    this.dropZone = zone;
  }

  // Raeumt den Hover-Zustand auf, sobald ein Drag endet (unabhaengig davon, ob es zu einem Move,
  // einem Merge oder einem Abbruch kam).
  public onCardDragEnded(): void {
    this.dropTargetCardId = null;
    this.dropZone = null;
  }

  public startEdit(card: RetroCardId): void {
    // Wechselt man von einer noch offenen, frisch per addAndEdit() angelegten (leeren) Karte weg,
    // wird diese aufgeraeumt (fire-and-forget), damit keine verwaiste leere Karte zurueckbleibt.
    if (this.newlyAddedCardId && this.newlyAddedCardId !== card.id) {
      void this.discardPendingNewCard();
    }
    this.editingCardId = card.id;
    this.editingText = card.text;
    // Live-Bearbeitungs-Hinweis: markiert die Karte als "wird gerade bearbeitet" fuer andere
    // Teilnehmer (siehe isBeingEditedByOther()/RetroService.setCardEditing()). Fire-and-forget, analog
    // zu discardPendingNewCard() oben -- der Edit-Modus soll nicht auf den Firestore-Write warten.
    void this.retroService.setCardEditing(this.boardId, card.id, this.myUid);
  }

  // Loescht eine ueber addAndEdit() angelegte, aber nie bestaetigte/abgebrochene leere Karte, bevor
  // zu einer anderen Karte gewechselt wird. newlyAddedCardId wird synchron geleert, damit der Zustand
  // unmittelbar konsistent ist; der Firestore-Delete laeuft asynchron.
  private async discardPendingNewCard(): Promise<void> {
    const pendingId = this.newlyAddedCardId;
    if (!pendingId) {
      return;
    }
    this.newlyAddedCardId = null;
    await this.retroService.deleteCard(this.boardId, pendingId);
  }

  // Re-Entrancy-Guard fuer addAndEdit(): verhindert, dass schnelle Mehrfachklicks auf "+" mehrere
  // leere Karten anlegen (async-Race: discardPendingNewCard() liest newlyAddedCardId, bevor der vorige
  // addAndEdit()-Aufruf es nach dem addCard()-await gesetzt hat).
  private addingCard = false;

  // UI-Feintuning (Teil B): "+"-Button im Spalten-Header -- legt sofort eine leere Karte an und
  // oeffnet den Edit-Modus dafuer; die leere Karte rendert ueber den bestehenden
  // editingCardId===card.id-Zweig als Textarea (siehe Template, appAutofocus fokussiert sie sofort).
  // Fuer ALLE Betrachter verfuegbar (nicht nur Owner), auch waehrend board.hidden aktiv ist.
  public async addAndEdit(columnId: string): Promise<void> {
    if (this.addingCard) {
      return;
    }
    this.addingCard = true;
    try {
      // Eine evtl. noch offene, frisch angelegte leere Karte zuerst aufraeumen (kein Verwaisen).
      await this.discardPendingNewCard();
      const id = await this.retroService.addCard(this.boardId, columnId, '');
      this.newlyAddedCardId = id;
      this.editingCardId = id;
      this.editingText = '';
    } finally {
      this.addingCard = false;
    }
  }

  // Setzt den Edit-Zustand zurueck (nach Abbruch oder Speichern), siehe cancelEdit()/saveEdit().
  private resetEditState(): void {
    this.editingCardId = null;
    this.editingText = '';
    this.newlyAddedCardId = null;
  }

  // Bricht den Edit-Vorgang ab. War die gerade bearbeitete Karte die ueber addAndEdit() frisch
  // angelegte (leere) Karte, wird sie dabei geloescht statt leer stehen zu bleiben.
  public async cancelEdit(): Promise<void> {
    const cardId = this.editingCardId;
    if (cardId && cardId === this.newlyAddedCardId) {
      await this.retroService.deleteCard(this.boardId, cardId);
    } else if (cardId) {
      // Live-Bearbeitungs-Hinweis: Abbruch ohne Speichern beendet den Bearbeitungs-Vorgang -- Indikator
      // fuer andere Teilnehmer wieder leeren. Frisch angelegte Karten (Zweig oben) werden ohnehin
      // geloescht, dafuer ist kein separates Leeren noetig.
      await this.retroService.setCardEditing(this.boardId, cardId, null);
    }
    this.resetEditState();
  }

  public async saveEdit(cardId: string): Promise<void> {
    const text = this.editingText.trim();
    if (!text) {
      // Leerer Text beendet den Edit -> die Karte wird geloescht, egal ob frisch angelegt oder
      // bestehend (eine leere Karte hat keinen Wert). Deckt auch "editiert und komplett geleert" ab.
      await this.retroService.deleteCard(this.boardId, cardId);
      this.resetEditState();
      return;
    }
    await this.retroService.updateCardText(this.boardId, cardId, text);
    this.resetEditState();
  }

  public async deleteCard(cardId: string): Promise<void> {
    if (this.editingCardId === cardId) {
      this.resetEditState();
    }
    await this.retroService.deleteCard(this.boardId, cardId);
  }

  public async toggleHidden(vm: BoardView): Promise<void> {
    await this.retroService.setHidden(this.boardId, !vm.board.hidden);
  }

  public toggleReveal(): void {
    this.revealTemporarily = !this.revealTemporarily;
    // Stoesst vm$ neu an (siehe revealTemporarily$ oben) -- buildBoardView() liest weiterhin direkt
    // this.revealTemporarily, der emittierte Wert selbst wird ignoriert.
    this.revealTemporarily$.next(this.revealTemporarily);
    // Rein lokale Aenderung (kein Firestore-Write, kein neuer board$-Snapshot) -- das Menu muss
    // deshalb hier explizit neu aufgebaut werden, damit das Label synchron bleibt.
    if (this.currentOwnerBoard) {
      this.buildOwnerMenu(this.currentOwnerBoard);
    }
  }

  // Ticket 13: schaltet den Spalten-Bearbeitungsmodus um (Name/Farbe/Reihenfolge/Entfernen/
  // Hinzufuegen im Column-Header, siehe Template). Analog zu toggleReveal() eine rein lokale
  // UI-Aenderung (kein Firestore-Write) -- das Menu wird deshalb hier explizit neu aufgebaut, damit
  // das Label ("Spalten bearbeiten" <-> "Bearbeiten beenden") synchron bleibt. Beim Aktivieren werden
  // die Editier-Puffer aus dem aktuellen Board-Stand neu befuellt, damit die Inputs nicht mit
  // veralteten/leeren Werten starten.
  public toggleEditColumns(): void {
    this.editColumns = !this.editColumns;
    if (this.editColumns && this.currentOwnerBoard) {
      this.seedColumnDrafts(this.currentOwnerBoard.columns);
    }
    if (this.currentOwnerBoard) {
      this.buildOwnerMenu(this.currentOwnerBoard);
    }
  }

  private seedColumnDrafts(columns: RetroColumn[]): void {
    this.columnNameDraft = {};
    this.columnColorDraft = {};
    for (const column of columns) {
      this.columnNameDraft[column.id] = column.name;
      this.columnColorDraft[column.id] = column.color;
    }
  }

  // Liefert vm.board.columns sortiert nach order (Basis fuer Reorder/Remove, wo die tatsaechliche
  // Reihenfolge relevant ist -- anders als bei Rename/Recolor, die order unangetastet lassen).
  private sortedColumns(vm: BoardView): RetroColumn[] {
    return [...vm.board.columns].sort((a, b) => a.order - b.order);
  }

  public isFirstColumn(vm: BoardView, columnId: string): boolean {
    const sorted = this.sortedColumns(vm);
    return sorted.length > 0 && sorted[0].id === columnId;
  }

  public isLastColumn(vm: BoardView, columnId: string): boolean {
    const sorted = this.sortedColumns(vm);
    return sorted.length > 0 && sorted[sorted.length - 1].id === columnId;
  }

  // Ein Board braucht mindestens eine Spalte -- die letzte Spalte darf nicht entfernt werden
  // (Entfernen-Button ist dann im Template deaktiviert, siehe canRemoveColumn()).
  public canRemoveColumn(vm: BoardView): boolean {
    return vm.board.columns.length > 1;
  }

  // Persistiert eine Namensaenderung aus dem Editier-Puffer (columnNameDraft) via
  // retroService.updateColumns(). Leerer/nur-Whitespace-Name wird ignoriert (kein Write).
  public async renameColumn(vm: BoardView, columnId: string): Promise<void> {
    const name = (this.columnNameDraft[columnId] ?? '').trim();
    if (!name) {
      return;
    }
    const columns = vm.board.columns.map(column => column.id === columnId ? {...column, name} : {...column});
    await this.retroService.updateColumns(this.boardId, columns);
  }

  // Persistiert eine Farbaenderung aus dem Editier-Puffer (columnColorDraft) via
  // retroService.updateColumns().
  public async recolorColumn(vm: BoardView, columnId: string): Promise<void> {
    const color = this.columnColorDraft[columnId];
    if (!color) {
      return;
    }
    const columns = vm.board.columns.map(column => column.id === columnId ? {...column, color} : {...column});
    await this.retroService.updateColumns(this.boardId, columns);
  }

  // Fuegt eine neue Spalte am Ende an (order = aktuelle Anzahl) und befuellt gleich den Editier-
  // Puffer dafuer, damit die neuen Inputs im Edit-Modus sofort korrekte Werte zeigen.
  public async addColumn(vm: BoardView): Promise<void> {
    const newColumn: RetroColumn = {id: ID(), name: 'Neue Spalte', color: '#9e9e9e', order: vm.board.columns.length};
    const columns = [...vm.board.columns.map(column => ({...column})), newColumn];
    await this.retroService.updateColumns(this.boardId, columns);
    this.columnNameDraft[newColumn.id] = newColumn.name;
    this.columnColorDraft[newColumn.id] = newColumn.color;
  }

  // Tauscht die order der Spalte mit ihrem linken (-1) bzw. rechten (+1) Nachbarn und schreibt
  // fortlaufende order-Werte (0..n-1) fuer alle Spalten. No-op am jeweiligen Rand (erste Spalte kann
  // nicht weiter nach links, letzte nicht weiter nach rechts -- siehe isFirstColumn()/isLastColumn()
  // fuer die Button-Deaktivierung im Template).
  public async moveColumn(vm: BoardView, columnId: string, direction: -1 | 1): Promise<void> {
    const sorted = this.sortedColumns(vm);
    const index = sorted.findIndex(column => column.id === columnId);
    const swapIndex = index + direction;
    if (index < 0 || swapIndex < 0 || swapIndex >= sorted.length) {
      return;
    }
    const reordered = [...sorted];
    [reordered[index], reordered[swapIndex]] = [reordered[swapIndex], reordered[index]];
    const columns = reordered.map((column, i) => ({...column, order: i}));
    await this.retroService.updateColumns(this.boardId, columns);
  }

  // Entfernt eine Spalte nicht-destruktiv: enthaelt sie Karten, wird der Owner erst um Bestaetigung
  // gebeten (window.confirm) -- bei Zustimmung werden alle Karten der Spalte in die ERSTE VERBLEIBENDE
  // Spalte (nach order) umgehaengt (angehaengt HINTER deren vorhandene Karten), BEVOR die Spalte selbst
  // aus dem columns-Array entfernt und mit neu vergebenen order-Werten (0..n-1) via updateColumns()
  // persistiert wird. Die letzte verbleibende Spalte kann nicht entfernt werden (siehe canRemoveColumn()).
  // Review-Fix (K4): die Zielspalte wird komplett neu durchnummeriert (bestehende + verschobene Karten
  // in EINEM moveCards()-Batch) statt nur an vm.columns.length der Zielspalte anzuknuepfen -- das war
  // fragil, sobald die order-Werte der Zielspalte bereits Luecken/Dopplungen hatten.
  public async removeColumn(vm: BoardView, columnId: string): Promise<void> {
    if (!this.canRemoveColumn(vm)) {
      return;
    }
    const columnView = vm.columns.find(cv => cv.column.id === columnId);
    if (!columnView) {
      return;
    }
    if (columnView.cards.length > 0 && !confirm('Diese Spalte enthält Karten. Sie werden beim Entfernen in die erste verbleibende Spalte verschoben. Fortfahren?')) {
      return;
    }
    const remaining = this.sortedColumns(vm).filter(column => column.id !== columnId);
    const targetColumnId = remaining[0]?.id;
    if (targetColumnId && columnView.cards.length > 0) {
      const targetCol = vm.columns.find(cv => cv.column.id === targetColumnId);
      const orderedIds = [...(targetCol?.cards ?? []).map(c => c.id), ...columnView.cards.map(c => c.id)];
      const moves = orderedIds.map((cardId, index) => ({cardId, columnId: targetColumnId, order: index}));
      await this.retroService.moveCards(this.boardId, moves);
    }
    const columns = remaining.map((column, i) => ({...column, order: i}));
    await this.retroService.updateColumns(this.boardId, columns);
  }

  // Owner-Control (Ticket 19): loescht das komplette Board (inkl. Karten, siehe RetroService.deleteBoard)
  // und navigiert danach zurueck zur Retro-Uebersicht. Wird ausschliesslich ueber das Seitenleisten-Menu
  // ausgeloest (mit Bestaetigung, siehe buildOwnerMenu()).
  public async deleteBoard(): Promise<void> {
    await this.retroService.deleteBoard(this.boardId);
    await this.router.navigateByUrl('/retrospective');
  }

  // Restzeit in ganzen Sekunden (aufgerundet) bis timerEndsAt, niemals negativ.
  // null, wenn kein Timer aktiv ist (timerEndsAt null/undefined).
  public getRemainingSeconds(timerEndsAt: any, now: Date = new Date()): number | null {
    if (timerEndsAt === null || timerEndsAt === undefined) {
      return null;
    }
    const endsAt = BoardComponent.toDate(timerEndsAt);
    return Math.max(0, Math.ceil((endsAt.getTime() - now.getTime()) / 1000));
  }

  // Ticket 14: leitet Restzeit + Pausen-Kennzeichnung aus einem Board-Snapshot ab (Basis fuer
  // tickSubscription oben). Ausgelagert als reine Funktion, damit sie unabhaengig von der
  // Timer-Subscription direkt testbar ist (siehe board.component.spec.ts). Pausiert
  // (board.timerPausedRemainingMs != null) hat Vorrang und liefert die eingefrorene Restzeit ohne
  // Ticking; sonst wie bisher aus board.timerEndsAt via getRemainingSeconds().
  public deriveCountdown(board: RetroBoardId | null | undefined, now: Date = new Date()): { remainingSeconds: number | null; paused: boolean } {
    if (!board) {
      return {remainingSeconds: null, paused: false};
    }
    if (board.timerPausedRemainingMs != null) {
      return {remainingSeconds: Math.max(0, Math.ceil(board.timerPausedRemainingMs / 1000)), paused: true};
    }
    return {remainingSeconds: this.getRemainingSeconds(board.timerEndsAt, now), paused: false};
  }

  // Formatiert Restzeit als mm:ss, zero-padded. Negative Werte werden auf 0 geklemmt (-> "00:00").
  public formatRemaining(seconds: number): string {
    const clamped = Math.max(0, Math.floor(seconds));
    const minutes = Math.floor(clamped / 60).toString().padStart(2, '0');
    const secs = (clamped % 60).toString().padStart(2, '0');
    return `${minutes}:${secs}`;
  }

  // Entscheidet, ob eine Karte fuer den aktuellen Betrachter gescrambled dargestellt werden muss.
  // Bei aktivem hidden sieht NUR der Autor seine eigene Karte im Klartext; alle anderen -- inklusive
  // des Owners -- sehen den Scramble. Der Owner kann per revealTemporarily (lokaler Bypass, kein
  // Firestore-Write) voruebergehend alle Texte aufdecken. Ist hidden aus, sehen alle den Klartext.
  public isScrambled(card: RetroCardId, vm: BoardView): boolean {
    if (!vm.board.hidden) {
      return false;
    }
    if (card.authorId === vm.myUid) {
      return false;
    }
    if (vm.isOwner && this.revealTemporarily) {
      return false;
    }
    return true;
  }

  // Liefert den im Template anzuzeigenden Text: Klartext oder deterministisch gescrambelten Ersatztext.
  // Der echte Text wird im Scramble-Fall NICHT ins DOM geschrieben.
  public displayText(card: RetroCardId, vm: BoardView): string {
    if (!this.isScrambled(card, vm)) {
      return card.text;
    }
    return BoardComponent.scrambleText(card.id, card.text);
  }

  // Deterministischer, Client-seitiger "Best effort"-Scramble: pro Karte + Zeichenindex ein stabiler
  // Hash, damit der Ersatztext bei jedem Re-Render identisch bleibt (kein Flackern). Buchstaben/Ziffern
  // werden innerhalb ihrer Zeichenklasse ersetzt, Leerzeichen/Zeilenumbrueche und sonstige Zeichen bleiben erhalten,
  // sodass Laenge und grobe Struktur (Woerter/Zeilen) erhalten bleiben.
  private static readonly LOWER = 'abcdefghijklmnopqrstuvwxyz';
  private static readonly UPPER = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  private static readonly DIGITS = '0123456789';

  // Normalisiert timerEndsAt zu einem JS-Date: Firestore liefert i.d.R. einen Timestamp mit
  // toDate(), lokale/Test-Werte sind meist schon ein Date. new Date(value) als Fallback deckt
  // ausserdem ISO-Strings/Millis ab.
  private static toDate(value: any): Date {
    if (value && typeof value.toDate === 'function') {
      return value.toDate();
    }
    return new Date(value);
  }

  private static hashSeed(cardId: string, index: number): number {
    const input = cardId + ':' + index;
    let hash = 0;
    for (let i = 0; i < input.length; i++) {
      hash = (hash * 31 + input.charCodeAt(i)) | 0;
    }
    return Math.abs(hash);
  }

  private static scrambleText(cardId: string, text: string): string {
    let result = '';
    for (let i = 0; i < text.length; i++) {
      const char = text[i];
      if (/\s/.test(char)) {
        result += char;
        continue;
      }
      const seed = BoardComponent.hashSeed(cardId, i);
      if (/[a-z]/.test(char)) {
        result += BoardComponent.LOWER[seed % BoardComponent.LOWER.length];
      } else if (/[A-Z]/.test(char)) {
        result += BoardComponent.UPPER[seed % BoardComponent.UPPER.length];
      } else if (/[0-9]/.test(char)) {
        result += BoardComponent.DIGITS[seed % BoardComponent.DIGITS.length];
      } else {
        result += char;
      }
    }
    return result;
  }

  private buildBoardView(board: RetroBoardId, cards: RetroCardId[], myUid: string, isOwner: boolean): BoardView {
    const columns = [...board.columns]
      .sort((a, b) => a.order - b.order)
      .map((column): ColumnView => ({
        column,
        cards: cards.filter(card => card.columnId === column.id).sort((a, b) => a.order - b.order),
      }));
    // Review-Fix (K-LOW): Karten mit unbekannter columnId fielen bisher still aus der Ansicht -> an die
    // erste Spalte hängen, damit sie sichtbar/verschiebbar bleiben.
    const knownColumnIds = new Set(board.columns.map(c => c.id));
    const orphaned = cards.filter(card => !knownColumnIds.has(card.columnId));
    if (orphaned.length > 0 && columns.length > 0) {
      columns[0] = {column: columns[0].column, cards: [...columns[0].cards, ...orphaned].sort((a, b) => a.order - b.order)};
    }
    // Review-Fix (Performance P2/P4): abgeleitete Werte EINMALIG je Emission statt pro CD-Zyklus/Karte.
    const vmLike = {board, columns, myUid, isOwner} as BoardView;
    const displayTextById: { [cardId: string]: string } = {};
    const scrambledById: { [cardId: string]: boolean } = {};
    let usedVotes = 0;
    for (const card of cards) {
      const scrambled = this.isScrambled(card, vmLike);
      scrambledById[card.id] = scrambled;
      displayTextById[card.id] = scrambled ? BoardComponent.scrambleText(card.id, card.text) : card.text;
      usedVotes += card.votes?.[myUid] ?? 0;
    }
    return {
      board, columns, myUid, isOwner,
      canInteract: !board.hidden,
      usedVotes,
      canVote: usedVotes < this.VOTES_PER_USER,
      displayTextById,
      scrambledById,
    };
  }
}

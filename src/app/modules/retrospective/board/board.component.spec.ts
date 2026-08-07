import {describe, it, expect, beforeEach, afterEach, vi} from 'vitest';
import {ComponentFixture, TestBed} from '@angular/core/testing';
import {NO_ERRORS_SCHEMA} from '@angular/core';
import {NoopAnimationsModule} from '@angular/platform-browser/animations';
import {ActivatedRoute, Router} from '@angular/router';
import {of} from 'rxjs';

import {BoardComponent} from './board.component';
import {RetroService} from '../retro.service';
import {LoginService} from '../../login/login.service';
import {MenuService} from '../../../shared/menu/menu.service';
import {RetroBoardId, RetroCardId, RetroColumn} from '../models/retro';
import {TimerControlComponent} from './timer-control/timer-control.component';

describe('BoardComponent', () => {
  let component: BoardComponent;
  let fixture: ComponentFixture<BoardComponent>;
  let retroService: any;
  let loginService: any;
  let menuService: any;
  let router: any;

  const board: RetroBoardId = {
    id: 'board1',
    ownerId: 'owner1',
    title: 'Sprint Retro',
    columns: [],
    hidden: false,
    timerEndsAt: null,
    created: new Date(),
    modified: new Date(),
  };

  beforeEach(async () => {
    retroService = {
      getBoard$: vi.fn().mockReturnValue(of(board)),
      getCards$: vi.fn().mockReturnValue(of([])),
      // Ticket 17: BoardComponent bindet die neue ActionItemsComponent unterhalb der Spalten ein
      // (siehe board.component.html); deren ngOnInit ruft getActionItems$ ueber denselben (gemockten)
      // RetroService auf, sonst schlaegt bereits das aeussere fixture.detectChanges() fehl.
      getActionItems$: vi.fn().mockReturnValue(of([])),
      setHidden: vi.fn().mockResolvedValue(undefined),
      setTimer: vi.fn().mockResolvedValue(undefined),
      updateCardText: vi.fn().mockResolvedValue(undefined),
      setCardEditing: vi.fn().mockResolvedValue(undefined),
      addCard: vi.fn().mockResolvedValue(undefined),
      deleteCard: vi.fn().mockResolvedValue(undefined),
      mergeCards: vi.fn().mockResolvedValue(undefined),
      deleteBoard: vi.fn().mockResolvedValue(undefined),
      updateColumns: vi.fn().mockResolvedValue(undefined),
      resetVotes: vi.fn().mockResolvedValue(undefined),
      moveCards: vi.fn().mockResolvedValue(undefined),
      changeVote: vi.fn().mockResolvedValue(undefined),
      clearUserVote: vi.fn().mockResolvedValue(undefined),
      addReaction: vi.fn().mockResolvedValue(undefined),
      removeReaction: vi.fn().mockResolvedValue(undefined),
    };

    loginService = {
      authStateAllowAnonymous$: of({uid: 'owner1'}),
      currentUserId$: vi.fn().mockReturnValue(of('owner1')),
    };

    // Owner-Aktionen (Ticket 19) laufen ueber die Seitenleiste (MenuService) statt inline im Template.
    // addCustomComponent wird fuer die TimerControlComponent-Menuzeile benoetigt (siehe buildOwnerMenu()).
    menuService = {addCustomAction: vi.fn(), addCustomComponent: vi.fn(), resetCustomActions: vi.fn()};
    router = {navigateByUrl: vi.fn().mockResolvedValue(true)};

    await TestBed.configureTestingModule({
      imports: [BoardComponent, NoopAnimationsModule],
      schemas: [NO_ERRORS_SCHEMA],
      providers: [
        {provide: ActivatedRoute, useValue: {snapshot: {paramMap: {get: () => 'board1'}}}},
        {provide: RetroService, useValue: retroService},
        {provide: LoginService, useValue: loginService},
        {provide: MenuService, useValue: menuService},
        {provide: Router, useValue: router},
      ],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(BoardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => {
    // Destroy triggert ngOnDestroy und damit das Unsubscriben der Timer-Ticking-Subscription
    // (siehe auch expliziten Leak-Test weiter unten); verhindert offene Intervals ueber die Suite hinweg.
    fixture.destroy();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('toggleHidden', () => {
    it('flips the hidden flag on the retro service via setHidden', async () => {
      const vm = {board: {...board, hidden: false}} as any;

      await component.toggleHidden(vm);

      expect(retroService.setHidden).toHaveBeenCalledWith('board1', true);
    });

    it('unhides again when the board is currently hidden', async () => {
      const vm = {board: {...board, hidden: true}} as any;

      await component.toggleHidden(vm);

      expect(retroService.setHidden).toHaveBeenCalledWith('board1', false);
    });
  });

  describe('toggleReveal', () => {
    it('toggles the local reveal state without touching Firestore', () => {
      expect(component.revealTemporarily).toBe(false);

      component.toggleReveal();
      expect(component.revealTemporarily).toBe(true);
      expect(retroService.setHidden).not.toHaveBeenCalled();

      component.toggleReveal();
      expect(component.revealTemporarily).toBe(false);
    });
  });

  describe('isScrambled / displayText', () => {
    const hiddenBoard = {...board, hidden: true};
    const foreignCard: RetroCardId = {
      id: 'card1',
      text: 'Hello World 123',
      columnId: 'col1',
      authorId: 'someoneElse',
      order: 0,
      created: new Date(),
      modified: new Date(),
    };

    it('shows plaintext when the board is not hidden', () => {
      const vm = {board: {...board, hidden: false}, myUid: 'me', isOwner: false, columns: []} as any;

      expect(component.isScrambled(foreignCard, vm)).toBe(false);
      expect(component.displayText(foreignCard, vm)).toBe(foreignCard.text);
    });

    it('shows plaintext to the author of the card even while hidden', () => {
      const authorCard = {...foreignCard, authorId: 'me'};
      const vm = {board: hiddenBoard, myUid: 'me', isOwner: false, columns: []} as any;

      expect(component.isScrambled(authorCard, vm)).toBe(false);
      expect(component.displayText(authorCard, vm)).toBe(authorCard.text);
    });

    it('scrambles foreign cards for the owner by default while hidden (owner is not auto-revealed)', () => {
      const vm = {board: hiddenBoard, myUid: 'owner1', isOwner: true, columns: []} as any;

      expect(component.isScrambled(foreignCard, vm)).toBe(true);
      expect(component.displayText(foreignCard, vm)).not.toBe(foreignCard.text);
    });

    it('scrambles foreign cards for non-owners while the board is hidden', () => {
      const vm = {board: hiddenBoard, myUid: 'me', isOwner: false, columns: []} as any;

      expect(component.isScrambled(foreignCard, vm)).toBe(true);
      const scrambled = component.displayText(foreignCard, vm);

      expect(scrambled).not.toBe(foreignCard.text);
      expect(scrambled.length).toBe(foreignCard.text.length);
      // Struktur (Leerzeichen/Zeilenumbrueche) bleibt erhalten.
      expect(scrambled.replace(/\S/g, '#')).toBe(foreignCard.text.replace(/\S/g, '#'));
    });

    it('produces a deterministic scramble that is stable across repeated renders', () => {
      const vm = {board: hiddenBoard, myUid: 'me', isOwner: false, columns: []} as any;

      const first = component.displayText(foreignCard, vm);
      const second = component.displayText(foreignCard, vm);

      expect(first).toBe(second);
    });

    it('produces different scrambles for cards with different ids (seeded per card)', () => {
      const otherCard = {...foreignCard, id: 'card2'};
      const vm = {board: hiddenBoard, myUid: 'me', isOwner: false, columns: []} as any;

      const first = component.displayText(foreignCard, vm);
      const second = component.displayText(otherCard, vm);

      expect(first).not.toBe(second);
    });

    it('reveals foreign cards for the owner once revealTemporarily is active', () => {
      const vm = {board: hiddenBoard, myUid: 'owner1', isOwner: true, columns: []} as any;
      component.revealTemporarily = true;

      expect(component.isScrambled(foreignCard, vm)).toBe(false);
      expect(component.displayText(foreignCard, vm)).toBe(foreignCard.text);
    });

    it('does not let a non-owner reveal foreign cards even if revealTemporarily is set', () => {
      const vm = {board: hiddenBoard, myUid: 'me', isOwner: false, columns: []} as any;
      component.revealTemporarily = true;

      expect(component.isScrambled(foreignCard, vm)).toBe(true);
    });
  });

  describe('canEdit / canInteract (UI-Feintuning: versteckte Karten sind fuer den Owner nicht editierbar)', () => {
    function makeCard(id: string, authorId: string): RetroCardId {
      return {id, text: 'x', columnId: 'col1', authorId, order: 0, created: new Date(), modified: new Date()};
    }

    it('own card is always editable, both while visible and while the board is hidden', () => {
      const ownCard = makeCard('c1', 'me');
      const visibleVm = {board: {...board, hidden: false}, myUid: 'me', isOwner: false, columns: []} as any;
      const hiddenVm = {board: {...board, hidden: true}, myUid: 'me', isOwner: false, columns: []} as any;

      expect(component.canEdit(ownCard, visibleVm)).toBe(true);
      expect(component.canEdit(ownCard, hiddenVm)).toBe(true);
    });

    it('a pure non-author viewer may never edit a foreign card, hidden or not', () => {
      const foreignCard = makeCard('c1', 'other');
      const visibleVm = {board: {...board, hidden: false}, myUid: 'me', isOwner: false, columns: []} as any;
      const hiddenVm = {board: {...board, hidden: true}, myUid: 'me', isOwner: false, columns: []} as any;

      expect(component.canEdit(foreignCard, visibleVm)).toBe(false);
      expect(component.canEdit(foreignCard, hiddenVm)).toBe(false);
    });

    it('the owner may edit a foreign card while the board is visible (!hidden)', () => {
      const foreignCard = makeCard('c1', 'other');
      const vm = {board: {...board, hidden: false}, myUid: 'owner1', isOwner: true, columns: []} as any;

      expect(component.canEdit(foreignCard, vm)).toBe(true);
    });

    it('the owner may NOT edit a foreign card while it is scrambled (board hidden, not revealed)', () => {
      const foreignCard = makeCard('c1', 'other');
      const vm = {board: {...board, hidden: true}, myUid: 'owner1', isOwner: true, columns: []} as any;

      expect(component.canEdit(foreignCard, vm)).toBe(false);
    });

    it('the owner may edit a foreign card again once temporarily revealed', () => {
      const foreignCard = makeCard('c1', 'other');
      const vm = {board: {...board, hidden: true}, myUid: 'owner1', isOwner: true, columns: []} as any;
      component.revealTemporarily = true;

      expect(component.canEdit(foreignCard, vm)).toBe(true);
    });

    it('canInteract is true while the board is visible and false while it is hidden (steuert Vote-/Reaktions-Controls)', () => {
      expect(component.canInteract({board: {...board, hidden: false}} as any)).toBe(true);
      expect(component.canInteract({board: {...board, hidden: true}} as any)).toBe(false);
    });
  });

  describe('adding cards via the "+" header button and the edit lifecycle (UI-Feintuning: addAndEdit)', () => {
    function makeExistingCard(id: string): RetroCardId {
      return {id, text: 'existing text', columnId: 'col1', authorId: 'me', order: 0, created: new Date(), modified: new Date()};
    }

    beforeEach(() => {
      retroService.addCard.mockResolvedValue('newCard1');
    });

    it('addAndEdit creates an empty card via the retro service and immediately opens it for editing', async () => {
      await component.addAndEdit('col1');

      expect(retroService.addCard).toHaveBeenCalledWith('board1', 'col1', '');
      expect(component.newlyAddedCardId).toBe('newCard1');
      expect(component.editingCardId).toBe('newCard1');
      expect(component.editingText).toBe('');
    });

    it('cancelEdit deletes the freshly added card when the edit is cancelled without saving', async () => {
      await component.addAndEdit('col1');

      await component.cancelEdit();

      expect(retroService.deleteCard).toHaveBeenCalledWith('board1', 'newCard1');
      expect(component.editingCardId).toBeNull();
      expect(component.editingText).toBe('');
      expect(component.newlyAddedCardId).toBeNull();
    });

    it('cancelEdit does NOT delete an existing card being edited (only freshly added ones)', async () => {
      component.startEdit(makeExistingCard('existing1'));

      await component.cancelEdit();

      expect(retroService.deleteCard).not.toHaveBeenCalled();
      expect(component.editingCardId).toBeNull();
    });

    it('saveEdit with empty text deletes the freshly added card', async () => {
      await component.addAndEdit('col1');
      component.editingText = '   ';

      await component.saveEdit('newCard1');

      expect(retroService.deleteCard).toHaveBeenCalledWith('board1', 'newCard1');
      expect(retroService.updateCardText).not.toHaveBeenCalled();
      expect(component.editingCardId).toBeNull();
      expect(component.newlyAddedCardId).toBeNull();
    });

    it('saveEdit with non-empty text persists via updateCardText and resets the edit state', async () => {
      await component.addAndEdit('col1');
      component.editingText = '  Some text  ';

      await component.saveEdit('newCard1');

      expect(retroService.updateCardText).toHaveBeenCalledWith('board1', 'newCard1', 'Some text');
      expect(retroService.deleteCard).not.toHaveBeenCalled();
      expect(component.editingCardId).toBeNull();
      expect(component.newlyAddedCardId).toBeNull();
    });

    it('saveEdit with empty text deletes the card (empty cards are removed, even existing ones)', async () => {
      component.startEdit(makeExistingCard('existing1'));
      component.editingText = '   ';

      await component.saveEdit('existing1');

      expect(retroService.deleteCard).toHaveBeenCalledWith('board1', 'existing1');
      expect(retroService.updateCardText).not.toHaveBeenCalled();
      expect(component.editingCardId).toBeNull();
    });
  });

  describe('live editing indicator (editingBy pulsiert bei anderen Teilnehmern)', () => {
    function makeExistingCard(id: string): RetroCardId {
      return {id, text: 'existing text', columnId: 'col1', authorId: 'me', order: 0, created: new Date(), modified: new Date()};
    }

    it('startEdit marks the card as being edited by the current viewer (myUid)', () => {
      component.startEdit(makeExistingCard('existing1'));

      expect(retroService.setCardEditing).toHaveBeenCalledWith('board1', 'existing1', 'owner1');
    });

    it('cancelEdit clears the indicator on an existing (not freshly added) card', async () => {
      component.startEdit(makeExistingCard('existing1'));
      retroService.setCardEditing.mockClear();

      await component.cancelEdit();

      expect(retroService.setCardEditing).toHaveBeenCalledWith('board1', 'existing1', null);
    });

    it('cancelEdit does nothing when there was no card being edited', async () => {
      await component.cancelEdit();

      expect(retroService.setCardEditing).not.toHaveBeenCalled();
    });

    it('saveEdit with empty text on an existing card deletes it (leere Karte -> weg, kein Indikator-Clear noetig)', async () => {
      component.startEdit(makeExistingCard('existing1'));
      retroService.setCardEditing.mockClear();
      component.editingText = '   ';

      await component.saveEdit('existing1');

      expect(retroService.deleteCard).toHaveBeenCalledWith('board1', 'existing1');
      expect(retroService.setCardEditing).not.toHaveBeenCalled();
      expect(retroService.updateCardText).not.toHaveBeenCalled();
    });

    it('saveEdit with non-empty text relies on updateCardText to clear editingBy (no extra setCardEditing call)', async () => {
      component.startEdit(makeExistingCard('existing1'));
      retroService.setCardEditing.mockClear();
      component.editingText = 'New text';

      await component.saveEdit('existing1');

      expect(retroService.updateCardText).toHaveBeenCalledWith('board1', 'existing1', 'New text');
      expect(retroService.setCardEditing).not.toHaveBeenCalled();
    });

    describe('isBeingEditedByOther', () => {
      function makeVm(myUid: string): any {
        return {board, columns: [], myUid, isOwner: false};
      }

      it('is true when another participant is currently editing the card', () => {
        const card = {...makeExistingCard('c1'), editingBy: 'someoneElse'};
        expect(component.isBeingEditedByOther(card, makeVm('me'))).toBe(true);
      });

      it('is false when the current viewer is the one editing (own edit does not pulse)', () => {
        const card = {...makeExistingCard('c1'), editingBy: 'me'};
        expect(component.isBeingEditedByOther(card, makeVm('me'))).toBe(false);
      });

      it('is false when nobody is editing the card (editingBy absent/null)', () => {
        const card = makeExistingCard('c1');
        expect(component.isBeingEditedByOther(card, makeVm('me'))).toBe(false);
        expect(component.isBeingEditedByOther({...card, editingBy: null}, makeVm('me'))).toBe(false);
      });
    });
  });

  describe('drag & drop (canMove / onDrop)', () => {
    // Kleiner Helper, um Testkarten ohne Boilerplate zu bauen (id, columnId, authorId, order sind
    // die einzigen fuer die DnD-Logik relevanten Felder).
    function makeCard(id: string, columnId: string, authorId: string, order: number): RetroCardId {
      return {id, text: 'text-' + id, columnId, authorId, order, created: new Date(), modified: new Date()};
    }

    // jsdom/happy-dom definiert document.elementFromPoint nicht -> als vi.spyOn-Ziel bereitstellen
    // (resolveDropTarget()/onDrop()/onCardDragMoved() nutzen es fuer die Zonen-Erkennung).
    beforeEach(() => {
      (document as any).elementFromPoint = () => null;
    });

    describe('canMove', () => {
      it('allows the author to move their own card', () => {
        const vm = {myUid: 'me', isOwner: false} as any;
        expect(component.canMove(makeCard('c1', 'colA', 'me', 0), vm)).toBe(true);
      });

      it('allows the owner to move any card', () => {
        const vm = {myUid: 'owner1', isOwner: true} as any;
        expect(component.canMove(makeCard('c1', 'colA', 'someoneElse', 0), vm)).toBe(true);
      });

      it('disallows a non-owner from moving a foreign card', () => {
        const vm = {myUid: 'me', isOwner: false} as any;
        expect(component.canMove(makeCard('c1', 'colA', 'someoneElse', 0), vm)).toBe(false);
      });
    });

    // Baut ein minimales BoardView fuer die onDrop()/onCardDragMoved()-Tests: je Spalten-Id eine
    // ColumnView mit den uebergebenen Karten (nur cards/myUid/isOwner sind fuer die Drop-Logik
    // relevant, siehe BoardComponent.onDrop()/resolveDropTarget()).
    function makeVm(columnsCards: {[columnId: string]: RetroCardId[]}, myUid: string, isOwner: boolean): any {
      return {
        board,
        columns: Object.keys(columnsCards).map((columnId, i) => ({
          column: {id: columnId, name: columnId, color: '#111', order: i},
          cards: columnsCards[columnId],
        })),
        myUid,
        isOwner,
      };
    }

    // Mockt document.elementFromPoint so, dass am Drop-/Zeiger-Punkt eine Karte mit der uebergebenen
    // cardId liegt, deren Kartenrechteck bei top beginnt und height hoch ist -- Basis fuer die
    // Drittel-Berechnung in resolveDropTarget() (Beispiel aus der Spec: top=0/height=90 -> y=15
    // oberes Drittel, y=45 mittleres Drittel, y=75 unteres Drittel).
    function mockCardAtPoint(cardId: string, top = 0, height = 90): void {
      const el = document.createElement('div');
      el.dataset['cardId'] = cardId;
      vi.spyOn(el, 'getBoundingClientRect').mockReturnValue({
        top, height, bottom: top + height, left: 0, right: 0, width: 0, x: 0, y: top, toJSON: () => ({}),
      } as any);
      vi.spyOn(document, 'elementFromPoint').mockReturnValue(el);
    }

    describe('onDrop (Drei-Zonen-Modell: oberes Drittel = davor, mittleres = mergen, unteres = dahinter)', () => {
      afterEach(() => {
        vi.restoreAllMocks();
      });

      it('Owner + mittleres Drittel auf Karte B -> merged (dragged in B), kein moveCards', async () => {
        const dragged = makeCard('c1', 'colA', 'someoneElse', 0);
        const target = makeCard('c2', 'colA', 'someoneElse', 1);
        mockCardAtPoint('c2', 0, 90);

        const event = {item: {data: dragged}, dropPoint: {x: 10, y: 45}} as any;
        const vm = makeVm({colA: [dragged, target]}, 'owner1', true);

        await component.onDrop(event, vm, 'colA');

        expect(retroService.mergeCards).toHaveBeenCalledWith('board1', 'c1', 'c2');
        expect(retroService.mergeCards).toHaveBeenCalledTimes(1);
        expect(retroService.moveCards).not.toHaveBeenCalled();
        expect(component.dropTargetCardId).toBeNull();
        expect(component.dropZone).toBeNull();
      });

      it('Owner + oberes Drittel auf B (gleiche Spalte) -> dragged wird VOR B einsortiert', async () => {
        const dragged = makeCard('c1', 'colA', 'someoneElse', 1);
        const target = makeCard('c2', 'colA', 'someoneElse', 0);
        mockCardAtPoint('c2', 0, 90);

        const event = {item: {data: dragged}, dropPoint: {x: 10, y: 15}} as any;
        const vm = makeVm({colA: [target, dragged]}, 'owner1', true);

        await component.onDrop(event, vm, 'colA');

        expect(retroService.mergeCards).not.toHaveBeenCalled();
        expect(retroService.moveCards).toHaveBeenCalledWith('board1', [{cardId: 'c1', columnId: 'colA', order: 0}, {cardId: 'c2', columnId: 'colA', order: 1}]);
        expect(retroService.moveCards).toHaveBeenCalledTimes(1);
      });

      it('Owner + unteres Drittel auf B -> dragged wird NACH B einsortiert', async () => {
        const dragged = makeCard('c1', 'colA', 'someoneElse', 0);
        const target = makeCard('c2', 'colA', 'someoneElse', 1);
        mockCardAtPoint('c2', 0, 90);

        const event = {item: {data: dragged}, dropPoint: {x: 10, y: 75}} as any;
        const vm = makeVm({colA: [dragged, target]}, 'owner1', true);

        await component.onDrop(event, vm, 'colA');

        expect(retroService.mergeCards).not.toHaveBeenCalled();
        expect(retroService.moveCards).toHaveBeenCalledWith('board1', [{cardId: 'c2', columnId: 'colA', order: 0}, {cardId: 'c1', columnId: 'colA', order: 1}]);
        expect(retroService.moveCards).toHaveBeenCalledTimes(1);
      });

      it('Nicht-Owner + Drop auf der Kartenmitte einer Karte in einer anderen Spalte -> keine Merge-Zone, Zwei-Zonen-Regel (davor/dahinter) greift', async () => {
        const dragged = makeCard('c1', 'colA', 'me', 0);
        const target = makeCard('c2', 'colB', 'other', 0);
        // Mittelpunkt (y=45 bei height=90, rel=0.5): fuer Nicht-Owner (nur 2 Zonen, Grenze bei 50%)
        // faellt das auf 'after' statt (wie beim Owner) auf 'merge'.
        mockCardAtPoint('c2', 0, 90);

        const event = {item: {data: dragged}, dropPoint: {x: 10, y: 45}} as any;
        const vm = makeVm({colA: [dragged], colB: [target]}, 'me', false);

        await component.onDrop(event, vm, 'colB');

        expect(retroService.mergeCards).not.toHaveBeenCalled();
        expect(retroService.moveCards).toHaveBeenCalledWith('board1', [{cardId: 'c2', columnId: 'colB', order: 0}, {cardId: 'c1', columnId: 'colB', order: 1}]);
        expect(retroService.moveCards).toHaveBeenCalledTimes(1);
      });

      it('Teilnehmer, gleiche Spalte -> no-op (Reorder innerhalb einer Spalte ist Owner-Recht, kein moveCards)', async () => {
        const dragged = makeCard('c1', 'colA', 'me', 0);
        const other = makeCard('c2', 'colA', 'me', 1);
        vi.spyOn(document, 'elementFromPoint').mockReturnValue(null);

        const event = {item: {data: dragged}, dropPoint: {x: 10, y: 10}} as any;
        const vm = makeVm({colA: [dragged, other]}, 'me', false);

        await component.onDrop(event, vm, 'colA');

        expect(retroService.moveCards).not.toHaveBeenCalled();
        expect(retroService.mergeCards).not.toHaveBeenCalled();
      });

      it('Cross-Column-Move (eigene Karte) -> moveCards fuer Ziel- UND Quellspalte (Reindex beider)', async () => {
        const dragged = makeCard('c1', 'colA', 'me', 0);
        const remainingInSource = makeCard('c2', 'colA', 'me', 1);
        const existingInTarget = makeCard('c3', 'colB', 'me', 0);
        // Drop landet in einer Luecke der Zielspalte (kein Kartentreffer) -> ans Ende der Zielspalte.
        vi.spyOn(document, 'elementFromPoint').mockReturnValue(null);

        const event = {item: {data: dragged}, dropPoint: {x: 10, y: 10}} as any;
        const vm = makeVm({colA: [dragged, remainingInSource], colB: [existingInTarget]}, 'me', false);

        await component.onDrop(event, vm, 'colB');

        // Zielspalte (colB) neu indiziert: die bestehende Karte bleibt vorn, die verschobene landet dahinter.
        expect(retroService.moveCards).toHaveBeenCalledWith('board1', [{cardId: 'c3', columnId: 'colB', order: 0}, {cardId: 'c1', columnId: 'colB', order: 1}]);
        // Quellspalte (colA) neu indiziert: die verbliebene Karte rutscht auf Index 0.
        expect(retroService.moveCards).toHaveBeenCalledWith('board1', [{cardId: 'c2', columnId: 'colA', order: 0}]);
        expect(retroService.moveCards).toHaveBeenCalledTimes(2);
      });

      it('Drop ohne Karte darunter (elementFromPoint -> null) landet am Ende der Zielspalte', async () => {
        const dragged = makeCard('c1', 'colA', 'someoneElse', 0);
        const b = makeCard('c2', 'colA', 'someoneElse', 1);
        const c = makeCard('c3', 'colA', 'someoneElse', 2);
        vi.spyOn(document, 'elementFromPoint').mockReturnValue(null);

        const event = {item: {data: dragged}, dropPoint: {x: 10, y: 10}} as any;
        const vm = makeVm({colA: [dragged, b, c]}, 'owner1', true);

        await component.onDrop(event, vm, 'colA');

        expect(retroService.moveCards).toHaveBeenCalledWith('board1', [
          {cardId: 'c2', columnId: 'colA', order: 0},
          {cardId: 'c3', columnId: 'colA', order: 1},
          {cardId: 'c1', columnId: 'colA', order: 2},
        ]);
        expect(retroService.moveCards).toHaveBeenCalledTimes(1);
      });

      it('does nothing when the dragged card may not be moved by the current viewer (foreign card, non-owner)', async () => {
        const dragged = makeCard('c1', 'colA', 'someoneElse', 0);

        const event = {item: {data: dragged}, dropPoint: {x: 10, y: 10}} as any;
        const vm = makeVm({colA: [dragged]}, 'me', false);

        await component.onDrop(event, vm, 'colA');

        expect(retroService.moveCards).not.toHaveBeenCalled();
        expect(retroService.mergeCards).not.toHaveBeenCalled();
      });
    });

    describe('onCardDragMoved / onCardDragEnded (visuelles Zonen-Feedback waehrend des Drags)', () => {
      afterEach(() => {
        vi.restoreAllMocks();
      });

      it('setzt dropTargetCardId/dropZone fuer den Owner ueber alle drei Zonen (oben/mitte/unten)', () => {
        const dragged = makeCard('c1', 'colA', 'someoneElse', 0);
        const vm = makeVm({}, 'owner1', true);

        mockCardAtPoint('c2', 0, 90);
        component.onCardDragMoved({pointerPosition: {x: 10, y: 15}, source: {data: dragged}} as any, vm);
        expect(component.dropTargetCardId).toBe('c2');
        expect(component.dropZone).toBe('before');

        mockCardAtPoint('c2', 0, 90);
        component.onCardDragMoved({pointerPosition: {x: 10, y: 45}, source: {data: dragged}} as any, vm);
        expect(component.dropTargetCardId).toBe('c2');
        expect(component.dropZone).toBe('merge');

        mockCardAtPoint('c2', 0, 90);
        component.onCardDragMoved({pointerPosition: {x: 10, y: 75}, source: {data: dragged}} as any, vm);
        expect(component.dropTargetCardId).toBe('c2');
        expect(component.dropZone).toBe('after');
      });

      it('setzt dropTargetCardId/dropZone fuer Nicht-Owner mit nur zwei Zonen (keine Merge-Zone)', () => {
        const dragged = makeCard('c1', 'colA', 'me', 0);
        const vm = makeVm({}, 'me', false);

        mockCardAtPoint('c2', 0, 90);
        component.onCardDragMoved({pointerPosition: {x: 10, y: 30}, source: {data: dragged}} as any, vm);
        expect(component.dropTargetCardId).toBe('c2');
        expect(component.dropZone).toBe('before');

        mockCardAtPoint('c2', 0, 90);
        component.onCardDragMoved({pointerPosition: {x: 10, y: 60}, source: {data: dragged}} as any, vm);
        expect(component.dropTargetCardId).toBe('c2');
        expect(component.dropZone).toBe('after');
      });

      it('setzt dropTargetCardId/dropZone auf null, wenn der Zeiger ueber keiner Karte liegt', () => {
        const dragged = makeCard('c1', 'colA', 'owner1', 0);
        const vm = makeVm({}, 'owner1', true);
        vi.spyOn(document, 'elementFromPoint').mockReturnValue(null);

        component.onCardDragMoved({pointerPosition: {x: 10, y: 10}, source: {data: dragged}} as any, vm);

        expect(component.dropTargetCardId).toBeNull();
        expect(component.dropZone).toBeNull();
      });

      it('onCardDragEnded raeumt dropTargetCardId/dropZone wieder auf', () => {
        component.dropTargetCardId = 'c2';
        component.dropZone = 'merge';

        component.onCardDragEnded();

        expect(component.dropTargetCardId).toBeNull();
        expect(component.dropZone).toBeNull();
      });
    });
  });

  describe('timer', () => {
    describe('getRemainingSeconds', () => {
      it('returns null when no timer is active (timerEndsAt is null/undefined)', () => {
        expect(component.getRemainingSeconds(null)).toBeNull();
        expect(component.getRemainingSeconds(undefined)).toBeNull();
      });

      it('computes the remaining whole seconds for a plain Date', () => {
        const now = new Date('2026-08-06T10:00:00.000Z');
        const endsAt = new Date('2026-08-06T10:00:30.000Z');

        expect(component.getRemainingSeconds(endsAt, now)).toBe(30);
      });

      it('normalizes Firestore Timestamp-like values via their toDate() method', () => {
        const now = new Date('2026-08-06T10:00:00.000Z');
        const firestoreTimestampLike = {toDate: () => new Date('2026-08-06T10:01:00.000Z')};

        expect(component.getRemainingSeconds(firestoreTimestampLike, now)).toBe(60);
      });

      it('clamps to 0 once the deadline has passed (expired timer, no negative values)', () => {
        const now = new Date('2026-08-06T10:00:00.000Z');
        const endsAt = new Date('2026-08-06T09:59:00.000Z');

        expect(component.getRemainingSeconds(endsAt, now)).toBe(0);
      });
    });

    describe('deriveCountdown (expiry grace window)', () => {
      it('keeps showing the expired state (0) during the grace window after the deadline', () => {
        const endsAt = new Date('2026-08-06T10:00:00.000Z');
        const now = new Date('2026-08-06T10:00:05.000Z'); // 5s nach Ablauf, < Nachlaufzeit

        expect(component.deriveCountdown({...board, timerEndsAt: endsAt}, now)).toEqual({remainingSeconds: 0, paused: false});
      });

      it('hides the display (null) once the grace window has fully elapsed', () => {
        const endsAt = new Date('2026-08-06T10:00:00.000Z');
        const now = new Date('2026-08-06T10:00:15.000Z'); // 15s nach Ablauf, > Nachlaufzeit

        expect(component.deriveCountdown({...board, timerEndsAt: endsAt}, now)).toEqual({remainingSeconds: null, paused: false});
      });

      it('hides the display exactly at the grace-window boundary (>=, not >)', () => {
        const endsAt = new Date('2026-08-06T10:00:00.000Z');
        const now = new Date(endsAt.getTime() + component.EXPIRED_DISPLAY_GRACE_MS); // exakt Ablauf + Nachlaufzeit

        expect(component.deriveCountdown({...board, timerEndsAt: endsAt}, now)).toEqual({remainingSeconds: null, paused: false});
      });

      it('still shows a running countdown before the deadline (grace window does not apply)', () => {
        const endsAt = new Date('2026-08-06T10:00:30.000Z');
        const now = new Date('2026-08-06T10:00:00.000Z');

        expect(component.deriveCountdown({...board, timerEndsAt: endsAt}, now)).toEqual({remainingSeconds: 30, paused: false});
      });

      it('never auto-hides a paused timer (paused state takes precedence, even at 0)', () => {
        const now = new Date('2026-08-06T10:00:15.000Z');

        expect(component.deriveCountdown({...board, timerEndsAt: null, timerPausedRemainingMs: 0}, now))
          .toEqual({remainingSeconds: 0, paused: true});
      });
    });

    describe('formatRemaining', () => {
      it('formats whole seconds as zero-padded mm:ss', () => {
        expect(component.formatRemaining(0)).toBe('00:00');
        expect(component.formatRemaining(5)).toBe('00:05');
        expect(component.formatRemaining(65)).toBe('01:05');
        expect(component.formatRemaining(600)).toBe('10:00');
      });
    });

    describe('cleanup', () => {
      it('unsubscribes the ticking subscription on destroy (no leaked interval/subscription)', () => {
        const subscription = (component as any).tickSubscription;
        expect(subscription.closed).toBe(false);

        fixture.destroy();

        expect(subscription.closed).toBe(true);
      });
    });
  });

  describe('owner menu (Ticket 19: Owner-Aktionen in der Seitenleiste via MenuService)', () => {
    // Die Owner-Menu-Subscription feuert bereits waehrend der Komponenten-Konstruktion (board$/isOwner$
    // sind hier synchrone of()-Streams), d.h. die Registrierung ist bereits im aeusseren beforeEach
    // (fixture = TestBed.createComponent(...)) erfolgt -- kein zusaetzlicher Trigger notwendig.
    it('registers the owner actions in the sidebar menu, including a confirmed "Board löschen" action', () => {
      expect(menuService.resetCustomActions).toHaveBeenCalled();
      expect(menuService.addCustomAction).toHaveBeenCalledWith('Texte verstecken', expect.any(Function));
      expect(menuService.addCustomAction).toHaveBeenCalledWith('Board löschen', expect.any(Function), true);
    });

    it('registers the TimerControlComponent as a menu row instead of the former Start/Stopp text actions', () => {
      expect(menuService.addCustomComponent).toHaveBeenCalledWith(TimerControlComponent, {boardId: 'board1'});
    });

    it('deletes the board via retroService and navigates back to the overview when "Board löschen" runs', async () => {
      const deleteCall = menuService.addCustomAction.mock.calls.find((call: any[]) => call[0] === 'Board löschen');
      expect(deleteCall).toBeTruthy();

      await deleteCall[1]();

      expect(retroService.deleteBoard).toHaveBeenCalledWith('board1');
      expect(router.navigateByUrl).toHaveBeenCalledWith('/retrospective');
    });

    it('resets the custom actions on destroy', () => {
      fixture.destroy();

      expect(menuService.resetCustomActions).toHaveBeenCalled();
    });

    it('registers the export actions (Markdown/CSV) in the sidebar menu without confirmation (Ticket 18)', () => {
      expect(menuService.addCustomAction).toHaveBeenCalledWith('Export (Markdown)', expect.any(Function));
      expect(menuService.addCustomAction).toHaveBeenCalledWith('Export (CSV)', expect.any(Function));
    });

    it('registers a confirmed "Votes zurücksetzen" action that resets all votes via retroService.resetVotes (Ticket 15)', async () => {
      const resetCall = menuService.addCustomAction.mock.calls.find((call: any[]) => call[0] === 'Votes zurücksetzen');
      expect(resetCall).toBeTruthy();
      expect(resetCall[2]).toBe(true);

      await resetCall[1]();

      expect(retroService.resetVotes).toHaveBeenCalledWith('board1');
    });

    describe('toggleEditColumns (Ticket 13)', () => {
      it('toggles the local editColumns flag, seeds the drafts from the current board and relabels the menu action', () => {
        const columns: RetroColumn[] = [
          {id: 'col1', name: 'To Do', color: '#111111', order: 0},
          {id: 'col2', name: 'Doing', color: '#222222', order: 1},
        ];
        (component as any).currentOwnerBoard = {...board, columns};
        menuService.addCustomAction.mockClear();

        component.toggleEditColumns();

        expect(component.editColumns).toBe(true);
        expect(component.columnNameDraft).toEqual({col1: 'To Do', col2: 'Doing'});
        expect(component.columnColorDraft).toEqual({col1: '#111111', col2: '#222222'});
        expect(menuService.addCustomAction).toHaveBeenCalledWith('Bearbeiten beenden', expect.any(Function));
        expect(retroService.updateColumns).not.toHaveBeenCalled();

        menuService.addCustomAction.mockClear();
        component.toggleEditColumns();

        expect(component.editColumns).toBe(false);
        expect(menuService.addCustomAction).toHaveBeenCalledWith('Spalten bearbeiten', expect.any(Function));
      });
    });
  });

  describe('column editing (Ticket 13: Spalten nachträglich bearbeiten)', () => {
    function makeColumnsVm(columns: RetroColumn[], cardsByColumn: {[columnId: string]: RetroCardId[]} = {}): any {
      return {
        board: {...board, columns},
        columns: [...columns].sort((a, b) => a.order - b.order).map(column => ({
          column,
          cards: cardsByColumn[column.id] ?? [],
        })),
        myUid: 'owner1',
        isOwner: true,
      };
    }

    function makeCard(id: string, columnId: string, order: number): RetroCardId {
      return {id, text: 'text-' + id, columnId, authorId: 'me', order, created: new Date(), modified: new Date()};
    }

    describe('renameColumn', () => {
      it('writes the full columns array with the renamed column via updateColumns, keeping order/color/other columns intact', async () => {
        const columns: RetroColumn[] = [
          {id: 'col1', name: 'To Do', color: '#111111', order: 0},
          {id: 'col2', name: 'Doing', color: '#222222', order: 1},
        ];
        const vm = makeColumnsVm(columns);
        component.columnNameDraft['col1'] = '  Backlog  ';

        await component.renameColumn(vm, 'col1');

        expect(retroService.updateColumns).toHaveBeenCalledWith('board1', [
          {id: 'col1', name: 'Backlog', color: '#111111', order: 0},
          {id: 'col2', name: 'Doing', color: '#222222', order: 1},
        ]);
      });

      it('does nothing when the draft name is empty/whitespace-only', async () => {
        const columns: RetroColumn[] = [{id: 'col1', name: 'To Do', color: '#111111', order: 0}];
        const vm = makeColumnsVm(columns);
        component.columnNameDraft['col1'] = '   ';

        await component.renameColumn(vm, 'col1');

        expect(retroService.updateColumns).not.toHaveBeenCalled();
      });
    });

    describe('recolorColumn', () => {
      it('writes the full columns array with the recolored column via updateColumns', async () => {
        const columns: RetroColumn[] = [
          {id: 'col1', name: 'To Do', color: '#111111', order: 0},
          {id: 'col2', name: 'Doing', color: '#222222', order: 1},
        ];
        const vm = makeColumnsVm(columns);
        component.columnColorDraft['col2'] = '#abcdef';

        await component.recolorColumn(vm, 'col2');

        expect(retroService.updateColumns).toHaveBeenCalledWith('board1', [
          {id: 'col1', name: 'To Do', color: '#111111', order: 0},
          {id: 'col2', name: 'Doing', color: '#abcdef', order: 1},
        ]);
      });
    });

    describe('addColumn', () => {
      it('appends a new column at the end with default name/color and persists via updateColumns', async () => {
        const columns: RetroColumn[] = [{id: 'col1', name: 'To Do', color: '#111111', order: 0}];
        const vm = makeColumnsVm(columns);

        await component.addColumn(vm);

        expect(retroService.updateColumns).toHaveBeenCalledTimes(1);
        const [persistedBoardId, persistedColumns] = retroService.updateColumns.mock.calls[0];
        expect(persistedBoardId).toBe('board1');
        expect(persistedColumns).toHaveLength(2);
        expect(persistedColumns[0]).toEqual(columns[0]);
        expect(persistedColumns[1]).toMatchObject({name: 'Neue Spalte', color: '#9e9e9e', order: 1});
        expect(persistedColumns[1].id).toBeTruthy();
        // Editier-Puffer wird gleich mitbefuellt, damit die neue Spalte im Edit-Modus sofort brauchbare Werte zeigt.
        expect(component.columnNameDraft[persistedColumns[1].id]).toBe('Neue Spalte');
        expect(component.columnColorDraft[persistedColumns[1].id]).toBe('#9e9e9e');
      });
    });

    describe('moveColumn (Reorder per Pfeil-Tausch)', () => {
      const columns: RetroColumn[] = [
        {id: 'col1', name: 'A', color: '#111111', order: 0},
        {id: 'col2', name: 'B', color: '#222222', order: 1},
        {id: 'col3', name: 'C', color: '#333333', order: 2},
      ];

      it('swaps order with the right neighbor when moved right (+1)', async () => {
        const vm = makeColumnsVm(columns);

        await component.moveColumn(vm, 'col2', 1);

        expect(retroService.updateColumns).toHaveBeenCalledWith('board1', [
          {id: 'col1', name: 'A', color: '#111111', order: 0},
          {id: 'col3', name: 'C', color: '#333333', order: 1},
          {id: 'col2', name: 'B', color: '#222222', order: 2},
        ]);
      });

      it('swaps order with the left neighbor when moved left (-1)', async () => {
        const vm = makeColumnsVm(columns);

        await component.moveColumn(vm, 'col2', -1);

        expect(retroService.updateColumns).toHaveBeenCalledWith('board1', [
          {id: 'col2', name: 'B', color: '#222222', order: 0},
          {id: 'col1', name: 'A', color: '#111111', order: 1},
          {id: 'col3', name: 'C', color: '#333333', order: 2},
        ]);
      });

      it('does nothing when the first column is moved further left', async () => {
        const vm = makeColumnsVm(columns);

        await component.moveColumn(vm, 'col1', -1);

        expect(retroService.updateColumns).not.toHaveBeenCalled();
      });

      it('does nothing when the last column is moved further right', async () => {
        const vm = makeColumnsVm(columns);

        await component.moveColumn(vm, 'col3', 1);

        expect(retroService.updateColumns).not.toHaveBeenCalled();
      });

      it('exposes isFirstColumn/isLastColumn for disabling the arrow buttons at the edges', () => {
        const vm = makeColumnsVm(columns);

        expect(component.isFirstColumn(vm, 'col1')).toBe(true);
        expect(component.isFirstColumn(vm, 'col2')).toBe(false);
        expect(component.isLastColumn(vm, 'col3')).toBe(true);
        expect(component.isLastColumn(vm, 'col2')).toBe(false);
      });
    });

    describe('removeColumn (nicht-destruktiv: Karten wandern in die erste verbleibende Spalte)', () => {
      afterEach(() => {
        vi.restoreAllMocks();
      });

      it('renumbers the target column (moved cards appended after existing) and persists columns without the removed one', async () => {
        vi.spyOn(window, 'confirm').mockReturnValue(true);
        const columns: RetroColumn[] = [
          {id: 'col1', name: 'To Do', color: '#111111', order: 0},
          {id: 'col2', name: 'Doing', color: '#222222', order: 1},
          {id: 'col3', name: 'Done', color: '#333333', order: 2},
        ];
        const cardsInCol2 = [makeCard('c1', 'col2', 0), makeCard('c2', 'col2', 1)];
        const existingInCol1 = [makeCard('c0', 'col1', 0)];
        const vm = makeColumnsVm(columns, {col1: existingInCol1, col2: cardsInCol2});

        await component.removeColumn(vm, 'col2');

        expect(window.confirm).toHaveBeenCalled();
        expect(retroService.moveCards).toHaveBeenCalledWith('board1', [
          {cardId: 'c0', columnId: 'col1', order: 0},
          {cardId: 'c1', columnId: 'col1', order: 1},
          {cardId: 'c2', columnId: 'col1', order: 2},
        ]);
        expect(retroService.moveCards).toHaveBeenCalledTimes(1);
        expect(retroService.updateColumns).toHaveBeenCalledWith('board1', [
          {id: 'col1', name: 'To Do', color: '#111111', order: 0},
          {id: 'col3', name: 'Done', color: '#333333', order: 1},
        ]);
      });

      it('does not move cards or touch confirm when the removed column is empty', async () => {
        const confirmSpy = vi.spyOn(window, 'confirm');
        const columns: RetroColumn[] = [
          {id: 'col1', name: 'To Do', color: '#111111', order: 0},
          {id: 'col2', name: 'Doing', color: '#222222', order: 1},
        ];
        const vm = makeColumnsVm(columns);

        await component.removeColumn(vm, 'col2');

        expect(confirmSpy).not.toHaveBeenCalled();
        expect(retroService.moveCards).not.toHaveBeenCalled();
        expect(retroService.updateColumns).toHaveBeenCalledWith('board1', [
          {id: 'col1', name: 'To Do', color: '#111111', order: 0},
        ]);
      });

      it('aborts without any writes when the owner cancels the confirmation for a non-empty column', async () => {
        vi.spyOn(window, 'confirm').mockReturnValue(false);
        const columns: RetroColumn[] = [
          {id: 'col1', name: 'To Do', color: '#111111', order: 0},
          {id: 'col2', name: 'Doing', color: '#222222', order: 1},
        ];
        const vm = makeColumnsVm(columns, {col2: [makeCard('c1', 'col2', 0)]});

        await component.removeColumn(vm, 'col2');

        expect(retroService.moveCards).not.toHaveBeenCalled();
        expect(retroService.updateColumns).not.toHaveBeenCalled();
      });

      it('refuses to remove the last remaining column (board needs at least one column)', async () => {
        const confirmSpy = vi.spyOn(window, 'confirm');
        const columns: RetroColumn[] = [{id: 'col1', name: 'To Do', color: '#111111', order: 0}];
        const vm = makeColumnsVm(columns, {col1: [makeCard('c1', 'col1', 0)]});

        expect(component.canRemoveColumn(vm)).toBe(false);

        await component.removeColumn(vm, 'col1');

        expect(confirmSpy).not.toHaveBeenCalled();
        expect(retroService.moveCards).not.toHaveBeenCalled();
        expect(retroService.updateColumns).not.toHaveBeenCalled();
      });
    });
  });

  describe('voting (Ticket 15: Dot-Voting)', () => {
    // Stimmen sind fuer die Voting-Logik unabhaengig von authorId/columnId -- die Helper hier
    // brauchen nur id + optionale votes-Map.
    function makeVoteCard(id: string, votes?: {[uid: string]: number}): RetroCardId {
      return {id, text: 'text-' + id, columnId: 'col1', authorId: 'someoneElse', order: 0, created: new Date(), modified: new Date(), votes};
    }

    // Baut ein minimales BoardView fuer die Voting-Helper: jede uebergebene Karten-Liste wird eine
    // eigene Spalte (nur columns/myUid/isOwner werden von den Voting-Helpern gelesen).
    function makeVoteVm(columnsCards: RetroCardId[][], myUid = 'me'): any {
      return {
        board,
        columns: columnsCards.map((cards, i) => ({column: {id: 'col' + i, name: 'Col', color: '#111', order: i}, cards})),
        myUid,
        isOwner: false,
      };
    }

    describe('totalVotes', () => {
      it('sums the votes of all users on a card', () => {
        expect(component.totalVotes(makeVoteCard('c1', {me: 2, other: 3}))).toBe(5);
      });

      it('returns 0 when the card has no votes field at all', () => {
        expect(component.totalVotes(makeVoteCard('c1'))).toBe(0);
      });
    });

    describe('myVotes / myUsedVotes / canVote (boardweites Kontingent)', () => {
      it('myVotes returns the current viewers own count on a card, 0 if absent', () => {
        const card = makeVoteCard('c1', {me: 2, other: 1});
        expect(component.myVotes(card, makeVoteVm([[card]], 'me'))).toBe(2);
        expect(component.myVotes(card, makeVoteVm([[card]], 'someoneWithoutVotes'))).toBe(0);
      });

      it('myUsedVotes sums the viewers votes across ALL cards and columns of the board', () => {
        const cardA = makeVoteCard('c1', {me: 2});
        const cardB = makeVoteCard('c2', {me: 1, other: 4});
        const cardC = makeVoteCard('c3');
        const vm = makeVoteVm([[cardA], [cardB, cardC]], 'me');

        expect(component.myUsedVotes(vm)).toBe(3);
      });

      it('canVote is true below the boardwide quota (VOTES_PER_USER = 5)', () => {
        const card = makeVoteCard('c1', {me: 4});
        expect(component.canVote(makeVoteVm([[card]], 'me'))).toBe(true);
      });

      it('canVote is false once the boardwide quota is reached, even across multiple cards', () => {
        const cardA = makeVoteCard('c1', {me: 3});
        const cardB = makeVoteCard('c2', {me: 2});
        expect(component.canVote(makeVoteVm([[cardA], [cardB]], 'me'))).toBe(false);
      });
    });

    describe('addVote', () => {
      it('increments the own vote count atomically, preserving other users votes on the card', async () => {
        const card = makeVoteCard('c1', {other: 3});
        const vm = makeVoteVm([[card]], 'me');

        await component.addVote(card, vm);

        expect(retroService.changeVote).toHaveBeenCalledWith('board1', 'c1', 'me', 1);
      });

      it('stacks additional votes on a card the viewer already voted on', async () => {
        const card = makeVoteCard('c1', {me: 1});
        const vm = makeVoteVm([[card]], 'me');

        await component.addVote(card, vm);

        expect(retroService.changeVote).toHaveBeenCalledWith('board1', 'c1', 'me', 1);
      });

      it('does nothing once the viewers boardwide quota (5) is exhausted -- no "+" beyond the limit', async () => {
        const cardA = makeVoteCard('c1', {me: 5});
        const cardB = makeVoteCard('c2');
        const vm = makeVoteVm([[cardA], [cardB]], 'me');

        await component.addVote(cardB, vm);

        expect(retroService.changeVote).not.toHaveBeenCalled();
      });
    });

    describe('removeVote', () => {
      it('decrements the own vote count when more than one remains, preserving other users votes', async () => {
        const card = makeVoteCard('c1', {me: 2, other: 1});
        const vm = makeVoteVm([[card]], 'me');

        await component.removeVote(card, vm);

        expect(retroService.changeVote).toHaveBeenCalledWith('board1', 'c1', 'me', -1);
      });

      it('removes the own key entirely once the count would drop to 0', async () => {
        const card = makeVoteCard('c1', {me: 1, other: 2});
        const vm = makeVoteVm([[card]], 'me');

        await component.removeVote(card, vm);

        expect(retroService.clearUserVote).toHaveBeenCalledWith('board1', 'c1', 'me');
      });

      it('does nothing when the viewer has no votes on the card', async () => {
        const card = makeVoteCard('c1', {other: 2});
        const vm = makeVoteVm([[card]], 'me');

        await component.removeVote(card, vm);

        expect(retroService.changeVote).not.toHaveBeenCalled();
        expect(retroService.clearUserVote).not.toHaveBeenCalled();
      });
    });

    describe('onVoteContext (Rechtsklick auf den Stern in der Footer-Zeile entfernt eine eigene Stimme)', () => {
      it('prevents the native context menu and removes one own vote via removeVote', () => {
        const card = makeVoteCard('c1', {me: 2});
        const vm = makeVoteVm([[card]], 'me');
        const event = {preventDefault: vi.fn()} as any;

        component.onVoteContext(event, card, vm);

        expect(event.preventDefault).toHaveBeenCalled();
        expect(retroService.changeVote).toHaveBeenCalledWith('board1', 'c1', 'me', -1);
      });
    });
  });

  describe('emoji reactions (Ticket 16)', () => {
    function makeReactionCard(id: string, reactions?: {[emoji: string]: string[]}): RetroCardId {
      return {id, text: 'text-' + id, columnId: 'col1', authorId: 'someoneElse', order: 0, created: new Date(), modified: new Date(), reactions};
    }

    function makeReactionVm(myUid = 'me'): any {
      return {board, columns: [], myUid, isOwner: false};
    }

    describe('reactionCount', () => {
      it('returns the number of uids that reacted with the given emoji', () => {
        const card = makeReactionCard('c1', {'👍': ['me', 'other']});
        expect(component.reactionCount(card, '👍')).toBe(2);
      });

      it('returns 0 when the emoji key is absent or the reactions field is missing entirely', () => {
        expect(component.reactionCount(makeReactionCard('c1', {'👍': ['me']}), '❤️')).toBe(0);
        expect(component.reactionCount(makeReactionCard('c1'), '👍')).toBe(0);
      });
    });

    describe('hasReacted', () => {
      it('is true when the current viewer is included in the emoji list', () => {
        const card = makeReactionCard('c1', {'👍': ['me', 'other']});
        expect(component.hasReacted(card, '👍', makeReactionVm('me'))).toBe(true);
      });

      it('is false when the current viewer is not included (or the emoji/field is absent)', () => {
        const card = makeReactionCard('c1', {'👍': ['other']});
        expect(component.hasReacted(card, '👍', makeReactionVm('me'))).toBe(false);
        expect(component.hasReacted(makeReactionCard('c1'), '👍', makeReactionVm('me'))).toBe(false);
      });
    });

    describe('toggleReaction', () => {
      it('adds the viewers uid to a fresh emoji reaction, preserving other emojis on the card', async () => {
        const card = makeReactionCard('c1', {'❤️': ['other']});
        const vm = makeReactionVm('me');

        await component.toggleReaction(card, '👍', vm);

        expect(retroService.addReaction).toHaveBeenCalledWith('board1', 'c1', '👍', 'me');
      });

      it('adds the viewers uid alongside an existing reaction from another user on the same emoji', async () => {
        const card = makeReactionCard('c1', {'👍': ['other']});
        const vm = makeReactionVm('me');

        await component.toggleReaction(card, '👍', vm);

        expect(retroService.addReaction).toHaveBeenCalledWith('board1', 'c1', '👍', 'me');
      });

      it('removes the viewers uid again on a second toggle, dropping the emoji key entirely once the array is empty', async () => {
        const card = makeReactionCard('c1', {'👍': ['me']});
        const vm = makeReactionVm('me');

        await component.toggleReaction(card, '👍', vm);

        expect(retroService.removeReaction).toHaveBeenCalledWith('board1', 'c1', '👍', 'me');
      });

      it('removes only the viewers uid, keeping other users reactions on the same emoji', async () => {
        const card = makeReactionCard('c1', {'👍': ['me', 'other']});
        const vm = makeReactionVm('me');

        await component.toggleReaction(card, '👍', vm);

        expect(retroService.removeReaction).toHaveBeenCalledWith('board1', 'c1', '👍', 'me');
      });
    });

    describe('activeReactions (UI-Feintuning: nur Reaktionen mit count > 0 werden als Chip angezeigt)', () => {
      it('returns only emojis with at least one reaction, in REACTION_EMOJIS order', () => {
        const card = makeReactionCard('c1', {'😕': ['other'], '👍': ['me']});

        expect(component.activeReactions(card)).toEqual(['👍', '😕']);
      });

      it('returns an empty array when the card has no reactions at all', () => {
        expect(component.activeReactions(makeReactionCard('c1'))).toEqual([]);
      });
    });

    describe('toggleReactionPicker (UI-Feintuning: Emoji-Auswahl-Panel oeffnen/schliessen)', () => {
      it('opens the picker for a card that currently has none open', () => {
        expect(component.reactionPickerCardId).toBeNull();

        component.toggleReactionPicker('c1');

        expect(component.reactionPickerCardId).toBe('c1');
      });

      it('closes the picker again when toggled a second time for the same card', () => {
        component.toggleReactionPicker('c1');
        component.toggleReactionPicker('c1');

        expect(component.reactionPickerCardId).toBeNull();
      });

      it('switches to another card instead of showing two pickers at once', () => {
        component.toggleReactionPicker('c1');

        component.toggleReactionPicker('c2');

        expect(component.reactionPickerCardId).toBe('c2');
      });
    });

    describe('selectReaction (Auswahl im Emoji-Panel: togglet die Reaktion und schliesst das Panel)', () => {
      it('toggles the reaction via the retro service and closes the picker', async () => {
        const card = makeReactionCard('c1');
        const vm = makeReactionVm('me');
        component.reactionPickerCardId = 'c1';

        await component.selectReaction(card, '👍', vm);

        expect(retroService.addReaction).toHaveBeenCalledWith('board1', 'c1', '👍', 'me');
        expect(component.reactionPickerCardId).toBeNull();
      });
    });
  });
});

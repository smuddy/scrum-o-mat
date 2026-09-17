import {describe, it, expect, beforeEach, afterEach, vi} from 'vitest';
import {ComponentFixture, TestBed} from '@angular/core/testing';
import {NO_ERRORS_SCHEMA} from '@angular/core';
import {NoopAnimationsModule} from '@angular/platform-browser/animations';
import {provideRouter} from '@angular/router';
import {firstValueFrom, of} from 'rxjs';

import {BoardListComponent} from './board-list.component';
import {RetroService} from '../retro.service';
import {MenuService} from '../../../shared/menu/menu.service';
import {RetroBoardId, RetroGroupId} from '../models/retro';

describe('BoardListComponent', () => {
  let component: BoardListComponent;
  let fixture: ComponentFixture<BoardListComponent>;
  let retroService: any;
  let menuService: any;

  // aeltestes aktives Board (created 01.01.), zwecks Sortier-Check nach created desc.
  const olderActiveBoard: RetroBoardId = {
    id: 'b0', ownerId: 'me', title: 'Aelteres Board', columns: [], hidden: false, timerEndsAt: null,
    created: new Date('2026-01-01'), modified: new Date('2026-01-01'),
  };
  const activeBoard: RetroBoardId = {
    id: 'b1', ownerId: 'me', title: 'Aktives Board', columns: [], hidden: false, timerEndsAt: null,
    created: new Date('2026-01-02'), modified: new Date('2026-01-02'),
  };
  // archived=true, aber juengstes created -- steht damit als Nachweis, dass die Trennung wirklich
  // ueber das archived-Flag laeuft und nicht (mehr) ueber die reine created-Sortierung.
  const archivedBoard: RetroBoardId = {
    id: 'b2', ownerId: 'me', title: 'Archiviertes Board', columns: [], hidden: false, timerEndsAt: null,
    created: new Date('2026-01-03'), modified: new Date('2026-01-03'), archived: true,
  };
  // Gruppen-Feature: aktives Board MIT groupId -- darf weder in boards$ noch in archivedBoards$ auftauchen.
  const groupedBoard: RetroBoardId = {
    id: 'b3', ownerId: 'me', title: 'Gruppen-Board', columns: [], hidden: false, timerEndsAt: null,
    created: new Date('2026-01-04'), modified: new Date('2026-01-04'), groupId: 'g1',
  };
  const groupA: RetroGroupId = {id: 'g1', ownerId: 'me', name: 'Team Alpha', created: new Date('2026-01-01'), modified: new Date('2026-01-01')};
  // Vertreter-Feature (Ticket 05): eine fremde Gruppe, in der "me" nur Vertreter ist (nicht Owner).
  const deputyGroupZ: RetroGroupId = {id: 'g9', ownerId: 'other', name: 'Team Zeta', created: new Date('2026-01-01'), modified: new Date('2026-01-01'), deputies: ['me']};

  // Baut das TestBed mit ueberschreibbaren RetroService-Mocks neu auf (analog zu group.component.spec.ts),
  // damit einzelne describe-Bloecke abweichende Streams (z.B. listGroupsWhereDeputy$) durchreichen koennen.
  async function setup(overrides: Record<string, unknown> = {}): Promise<void> {
    // Idempotent aufrufbar: erlaubt einzelnen Tests, nach dem globalen beforeEach (Standard-Mocks)
    // per erneutem setup(...) abweichende Mocks (z.B. listGroupsWhereDeputy$) durchzureichen.
    TestBed.resetTestingModule();

    retroService = {
      listMyBoards$: of([olderActiveBoard, activeBoard, archivedBoard, groupedBoard]),
      listMyGroups$: of([groupA]),
      listGroupsWhereDeputy$: of([]),
      renameBoard: vi.fn().mockResolvedValue(undefined),
      setArchived: vi.fn().mockResolvedValue(undefined),
      createGroup: vi.fn().mockResolvedValue('new-group-id'),
      renameGroup: vi.fn().mockResolvedValue(undefined),
      deleteGroup: vi.fn().mockResolvedValue(undefined),
      assignBoardToGroup: vi.fn().mockResolvedValue(undefined),
      ...overrides,
    };

    // Owner-Aktionen laufen ueber die Seitenleiste (MenuService), analog zu board.component.spec.ts.
    menuService = {addCustomAction: vi.fn(), resetCustomActions: vi.fn()};

    await TestBed.configureTestingModule({
      imports: [BoardListComponent, NoopAnimationsModule],
      providers: [
        {provide: RetroService, useValue: retroService},
        {provide: MenuService, useValue: menuService},
        provideRouter([]),
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();

    fixture = TestBed.createComponent(BoardListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }

  beforeEach(async () => setup());

  afterEach(() => {
    TestBed.resetTestingModule();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('Trennung aktiv/archiviert/gruppiert', () => {
    it('boards$ enthaelt nur nicht-archivierte, UNGRUPPIERTE Boards, sortiert nach created desc', async () => {
      const boards = await firstValueFrom(component.boards$);

      expect(boards.map(b => b.id)).toEqual(['b1', 'b0']);
    });

    it('archivedBoards$ enthaelt nur archivierte, ungruppierte Boards', async () => {
      const archived = await firstValueFrom(component.archivedBoards$);

      expect(archived.map(b => b.id)).toEqual(['b2']);
    });

    it('gruppierte Boards erscheinen weder in boards$ noch in archivedBoards$', async () => {
      const boards = await firstValueFrom(component.boards$);
      const archived = await firstValueFrom(component.archivedBoards$);

      expect(boards.map(b => b.id)).not.toContain('b3');
      expect(archived.map(b => b.id)).not.toContain('b3');
    });
  });

  describe('Gruppen-Uebersicht', () => {
    it('groupViews$ liefert die Gruppe mit korrekter Board-Anzahl', async () => {
      const groups = await firstValueFrom(component.groupViews$);

      expect(groups).toHaveLength(1);
      expect(groups[0].group.id).toBe('g1');
      expect(groups[0].boardCount).toBe(1);
    });

    it('sortedGroups$ liefert die Gruppen des Owners', async () => {
      const groups = await firstValueFrom(component.sortedGroups$);

      expect(groups.map(g => g.id)).toEqual(['g1']);
    });
  });

  // Ticket 05: eigener Abschnitt fuer Gruppen, in denen der Nutzer nur Vertreter (nicht Owner) ist.
  describe('Vertreter-Sicht (Ticket 05: Gruppen, in denen ich Vertreter bin)', () => {
    it('deputyGroupViews$ liefert die Gruppen aus listGroupsWhereDeputy$', async () => {
      await setup({listGroupsWhereDeputy$: of([deputyGroupZ])});

      const views = await firstValueFrom(component.deputyGroupViews$);

      expect(views.map(g => g.id)).toEqual(['g9']);
    });

    it('dedupliziert eine Gruppe, die gleichzeitig eine eigene Gruppe ist', async () => {
      // groupA ist bereits Owner-Gruppe (listMyGroups$) -- selbst wenn der Deputy-Stream sie ebenfalls
      // liefert, darf sie NICHT zusaetzlich im Vertreter-Abschnitt auftauchen.
      await setup({listGroupsWhereDeputy$: of([groupA, deputyGroupZ])});

      const views = await firstValueFrom(component.deputyGroupViews$);

      expect(views.map(g => g.id)).toEqual(['g9']);
    });

    it('bleibt leer, wenn der Deputy-Stream leer ist (z.B. anonymer Nutzer)', async () => {
      const views = await firstValueFrom(component.deputyGroupViews$);

      expect(views).toEqual([]);
    });

    it('rendert den Vertreter-Abschnitt im Template nur, wenn Vertreter-Gruppen vorhanden sind', async () => {
      await setup({listGroupsWhereDeputy$: of([deputyGroupZ])});

      const text = (fixture.nativeElement as HTMLElement).textContent ?? '';

      expect(text).toContain('Gruppen, in denen ich Mitarbeiter bin');
      expect(text).toContain('Team Zeta');
    });

    it('zeigt bei leerem Deputy-Stream KEINEN Vertreter-Abschnitt', () => {
      const text = (fixture.nativeElement as HTMLElement).textContent ?? '';

      expect(text).not.toContain('Gruppen, in denen ich Mitarbeiter bin');
    });

    it('bietet an den Vertreter-Karten KEINE Owner-Aktionen (kein Umbenennen/Loeschen/Verwalten)', async () => {
      await setup({listGroupsWhereDeputy$: of([deputyGroupZ])});

      const deputyList = (fixture.nativeElement as HTMLElement).querySelector('.deputy-list');

      expect(deputyList).toBeTruthy();
      expect(deputyList?.querySelectorAll('app-icon-button').length).toBe(0);
    });

    it('sortedGroups$ (Verschiebe-Auswahl) enthaelt auch Vertreter-Gruppen', async () => {
      await setup({listGroupsWhereDeputy$: of([deputyGroupZ])});

      const groups = await firstValueFrom(component.sortedGroups$);

      expect(groups.map(g => g.id).sort()).toEqual(['g1', 'g9']);
    });
  });

  describe('Gruppe anlegen/umbenennen/loeschen', () => {
    it('saveNewGroup delegiert (getrimmt) an createGroup und schliesst das Formular', async () => {
      component.startCreateGroup();
      component.newGroupName = '  Team Beta  ';

      await component.saveNewGroup();

      expect(retroService.createGroup).toHaveBeenCalledWith('Team Beta');
      expect(component.creatingGroup).toBe(false);
    });

    it('saveNewGroup ignoriert einen leeren Namen (kein Firestore-Write)', async () => {
      component.startCreateGroup();
      component.newGroupName = '   ';

      await component.saveNewGroup();

      expect(retroService.createGroup).not.toHaveBeenCalled();
    });

    it('saveGroupEdit delegiert (getrimmt) an renameGroup', async () => {
      component.startEditGroup(groupA);
      component.editingGroupName = '  Neuer Name  ';

      await component.saveGroupEdit('g1');

      expect(retroService.renameGroup).toHaveBeenCalledWith('g1', 'Neuer Name');
      expect(component.editingGroupId).toBeNull();
    });

    it('deleteGroup loescht nur nach Bestaetigung', async () => {
      const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(false);
      await component.deleteGroup(groupA);
      expect(retroService.deleteGroup).not.toHaveBeenCalled();

      confirmSpy.mockReturnValue(true);
      await component.deleteGroup(groupA);
      expect(retroService.deleteGroup).toHaveBeenCalledWith('g1');

      confirmSpy.mockRestore();
    });
  });

  describe('Board in Gruppe verschieben', () => {
    it('moveBoardToGroup delegiert an assignBoardToGroup und setzt den Select zurueck', async () => {
      const select = {value: 'g1'} as HTMLSelectElement;

      await component.moveBoardToGroup('b1', {target: select} as unknown as Event);

      expect(retroService.assignBoardToGroup).toHaveBeenCalledWith('b1', 'g1');
      expect(select.value).toBe('');
    });

    it('moveBoardToGroup ohne Auswahl (leerer Wert) ruft nichts auf', async () => {
      const select = {value: ''} as HTMLSelectElement;

      await component.moveBoardToGroup('b1', {target: select} as unknown as Event);

      expect(retroService.assignBoardToGroup).not.toHaveBeenCalled();
    });
  });

  describe('Umbenennen (Board)', () => {
    it('saveEdit delegiert (getrimmt) an renameBoard und beendet den Edit-Modus', async () => {
      component.startEdit(activeBoard);
      component.editingTitle = '  Neuer Titel  ';

      await component.saveEdit('b1');

      expect(retroService.renameBoard).toHaveBeenCalledWith('b1', 'Neuer Titel');
      expect(component.editingBoardId).toBeNull();
    });
  });

  describe('Archivieren/Wiederherstellen', () => {
    it('archiviert ein aktives Board (archived: false -> true)', async () => {
      await component.toggleArchived(activeBoard);

      expect(retroService.setArchived).toHaveBeenCalledWith('b1', true);
    });
  });

  describe('ngOnInit/ngOnDestroy', () => {
    it('registriert "Neues Board anlegen" und "Neue Gruppe anlegen" im Seitenleisten-Menu', () => {
      expect(menuService.addCustomAction).toHaveBeenCalledWith('Neues Board anlegen', expect.any(Function));
      expect(menuService.addCustomAction).toHaveBeenCalledWith('Neue Gruppe anlegen', expect.any(Function));
    });

    it('setzt die Custom-Actions beim Destroy zurueck', () => {
      fixture.destroy();

      expect(menuService.resetCustomActions).toHaveBeenCalled();
    });
  });
});

import {describe, it, expect, beforeEach, vi} from 'vitest';
import {ComponentFixture, TestBed} from '@angular/core/testing';
import {NO_ERRORS_SCHEMA} from '@angular/core';
import {NoopAnimationsModule} from '@angular/platform-browser/animations';
import {provideRouter} from '@angular/router';
import {firstValueFrom, of} from 'rxjs';

import {BoardListComponent} from './board-list.component';
import {RetroService} from '../retro.service';
import {MenuService} from '../../../shared/menu/menu.service';
import {RetroBoardId} from '../models/retro';

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

  beforeEach(async () => {
    retroService = {
      listMyBoards$: of([olderActiveBoard, activeBoard, archivedBoard]),
      renameBoard: vi.fn().mockResolvedValue(undefined),
      setArchived: vi.fn().mockResolvedValue(undefined),
    };

    // Owner-Aktion "Neues Board anlegen" laeuft ueber die Seitenleiste (MenuService), analog zu
    // board.component.spec.ts.
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
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(BoardListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('Trennung aktiv/archiviert', () => {
    it('boards$ enthaelt nur nicht-archivierte Boards, sortiert nach created desc', async () => {
      const boards = await firstValueFrom(component.boards$);

      expect(boards.map(b => b.id)).toEqual(['b1', 'b0']);
    });

    it('archivedBoards$ enthaelt nur archivierte Boards', async () => {
      const archived = await firstValueFrom(component.archivedBoards$);

      expect(archived.map(b => b.id)).toEqual(['b2']);
    });
  });

  describe('Umbenennen', () => {
    it('startEdit setzt editingBoardId und uebernimmt den aktuellen Titel', () => {
      component.startEdit(activeBoard);

      expect(component.editingBoardId).toBe('b1');
      expect(component.editingTitle).toBe('Aktives Board');
    });

    it('saveEdit delegiert (getrimmt) an renameBoard und beendet den Edit-Modus', async () => {
      component.startEdit(activeBoard);
      component.editingTitle = '  Neuer Titel  ';

      await component.saveEdit('b1');

      expect(retroService.renameBoard).toHaveBeenCalledWith('b1', 'Neuer Titel');
      expect(component.editingBoardId).toBeNull();
      expect(component.editingTitle).toBe('');
    });

    it('saveEdit ignoriert einen leeren/nur-Whitespace-Titel (kein Firestore-Write, Edit bleibt offen)', async () => {
      component.startEdit(activeBoard);
      component.editingTitle = '   ';

      await component.saveEdit('b1');

      expect(retroService.renameBoard).not.toHaveBeenCalled();
      expect(component.editingBoardId).toBe('b1');
    });

    it('cancelEdit verwirft die Bearbeitung ohne Firestore-Zugriff', () => {
      component.startEdit(activeBoard);

      component.cancelEdit();

      expect(component.editingBoardId).toBeNull();
      expect(component.editingTitle).toBe('');
      expect(retroService.renameBoard).not.toHaveBeenCalled();
    });
  });

  describe('Archivieren/Wiederherstellen', () => {
    it('archiviert ein aktives Board (archived: false -> true)', async () => {
      await component.toggleArchived(activeBoard);

      expect(retroService.setArchived).toHaveBeenCalledWith('b1', true);
    });

    it('stellt ein archiviertes Board wieder her (archived: true -> false)', async () => {
      await component.toggleArchived(archivedBoard);

      expect(retroService.setArchived).toHaveBeenCalledWith('b2', false);
    });

    it('bricht eine laufende Umbenennung desselben Boards ab, wenn es archiviert/wiederhergestellt wird', async () => {
      component.startEdit(activeBoard);

      await component.toggleArchived(activeBoard);

      expect(component.editingBoardId).toBeNull();
    });
  });

  describe('Archiv-Abschnitt (Default eingeklappt)', () => {
    it('ist initial eingeklappt', () => {
      expect(component.archivedExpanded).toBe(false);
    });

    it('toggleArchivedSection klappt den Bereich auf und wieder zu', () => {
      component.toggleArchivedSection();
      expect(component.archivedExpanded).toBe(true);

      component.toggleArchivedSection();
      expect(component.archivedExpanded).toBe(false);
    });
  });

  describe('ngOnInit/ngOnDestroy', () => {
    it('registriert "Neues Board anlegen" im Seitenleisten-Menu', () => {
      expect(menuService.addCustomAction).toHaveBeenCalledWith('Neues Board anlegen', expect.any(Function));
    });

    it('setzt die Custom-Actions beim Destroy zurueck', () => {
      fixture.destroy();

      expect(menuService.resetCustomActions).toHaveBeenCalled();
    });
  });
});

import {describe, it, expect, beforeEach, afterEach, vi} from 'vitest';
import {ComponentFixture, TestBed} from '@angular/core/testing';
import {NO_ERRORS_SCHEMA} from '@angular/core';
import {NoopAnimationsModule} from '@angular/platform-browser/animations';
import {ActivatedRoute, provideRouter} from '@angular/router';
import {firstValueFrom, of} from 'rxjs';

import {GroupComponent} from './group.component';
import {RetroService} from '../retro.service';
import {LoginService} from '../../login/login.service';
import {HeaderService} from '../../../shared/header/header.service';
import {MenuService} from '../../../shared/menu/menu.service';
import {RetroBoardId, RetroGroupId} from '../models/retro';

describe('GroupComponent', () => {
  let component: GroupComponent;
  let fixture: ComponentFixture<GroupComponent>;
  let retroService: any;
  let menuService: any;

  const group: RetroGroupId = {id: 'g1', ownerId: 'me', name: 'Team Alpha', created: new Date('2026-01-01'), modified: new Date('2026-01-01')};
  const otherGroup: RetroGroupId = {id: 'g2', ownerId: 'me', name: 'Team Beta', created: new Date('2026-01-01'), modified: new Date('2026-01-01')};

  const boardOld: RetroBoardId = {
    id: 'b1', ownerId: 'me', title: 'Sprint 1', columns: [], hidden: false, timerEndsAt: null,
    created: new Date('2026-01-01'), modified: new Date('2026-01-01'), groupId: 'g1',
  };
  const boardCurrent: RetroBoardId = {
    id: 'b2', ownerId: 'me', title: 'Sprint 2', columns: [], hidden: false, timerEndsAt: null,
    created: new Date('2026-02-02'), modified: new Date('2026-02-02'), groupId: 'g1',
  };
  // juengstes created, aber archiviert -> darf NICHT das "aktuelle" Board sein.
  const boardArchived: RetroBoardId = {
    id: 'b0', ownerId: 'me', title: 'Sprint 0', columns: [], hidden: false, timerEndsAt: null,
    created: new Date('2026-03-03'), modified: new Date('2026-03-03'), archived: true, groupId: 'g1',
  };

  async function setup(uid: string | undefined): Promise<void> {
    retroService = {
      getGroup$: vi.fn().mockReturnValue(of(group)),
      listBoardsByGroup$: vi.fn().mockReturnValue(of([boardOld, boardCurrent, boardArchived])),
      listMyGroups$: of([group, otherGroup]),
      renameGroup: vi.fn().mockResolvedValue(undefined),
      assignBoardToGroup: vi.fn().mockResolvedValue(undefined),
    };
    menuService = {addCustomAction: vi.fn(), resetCustomActions: vi.fn()};
    const loginService = {currentUserId$: () => of(uid)};
    const headerService = {setBreadcrumb: vi.fn()};

    await TestBed.configureTestingModule({
      imports: [GroupComponent, NoopAnimationsModule],
      providers: [
        {provide: RetroService, useValue: retroService},
        {provide: MenuService, useValue: menuService},
        {provide: LoginService, useValue: loginService},
        {provide: HeaderService, useValue: headerService},
        provideRouter([]),
        // ActivatedRoute NACH provideRouter, sonst gewinnt dessen (leerer) Root-Route-Provider.
        {provide: ActivatedRoute, useValue: {snapshot: {paramMap: {get: (k: string) => (k === 'groupId' ? 'g1' : null)}}}},
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();

    fixture = TestBed.createComponent(GroupComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }

  afterEach(() => {
    TestBed.resetTestingModule();
  });

  describe('Board-Aufteilung (Owner-Sicht)', () => {
    beforeEach(async () => setup('me'));

    it('should create', () => {
      expect(component).toBeTruthy();
    });

    it('bestimmt das aktuelle Board als neuestes NICHT-archiviertes Board', async () => {
      const vm = await firstValueFrom(component.vm$);

      expect(vm.currentBoard?.id).toBe('b2');
      expect(vm.otherActiveBoards.map(b => b.id)).toEqual(['b1']);
      expect(vm.archivedBoards.map(b => b.id)).toEqual(['b0']);
    });

    it('otherGroups blendet die aktuelle Gruppe aus', async () => {
      const vm = await firstValueFrom(component.vm$);

      expect(component.otherGroups(vm).map(g => g.id)).toEqual(['g2']);
    });

    it('registriert die Owner-Aktionen in der Seitenleiste', () => {
      expect(menuService.addCustomAction).toHaveBeenCalledWith('Neues Board anlegen', expect.any(Function));
      expect(menuService.addCustomAction).toHaveBeenCalledWith('Gruppen-Link kopieren', expect.any(Function));
      expect(menuService.addCustomAction).toHaveBeenCalledWith('Gruppe umbenennen', expect.any(Function));
    });

    it('moveBoard verschiebt in eine andere Gruppe', async () => {
      const select = {value: 'g2'} as HTMLSelectElement;

      await component.moveBoard('b2', {target: select} as unknown as Event);

      expect(retroService.assignBoardToGroup).toHaveBeenCalledWith('b2', 'g2');
      expect(select.value).toBe('');
    });

    it('moveBoard mit __remove__ loest das Board aus der Gruppe', async () => {
      const select = {value: '__remove__'} as HTMLSelectElement;

      await component.moveBoard('b2', {target: select} as unknown as Event);

      expect(retroService.assignBoardToGroup).toHaveBeenCalledWith('b2', null);
    });

    it('saveRename delegiert (getrimmt) an renameGroup', async () => {
      component.editingNameValue = '  Team Gamma  ';

      await component.saveRename();

      expect(retroService.renameGroup).toHaveBeenCalledWith('g1', 'Team Gamma');
      expect(component.editingName).toBe(false);
    });
  });

  describe('Mitglied-Sicht (anonym, nicht Owner)', () => {
    beforeEach(async () => setup(undefined));

    it('markiert den Betrachter nicht als Owner', async () => {
      const vm = await firstValueFrom(component.vm$);

      expect(vm.isOwner).toBe(false);
    });

    it('registriert KEINE Verwaltungs-/Teilen-Aktionen fuer Mitglieder', () => {
      expect(menuService.addCustomAction).not.toHaveBeenCalled();
      expect(menuService.resetCustomActions).toHaveBeenCalled();
    });
  });
});

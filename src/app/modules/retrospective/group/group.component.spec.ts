import {describe, it, expect, beforeEach, afterEach, vi} from 'vitest';
import {ComponentFixture, TestBed} from '@angular/core/testing';
import {NO_ERRORS_SCHEMA} from '@angular/core';
import {NoopAnimationsModule} from '@angular/platform-browser/animations';
import {ActivatedRoute, provideRouter} from '@angular/router';
import {firstValueFrom, of} from 'rxjs';

import {GroupComponent} from './group.component';
import {RetroService} from '../retro.service';
import {LoginService} from '../../login/login.service';
import {UserService} from '../../login/user.service';
import {HeaderService} from '../../../shared/header/header.service';
import {MenuService} from '../../../shared/menu/menu.service';
import {RetroBoardId, RetroGroupId} from '../models/retro';

describe('GroupComponent', () => {
  let component: GroupComponent;
  let fixture: ComponentFixture<GroupComponent>;
  let retroService: any;
  let menuService: any;
  let userService: any;

  const group: RetroGroupId = {id: 'g1', ownerId: 'me', name: 'Team Alpha', created: new Date('2026-01-01'), modified: new Date('2026-01-01')};
  // Vertreter-Feature: dieselbe Gruppe, aber mit einem Vertreter -- Basis fuer die "Vertreter-Sicht"-Tests.
  const groupWithDeputy: RetroGroupId = {...group, deputies: ['dep1']};
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

  async function setup(uid: string | undefined, groupOverride: RetroGroupId = group, userServiceOverrides: Record<string, unknown> = {}): Promise<void> {
    retroService = {
      getGroup$: vi.fn().mockReturnValue(of(groupOverride)),
      listBoardsByGroup$: vi.fn().mockReturnValue(of([boardOld, boardCurrent, boardArchived])),
      listMyGroups$: of([groupOverride, otherGroup]),
      renameGroup: vi.fn().mockResolvedValue(undefined),
      assignBoardToGroup: vi.fn().mockResolvedValue(undefined),
      // Ticket 03 (Vertreter-Verwaltung): Freigabe-Code erzeugen/widerrufen + Vertreter entfernen.
      createInvite: vi.fn().mockResolvedValue('invite-code-123'),
      revokeInvite: vi.fn().mockResolvedValue(undefined),
      removeDeputy: vi.fn().mockResolvedValue(undefined),
    };
    menuService = {addCustomAction: vi.fn(), resetCustomActions: vi.fn()};
    const loginService = {currentUserId$: () => of(uid)};
    const headerService = {setBreadcrumb: vi.fn()};
    // Mitarbeiter-Liste (E-Mail statt uid): Default liefert kein Doc -> Fallback auf die uid,
    // sofern ein Test nichts anderes ueberschreibt.
    userService = {getUser$: vi.fn().mockReturnValue(of(undefined)), ...userServiceOverrides};

    await TestBed.configureTestingModule({
      imports: [GroupComponent, NoopAnimationsModule],
      providers: [
        {provide: RetroService, useValue: retroService},
        {provide: MenuService, useValue: menuService},
        {provide: LoginService, useValue: loginService},
        {provide: UserService, useValue: userService},
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

    it('markiert den Owner als Board-Manager (canManage)', async () => {
      const vm = await firstValueFrom(component.vm$);

      expect(vm.canManage).toBe(true);
    });

    describe('Ticket 03: Freigabe-Code erzeugen/widerrufen', () => {
      it('createInvite erzeugt einen Code, den kopierbaren Link und ein lesbares Ablaufdatum', async () => {
        expect(component.inviteCode).toBeNull();

        await component.createInvite();

        expect(retroService.createInvite).toHaveBeenCalledWith('g1');
        expect(component.inviteCode).toBe('invite-code-123');
        expect(component.inviteLink).toContain('/retrospective/join/invite-code-123');
        expect(component.inviteExpiresLabel).toBeTruthy();
      });

      it('copyInviteLink kopiert den Link und gibt kurzes Feedback', async () => {
        if (!navigator.clipboard) {
          (navigator as any).clipboard = {writeText: () => Promise.resolve()};
        }
        const writeTextSpy = vi.spyOn(navigator.clipboard, 'writeText').mockResolvedValue(undefined);
        await component.createInvite();

        await component.copyInviteLink();

        expect(writeTextSpy).toHaveBeenCalledWith(component.inviteLink);
        expect(component.inviteLinkCopied).toBe(true);
      });

      it('revokeInvite widerruft den gerade erzeugten Code und setzt die Anzeige zurueck', async () => {
        await component.createInvite();

        await component.revokeInvite();

        expect(retroService.revokeInvite).toHaveBeenCalledWith('invite-code-123');
        expect(component.inviteCode).toBeNull();
        expect(component.inviteLink).toBeNull();
      });

      it('revokeInvite ohne zuvor erzeugten Code ist ein No-op', async () => {
        await component.revokeInvite();

        expect(retroService.revokeInvite).not.toHaveBeenCalled();
      });
    });

    describe('Ticket 03: Vertreter entfernen', () => {
      it('removeDeputy delegiert an retroService.removeDeputy', async () => {
        await component.removeDeputy('dep1');

        expect(retroService.removeDeputy).toHaveBeenCalledWith('g1', 'dep1');
      });
    });
  });

  describe('Mitarbeiter-Liste: E-Mail statt uid (Owner-Sicht auf eigene Gruppe mit Mitarbeiter)', () => {
    it('zeigt die E-Mail aus getUser$ als label', async () => {
      await setup('me', groupWithDeputy, {getUser$: vi.fn().mockReturnValue(of({id: 'dep1', name: 'Dep', email: 'dep1@example.com'}))});

      const infos = await firstValueFrom(component.deputyInfos$);

      expect(userService.getUser$).toHaveBeenCalledWith('dep1');
      expect(infos).toEqual([{uid: 'dep1', label: 'dep1@example.com'}]);
    });

    it('faellt auf die uid zurueck, solange noch keine E-Mail gespeichert ist', async () => {
      await setup('me', groupWithDeputy, {getUser$: vi.fn().mockReturnValue(of({id: 'dep1', name: 'Dep'}))});

      const infos = await firstValueFrom(component.deputyInfos$);

      expect(infos).toEqual([{uid: 'dep1', label: 'dep1'}]);
    });

    it('liefert eine leere Liste, wenn die Gruppe keine Mitarbeiter hat', async () => {
      await setup('me', group);

      const infos = await firstValueFrom(component.deputyInfos$);

      expect(infos).toEqual([]);
      expect(userService.getUser$).not.toHaveBeenCalled();
    });
  });

  describe('Mitglied-Sicht (anonym, nicht Owner)', () => {
    beforeEach(async () => setup(undefined));

    it('markiert den Betrachter nicht als Owner', async () => {
      const vm = await firstValueFrom(component.vm$);

      expect(vm.isOwner).toBe(false);
    });

    it('markiert den Betrachter nicht als Board-Manager', async () => {
      const vm = await firstValueFrom(component.vm$);

      expect(vm.canManage).toBe(false);
    });

    it('registriert KEINE Verwaltungs-/Teilen-Aktionen fuer Mitglieder', () => {
      expect(menuService.addCustomAction).not.toHaveBeenCalled();
      expect(menuService.resetCustomActions).toHaveBeenCalled();
    });
  });

  // Vertreter-Feature (Ticket 04): ein Vertreter (uid in group.deputies, NICHT der Owner) ist
  // Board-Manager (darf Boards anlegen) aber KEIN Owner (keine Gruppen-Verwaltung).
  describe('Vertreter-Sicht (eingeloggter Vertreter, kein Owner)', () => {
    beforeEach(async () => setup('dep1', groupWithDeputy));

    it('markiert den Vertreter als Board-Manager, aber nicht als Owner', async () => {
      const vm = await firstValueFrom(component.vm$);

      expect(vm.isOwner).toBe(false);
      expect(vm.canManage).toBe(true);
    });

    it('registriert "Neues Board anlegen" fuer den Vertreter, aber KEINE Gruppen-Verwaltungsaktionen', () => {
      expect(menuService.addCustomAction).toHaveBeenCalledWith('Neues Board anlegen', expect.any(Function));
      expect(menuService.addCustomAction).not.toHaveBeenCalledWith('Gruppen-Link kopieren', expect.any(Function));
      expect(menuService.addCustomAction).not.toHaveBeenCalledWith('Gruppe umbenennen', expect.any(Function));
    });
  });
});

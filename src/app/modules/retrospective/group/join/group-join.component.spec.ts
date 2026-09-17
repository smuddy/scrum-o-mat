import {describe, it, expect, beforeEach, afterEach, vi} from 'vitest';
import {ComponentFixture, TestBed} from '@angular/core/testing';
import {NO_ERRORS_SCHEMA} from '@angular/core';
import {NoopAnimationsModule} from '@angular/platform-browser/animations';
import {ActivatedRoute, provideRouter, Router} from '@angular/router';
import {of} from 'rxjs';

import {GroupJoinComponent} from './group-join.component';
import {RetroService} from '../../retro.service';
import {LoginService} from '../../../login/login.service';
import {HeaderService} from '../../../../shared/header/header.service';
import {RetroGroupId, RetroInvite} from '../../models/retro';

describe('GroupJoinComponent', () => {
  let component: GroupJoinComponent;
  let fixture: ComponentFixture<GroupJoinComponent>;
  let retroService: any;
  let headerService: any;
  let router: Router;

  const group: RetroGroupId = {id: 'g1', ownerId: 'owner1', name: 'Team Alpha', created: new Date('2026-01-01'), modified: new Date('2026-01-01')};

  function makeInvite(expiresAt: any): RetroInvite {
    return {groupId: 'g1', createdBy: 'owner1', created: new Date('2026-01-01'), expiresAt};
  }

  async function setup(uid: string | undefined): Promise<void> {
    headerService = {setBreadcrumb: vi.fn()};
    const loginService = {currentUserId$: () => of(uid)};

    await TestBed.configureTestingModule({
      imports: [GroupJoinComponent, NoopAnimationsModule],
      providers: [
        {provide: RetroService, useValue: retroService},
        {provide: LoginService, useValue: loginService},
        {provide: HeaderService, useValue: headerService},
        provideRouter([]),
        // ActivatedRoute NACH provideRouter, sonst gewinnt dessen (leerer) Root-Route-Provider.
        {provide: ActivatedRoute, useValue: {snapshot: {paramMap: {get: (k: string) => (k === 'code' ? 'code123' : null)}}}},
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();

    router = TestBed.inject(Router);
    vi.spyOn(router, 'navigateByUrl').mockResolvedValue(true);

    fixture = TestBed.createComponent(GroupJoinComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
    await fixture.whenStable();
  }

  afterEach(() => {
    TestBed.resetTestingModule();
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  describe('Vorschau: unbekannter Code', () => {
    beforeEach(async () => {
      retroService = {
        getInvite: vi.fn().mockResolvedValue(null),
        getGroup$: vi.fn(),
        redeemInvite: vi.fn(),
      };
      await setup('me');
    });

    it('zeigt den Fehlerzustand "invalid"', () => {
      expect(component.state).toBe('invalid');
    });
  });

  describe('Vorschau: abgelaufener Code', () => {
    beforeEach(async () => {
      retroService = {
        getInvite: vi.fn().mockResolvedValue(makeInvite(new Date('2020-01-01'))),
        getGroup$: vi.fn(),
        redeemInvite: vi.fn(),
      };
      await setup('me');
    });

    it('zeigt den Fehlerzustand "expired"', () => {
      expect(component.state).toBe('expired');
    });
  });

  describe('Vorschau: abgelaufener Code als Firestore-Timestamp (toDate())', () => {
    beforeEach(async () => {
      retroService = {
        getInvite: vi.fn().mockResolvedValue(makeInvite({toDate: () => new Date('2020-01-01')})),
        getGroup$: vi.fn(),
        redeemInvite: vi.fn(),
      };
      await setup('me');
    });

    it('erkennt den Ablauf auch ueber toDate() statt eines Date/String-Werts', () => {
      expect(component.state).toBe('expired');
    });
  });

  describe('Vorschau: gueltiger Code, eingeloggt', () => {
    beforeEach(async () => {
      retroService = {
        getInvite: vi.fn().mockResolvedValue(makeInvite(new Date('2099-01-01'))),
        getGroup$: vi.fn().mockReturnValue(of(group)),
        redeemInvite: vi.fn(),
      };
      await setup('me');
    });

    it('zeigt den Gruppennamen und markiert den Betrachter als eingeloggt', () => {
      expect(component.state).toBe('ready');
      expect(component.groupName).toBe('Team Alpha');
      expect(component.isLoggedIn).toBe(true);
    });

    it('setzt den Breadcrumb auf die Retrospektive-Uebersicht', () => {
      expect(headerService.setBreadcrumb).toHaveBeenCalledWith([{route: '/retrospective', name: 'Retrospektive'}]);
    });

    describe('join()', () => {
      it('loest den Code ein und navigiert nach kurzer Bestaetigung zur Gruppen-Seite', async () => {
        vi.useFakeTimers();
        retroService.redeemInvite.mockResolvedValue({groupId: 'g1'});

        await component.join();

        expect(retroService.redeemInvite).toHaveBeenCalledWith('code123', 'me');
        expect(component.state).toBe('success');
        expect(router.navigateByUrl).not.toHaveBeenCalledWith('/retrospective/group/g1');

        await vi.advanceTimersByTimeAsync(1200);

        expect(router.navigateByUrl).toHaveBeenCalledWith('/retrospective/group/g1');
      });

      it('zeigt "invalid" mit Fehlermeldung, wenn der Code inzwischen verbraucht/widerrufen wurde', async () => {
        retroService.redeemInvite.mockResolvedValue('not-found');

        await component.join();

        expect(component.state).toBe('invalid');
        expect(component.joinErrorMessage).toBeTruthy();
      });

      it('zeigt "expired" mit Fehlermeldung, wenn der Code inzwischen abgelaufen ist', async () => {
        retroService.redeemInvite.mockResolvedValue('expired');

        await component.join();

        expect(component.state).toBe('expired');
        expect(component.joinErrorMessage).toBeTruthy();
      });
    });
  });

  describe('Vorschau: gueltiger Code, anonym/nicht eingeloggt', () => {
    beforeEach(async () => {
      retroService = {
        getInvite: vi.fn().mockResolvedValue(makeInvite(new Date('2099-01-01'))),
        getGroup$: vi.fn().mockReturnValue(of(group)),
        redeemInvite: vi.fn(),
      };
      await setup(undefined);
    });

    it('markiert den Betrachter als NICHT eingeloggt', () => {
      expect(component.state).toBe('ready');
      expect(component.isLoggedIn).toBe(false);
    });

    it('goToLogin hinterlegt die Join-URL in localStorage und navigiert zu /login', async () => {
      const setItemSpy = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => undefined);

      await component.goToLogin();

      expect(setItemSpy).toHaveBeenCalledWith('retroReturnUrl', '/retrospective/join/code123');
      expect(router.navigateByUrl).toHaveBeenCalledWith('/login');
    });

    it('join() tut nichts (defensive Absicherung), da keine reale uid vorliegt', async () => {
      await component.join();

      expect(retroService.redeemInvite).not.toHaveBeenCalled();
      expect(component.state).toBe('ready');
    });
  });
});

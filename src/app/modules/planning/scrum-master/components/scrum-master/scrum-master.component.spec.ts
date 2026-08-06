import {describe, it, expect, beforeEach, vi} from 'vitest';

vi.mock('@angular/fire/firestore', () => {
  const g = globalThis as any;
  if (!g.__fireFirestoreMock) {
    g.__fireFirestoreMock = {
      Firestore: class Firestore {},
      collection: vi.fn(), doc: vi.fn(), query: vi.fn(), where: vi.fn(), orderBy: vi.fn(), limit: vi.fn(),
      collectionData: vi.fn(), docData: vi.fn(),
      addDoc: vi.fn(), setDoc: vi.fn(), updateDoc: vi.fn(), deleteDoc: vi.fn(),
      Timestamp: {fromDate: (d: any) => ({toDate: () => d}), now: () => ({toDate: () => new Date()})},
    };
  }
  return g.__fireFirestoreMock;
});
vi.mock('@angular/fire/auth', () => {
  const g = globalThis as any;
  if (!g.__fireAuthMock) {
    g.__fireAuthMock = {
      Auth: class Auth {},
      authState: vi.fn(), signInAnonymously: vi.fn(),
      signInWithEmailAndPassword: vi.fn(), createUserWithEmailAndPassword: vi.fn(),
      signOut: vi.fn(), user: vi.fn(),
    };
  }
  return g.__fireAuthMock;
});
import {ComponentFixture, TestBed} from '@angular/core/testing';
import {NO_ERRORS_SCHEMA} from '@angular/core';
import {NoopAnimationsModule} from '@angular/platform-browser/animations';
import {ActivatedRoute, Router} from '@angular/router';
import {of, Subject} from 'rxjs';

import {ScrumMasterComponent} from './scrum-master.component';
import {PlanningService} from '../../../planning.service';
import {AdminService} from '../../../admin/components/admin.service';
import {MenuService} from '../../../../../shared/menu/menu.service';
import {HeaderService} from '../../../../../shared/header/header.service';
import {FireworksService} from '../../../../../shared/fireworks/fireworks.service';
import {environment} from '../../../../../../environments/environment';
import {Planning} from '../../../models/planning';
import {DeveloperId} from '../../../models/delevoper';
import {StoryPoints} from '../../../models/storyPoints';

describe('ScrumMasterComponent', () => {
  let component: ScrumMasterComponent;
  let fixture: ComponentFixture<ScrumMasterComponent>;
  let planningService: any;
  let router: any;
  let menuService: any;
  let headerService: any;
  let fireworksService: any;
  let menuOpenSubject: Subject<boolean>;

  function createComponent(): void {
    fixture = TestBed.createComponent(ScrumMasterComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }

  beforeEach(async () => {
    fireworksService = {start: vi.fn(), stop: vi.fn(), configure: vi.fn()};

    planningService = {
      getDevelopers: vi.fn().mockReturnValue(of([])),
      getPlanning: vi.fn().mockReturnValue(of(undefined)),
      resetEstimate: vi.fn().mockResolvedValue(undefined),
      setEstimateResult: vi.fn().mockResolvedValue(undefined),
      deletePlanning: vi.fn().mockResolvedValue(undefined),
    };

    router = {
      navigateByUrl: vi.fn().mockResolvedValue(true),
      createUrlTree: vi.fn().mockReturnValue({} as any),
    };

    menuOpenSubject = new Subject<boolean>();
    menuService = {
      addCustomAction: vi.fn(),
      resetCustomActions: vi.fn(),
      menuOpen$: menuOpenSubject.asObservable(),
    };

    headerService = {setBreadcrumb: vi.fn(), setFullscreen: vi.fn()};

    await TestBed.configureTestingModule({
      imports: [ScrumMasterComponent, NoopAnimationsModule],
      providers: [
        {provide: ActivatedRoute, useValue: {params: of({planningId: 'p1'})} as any},
        {provide: PlanningService, useValue: planningService},
        {provide: Router, useValue: router},
        {provide: MenuService, useValue: menuService},
        {provide: HeaderService, useValue: headerService},
        {provide: AdminService, useValue: {getDevelopers: vi.fn().mockReturnValue(of([])), deleteUser: vi.fn().mockResolvedValue(undefined)}},
        {provide: FireworksService, useValue: fireworksService},
      ],
      schemas: [NO_ERRORS_SCHEMA],
    })
      .compileComponents();
  });

  it('should create', () => {
    createComponent();
    expect(component).toBeTruthy();
  });

  it('sets the breadcrumb and loads developers and planning on init', () => {
    const developers: DeveloperId[] = [{id: 'd1', name: 'Dev', storyPoints: null}];
    const planning: Planning = {
      issue: null, modified: new Date(), subject: 'Sprint 1', count: 2, userId: 'u1',
      estimateRequested: false, estimateSucceeded: true, storyPoints: StoryPoints.s5,
    };
    planningService.getDevelopers.mockReturnValue(of(developers));
    planningService.getPlanning.mockReturnValue(of(planning));

    createComponent();

    expect(headerService.setBreadcrumb).toHaveBeenCalledWith([{route: '/planning', name: 'Scrum Poker'}]);
    expect(component.developers).toBe(developers);
    expect(component.planning).toBe(planning);
    expect(component.count).toBe(2);
    expect(menuService.addCustomAction).toHaveBeenCalledWith('Session beenden', expect.any(Function));
    expect(fireworksService.start).toHaveBeenCalled();
    // estimateSucceeded=true, storyPoints=s5 (nicht Kaffee), count=2 -> 50 Partikel, Intervall [200*4, 1500*4].
    expect(fireworksService.configure).toHaveBeenCalledWith(50, [800, 6000]);
  });

  it('navigates away when the loaded planning has no subject', () => {
    planningService.getPlanning.mockReturnValue(of({} as Planning));

    createComponent();

    expect(router.navigateByUrl).toHaveBeenCalledWith('/planning');
    expect(component.planning).toBeUndefined();
  });

  it('enables fullscreen mode when the planning has an issue', () => {
    const planning: Planning = {
      issue: 'ISSUE-1', modified: new Date(), subject: 'Sprint 1', count: 1, userId: 'u1',
      estimateRequested: false, estimateSucceeded: false, storyPoints: StoryPoints.s5,
    };
    planningService.getPlanning.mockReturnValue(of(planning));

    createComponent();

    expect(headerService.setFullscreen).toHaveBeenCalledWith(true);
  });

  it('derives the estimate status flags from the current planning', () => {
    createComponent();
    component.planning = {
      issue: null, modified: new Date(), subject: 'Sprint 1', count: 1, userId: 'u1',
      estimateRequested: false, estimateSucceeded: true, storyPoints: StoryPoints.s5,
    };

    expect(component.estimateSucceeded()).toBe(true);
    expect(component.coffeeBreak()).toBe(false);
    expect(component.estimateFailed()).toBe(false);
    expect(component.estimateRequested()).toBe(false);

    component.planning.storyPoints = StoryPoints.coffee;
    expect(component.estimateSucceeded()).toBe(false);
    expect(component.coffeeBreak()).toBe(true);

    component.planning.estimateSucceeded = false;
    component.planning.storyPoints = StoryPoints.s5;
    expect(component.estimateFailed()).toBe(true);

    component.planning.estimateRequested = true;
    expect(component.estimateRequested()).toBe(true);
  });

  it('requests a new estimate for the next round', async () => {
    createComponent();
    component.planning = {count: 3} as Planning;

    await component.requestEstimate();

    expect(planningService.resetEstimate).toHaveBeenCalledWith('p1', 4);
  });

  it('resumes after a coffee break with the current round', async () => {
    createComponent();
    component.planning = {count: 3} as Planning;

    await component.resumeAfterCoffeeBreak();

    expect(planningService.resetEstimate).toHaveBeenCalledWith('p1', 3);
  });

  it('navigates away and deletes the planning on logout', async () => {
    createComponent();

    await component.logout();

    expect(router.navigateByUrl).toHaveBeenCalledWith('/planning');
    expect(planningService.deletePlanning).toHaveBeenCalledWith('p1');
  });

  it('builds the shareable link from the planning id', () => {
    createComponent();

    expect(component.link()).toBe(environment.url + 'p1');
  });

  it('copies the given link to the clipboard', () => {
    createComponent();
    if (!navigator.clipboard) {
      (navigator as any).clipboard = {writeText: () => Promise.resolve()};
    }
    const writeTextSpy = vi.spyOn(navigator.clipboard, 'writeText').mockResolvedValue(undefined);

    component.copyLink('http://link');

    expect(writeTextSpy).toHaveBeenCalledWith('http://link');
  });

  it('ignores developer updates when no estimate is requested', async () => {
    createComponent();
    component.planning = {estimateRequested: false} as Planning;

    await component['developersChanged']([{id: 'd1', name: 'A', storyPoints: StoryPoints.s5} as DeveloperId]);

    expect(planningService.setEstimateResult).not.toHaveBeenCalled();
  });

  it('sets a successful estimate result once every developer agreed', async () => {
    createComponent();
    component.planning = {estimateRequested: true} as Planning;
    const developers = [
      {id: 'd1', name: 'A', storyPoints: StoryPoints.s5} as DeveloperId,
      {id: 'd2', name: 'B', storyPoints: StoryPoints.s5} as DeveloperId,
    ];

    await component['developersChanged'](developers);

    expect(planningService.setEstimateResult).toHaveBeenCalledWith('p1', true, StoryPoints.s5);
  });

  it('sets a failed estimate result when developers disagree', async () => {
    createComponent();
    component.planning = {estimateRequested: true} as Planning;
    const developers = [
      {id: 'd1', name: 'A', storyPoints: StoryPoints.s5} as DeveloperId,
      {id: 'd2', name: 'B', storyPoints: StoryPoints.s8} as DeveloperId,
    ];

    await component['developersChanged'](developers);

    expect(planningService.setEstimateResult).toHaveBeenCalledWith('p1', false, StoryPoints.s5);
  });

  it('waits for every developer to choose before setting a result', async () => {
    createComponent();
    component.planning = {estimateRequested: true} as Planning;
    const developers = [
      {id: 'd1', name: 'A', storyPoints: StoryPoints.s5} as DeveloperId,
      {id: 'd2', name: 'B', storyPoints: null} as DeveloperId,
    ];

    await component['developersChanged'](developers);

    expect(planningService.setEstimateResult).not.toHaveBeenCalled();
  });

  it('sets a coffee-break result as soon as one developer chooses coffee', async () => {
    createComponent();
    component.planning = {estimateRequested: true} as Planning;
    const developers = [
      {id: 'd1', name: 'A', storyPoints: StoryPoints.coffee} as DeveloperId,
      {id: 'd2', name: 'B', storyPoints: null} as DeveloperId,
    ];

    await component['developersChanged'](developers);

    expect(planningService.setEstimateResult).toHaveBeenCalledWith('p1', true, StoryPoints.coffee);
  });

  it('hides the qr code once the menu is opened', () => {
    createComponent();
    expect(component.showQrCode).toBe(true);

    menuOpenSubject.next(true);

    expect(component.showQrCode).toBe(false);
  });

  it('resets the custom menu actions and disables fullscreen on destroy', () => {
    createComponent();

    component.ngOnDestroy();

    expect(menuService.resetCustomActions).toHaveBeenCalled();
    expect(headerService.setFullscreen).toHaveBeenCalledWith(false);
    expect(fireworksService.stop).toHaveBeenCalled();
  });

});

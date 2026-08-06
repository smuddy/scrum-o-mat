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
import {of} from 'rxjs';

import {DeveloperComponent} from './developer.component';
import {PlanningService} from '../../../planning.service';
import {AdminService} from '../../../admin/components/admin.service';
import {MenuService} from '../../../../../shared/menu/menu.service';
import {HeaderService} from '../../../../../shared/header/header.service';
import {FireworksService} from '../../../../../shared/fireworks/fireworks.service';
import {StoryPoints} from '../../../models/storyPoints';

describe('DeveloperComponent', () => {
  let component: DeveloperComponent;
  let fixture: ComponentFixture<DeveloperComponent>;
  let planningService: any;
  let adminService: any;
  let menuService: any;
  let headerService: any;
  let fireworksService: any;
  let router: any;

  beforeEach(async () => {
    fireworksService = {start: vi.fn(), stop: vi.fn(), configure: vi.fn()};

    planningService = {
      getPlanning: vi.fn().mockReturnValue(of(null)),
      getDeveloper: vi.fn().mockReturnValue(of({name: 'Ada', storyPoints: 1} as any)),
      updateStoryPoints: vi.fn().mockResolvedValue(undefined),
      deleteUser: vi.fn().mockResolvedValue(undefined),
    };

    adminService = {
      getDevelopers: vi.fn().mockReturnValue(of([])),
    };

    menuService = {
      addCustomAction: vi.fn(),
      resetCustomActions: vi.fn(),
    };
    headerService = {
      setBreadcrumb: vi.fn(),
      setFullscreen: vi.fn(),
    };

    router = {
      navigateByUrl: vi.fn().mockResolvedValue(true),
      createUrlTree: vi.fn().mockReturnValue({} as any),
    };

    await TestBed.configureTestingModule({
      imports: [DeveloperComponent, NoopAnimationsModule],
      providers: [
        {provide: ActivatedRoute, useValue: {params: of({planningId: 'p1', userId: 'u1'})} as any},
        {provide: PlanningService, useValue: planningService},
        {provide: AdminService, useValue: adminService},
        {provide: MenuService, useValue: menuService},
        {provide: HeaderService, useValue: headerService},
        {provide: Router, useValue: router},
        {provide: FireworksService, useValue: fireworksService},
      ],
      schemas: [NO_ERRORS_SCHEMA],
    })
      .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(DeveloperComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('sets the breadcrumb and enables fullscreen on init', () => {
    expect(headerService.setBreadcrumb).toHaveBeenCalledWith([{route: '/planning', name: 'Scrum Poker'}]);
    expect(headerService.setFullscreen).toHaveBeenCalledWith(true);
    expect(fireworksService.start).toHaveBeenCalled();
  });

  it('navigates away when there is no active planning', () => {
    expect(router.createUrlTree).toHaveBeenCalledWith(['/'], {queryParams: {session: 'p1'}});
    expect(router.navigateByUrl).toHaveBeenCalled();
  });

  it('renders story points as text', () => {
    expect(component.renderStoryPoints(StoryPoints.s5)).toBe('5');
  });

  it('delegates card selection to planningService.updateStoryPoints', async () => {
    await component.onCardSelected(StoryPoints.s5);

    expect(planningService.updateStoryPoints).toHaveBeenCalledWith('p1', 'u1', StoryPoints.s5);
  });

  it('calculates the width percentage based on maxPoints', () => {
    component.maxPoints = 4;

    expect(component.getWidthPercentage(2)).toBe(30);
  });

  it('logs out by deleting the user and navigating to the planning overview', async () => {
    await component.logout();

    expect(planningService.deleteUser).toHaveBeenCalledWith('p1', 'u1');
    expect(router.createUrlTree).toHaveBeenCalledWith(['/planning/'], {queryParams: {session: 'p1'}});
    expect(router.navigateByUrl).toHaveBeenCalled();
  });

  it('renders the current story points via the parameterless renderer', () => {
    component.storyPoints = StoryPoints.s8;

    expect(component.renderStoryPoint()).toBe('8');
  });

  it('disables fullscreen and resets the custom actions on destroy', () => {
    headerService.setFullscreen.mockClear();
    menuService.resetCustomActions.mockClear();

    fixture.destroy();

    expect(headerService.setFullscreen).toHaveBeenCalledWith(false);
    expect(menuService.resetCustomActions).toHaveBeenCalled();
    expect(fireworksService.stop).toHaveBeenCalled();
  });

});

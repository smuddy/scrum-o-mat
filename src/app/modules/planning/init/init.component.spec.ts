import {describe, it, expect, beforeEach, afterEach, vi} from 'vitest';
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

import {InitComponent} from './init.component';
import {PlanningService} from '../planning.service';
import {HeaderService} from '../../../shared/header/header.service';
import {UserService} from '../../login/user.service';

describe('InitComponent', () => {
  let component: InitComponent;
  let fixture: ComponentFixture<InitComponent>;
  let planningService: any;
  let userService: any;
  let router: {navigateByUrl: ReturnType<typeof vi.fn>; createUrlTree: ReturnType<typeof vi.fn>};
  let headerService: {setBreadcrumb: ReturnType<typeof vi.fn>; setFullscreen: ReturnType<typeof vi.fn>};

  beforeEach(async () => {
    planningService = {
      listMyPlannings$: of([]),
      createNewSession: vi.fn().mockResolvedValue('planning-1'),
      addUser: vi.fn().mockResolvedValue('user-1'),
    };
    userService = {
      user$: of({name: 'Alice'} as any),
      setUserNameAsync: vi.fn().mockResolvedValue(undefined),
    };
    router = {
      navigateByUrl: vi.fn().mockResolvedValue(true),
      createUrlTree: vi.fn().mockReturnValue({} as any),
    };
    headerService = {
      setBreadcrumb: vi.fn(),
      setFullscreen: vi.fn(),
    };

    await TestBed.configureTestingModule({
      imports: [InitComponent, NoopAnimationsModule],
      providers: [
        {provide: PlanningService, useValue: planningService},
        {provide: Router, useValue: router},
        {provide: ActivatedRoute, useValue: {queryParams: of({session: 'p1'})} as any},
        {provide: HeaderService, useValue: headerService},
        {provide: UserService, useValue: userService},
      ],
      schemas: [NO_ERRORS_SCHEMA],
    })
      .compileComponents();
  });

  beforeEach(() => {
    localStorage.removeItem('last-session');
    fixture = TestBed.createComponent(InitComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => {
    localStorage.removeItem('last-session');
    localStorage.removeItem('user');
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('sets the breadcrumb and disables fullscreen on init', () => {
    expect(headerService.setBreadcrumb).toHaveBeenCalledWith([{route: '/planning', name: 'Scrum Poker'}]);
    expect(headerService.setFullscreen).toHaveBeenCalledWith(false);
  });

  it('takes the planning id from the query params', () => {
    expect(component.planningId).toBe('p1');
  });

  it('sets the username once the current user resolves', async () => {
    await fixture.whenStable();

    expect(component.username).toBe('Alice');
  });

  it('creates a new session and navigates to the master view', async () => {
    component.subject = 'Sprint planning';

    await component.goMaster();

    expect(planningService.createNewSession).toHaveBeenCalledWith('Sprint planning');
    expect(component.planningId).toBe('planning-1');
    expect(router.navigateByUrl).toHaveBeenCalledWith('/planning/planning-1/master');
  });

  it('does not create a session when no subject is set', async () => {
    component.subject = null;

    await component.goMaster();

    expect(planningService.createNewSession).not.toHaveBeenCalled();
    expect(router.navigateByUrl).not.toHaveBeenCalled();
  });

  it('adds a developer and navigates when joining as developer', async () => {
    // Let the async username assignment from ngOnInit (user$ -> 'Alice') settle first,
    // otherwise it overwrites the username we set below during goDeveloper's awaits.
    await fixture.whenStable();
    component.planningId = 'p1';
    component.username = 'Bob';

    await component.goDeveloper();

    expect(userService.setUserNameAsync).toHaveBeenCalledWith('Bob');
    expect(planningService.addUser).toHaveBeenCalledWith('p1', 'Bob');
    expect(localStorage.getItem('last-session')).toBe('user-1');
    expect(router.navigateByUrl).toHaveBeenCalledWith('/planning/p1/user-1');
  });

  it('does not navigate when no user id is returned', async () => {
    planningService.addUser.mockResolvedValue(null);
    component.planningId = 'p1';
    component.username = 'Bob';

    await component.goDeveloper();

    expect(localStorage.getItem('last-session')).toBeNull();
    expect(router.navigateByUrl).not.toHaveBeenCalled();
  });

  it('reports whether a last session exists', () => {
    expect(component.hasLastSession()).toBe(false);

    localStorage.setItem('last-session', 'user-1');

    expect(component.hasLastSession()).toBe(true);
  });

  it('navigates to the last session as developer', async () => {
    localStorage.setItem('last-session', 'user-1');
    component.planningId = 'p1';

    await component.goDeveloperLastSession();

    expect(router.navigateByUrl).toHaveBeenCalledWith('/planning/p1/user-1');
  });

  it('navigates as guest', async () => {
    component.planningId = 'p1';

    await component.goGuest();

    expect(router.navigateByUrl).toHaveBeenCalledWith('/planning/p1/guest');
  });

});

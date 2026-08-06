import {ComponentFixture, TestBed} from '@angular/core/testing';
import {NO_ERRORS_SCHEMA} from '@angular/core';
import {CommonModule} from '@angular/common';
import {FormsModule} from '@angular/forms';
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
  let router: jasmine.SpyObj<Router>;
  let headerService: jasmine.SpyObj<HeaderService>;

  beforeEach(async () => {
    planningService = {
      listMyPlannings$: of([]),
      createNewSession: jasmine.createSpy('createNewSession').and.resolveTo('planning-1'),
      addUser: jasmine.createSpy('addUser').and.resolveTo('user-1'),
    };
    userService = {
      user$: of({name: 'Alice'} as any),
      setUserNameAsync: jasmine.createSpy('setUserNameAsync').and.resolveTo(),
    };
    router = jasmine.createSpyObj('Router', ['navigateByUrl', 'createUrlTree']);
    router.navigateByUrl.and.resolveTo(true);
    router.createUrlTree.and.returnValue({} as any);
    headerService = jasmine.createSpyObj('HeaderService', ['setBreadcrumb', 'setFullscreen']);

    await TestBed.configureTestingModule({
      declarations: [InitComponent],
      imports: [CommonModule, FormsModule, NoopAnimationsModule],
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
    planningService.addUser.and.resolveTo(null);
    component.planningId = 'p1';
    component.username = 'Bob';

    await component.goDeveloper();

    expect(localStorage.getItem('last-session')).toBeNull();
    expect(router.navigateByUrl).not.toHaveBeenCalled();
  });

  it('reports whether a last session exists', () => {
    expect(component.hasLastSession()).toBeFalse();

    localStorage.setItem('last-session', 'user-1');

    expect(component.hasLastSession()).toBeTrue();
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

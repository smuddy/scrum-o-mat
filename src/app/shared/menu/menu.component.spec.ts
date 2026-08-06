import {ComponentFixture, TestBed} from '@angular/core/testing';
import {CommonModule} from '@angular/common';
import {NO_ERRORS_SCHEMA} from '@angular/core';
import {NoopAnimationsModule} from '@angular/platform-browser/animations';
import {Router} from '@angular/router';
import {BehaviorSubject, of} from 'rxjs';

import {MenuComponent} from './menu.component';
import {LoginService} from '../../modules/login/login.service';
import {MenuService} from './menu.service';

describe('MenuComponent', () => {
  let component: MenuComponent;
  let fixture: ComponentFixture<MenuComponent>;
  let authState$: BehaviorSubject<any>;
  let loginService: any;
  let menuService: any;
  let router: jasmine.SpyObj<Router>;

  beforeEach(async () => {
    authState$ = new BehaviorSubject<any>(null);
    loginService = {
      authState$: () => authState$,
      logout: jasmine.createSpy('logout').and.resolveTo(undefined),
    };
    menuService = {
      menuEntries$: of([]),
      menuOpen$: of(false),
      openMenu: jasmine.createSpy(),
      closeMenu: jasmine.createSpy(),
      toggleMenu: jasmine.createSpy(),
      resetCustomActions: jasmine.createSpy(),
    };
    router = jasmine.createSpyObj('Router', ['navigateByUrl']);
    router.navigateByUrl.and.resolveTo(true);

    await TestBed.configureTestingModule({
      declarations: [MenuComponent],
      imports: [CommonModule, NoopAnimationsModule],
      providers: [
        {provide: LoginService, useValue: loginService},
        {provide: MenuService, useValue: menuService},
        {provide: Router, useValue: router},
      ],
      schemas: [NO_ERRORS_SCHEMA],
    })
      .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(MenuComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('reflects the logged in state derived from LoginService', () => {
    let loggedIn: boolean;
    component.loggedIn.subscribe(_ => loggedIn = _);

    expect(loggedIn).toBeFalse();

    authState$.next({uid: '1'});

    expect(loggedIn).toBeTrue();
  });

  it('exposes the menu entries from MenuService', () => {
    let entries: any[];
    component.menuEntries$.subscribe(_ => entries = _);

    expect(entries).toEqual([]);
  });

  it('delegates closeMenu to the MenuService', () => {
    component.closeMenu();

    expect(menuService.closeMenu).toHaveBeenCalled();
  });

  it('navigates to /login and closes the menu on login', async () => {
    await component.login();

    expect(router.navigateByUrl).toHaveBeenCalledWith('/login');
    expect(menuService.closeMenu).toHaveBeenCalled();
  });

  it('logs out, navigates home and closes the menu on logout', async () => {
    await component.logout();

    expect(loginService.logout).toHaveBeenCalled();
    expect(router.navigateByUrl).toHaveBeenCalledWith('/');
    expect(menuService.closeMenu).toHaveBeenCalled();
  });
});

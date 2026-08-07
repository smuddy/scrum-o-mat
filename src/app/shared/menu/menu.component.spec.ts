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
import {CommonModule} from '@angular/common';
import {Component, Input, NO_ERRORS_SCHEMA} from '@angular/core';
import {NoopAnimationsModule} from '@angular/platform-browser/animations';
import {Router} from '@angular/router';
import {BehaviorSubject, of} from 'rxjs';

import {MenuComponent} from './menu.component';
import {LoginService} from '../../modules/login/login.service';
import {MenuService} from './menu.service';

// Winziges Stand-in fuer eine ueber MenuService.addCustomComponent registrierte Component (z.B.
// TimerControlComponent), nur um NgComponentOutlet + Inputs-Weitergabe im Menu zu verifizieren.
@Component({
  standalone: true,
  selector: 'app-test-menu-widget',
  template: '<span>{{label}}</span>',
})
class TestMenuWidgetComponent {
  @Input() label = '';
}

describe('MenuComponent', () => {
  let component: MenuComponent;
  let fixture: ComponentFixture<MenuComponent>;
  let authState$: BehaviorSubject<any>;
  let loginService: any;
  let menuService: any;
  let router: { navigateByUrl: ReturnType<typeof vi.fn> };

  beforeEach(async () => {
    authState$ = new BehaviorSubject<any>(null);
    loginService = {
      authState$: () => authState$,
      logout: vi.fn().mockResolvedValue(undefined),
    };
    menuService = {
      menuEntries$: of([]),
      menuOpen$: of(false),
      openMenu: vi.fn(),
      closeMenu: vi.fn(),
      toggleMenu: vi.fn(),
      resetCustomActions: vi.fn(),
    };
    router = {navigateByUrl: vi.fn().mockResolvedValue(true)};

    await TestBed.configureTestingModule({
      imports: [MenuComponent, NoopAnimationsModule],
      providers: [
        {provide: LoginService, useValue: loginService},
        {provide: MenuService, useValue: menuService},
        {provide: Router, useValue: router},
      ],
    })
      .overrideComponent(MenuComponent, {
        set: {imports: [CommonModule], schemas: [NO_ERRORS_SCHEMA]},
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

    expect(loggedIn).toBe(false);

    authState$.next({uid: '1'});

    expect(loggedIn).toBe(true);
  });

  it('exposes the menu entries from MenuService', () => {
    const menuEntries = [{name: 'Neu würfeln', action: () => {}}];
    menuService.menuEntries$ = of(menuEntries);
    const entriesComponent = TestBed.createComponent(MenuComponent).componentInstance;

    let entries: any[];
    entriesComponent.menuEntries$.subscribe(_ => entries = _);

    expect(entries).toBe(menuEntries);
  });

  it('renders a component-based menu entry (MenuService.addCustomComponent) via NgComponentOutlet, passing through its inputs', () => {
    const menuEntries = [{name: '', action: () => {}, component: TestMenuWidgetComponent, inputs: {label: 'Hallo'}}];
    menuService.menuEntries$ = of(menuEntries);
    const componentFixture = TestBed.createComponent(MenuComponent);
    componentFixture.detectChanges();

    const host = componentFixture.nativeElement as HTMLElement;
    expect(host.querySelector('.menu-item.menu-component')).toBeTruthy();
    expect(host.textContent).toContain('Hallo');
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

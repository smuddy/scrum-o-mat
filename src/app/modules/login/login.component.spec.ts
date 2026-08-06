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
import {NoopAnimationsModule} from '@angular/platform-browser/animations';

import {LoginComponent} from './login.component';
import {LoginService} from './login.service';
import {HeaderService} from '../../shared/header/header.service';

describe('LoginComponent', () => {
  let component: LoginComponent;
  let fixture: ComponentFixture<LoginComponent>;
  let loginServiceMock: {login: ReturnType<typeof vi.fn>; register: ReturnType<typeof vi.fn>};
  let headerServiceMock: {setBreadcrumb: ReturnType<typeof vi.fn>};

  beforeEach(async () => {
    loginServiceMock = {
      login: vi.fn().mockResolvedValue(null),
      register: vi.fn().mockResolvedValue(null),
    };

    headerServiceMock = {
      setBreadcrumb: vi.fn(),
    };

    await TestBed.configureTestingModule({
      imports: [LoginComponent, NoopAnimationsModule],
      providers: [
        {provide: LoginService, useValue: loginServiceMock},
        {provide: HeaderService, useValue: headerServiceMock},
      ],
    })
      .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(LoginComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('delegates login submit to the login service with the form values', async () => {
    component.email.setValue('user@example.com');
    component.pass.setValue('secret1');

    await component.login();

    expect(loginServiceMock.login).toHaveBeenCalledWith('user@example.com', 'secret1');
  });

  it('delegates register submit to the login service with the form values', async () => {
    component.email.setValue('user@example.com');
    component.pass.setValue('secret1');

    await component.register();

    expect(loginServiceMock.register).toHaveBeenCalledWith('user@example.com', 'secret1');
  });

  it('sets the error message when the login service returns a string', async () => {
    component.email.setValue('user@example.com');
    component.pass.setValue('secret1');
    loginServiceMock.login.mockResolvedValue('E-Mail Adresse oder Passwort ist falsch!');

    await component.login();

    expect(component.errorMessage).toBe('E-Mail Adresse oder Passwort ist falsch!');
  });

  it('does not call the login service while the form is invalid', async () => {
    component.email.setValue('not-an-email');
    component.pass.setValue('123');

    await component.login();

    expect(loginServiceMock.login).not.toHaveBeenCalled();
    expect(component.errorMessage).toBe('');
  });

  it('does not call the register service while the form is invalid', async () => {
    component.email.setValue('');
    component.pass.setValue('');

    await component.register();

    expect(loginServiceMock.register).not.toHaveBeenCalled();
    expect(component.errorMessage).toBe('');
  });

});

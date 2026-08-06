import {TestBed} from '@angular/core/testing';
import {AngularFireAuth} from '@angular/fire/compat/auth';
import {Router} from '@angular/router';
import {of} from 'rxjs';

import {LoginService} from './login.service';

describe('LoginService', () => {
  let router: jasmine.SpyObj<Router>;

  function createAfAuthMock(authState: any = of(null)): any {
    return {
      authState,
      signInWithEmailAndPassword: jasmine.createSpy().and.resolveTo(),
      createUserWithEmailAndPassword: jasmine.createSpy().and.resolveTo(),
      signOut: jasmine.createSpy().and.resolveTo(),
    };
  }

  function createService(afAuth: any): LoginService {
    TestBed.configureTestingModule({
      providers: [
        LoginService,
        {provide: AngularFireAuth, useValue: afAuth},
        {provide: Router, useValue: router},
      ],
    });
    return TestBed.inject(LoginService);
  }

  beforeEach(() => {
    router = jasmine.createSpyObj('Router', ['navigateByUrl']);
    router.navigateByUrl.and.resolveTo(true);
  });

  it('should be created', () => {
    const service = createService(createAfAuthMock());
    expect(service).toBeTruthy();
  });

  it('logs in successfully and navigates to the root route', async () => {
    const afAuth = createAfAuthMock();
    const service = createService(afAuth);

    const result = await service.login('user@example.com', 'secret');

    expect(result).toBeNull();
    expect(afAuth.signInWithEmailAndPassword).toHaveBeenCalledWith('user@example.com', 'secret');
    expect(router.navigateByUrl).toHaveBeenCalledWith('/');
  });

  it('returns an error message when login fails with a wrong password', async () => {
    const afAuth = createAfAuthMock();
    afAuth.signInWithEmailAndPassword = jasmine.createSpy().and.rejectWith({code: 'auth/wrong-password'});
    const service = createService(afAuth);

    const result = await service.login('user@example.com', 'wrong');

    expect(result).toBe('E-Mail Adresse oder Passwort ist falsch!');
  });

  it('registers successfully and navigates to the root route', async () => {
    const afAuth = createAfAuthMock();
    const service = createService(afAuth);

    const result = await service.register('user@example.com', 'secret');

    expect(result).toBeNull();
    expect(afAuth.createUserWithEmailAndPassword).toHaveBeenCalledWith('user@example.com', 'secret');
    expect(router.navigateByUrl).toHaveBeenCalledWith('/');
  });

  it('returns an error message when registration fails because the e-mail is already in use', async () => {
    const afAuth = createAfAuthMock();
    afAuth.createUserWithEmailAndPassword = jasmine.createSpy().and.rejectWith({code: 'auth/email-already-in-use'});
    const service = createService(afAuth);

    const result = await service.register('user@example.com', 'secret');

    expect(result).toBe('E-Mail Adresse ist bereits registriert!');
  });

  it('logs out via afAuth.signOut', async () => {
    const afAuth = createAfAuthMock();
    const service = createService(afAuth);

    await service.logout();

    expect(afAuth.signOut).toHaveBeenCalled();
  });

  it('maps the current user id from the auth state', () => {
    const afAuth = createAfAuthMock(of({uid: 'u1'}));
    const service = createService(afAuth);

    let userId: string;
    service.currentUserId$().subscribe(_ => userId = _);

    expect(userId).toBe('u1');
  });

  it('creates and stores a new anonymous user id when none exists yet', () => {
    spyOn(localStorage, 'getItem').and.returnValue(null);
    spyOn(localStorage, 'setItem');
    const afAuth = createAfAuthMock(of(null));
    const service = createService(afAuth);

    let result: any;
    service.authStateAllowAnonymous$.subscribe(_ => result = _);

    expect(result.uid).toBeTruthy();
    expect(localStorage.setItem).toHaveBeenCalledWith('annonymUser', result.uid);
  });

  it('reuses the stored anonymous user id when one already exists', () => {
    spyOn(localStorage, 'getItem').and.returnValue('existing-id');
    spyOn(localStorage, 'setItem');
    const afAuth = createAfAuthMock(of(null));
    const service = createService(afAuth);

    let result: any;
    service.authStateAllowAnonymous$.subscribe(_ => result = _);

    expect(result).toEqual({uid: 'existing-id'});
    expect(localStorage.setItem).not.toHaveBeenCalled();
  });

});

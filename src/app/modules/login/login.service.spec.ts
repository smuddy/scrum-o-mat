import {describe, it, expect, beforeEach, vi} from 'vitest';
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

import {TestBed} from '@angular/core/testing';
import {Router} from '@angular/router';
import {of} from 'rxjs';
import {firstValueFrom} from 'rxjs';
import {
  Auth,
  authState,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
} from '@angular/fire/auth';
import {Firestore, doc, setDoc} from '@angular/fire/firestore';

import {LoginService} from './login.service';

describe('LoginService', () => {
  let router: {navigateByUrl: ReturnType<typeof vi.fn>};

  function createService(): LoginService {
    TestBed.configureTestingModule({
      providers: [
        LoginService,
        {provide: Auth, useValue: {}},
        {provide: Firestore, useValue: {}},
        {provide: Router, useValue: router},
      ],
    });
    return TestBed.inject(LoginService);
  }

  beforeEach(() => {
    vi.clearAllMocks();
    // authStateAllowAnonymous$ wird bereits im Feld-Initializer ausgewertet -> Default vor Konstruktion setzen.
    vi.mocked(authState).mockReturnValue(of(null) as any);
    vi.mocked(signInWithEmailAndPassword).mockResolvedValue({user: {uid: 'u1'}} as any);
    vi.mocked(createUserWithEmailAndPassword).mockResolvedValue({user: {uid: 'u1'}} as any);
    vi.mocked(signOut).mockResolvedValue(undefined as any);
    vi.mocked(doc).mockReturnValue({} as any);
    vi.mocked(setDoc).mockResolvedValue(undefined as any);

    router = {navigateByUrl: vi.fn().mockResolvedValue(true)};
  });

  it('should be created', () => {
    const service = createService();
    expect(service).toBeTruthy();
  });

  it('logs in successfully and navigates to the root route', async () => {
    const service = createService();

    const result = await service.login('user@example.com', 'secret');

    expect(result).toBeNull();
    expect(vi.mocked(signInWithEmailAndPassword)).toHaveBeenCalledWith(expect.anything(), 'user@example.com', 'secret');
    expect(router.navigateByUrl).toHaveBeenCalledWith('/');
  });

  it('login persistiert die E-Mail im User-Doc (merge)', async () => {
    const service = createService();

    await service.login('user@example.com', 'secret');

    expect(vi.mocked(doc)).toHaveBeenCalledWith(expect.anything(), 'user/u1');
    expect(vi.mocked(setDoc)).toHaveBeenCalledWith(expect.anything(), {email: 'user@example.com'}, {merge: true});
  });

  it('returns an error message when login fails with a wrong password', async () => {
    vi.mocked(signInWithEmailAndPassword).mockRejectedValue({code: 'auth/wrong-password'});
    const service = createService();

    const result = await service.login('user@example.com', 'wrong');

    expect(result).toBe('E-Mail Adresse oder Passwort ist falsch!');
  });

  it('registers successfully and navigates to the root route', async () => {
    const service = createService();

    const result = await service.register('user@example.com', 'secret');

    expect(result).toBeNull();
    expect(vi.mocked(createUserWithEmailAndPassword)).toHaveBeenCalledWith(expect.anything(), 'user@example.com', 'secret');
    expect(router.navigateByUrl).toHaveBeenCalledWith('/');
  });

  it('register persistiert die E-Mail im User-Doc (merge)', async () => {
    const service = createService();

    await service.register('user@example.com', 'secret');

    expect(vi.mocked(doc)).toHaveBeenCalledWith(expect.anything(), 'user/u1');
    expect(vi.mocked(setDoc)).toHaveBeenCalledWith(expect.anything(), {email: 'user@example.com'}, {merge: true});
  });

  describe('Vertreter-Feature (Ticket 02): Ruecksprung nach Login/Registrieren', () => {
    it('login navigiert zur hinterlegten retroReturnUrl und entfernt sie danach aus localStorage', async () => {
      vi.spyOn(Storage.prototype, 'getItem').mockReturnValue('/retrospective/join/abc123');
      const removeItemSpy = vi.spyOn(Storage.prototype, 'removeItem').mockImplementation(() => undefined);
      const service = createService();

      await service.login('user@example.com', 'secret');

      expect(router.navigateByUrl).toHaveBeenCalledWith('/retrospective/join/abc123');
      expect(removeItemSpy).toHaveBeenCalledWith('retroReturnUrl');
    });

    it('register navigiert zur hinterlegten retroReturnUrl und entfernt sie danach aus localStorage', async () => {
      vi.spyOn(Storage.prototype, 'getItem').mockReturnValue('/retrospective/join/abc123');
      const removeItemSpy = vi.spyOn(Storage.prototype, 'removeItem').mockImplementation(() => undefined);
      const service = createService();

      await service.register('user@example.com', 'secret');

      expect(router.navigateByUrl).toHaveBeenCalledWith('/retrospective/join/abc123');
      expect(removeItemSpy).toHaveBeenCalledWith('retroReturnUrl');
    });

    it('login navigiert wie bisher auf "/", wenn keine retroReturnUrl hinterlegt ist', async () => {
      vi.spyOn(Storage.prototype, 'getItem').mockReturnValue(null);
      const service = createService();

      await service.login('user@example.com', 'secret');

      expect(router.navigateByUrl).toHaveBeenCalledWith('/');
    });
  });

  it('returns an error message when registration fails because the e-mail is already in use', async () => {
    vi.mocked(createUserWithEmailAndPassword).mockRejectedValue({code: 'auth/email-already-in-use'});
    const service = createService();

    const result = await service.register('user@example.com', 'secret');

    expect(result).toBe('E-Mail Adresse ist bereits registriert!');
  });

  it('logs out via signOut', async () => {
    const service = createService();

    await service.logout();

    expect(vi.mocked(signOut)).toHaveBeenCalled();
  });

  it('maps the current user id from the auth state', async () => {
    vi.mocked(authState).mockReturnValue(of({uid: 'u1'}) as any);
    const service = createService();

    const userId = await firstValueFrom(service.currentUserId$());

    expect(userId).toBe('u1');
  });

  it('creates and stores a new anonymous user id when none exists yet', async () => {
    vi.spyOn(Storage.prototype, 'getItem').mockReturnValue(null);
    const setItemSpy = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => undefined);
    vi.mocked(authState).mockReturnValue(of(null) as any);
    const service = createService();

    const result: any = await firstValueFrom(service.authStateAllowAnonymous$);

    expect(result.uid).toBeTruthy();
    expect(setItemSpy).toHaveBeenCalledWith('annonymUser', result.uid);
  });

  it('reuses the stored anonymous user id when one already exists', async () => {
    vi.spyOn(Storage.prototype, 'getItem').mockReturnValue('existing-id');
    const setItemSpy = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => undefined);
    vi.mocked(authState).mockReturnValue(of(null) as any);
    const service = createService();

    const result: any = await firstValueFrom(service.authStateAllowAnonymous$);

    expect(result).toEqual({uid: 'existing-id'});
    expect(setItemSpy).not.toHaveBeenCalled();
  });

  describe('userIdRegex', () => {
    it('accepts a valid reader id', () => {
      expect(LoginService.userIdRegex.test('valid-User_1;2')).toBe(true);
    });

    it('rejects an id containing spaces or punctuation', () => {
      // Alt-Bug: ungeankerte Regex /[...]*/gm matchte jeden String (Zero-Length) -> alles akzeptiert.
      expect(LoginService.userIdRegex.test('foo bar!')).toBe(false);
    });

    it('rejects an empty id', () => {
      expect(LoginService.userIdRegex.test('')).toBe(false);
    });

    it('is not stateful across repeated calls (no global lastIndex trap)', () => {
      // Mit dem alten g-Flag verschob sich lastIndex zwischen Aufrufen -> alternierende Ergebnisse.
      expect(LoginService.userIdRegex.test('validId')).toBe(true);
      expect(LoginService.userIdRegex.test('validId')).toBe(true);
    });
  });

});

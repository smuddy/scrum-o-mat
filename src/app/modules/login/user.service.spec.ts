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

import {TestBed} from '@angular/core/testing';
import {of, firstValueFrom} from 'rxjs';
import {Firestore, doc, docData, setDoc, updateDoc} from '@angular/fire/firestore';

import {UserService} from './user.service';
import {LoginService} from './login.service';

describe('UserService', () => {
  let loginService: {authStateAllowAnonymous$: import('rxjs').Observable<any>};

  function createService(): UserService {
    TestBed.configureTestingModule({
      providers: [
        UserService,
        {provide: Firestore, useValue: {}},
        {provide: LoginService, useValue: loginService},
      ],
    });
    return TestBed.inject(UserService);
  }

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(doc).mockReturnValue({} as any);
    vi.mocked(docData).mockReturnValue(of({name: 'x'}) as any);
    vi.mocked(setDoc).mockResolvedValue(undefined as any);
    vi.mocked(updateDoc).mockResolvedValue(undefined as any);

    loginService = {authStateAllowAnonymous$: of({uid: 'u1'})};
  });

  it('should be created', () => {
    const service = createService();
    expect(service).toBeTruthy();
  });

  it('exposes the current user via user$', async () => {
    const service = createService();

    const user = await firstValueFrom(service.user$);

    expect(vi.mocked(doc)).toHaveBeenCalledWith(expect.anything(), 'user/u1');
    expect(vi.mocked(docData)).toHaveBeenCalled();
    expect(user).toEqual({name: 'x'} as any);
  });

  it('creates a new user document when none exists yet', async () => {
    let created = false;
    vi.mocked(setDoc).mockImplementation(async () => {
      created = true;
    });
    vi.mocked(docData).mockImplementation(() => of(created ? {name: null} : null) as any);

    const service = createService();

    const user = await firstValueFrom(service.user$);

    expect(vi.mocked(doc)).toHaveBeenCalledWith(expect.anything(), 'user/u1');
    expect(vi.mocked(setDoc)).toHaveBeenCalledWith(expect.anything(), {name: null}, {merge: true});
    expect(user).toEqual({name: null} as any);
  });

  it('sets the name of the current user via a merging setDoc', async () => {
    const service = createService();

    await service.setUserNameAsync('Ada');

    expect(vi.mocked(doc)).toHaveBeenCalledWith(expect.anything(), 'user/u1');
    // setDoc mit {merge: true} statt updateDoc: legt das User-Dokument auch dann an,
    // wenn es noch nicht existiert (Alt-Bug: updateDoc schlägt bei fehlendem Doc fehl).
    expect(vi.mocked(setDoc)).toHaveBeenCalledWith(expect.anything(), {name: 'Ada'}, {merge: true});
    expect(vi.mocked(updateDoc)).not.toHaveBeenCalled();
  });

  // Vertreter-Feature: liest das User-Doc eines fremden uid (Mitarbeiter-Liste im Owner-Abschnitt der Gruppe).
  it('getUser$ liest das User-Doc einer fremden uid mit idField', async () => {
    vi.mocked(docData).mockReturnValue(of({name: 'Bob', email: 'bob@example.com'}) as any);
    const service = createService();

    const user = await firstValueFrom(service.getUser$('other-uid'));

    expect(vi.mocked(doc)).toHaveBeenCalledWith(expect.anything(), 'user/other-uid');
    expect(vi.mocked(docData)).toHaveBeenCalledWith(expect.anything(), {idField: 'id'});
    expect(user).toEqual({name: 'Bob', email: 'bob@example.com'} as any);
  });

});

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
import {
  Firestore,
  collection,
  doc,
  collectionData,
  docData,
  addDoc,
  updateDoc,
  deleteDoc,
} from '@angular/fire/firestore';
import {firstValueFrom, of, throwError} from 'rxjs';

import {PlanningService, renderStoryPoint} from './planning.service';
import {LoginService} from '../login/login.service';
import {StoryPoints} from './models/storyPoints';

describe('PlanningService', () => {
  let service: PlanningService;
  let loginService: any;

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(collection).mockReturnValue({} as any);
    vi.mocked(doc).mockReturnValue({} as any);
    vi.mocked(collectionData).mockReturnValue(of([]) as any);
    vi.mocked(docData).mockReturnValue(of(undefined) as any);
    vi.mocked(addDoc).mockResolvedValue({id: 'newId'} as any);
    vi.mocked(updateDoc).mockResolvedValue(undefined as any);
    vi.mocked(deleteDoc).mockResolvedValue(undefined as any);

    loginService = {authStateAllowAnonymous$: of({uid: 'u1'})};

    TestBed.configureTestingModule({
      providers: [
        PlanningService,
        {provide: Firestore, useValue: {}},
        {provide: LoginService, useValue: loginService},
      ],
    });
    service = TestBed.inject(PlanningService);
  });

  it('should create', () => {
    expect(service).toBeTruthy();
    expect(vi.mocked(collection)).toHaveBeenCalledWith(expect.anything(), 'planning');
  });

  it('updates the issue and resets the story points afterwards', async () => {
    await service.updateIssue('p1', 'New issue text');

    expect(vi.mocked(doc)).toHaveBeenCalledWith(expect.anything(), 'planning/p1');
    expect(vi.mocked(updateDoc)).toHaveBeenCalledWith(expect.anything(), expect.objectContaining({
      issue: 'New issue text',
      estimateRequested: true,
      estimateSucceeded: false,
      storyPoints: null,
      count: 1,
    }));
  });

  it('propagates an error when resetting the story points fails', async () => {
    // Alt-Bug: updateIssue rief resetStoryPoints ohne await auf (fire-and-forget) ->
    // Fehler wurden verschluckt. Nach dem Fix muss der Fehler durchpropagiert werden.
    vi.mocked(collectionData).mockReturnValue(throwError(() => new Error('reset failed')) as any);

    await expect(service.updateIssue('p1', 'New issue text')).rejects.toThrow('reset failed');
  });

  it('creates a new session for the current user and returns the new id', async () => {
    const id = await service.createNewSession('Sprint planning');

    expect(id).toBe('newId');
    expect(vi.mocked(collection)).toHaveBeenCalledWith(expect.anything(), 'planning');
    expect(vi.mocked(addDoc)).toHaveBeenCalledWith(expect.anything(), expect.objectContaining({
      subject: 'Sprint planning',
      issue: null,
      userId: 'u1',
      estimateRequested: true,
      estimateSucceeded: false,
      storyPoints: null,
      count: 0,
    }));
  });

  it('loads a planning by id', async () => {
    vi.mocked(docData).mockReturnValue(of({subject: 'Sprint planning'}) as any);

    const planning = await firstValueFrom(service.getPlanning('p1'));

    expect(vi.mocked(doc)).toHaveBeenCalledWith(expect.anything(), 'planning/p1');
    expect(planning).toEqual({subject: 'Sprint planning'} as any);
  });

  it('adds a developer, stores the name locally and returns the new id', async () => {
    const setItem = vi.spyOn(Storage.prototype, 'setItem');

    const id = await service.addUser('p1', 'Ada');

    expect(id).toBe('newId');
    expect(setItem).toHaveBeenCalledWith('user', 'Ada');
    expect(vi.mocked(collection)).toHaveBeenCalledWith(expect.anything(), 'planning/p1/developer');
    expect(vi.mocked(addDoc)).toHaveBeenCalledWith(expect.anything(), {name: 'Ada', storyPoints: null});
  });

  it('updates the story points of a developer', async () => {
    await service.updateStoryPoints('p1', 'u1', StoryPoints.s5);

    expect(vi.mocked(doc)).toHaveBeenCalledWith(expect.anything(), 'planning/p1/developer/u1');
    expect(vi.mocked(updateDoc)).toHaveBeenCalledWith(expect.anything(), {storyPoints: StoryPoints.s5});
  });

  it('sets the estimate result', async () => {
    await service.setEstimateResult('p1', true, StoryPoints.s3);

    expect(vi.mocked(updateDoc)).toHaveBeenCalledWith(expect.anything(), expect.objectContaining({
      estimateRequested: false,
      estimateSucceeded: true,
      storyPoints: StoryPoints.s3,
    }));
  });

  it('resets the estimate and clears the story points of all developers', async () => {
    vi.mocked(collectionData).mockReturnValue(of([{id: 'u1', name: 'Ada', storyPoints: StoryPoints.s5}]) as any);

    await service.resetEstimate('p1', 3);

    expect(vi.mocked(doc)).toHaveBeenCalledWith(expect.anything(), 'planning/p1/developer/u1');
    expect(vi.mocked(updateDoc)).toHaveBeenCalledWith(expect.anything(), {storyPoints: null});
    expect(vi.mocked(updateDoc)).toHaveBeenCalledWith(expect.anything(), expect.objectContaining({
      estimateRequested: true,
      estimateSucceeded: false,
      storyPoints: 0,
      count: 3,
    }));
  });

  it('exposes the developers of a planning', async () => {
    vi.mocked(collectionData).mockReturnValue(of([{id: 'u1', name: 'Ada', storyPoints: null}]) as any);

    const developers = await firstValueFrom(service.getDevelopers('p1'));

    expect(vi.mocked(collection)).toHaveBeenCalledWith(expect.anything(), 'planning/p1/developer');
    expect(developers).toEqual([{id: 'u1', name: 'Ada', storyPoints: null}]);
  });

  it('exposes a single developer of a planning', async () => {
    vi.mocked(docData).mockReturnValue(of({name: 'Ada', storyPoints: StoryPoints.s5}) as any);

    const developer = await firstValueFrom(service.getDeveloper('p1', 'u1'));

    expect(vi.mocked(doc)).toHaveBeenCalledWith(expect.anything(), 'planning/p1/developer/u1');
    expect(developer).toEqual({name: 'Ada', storyPoints: StoryPoints.s5});
  });

  it('deletes a developer from a planning', async () => {
    await service.deleteUser('p1', 'u1');

    expect(vi.mocked(doc)).toHaveBeenCalledWith(expect.anything(), 'planning/p1/developer/u1');
    expect(vi.mocked(deleteDoc)).toHaveBeenCalled();
  });

  it('deletes a planning together with all of its developers', async () => {
    vi.mocked(collectionData).mockReturnValue(of([{id: 'u1', name: 'Ada', storyPoints: null}]) as any);

    await service.deletePlanning('p1');

    expect(vi.mocked(doc)).toHaveBeenCalledWith(expect.anything(), 'planning/p1/developer/u1');
    expect(vi.mocked(doc)).toHaveBeenCalledWith(expect.anything(), 'planning/p1');
    expect(vi.mocked(deleteDoc)).toHaveBeenCalled();
  });

});

describe('renderStoryPoint', () => {
  it('renders half a story point', () => {
    expect(renderStoryPoint(StoryPoints.sHalf)).toBe('1/2');
  });

  it('renders one story point', () => {
    expect(renderStoryPoint(StoryPoints.s1)).toBe('1');
  });

  it('renders five story points', () => {
    expect(renderStoryPoint(StoryPoints.s5)).toBe('5');
  });

  it('renders an unsure estimate', () => {
    expect(renderStoryPoint(StoryPoints.unsure)).toBe('?');
  });

  it('renders a coffee break', () => {
    expect(renderStoryPoint(StoryPoints.coffee)).toBe('☕️');
  });

  it('returns null for an unknown value', () => {
    expect(renderStoryPoint(999)).toBeNull();
  });
});

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
  addDoc,
  collection,
  collectionData,
  deleteDoc,
  doc,
  docData,
  Firestore,
  query,
  updateDoc,
  where,
} from '@angular/fire/firestore';
import {firstValueFrom, of} from 'rxjs';

import {ProjectService} from './project.service';
import {LoginService} from '../../login/login.service';

describe('ProjectService', () => {
  let service: ProjectService;
  let loginService: any;

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(collection).mockReturnValue({} as any);
    vi.mocked(doc).mockReturnValue({} as any);
    vi.mocked(query).mockReturnValue({} as any);
    vi.mocked(where).mockReturnValue({} as any);
    vi.mocked(collectionData).mockReturnValue(of([]) as any);
    vi.mocked(docData).mockReturnValue(of(undefined) as any);
    vi.mocked(addDoc).mockResolvedValue({id: 'newId'} as any);
    vi.mocked(updateDoc).mockResolvedValue(undefined as any);
    vi.mocked(deleteDoc).mockResolvedValue(undefined as any);

    loginService = {currentUserId$: () => of('u1')};

    TestBed.configureTestingModule({
      providers: [
        ProjectService,
        {provide: Firestore, useValue: {}},
        {provide: LoginService, useValue: loginService},
      ],
    });
    service = TestBed.inject(ProjectService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('exposes the projects owned by the current user', async () => {
    vi.mocked(collectionData).mockReturnValue(of([{id: 'p1', name: 'Owner Project'}]) as any);

    const projects = await firstValueFrom(service.getProjectsOwner());

    expect(vi.mocked(collection)).toHaveBeenCalledWith(expect.anything(), 'project');
    expect(vi.mocked(where)).toHaveBeenCalledWith('owner', '==', 'u1');
    expect(projects).toEqual([{id: 'p1', name: 'Owner Project'}] as any);
  });

  it('exposes the projects the current user can read', async () => {
    vi.mocked(collectionData).mockReturnValue(of([{id: 'p2', name: 'Reader Project'}]) as any);

    const projects = await firstValueFrom(service.getProjectsReader());

    expect(vi.mocked(where)).toHaveBeenCalledWith('coReaders', 'array-contains', 'u1');
    expect(projects).toEqual([{id: 'p2', name: 'Reader Project'}] as any);
  });

  it('exposes the projects the current user can write', async () => {
    vi.mocked(collectionData).mockReturnValue(of([{id: 'p3', name: 'Writer Project'}]) as any);

    const projects = await firstValueFrom(service.getProjectsWriter());

    expect(vi.mocked(where)).toHaveBeenCalledWith('coWriters', 'array-contains', 'u1');
    expect(projects).toEqual([{id: 'p3', name: 'Writer Project'}] as any);
  });

  it('gets a single project by id', async () => {
    vi.mocked(docData).mockReturnValue(of({id: 'p1', name: 'Test Project'}) as any);

    const project = await firstValueFrom(service.getProject('p1'));

    expect(vi.mocked(doc)).toHaveBeenCalledWith(expect.anything(), 'project/p1');
    expect(project).toEqual({id: 'p1', name: 'Test Project'} as any);
  });

  it('adds a new project owned by the given user', async () => {
    const newId = await service.addNewProject('u1');

    expect(vi.mocked(collection)).toHaveBeenCalledWith(expect.anything(), 'project');
    expect(vi.mocked(addDoc)).toHaveBeenCalledWith(expect.anything(), {
      name: 'neues Projekt',
      owner: 'u1',
      sprints: [],
      initialVelocity: 1,
      coReaders: [],
      coWriters: [],
    });
    expect(newId).toEqual('newId');
  });

  it('deletes a project by id', async () => {
    await service.deleteProject('p1');

    expect(vi.mocked(doc)).toHaveBeenCalledWith(expect.anything(), 'project/p1');
    expect(vi.mocked(deleteDoc)).toHaveBeenCalledWith(expect.anything());
  });

  it('updates a project by id', async () => {
    await service.updateProject('p1', {name: 'Updated'});

    expect(vi.mocked(doc)).toHaveBeenCalledWith(expect.anything(), 'project/p1');
    expect(vi.mocked(updateDoc)).toHaveBeenCalledWith(expect.anything(), expect.objectContaining({name: 'Updated'}));
  });

});

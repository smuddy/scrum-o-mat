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

import {TestBed} from '@angular/core/testing';
import {Firestore, collection, doc, collectionData, deleteDoc} from '@angular/fire/firestore';
import {firstValueFrom, of} from 'rxjs';

import {AdminService} from './admin.service';

describe('AdminService', () => {
  let service: AdminService;

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(collectionData).mockReturnValue(of([]) as any);
    vi.mocked(deleteDoc).mockResolvedValue(undefined as any);

    TestBed.configureTestingModule({
      providers: [
        AdminService,
        {provide: Firestore, useValue: {}},
      ],
    });
    service = TestBed.inject(AdminService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
    expect(vi.mocked(collection)).toHaveBeenCalledWith(expect.anything(), 'planning');
  });

  it('deletes a planning by id', async () => {
    await service.deletePlanning('p1');

    expect(vi.mocked(doc)).toHaveBeenCalledWith(expect.anything(), 'planning/p1');
    expect(vi.mocked(deleteDoc)).toHaveBeenCalled();
  });

  it('deletes all developers of a planning before deleting the planning itself (no orphaned docs)', async () => {
    vi.mocked(collectionData).mockReturnValue(of([
      {id: 'u1', name: 'Ada', storyPoints: null},
      {id: 'u2', name: 'Bob', storyPoints: null},
    ]) as any);
    const deletedPaths: string[] = [];
    vi.mocked(doc).mockImplementation(((_afs: any, path: string) => ({path})) as any);
    vi.mocked(deleteDoc).mockImplementation((async (ref: any) => {
      deletedPaths.push(ref.path);
    }) as any);

    await service.deletePlanning('p1');

    // Erst beide developer-Subcollection-Docs, dann die Planning selbst.
    expect(deletedPaths).toEqual([
      'planning/p1/developer/u1',
      'planning/p1/developer/u2',
      'planning/p1',
    ]);
  });

  it('deletes a developer within a planning', async () => {
    await service.deleteUser('p1', 'u1');

    expect(vi.mocked(doc)).toHaveBeenCalledWith(expect.anything(), 'planning/p1/developer/u1');
    expect(vi.mocked(deleteDoc)).toHaveBeenCalled();
  });

  it('exposes the developers of a planning', async () => {
    vi.mocked(collectionData).mockReturnValue(of([{id: 'u1', name: 'Ada', storyPoints: null}]) as any);

    const developers = await firstValueFrom(service.getDevelopers('p1'));

    expect(vi.mocked(collection)).toHaveBeenCalledWith(expect.anything(), 'planning/p1/developer');
    expect(developers).toEqual([{id: 'u1', name: 'Ada', storyPoints: null}]);
  });

});

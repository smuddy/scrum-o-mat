import {describe, it, expect, beforeEach, vi} from 'vitest';

// Mock von @angular/fire/firestore -- analog zum Muster in planning.service.spec.ts, erweitert um
// die von RetroService zusaetzlich genutzten Funktionen (writeBatch, FieldPath, arrayUnion/-Remove,
// increment, deleteField). `doc`/`collection` geben bewusst den rohen Pfad-String zurueck, damit
// er in Assertions (updateDoc/batch.update/batch.delete) direkt als Erkennungsmerkmal dient.
vi.mock('@angular/fire/firestore', () => {
  const g = globalThis as any;
  if (!g.__fireFirestoreMockRetro) {
    class FieldPath {
      public segments: string[];

      constructor(...segments: string[]) {
        this.segments = segments;
      }
    }

    g.__fireFirestoreMockRetro = {
      Firestore: class Firestore {
      },
      FieldPath,
      collection: vi.fn(),
      doc: vi.fn(),
      query: vi.fn((ref: any) => ref),
      where: vi.fn(),
      collectionData: vi.fn(),
      docData: vi.fn(),
      addDoc: vi.fn(),
      updateDoc: vi.fn(),
      deleteDoc: vi.fn(),
      writeBatch: vi.fn(),
      arrayUnion: vi.fn((uid: any) => ({__op: 'arrayUnion', uid})),
      arrayRemove: vi.fn((uid: any) => ({__op: 'arrayRemove', uid})),
      increment: vi.fn((n: any) => ({__op: 'increment', n})),
      deleteField: vi.fn(() => ({__op: 'deleteField'})),
    };
  }
  return g.__fireFirestoreMockRetro;
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
  writeBatch,
  FieldPath,
} from '@angular/fire/firestore';
import {of} from 'rxjs';

import {RetroService} from './retro.service';
import {LoginService} from '../login/login.service';
import {RetroActionItemId, RetroCardId} from './models/retro';

describe('RetroService', () => {
  let service: RetroService;
  let loginService: any;
  // Steuert die Rueckgabewerte von docData()/collectionData() ueber den (gemockten) Pfad-String,
  // den doc()/collection() als Referenz zurueckgeben -- siehe beforeEach.
  let cardByPath: Record<string, any>;
  let collectionByPath: Record<string, any[]>;
  // Jede writeBatch()-Instanz landet hier, damit Tests die tatsaechlich benutzte Batch-Instanz
  // pruefen koennen (update/delete/commit).
  let batches: { update: ReturnType<typeof vi.fn>; delete: ReturnType<typeof vi.fn>; commit: ReturnType<typeof vi.fn> }[];

  function makeBatch() {
    const batch = {
      update: vi.fn(),
      delete: vi.fn(),
      commit: vi.fn().mockResolvedValue(undefined),
    };
    batches.push(batch);
    return batch;
  }

  beforeEach(() => {
    vi.clearAllMocks();
    cardByPath = {};
    collectionByPath = {};
    batches = [];

    vi.mocked(collection).mockImplementation((_afs: any, path: any) => path);
    vi.mocked(doc).mockImplementation((_afs: any, path: any) => path);
    vi.mocked(collectionData).mockImplementation((ref: any) => of(collectionByPath[ref] ?? []) as any);
    vi.mocked(docData).mockImplementation((ref: any) => of(cardByPath[ref]) as any);
    vi.mocked(addDoc).mockResolvedValue({id: 'newId'} as any);
    vi.mocked(updateDoc).mockResolvedValue(undefined as any);
    vi.mocked(deleteDoc).mockResolvedValue(undefined as any);
    vi.mocked(writeBatch).mockImplementation(() => makeBatch() as any);

    loginService = {
      authStateAllowAnonymous$: of({uid: 'u1'}),
      currentUserId$: () => of('owner1'),
    };

    TestBed.configureTestingModule({
      providers: [
        RetroService,
        {provide: Firestore, useValue: {}},
        {provide: LoginService, useValue: loginService},
      ],
    });
    service = TestBed.inject(RetroService);
  });

  it('should create', () => {
    expect(service).toBeTruthy();
  });

  describe('changeVote (Ticket 15, Review-Fix Lost-Update)', () => {
    it('schreibt ueber FieldPath(votes,uid) + increment(delta), statt die votes-Map zu ueberschreiben', async () => {
      await service.changeVote('b1', 'c1', 'u1', 1);

      expect(vi.mocked(updateDoc)).toHaveBeenCalledWith(
        'retro/b1/cards/c1',
        new FieldPath('votes', 'u1'),
        {__op: 'increment', n: 1},
      );
    });
  });

  describe('clearUserVote', () => {
    it('entfernt den votes-Key des Nutzers ueber FieldPath(votes,uid) + deleteField()', async () => {
      await service.clearUserVote('b1', 'c1', 'u1');

      expect(vi.mocked(updateDoc)).toHaveBeenCalledWith(
        'retro/b1/cards/c1',
        new FieldPath('votes', 'u1'),
        {__op: 'deleteField'},
      );
    });
  });

  describe('addReaction/removeReaction (Ticket 16, Review-Fix Lost-Update)', () => {
    it('addReaction schreibt ueber FieldPath(reactions,emoji) + arrayUnion(uid)', async () => {
      await service.addReaction('b1', 'c1', '👍', 'u1');

      expect(vi.mocked(updateDoc)).toHaveBeenCalledWith(
        'retro/b1/cards/c1',
        new FieldPath('reactions', '👍'),
        {__op: 'arrayUnion', uid: 'u1'},
      );
    });

    it('removeReaction schreibt ueber FieldPath(reactions,emoji) + arrayRemove(uid)', async () => {
      await service.removeReaction('b1', 'c1', '👍', 'u1');

      expect(vi.mocked(updateDoc)).toHaveBeenCalledWith(
        'retro/b1/cards/c1',
        new FieldPath('reactions', '👍'),
        {__op: 'arrayRemove', uid: 'u1'},
      );
    });
  });

  describe('moveCards (Review-Fix Atomaritaet/Write-Amplifikation)', () => {
    it('schreibt columnId/order/modified je Karte in EINEM writeBatch und committet einmal', async () => {
      await service.moveCards('b1', [
        {cardId: 'c1', columnId: 'col2', order: 1},
        {cardId: 'c2', columnId: 'col2', order: 2},
      ]);

      expect(vi.mocked(writeBatch)).toHaveBeenCalledTimes(1);
      const batch = batches[0];
      expect(batch.update).toHaveBeenCalledTimes(2);
      expect(batch.update).toHaveBeenCalledWith('retro/b1/cards/c1', {
        columnId: 'col2', order: 1, modified: expect.any(Date),
      });
      expect(batch.update).toHaveBeenCalledWith('retro/b1/cards/c2', {
        columnId: 'col2', order: 2, modified: expect.any(Date),
      });
      expect(batch.commit).toHaveBeenCalledTimes(1);
    });

    it('legt bei leerem moves-Array KEINEN Batch an', async () => {
      await service.moveCards('b1', []);

      expect(vi.mocked(writeBatch)).not.toHaveBeenCalled();
    });
  });

  describe('resetVotes (Ticket 15, Review-Fix Atomaritaet)', () => {
    it('liest die Karten und leert votes je Karte in EINEM Batch + commit', async () => {
      const cards: RetroCardId[] = [
        {id: 'c1', text: 'A', columnId: 'col1', order: 0, authorId: 'u1', created: new Date(), modified: new Date(), votes: {u1: 2}},
        {id: 'c2', text: 'B', columnId: 'col1', order: 1, authorId: 'u1', created: new Date(), modified: new Date(), votes: {u2: 1}},
      ];
      collectionByPath['retro/b1/cards'] = cards;

      await service.resetVotes('b1');

      expect(vi.mocked(writeBatch)).toHaveBeenCalledTimes(1);
      const batch = batches[0];
      expect(batch.update).toHaveBeenCalledTimes(2);
      expect(batch.update).toHaveBeenCalledWith('retro/b1/cards/c1', {votes: {}});
      expect(batch.update).toHaveBeenCalledWith('retro/b1/cards/c2', {votes: {}});
      expect(batch.commit).toHaveBeenCalledTimes(1);
    });

    it('legt bei keinen Karten KEINEN Batch an', async () => {
      collectionByPath['retro/b1/cards'] = [];

      await service.resetVotes('b1');

      expect(vi.mocked(writeBatch)).not.toHaveBeenCalled();
    });
  });

  describe('deleteBoard (Review-Fix Atomaritaet/Write-Amplifikation)', () => {
    it('loescht alle Karten, alle Action-Items und das Board-Dokument in EINEM Batch + commit', async () => {
      const cards: RetroCardId[] = [
        {id: 'c1', text: 'A', columnId: 'col1', order: 0, authorId: 'u1', created: new Date(), modified: new Date()},
        {id: 'c2', text: 'B', columnId: 'col1', order: 1, authorId: 'u1', created: new Date(), modified: new Date()},
      ];
      const actionItems: RetroActionItemId[] = [
        {id: 'a1', text: 'Todo', done: false, authorId: 'u1', order: 0, created: new Date(), modified: new Date()},
      ];
      collectionByPath['retro/b1/cards'] = cards;
      collectionByPath['retro/b1/actionItems'] = actionItems;

      await service.deleteBoard('b1');

      expect(vi.mocked(writeBatch)).toHaveBeenCalledTimes(1);
      const batch = batches[0];
      expect(batch.delete).toHaveBeenCalledTimes(4);
      expect(batch.delete).toHaveBeenCalledWith('retro/b1/cards/c1');
      expect(batch.delete).toHaveBeenCalledWith('retro/b1/cards/c2');
      expect(batch.delete).toHaveBeenCalledWith('retro/b1/actionItems/a1');
      expect(batch.delete).toHaveBeenCalledWith('retro/b1');
      expect(batch.commit).toHaveBeenCalledTimes(1);
    });
  });

  describe('mergeCards (Review-Fix K3 -- Stimmen/Reaktionen der Quellkarte gehen nicht mehr verloren)', () => {
    it('summiert votes pro uid, vereinigt reactions je Emoji, merged den Text und loescht die Quellkarte -- alles in EINEM Batch', async () => {
      cardByPath['retro/b1/cards/source1'] = {
        text: 'S',
        votes: {a: 2, b: 1},
        reactions: {'👍': ['x']},
      };
      cardByPath['retro/b1/cards/target1'] = {
        text: 'T',
        votes: {a: 1, c: 3},
        reactions: {'👍': ['y'], '❤️': ['z']},
      };

      await service.mergeCards('b1', 'source1', 'target1');

      expect(vi.mocked(writeBatch)).toHaveBeenCalledTimes(1);
      const batch = batches[0];
      expect(batch.update).toHaveBeenCalledTimes(1);

      const [targetRef, payload] = batch.update.mock.calls[0];
      expect(targetRef).toBe('retro/b1/cards/target1');
      expect(payload.text).toBe('T\n\nS');
      expect(payload.votes).toEqual({a: 3, b: 1, c: 3});
      expect(payload.modified).toBeInstanceOf(Date);
      expect(new Set(payload.reactions['👍'])).toEqual(new Set(['x', 'y']));
      expect(payload.reactions['❤️']).toEqual(['z']);

      expect(batch.delete).toHaveBeenCalledTimes(1);
      expect(batch.delete).toHaveBeenCalledWith('retro/b1/cards/source1');
      expect(batch.commit).toHaveBeenCalledTimes(1);
    });

    it('schreibt/loescht nichts, wenn Quell- oder Zielkarte nicht (mehr) existiert', async () => {
      cardByPath['retro/b1/cards/target1'] = {text: 'T', votes: {}, reactions: {}};
      // source1 bleibt bewusst undefined (z.B. bereits geloescht/parallel gemerged).

      await service.mergeCards('b1', 'source1', 'target1');

      expect(vi.mocked(writeBatch)).not.toHaveBeenCalled();
    });
  });
});

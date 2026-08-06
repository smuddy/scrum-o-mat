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
import {NO_ERRORS_SCHEMA} from '@angular/core';
import {NoopAnimationsModule} from '@angular/platform-browser/animations';
import {provideRouter} from '@angular/router';

import {MySessionsComponent} from './my-sessions.component';
import {PlanningService} from '../../planning.service';

describe('MySessionsComponent', () => {
  let component: MySessionsComponent;
  let fixture: ComponentFixture<MySessionsComponent>;
  let planningService: any;

  beforeEach(async () => {
    planningService = {
      deletePlanning: vi.fn().mockResolvedValue(undefined),
    };

    await TestBed.configureTestingModule({
      imports: [MySessionsComponent, NoopAnimationsModule],
      providers: [
        {provide: PlanningService, useValue: planningService},
        provideRouter([]),
      ],
      schemas: [NO_ERRORS_SCHEMA],
    })
      .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(MySessionsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('deletes a planning via the planning service', async () => {
    await component.delete('p1');

    expect(planningService.deletePlanning).toHaveBeenCalledWith('p1');
  });

  it('renders one entry per planning', () => {
    component.plannings = [
      {id: 'p1', subject: 'Sprint 1', modified: {seconds: 0}},
      {id: 'p2', subject: 'Sprint 2', modified: {seconds: 0}},
    ] as any;
    fixture.detectChanges();

    const entries = fixture.nativeElement.querySelectorAll('.planning');
    expect(entries.length).toBe(2);
    expect(fixture.nativeElement.textContent).toContain('Sprint 1');
    expect(fixture.nativeElement.textContent).toContain('Sprint 2');
  });

});

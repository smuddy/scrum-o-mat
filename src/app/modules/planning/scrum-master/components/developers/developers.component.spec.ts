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
import {ActivatedRoute, Router} from '@angular/router';
import {of} from 'rxjs';

import {DevelopersComponent} from './developers.component';
import {AdminService} from '../../../admin/components/admin.service';
import {PlanningService} from '../../../planning.service';
import {StoryPoints} from '../../../models/storyPoints';
import {DeveloperId} from '../../../models/delevoper';

describe('DevelopersComponent', () => {
  let component: DevelopersComponent;
  let fixture: ComponentFixture<DevelopersComponent>;
  let adminService: any;

  function createComponent(): void {
    fixture = TestBed.createComponent(DevelopersComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }

  beforeEach(async () => {
    adminService = {
      getDevelopers: vi.fn().mockReturnValue(of([])),
      deleteUser: vi.fn().mockResolvedValue(undefined),
    };

    const planningService = {getDevelopers: vi.fn()};
    const router = {
      navigateByUrl: vi.fn().mockResolvedValue(true),
      createUrlTree: vi.fn().mockReturnValue({} as any),
    };

    await TestBed.configureTestingModule({
      imports: [DevelopersComponent, NoopAnimationsModule],
      providers: [
        {provide: ActivatedRoute, useValue: {params: of({planningId: 'p1'})} as any},
        {provide: PlanningService, useValue: planningService},
        {provide: Router, useValue: router},
        {provide: AdminService, useValue: adminService},
      ],
      schemas: [NO_ERRORS_SCHEMA],
    })
      .compileComponents();
  });

  it('should create', () => {
    createComponent();
    expect(component).toBeTruthy();
  });

  it('loads developers from the admin service when a planning id is present', () => {
    const developers: DeveloperId[] = [{id: 'd1', name: 'A', storyPoints: null}];
    adminService.getDevelopers.mockReturnValue(of(developers));

    createComponent();

    expect(adminService.getDevelopers).toHaveBeenCalledWith('p1');
    expect(component.developers).toBe(developers);
  });

  it('delegates deleting a developer to the admin service', async () => {
    createComponent();

    await component.delete('d1');

    expect(adminService.deleteUser).toHaveBeenCalledWith('p1', 'd1');
  });

  it('renders story points using the shared formatter', () => {
    createComponent();

    expect(component.renderStoryPoints(StoryPoints.s5)).toBe('5');
    expect(component.renderStoryPoints(StoryPoints.coffee)).toBe('☕️');
  });

  it('reports readiness before results are shown based on having chosen story points', () => {
    createComponent();
    component.showResults = false;

    expect(component.devIsReady(StoryPoints.s5)).toBe(true);
    expect(component.devIsReady(null)).toBe(false);
  });

  it('reports readiness once results are shown, excluding the unsure choice', () => {
    createComponent();
    component.showResults = true;

    expect(component.devIsReady(StoryPoints.unsure)).toBe(false);
    expect(component.devIsReady(StoryPoints.s5)).toBe(true);
  });

  it('tracks developers by id', () => {
    createComponent();
    const developer = {id: 'd7', name: 'X', storyPoints: null} as DeveloperId;

    expect(component.trackById(0, developer)).toBe('d7');
  });

  it('exposes a name-sorted copy of the developers without mutating the input', () => {
    createComponent();
    const developers = [
      {id: 'd1', name: 'Charlie', storyPoints: null},
      {id: 'd2', name: 'Alice', storyPoints: null},
      {id: 'd3', name: 'Bob', storyPoints: null},
    ] as DeveloperId[];
    component.developers = developers;

    expect(component.sortedDevelopers.map(_ => _.name)).toEqual(['Alice', 'Bob', 'Charlie']);
    expect(developers.map(_ => _.name)).toEqual(['Charlie', 'Alice', 'Bob']);
  });

  it('tolerates an undefined developer list and null names when sorting', () => {
    createComponent();

    component.developers = undefined as any;
    expect(component.sortedDevelopers).toEqual([]);

    component.developers = [
      {id: 'd1', name: null, storyPoints: null},
      {id: 'd2', name: 'Zoe', storyPoints: null},
    ] as any;
    expect(component.sortedDevelopers.map(_ => _.name)).toEqual([null, 'Zoe']);
  });

});

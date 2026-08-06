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

import {GuestComponent} from './guest.component';
import {PlanningService} from '../planning.service';
import {AdminService} from '../admin/components/admin.service';
import {HeaderService} from '../../../shared/header/header.service';
import {FireworksService} from '../../../shared/fireworks/fireworks.service';
import {StoryPoints} from '../models/storyPoints';
import {DeveloperId} from '../models/delevoper';

describe('GuestComponent', () => {
  let component: GuestComponent;
  let fixture: ComponentFixture<GuestComponent>;
  let planningService: any;
  let adminService: any;
  let headerService: any;
  let fireworksService: any;
  let router: any;

  beforeEach(async () => {
    planningService = {getPlanning: vi.fn().mockReturnValue(of(undefined))};
    adminService = {getDevelopers: vi.fn().mockReturnValue(of([]))};
    headerService = {setFullscreen: vi.fn(), setBreadcrumb: vi.fn()};
    fireworksService = {start: vi.fn(), stop: vi.fn(), configure: vi.fn()};
    router = {
      navigateByUrl: vi.fn().mockResolvedValue(true),
      createUrlTree: vi.fn().mockReturnValue({} as any),
    };

    await TestBed.configureTestingModule({
      imports: [GuestComponent, NoopAnimationsModule],
      providers: [
        {provide: ActivatedRoute, useValue: {params: of({planningId: 'planning-1'}), queryParams: of({})} as any},
        {provide: PlanningService, useValue: planningService},
        {provide: Router, useValue: router},
        {provide: AdminService, useValue: adminService},
        {provide: HeaderService, useValue: headerService},
        {provide: FireworksService, useValue: fireworksService},
      ],
      schemas: [NO_ERRORS_SCHEMA],
    })
      .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(GuestComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('sets the fullscreen header and the breadcrumb on init', () => {
    expect(headerService.setFullscreen).toHaveBeenCalledWith(true);
    expect(headerService.setBreadcrumb).toHaveBeenCalledWith([{route: '/planning', name: 'Scrum Poker'}]);
    expect(fireworksService.start).toHaveBeenCalled();
  });

  it('redirects to the start page when no planning is found for the session', () => {
    expect(router.createUrlTree).toHaveBeenCalledWith(['/'], {queryParams: {session: 'planning-1'}});
    expect(router.navigateByUrl).toHaveBeenCalled();
  });

  it('applies planning data and configures the fireworks intensity', () => {
    const planning = {
      count: 1,
      issue: 'issue-1',
      subject: 'subject-1',
      estimateRequested: false,
      estimateSucceeded: true,
      storyPoints: StoryPoints.s5,
    } as any;
    planningService.getPlanning.mockReturnValue(of(planning));

    fixture = TestBed.createComponent(GuestComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();

    expect(component.count).toBe(1);
    expect(component.subject).toBe('subject-1');
    expect(component.estimateSucceeded).toBe(true);
    expect(component.coffeeBreak).toBe(false);
    expect(fireworksService.configure).toHaveBeenCalledWith(50, [200, 1500]);
  });

  it('marks a coffee break and disables fireworks when the coffee card was chosen', () => {
    const planning = {
      count: 1,
      issue: 'issue-1',
      subject: 'subject-1',
      estimateRequested: false,
      estimateSucceeded: true,
      storyPoints: StoryPoints.coffee,
    } as any;
    planningService.getPlanning.mockReturnValue(of(planning));

    fixture = TestBed.createComponent(GuestComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();

    expect(component.coffeeBreak).toBe(true);
    expect(fireworksService.configure).toHaveBeenCalledWith(0, [200, 1500]);
  });

  it('aggregates the selected story points and the chosen percentage once every developer has estimated', () => {
    const developers: DeveloperId[] = [
      {id: '1', name: 'Alice', storyPoints: StoryPoints.s3},
      {id: '2', name: 'Bob', storyPoints: StoryPoints.s3},
      {id: '3', name: 'Carol', storyPoints: StoryPoints.s5},
    ];
    adminService.getDevelopers.mockReturnValue(of(developers));

    fixture = TestBed.createComponent(GuestComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();

    expect(component.chosenPercent).toBe(100);
    expect(component.maxPoints).toBe(2);
    expect(component.selectedStoryPoints).toEqual([
      {storyPoint: StoryPoints.s3, count: 2},
      {storyPoint: StoryPoints.s5, count: 1},
    ]);
  });

  it('skips the aggregation while a developer has not estimated yet', () => {
    const developers: DeveloperId[] = [
      {id: '1', name: 'Alice', storyPoints: StoryPoints.s3},
      {id: '2', name: 'Bob', storyPoints: null},
    ];
    adminService.getDevelopers.mockReturnValue(of(developers));

    fixture = TestBed.createComponent(GuestComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();

    expect(component.chosenPercent).toBe(50);
    expect(component.selectedStoryPoints).toEqual([]);
    expect(component.maxPoints).toBe(1);
  });

  it('counts a "half" estimate (StoryPoints.sHalf = 0) as estimated', () => {
    const developers: DeveloperId[] = [
      {id: '1', name: 'Alice', storyPoints: StoryPoints.sHalf},
      {id: '2', name: 'Bob', storyPoints: StoryPoints.s3},
    ];
    adminService.getDevelopers.mockReturnValue(of(developers));

    fixture = TestBed.createComponent(GuestComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();

    // Alt-Bug: filter(d => d.storyPoints) wertete sHalf (=0) als falsy -> chosenPercent faelschlich 50.
    expect(component.chosenPercent).toBe(100);
    expect(component.selectedStoryPoints).toEqual([
      {storyPoint: StoryPoints.sHalf, count: 1},
      {storyPoint: StoryPoints.s3, count: 1},
    ]);
  });

  it('renders the label for a given story point', () => {
    expect(component.renderStoryPoints(StoryPoints.s5)).toBe('5');
  });

  it('computes the bar width percentage based on the highest vote count', () => {
    component.maxPoints = 4;

    expect(component.getWidthPercentage(2)).toBe(30);
  });

  it('turns off the fullscreen header and stops the fireworks on destroy', () => {
    component.ngOnDestroy();

    expect(headerService.setFullscreen).toHaveBeenCalledWith(false);
    expect(fireworksService.stop).toHaveBeenCalled();
  });

});

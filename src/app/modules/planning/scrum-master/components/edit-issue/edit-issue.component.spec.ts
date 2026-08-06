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
import {FormsModule} from '@angular/forms';
import {NoopAnimationsModule} from '@angular/platform-browser/animations';
import {of} from 'rxjs';

import {EditIssueComponent} from './edit-issue.component';
import {PlanningService} from '../../../planning.service';
import {Planning} from '../../../models/planning';
import {StoryPoints} from '../../../models/storyPoints';

describe('EditIssueComponent', () => {
  let component: EditIssueComponent;
  let fixture: ComponentFixture<EditIssueComponent>;
  let planningService: any;

  function createComponent(): void {
    fixture = TestBed.createComponent(EditIssueComponent);
    component = fixture.componentInstance;
    component.planningId = 'p1';
    fixture.detectChanges();
  }

  beforeEach(async () => {
    planningService = {
      getPlanning: vi.fn().mockReturnValue(of(undefined)),
      updateIssue: vi.fn().mockResolvedValue(undefined),
    };

    await TestBed.configureTestingModule({
      imports: [EditIssueComponent, FormsModule, NoopAnimationsModule],
      providers: [
        {provide: PlanningService, useValue: planningService},
      ],
      schemas: [NO_ERRORS_SCHEMA],
    })
      .compileComponents();
  });

  it('should create', () => {
    createComponent();
    expect(component).toBeTruthy();
  });

  it('stays in edit mode and ignores planning updates without an issue', () => {
    createComponent();

    expect(component.edit).toBe(true);
    expect(component.issue).toBeUndefined();
  });

  it('loads the subject and issue once a planning with an issue arrives', () => {
    const planning: Planning = {
      issue: 'ISSUE-1',
      subject: 'Sprint 1',
      modified: new Date(),
      count: 1,
      userId: 'u1',
      estimateRequested: false,
      estimateSucceeded: false,
      storyPoints: StoryPoints.s5,
    };
    planningService.getPlanning.mockReturnValue(of(planning));

    createComponent();

    expect(component.subject).toBe('Sprint 1');
    expect(component.issue).toBe('ISSUE-1');
    expect(component.edit).toBe(false);
  });

  it('focuses the input and does not save when trying to set an empty issue', async () => {
    createComponent();
    component.issue = null;
    const focusSpy = vi.fn();
    component.inputRef = {nativeElement: {focus: focusSpy}};

    await component.setIssue();

    expect(focusSpy).toHaveBeenCalled();
    expect(planningService.updateIssue).not.toHaveBeenCalled();
    expect(component.edit).toBe(true);
  });

  it('saves the issue and leaves edit mode when set with a value', async () => {
    createComponent();
    component.issue = 'ISSUE-2';
    component.inputRef = {nativeElement: {focus: vi.fn()}};

    await component.setIssue();

    expect(planningService.updateIssue).toHaveBeenCalledWith('p1', 'ISSUE-2');
    expect(component.edit).toBe(false);
  });

  it('resets the issue, re-enters edit mode and refocuses the input', async () => {
    createComponent();
    component.issue = 'ISSUE-2';
    const focusSpy = vi.fn();
    component.inputRef = {nativeElement: {focus: focusSpy}};

    await component.resetIssue();

    expect(component.issue).toBeNull();
    expect(planningService.updateIssue).toHaveBeenCalledWith('p1', null);
    expect(component.edit).toBe(true);
    expect(focusSpy).toHaveBeenCalled();
  });

  it('delegates saving to the planning service using the current planning id and issue', async () => {
    createComponent();
    component.issue = 'ISSUE-3';

    await component.updateIssue();

    expect(planningService.updateIssue).toHaveBeenCalledWith('p1', 'ISSUE-3');
  });

});

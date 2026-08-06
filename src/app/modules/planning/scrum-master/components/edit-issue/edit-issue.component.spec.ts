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
  let planningService: jasmine.SpyObj<PlanningService>;

  function createComponent(): void {
    fixture = TestBed.createComponent(EditIssueComponent);
    component = fixture.componentInstance;
    component.planningId = 'p1';
    fixture.detectChanges();
  }

  beforeEach(async () => {
    planningService = jasmine.createSpyObj('PlanningService', ['getPlanning', 'updateIssue']);
    planningService.getPlanning.and.returnValue(of(undefined));
    planningService.updateIssue.and.resolveTo();

    await TestBed.configureTestingModule({
      declarations: [EditIssueComponent],
      imports: [FormsModule, NoopAnimationsModule],
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

    expect(component.edit).toBeTrue();
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
    planningService.getPlanning.and.returnValue(of(planning));

    createComponent();

    expect(component.subject).toBe('Sprint 1');
    expect(component.issue).toBe('ISSUE-1');
    expect(component.edit).toBeFalse();
  });

  it('focuses the input and does not save when trying to set an empty issue', async () => {
    createComponent();
    component.issue = null;
    const focusSpy = jasmine.createSpy('focus');
    component.inputRef = {nativeElement: {focus: focusSpy}};

    await component.setIssue();

    expect(focusSpy).toHaveBeenCalled();
    expect(planningService.updateIssue).not.toHaveBeenCalled();
    expect(component.edit).toBeTrue();
  });

  it('saves the issue and leaves edit mode when set with a value', async () => {
    createComponent();
    component.issue = 'ISSUE-2';
    component.inputRef = {nativeElement: {focus: jasmine.createSpy('focus')}};

    await component.setIssue();

    expect(planningService.updateIssue).toHaveBeenCalledWith('p1', 'ISSUE-2');
    expect(component.edit).toBeFalse();
  });

  it('resets the issue, re-enters edit mode and refocuses the input', async () => {
    createComponent();
    component.issue = 'ISSUE-2';
    const focusSpy = jasmine.createSpy('focus');
    component.inputRef = {nativeElement: {focus: focusSpy}};

    await component.resetIssue();

    expect(component.issue).toBeNull();
    expect(planningService.updateIssue).toHaveBeenCalledWith('p1', null);
    expect(component.edit).toBeTrue();
    expect(focusSpy).toHaveBeenCalled();
  });

  it('delegates saving to the planning service using the current planning id and issue', async () => {
    createComponent();
    component.issue = 'ISSUE-3';

    await component.updateIssue();

    expect(planningService.updateIssue).toHaveBeenCalledWith('p1', 'ISSUE-3');
  });

});

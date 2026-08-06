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
import {ActivatedRoute, Router} from '@angular/router';
import {CommonModule} from '@angular/common';
import {NoopAnimationsModule} from '@angular/platform-browser/animations';
import {of} from 'rxjs';

import {SprintComponent} from './sprint.component';
import {VelocityService} from '../velocity.service';
import {ProjectService} from '../../project.service';
import {MenuService} from '../../../../../shared/menu/menu.service';
import {HeaderService} from '../../../../../shared/header/header.service';

describe('SprintComponent', () => {
  let component: SprintComponent;
  let fixture: ComponentFixture<SprintComponent>;
  let velocityService: any;
  let projectService: any;
  let menuService: any;
  let headerService: any;
  let router: any;

  beforeEach(async () => {
    velocityService = {
      getSprint$: vi.fn().mockReturnValue(of({
        id: 's1', sprintName: '1', sprintNumber: 1, fromDate: null, toDate: null,
        pointsAchieved: 0, availableStaff: [], projectName: 'P',
      } as any)),
      updateFromDate: vi.fn().mockResolvedValue(undefined),
      updateToDate: vi.fn().mockResolvedValue(undefined),
      updateSprintName: vi.fn().mockResolvedValue(undefined),
      updatePointsAchieved: vi.fn().mockResolvedValue(undefined),
      updateStaffName: vi.fn().mockResolvedValue(undefined),
      updateStaffDays: vi.fn().mockResolvedValue(undefined),
      updateStaffPercent: vi.fn().mockResolvedValue(undefined),
      addStaff: vi.fn().mockResolvedValue(undefined),
      removeStaff: vi.fn().mockResolvedValue(undefined),
      removeSprint: vi.fn().mockResolvedValue(undefined),
    };

    projectService = {
      getProject: vi.fn().mockReturnValue(of({
        id: 'pr1', name: 'P', sprints: [{id: 's1', sprintNumber: 1, availableStaff: []}],
        initialVelocity: 1, coReaders: [], coWriters: [],
      } as any)),
    };

    menuService = {addCustomAction: vi.fn(), resetCustomActions: vi.fn()};
    headerService = {setBreadcrumb: vi.fn(), setFullscreen: vi.fn()};
    router = {navigateByUrl: vi.fn().mockResolvedValue(true)};

    await TestBed.configureTestingModule({
      imports: [SprintComponent, CommonModule, NoopAnimationsModule],
      schemas: [NO_ERRORS_SCHEMA],
      providers: [
        {provide: ActivatedRoute, useValue: {params: of({projectId: 'pr1', sprintId: 's1'})} as any},
        {provide: VelocityService, useValue: velocityService},
        {provide: ProjectService, useValue: projectService},
        {provide: MenuService, useValue: menuService},
        {provide: HeaderService, useValue: headerService},
        {provide: Router, useValue: router},
      ],
    })
      .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(SprintComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('calculates the sum of days weighted by staff percentage', () => {
    const staff = [
      {id: '1', name: 'Alice', days: 10, percent: 50},
      {id: '2', name: 'Bob', days: 5, percent: 100},
    ];

    const result = component.sumDays(staff);

    expect(result).toBe(10);
  });

  it('tracks staff entries by id', () => {
    const result = component.trackBy(3, {id: 'xyz'});

    expect(result).toBe('xyz');
  });

  it('registers a custom action to delete the sprint on init', () => {
    expect(menuService.addCustomAction).toHaveBeenCalledWith('Sprint löschen', expect.any(Function), true);
  });

  it('deletes the sprint and navigates back to the project when the registered action runs', async () => {
    const project = {sprints: [{id: 's1'}]} as any;
    component['project'] = project;
    component['projectId'] = 'pr1';
    component['sprintId'] = 's1';
    const deleteAction = menuService.addCustomAction.mock.calls[0][1];

    await deleteAction();

    expect(velocityService.removeSprint).toHaveBeenCalledWith('pr1', project, 's1');
    expect(router.navigateByUrl).toHaveBeenCalledWith('/velocity/pr1');
  });

  it('resets the custom actions on destroy', () => {
    component.ngOnDestroy();

    expect(menuService.resetCustomActions).toHaveBeenCalled();
  });

  it('delegates updateFromDate to the velocity service', () => {
    const project = {} as any;
    component['project'] = project;
    component['projectId'] = 'pr1';
    const date = new Date(2024, 0, 1);

    component.updateFromDate(1, date);

    expect(velocityService.updateFromDate).toHaveBeenCalledWith('pr1', project, 1, date);
  });

  it('delegates updateToDate to the velocity service', () => {
    const project = {} as any;
    component['project'] = project;
    component['projectId'] = 'pr1';
    const date = new Date(2024, 0, 14);

    component.updateToDate(1, date);

    expect(velocityService.updateToDate).toHaveBeenCalledWith('pr1', project, 1, date);
  });

  it('delegates updateSprintText to the velocity service', () => {
    const project = {} as any;
    component['project'] = project;
    component['projectId'] = 'pr1';

    component.updateSprintText(1, 'New name');

    expect(velocityService.updateSprintName).toHaveBeenCalledWith('pr1', project, 1, 'New name');
  });

  it('delegates updatePointsAchieved to the velocity service', () => {
    const project = {} as any;
    component['project'] = project;
    component['projectId'] = 'pr1';

    component.updatePointsAchieved(1, 42);

    expect(velocityService.updatePointsAchieved).toHaveBeenCalledWith('pr1', project, 1, 42);
  });

  it('delegates updateStaffName to the velocity service', () => {
    const project = {} as any;
    component['project'] = project;
    component['projectId'] = 'pr1';

    component.updateStaffName(1, 'Alice', 'Alicia');

    expect(velocityService.updateStaffName).toHaveBeenCalledWith('pr1', project, 1, 'Alice', 'Alicia');
  });

  it('delegates updateStaffDays to the velocity service', () => {
    const project = {} as any;
    component['project'] = project;
    component['projectId'] = 'pr1';

    component.updateStaffDays(1, 'Alice', 7);

    expect(velocityService.updateStaffDays).toHaveBeenCalledWith('pr1', project, 1, 'Alice', 7);
  });

  it('delegates updateStaffPercent to the velocity service', () => {
    const project = {} as any;
    component['project'] = project;
    component['projectId'] = 'pr1';

    component.updateStaffPercent(1, 'Alice', 75);

    expect(velocityService.updateStaffPercent).toHaveBeenCalledWith('pr1', project, 1, 'Alice', 75);
  });

  it('delegates addStaff to the velocity service', () => {
    const project = {} as any;
    component['project'] = project;
    component['projectId'] = 'pr1';

    component.addStaff(1);

    expect(velocityService.addStaff).toHaveBeenCalledWith('pr1', project, 1);
  });

  it('delegates removeStaff to the velocity service', () => {
    const project = {} as any;
    component['project'] = project;
    component['projectId'] = 'pr1';
    const staff = {id: 'staff1', name: 'Alice', days: 5, percent: 100};

    component.removeStaff(1, staff);

    expect(velocityService.removeStaff).toHaveBeenCalledWith('pr1', project, 1, 'staff1');
  });

  describe('onClickRight', () => {
    it('navigates to the next sprint when not the last one', () => {
      const project = {sprints: [{id: 's0'}, {id: 's1'}, {id: 's2'}]} as any;
      component['project'] = project;
      component['projectId'] = 'pr1';
      component['sprintId'] = 's1';

      component.onClickRight();

      expect(router.navigateByUrl).toHaveBeenCalledWith('/velocity/pr1/s2');
    });

    it('does not navigate when already on the last sprint', () => {
      const project = {sprints: [{id: 's0'}, {id: 's1'}]} as any;
      component['project'] = project;
      component['projectId'] = 'pr1';
      component['sprintId'] = 's1';

      router.navigateByUrl.mockClear();
      component.onClickRight();

      expect(router.navigateByUrl).not.toHaveBeenCalled();
    });
  });

  describe('onClickLeft', () => {
    it('navigates to the previous sprint when not the first one', () => {
      const project = {sprints: [{id: 's0'}, {id: 's1'}, {id: 's2'}]} as any;
      component['project'] = project;
      component['projectId'] = 'pr1';
      component['sprintId'] = 's1';

      component.onClickLeft();

      expect(router.navigateByUrl).toHaveBeenCalledWith('/velocity/pr1/s0');
    });

    it('does not navigate when already on the first sprint', () => {
      const project = {sprints: [{id: 's0'}, {id: 's1'}]} as any;
      component['project'] = project;
      component['projectId'] = 'pr1';
      component['sprintId'] = 's0';

      router.navigateByUrl.mockClear();
      component.onClickLeft();

      expect(router.navigateByUrl).not.toHaveBeenCalled();
    });
  });

});

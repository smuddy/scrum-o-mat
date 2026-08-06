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
import {CommonModule} from '@angular/common';
import {NO_ERRORS_SCHEMA} from '@angular/core';
import {NoopAnimationsModule} from '@angular/platform-browser/animations';
import {ActivatedRoute, Router} from '@angular/router';
import {of} from 'rxjs';

import {ProjectComponent} from './project.component';
import {VelocityService} from './velocity.service';
import {ProjectService} from '../project.service';
import {MenuService} from '../../../../shared/menu/menu.service';
import {HeaderService} from '../../../../shared/header/header.service';
import {LoginService} from '../../../login/login.service';
import {ProjectId} from '../../models/project';

describe('ProjectComponent', () => {
  let component: ProjectComponent;
  let fixture: ComponentFixture<ProjectComponent>;
  let velocityService: any;
  let projectService: any;
  let menuService: any;
  let headerService: any;
  let router: any;
  let project: ProjectId;

  beforeEach(async () => {
    project = {id: 'pr1', name: 'Testprojekt', sprints: [], initialVelocity: 1, coReaders: [], coWriters: []};

    velocityService = {
      addSprint: vi.fn().mockResolvedValue(undefined),
      updateProject: vi.fn().mockResolvedValue(undefined),
    };

    projectService = {
      getProject: vi.fn().mockReturnValue(of(project)),
      updateProject: vi.fn().mockResolvedValue(undefined),
      deleteProject: vi.fn().mockResolvedValue(undefined),
    };

    menuService = {addCustomAction: vi.fn(), resetCustomActions: vi.fn()};
    headerService = {setBreadcrumb: vi.fn()};

    router = {
      navigateByUrl: vi.fn().mockResolvedValue(true),
      createUrlTree: vi.fn().mockReturnValue({} as any),
    };

    await TestBed.configureTestingModule({
      imports: [ProjectComponent, CommonModule, NoopAnimationsModule],
      providers: [
        {provide: VelocityService, useValue: velocityService},
        {provide: ActivatedRoute, useValue: {params: of({projectId: 'pr1'})} as any},
        {provide: ProjectService, useValue: projectService},
        {provide: MenuService, useValue: menuService},
        {provide: HeaderService, useValue: headerService},
        {provide: Router, useValue: router},
        {provide: LoginService, useValue: {currentUserId$: () => of('u1')} as any},
      ],
      schemas: [NO_ERRORS_SCHEMA],
    })
      .compileComponents();
  });

  // project$ is debounced by 500ms in the ported component, so `this.project` and the refined
  // breadcrumb are only available after the timer elapses. We await a real timer since the
  // Vitest/zone environment does not provide a ProxyZone for fakeAsync.
  beforeEach(async () => {
    fixture = TestBed.createComponent(ProjectComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
    await new Promise(resolve => setTimeout(resolve, 600));
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('sets the sprint planner breadcrumb and then refines it with the loaded project on init', () => {
    expect(headerService.setBreadcrumb).toHaveBeenCalledWith([{route: '/velocity', name: 'Sprint Planer'}]);
    expect(headerService.setBreadcrumb).toHaveBeenCalledWith([
      {route: '/velocity', name: 'Sprint Planer'},
      {route: '/velocity/pr1', name: 'Testprojekt'},
    ]);
  });

  it('registers the sprint, edit and delete custom actions', () => {
    const names = menuService.addCustomAction.mock.calls.map((args: any[]) => args[0]);

    expect(names).toEqual(['Sprint erstellen', 'Projekt bearbeiten', 'Projekt löschen']);
    expect(menuService.addCustomAction.mock.calls[2][2]).toBe(true);
  });

  it('delegates sprint creation to the velocity service', () => {
    const createSprint = menuService.addCustomAction.mock.calls[0][1];

    createSprint();

    expect(velocityService.addSprint).toHaveBeenCalledWith('pr1', project);
  });

  it('navigates to the edit page when the edit action is triggered', () => {
    const editProject = menuService.addCustomAction.mock.calls[1][1];

    editProject();

    expect(router.navigateByUrl).toHaveBeenCalledWith('/velocity/pr1/edit');
  });

  it('deletes the project and navigates back when the delete action is triggered', () => {
    const deleteProject = menuService.addCustomAction.mock.calls[2][1];

    deleteProject();

    expect(router.navigateByUrl).toHaveBeenCalledWith('/velocity');
    expect(projectService.deleteProject).toHaveBeenCalledWith('pr1');
  });

  it('delegates name updates to the project service', () => {
    component.updateName('Neuer Name');

    expect(projectService.updateProject).toHaveBeenCalledWith('pr1', {name: 'Neuer Name'});
  });

  it('calculates the available staff in person-days', () => {
    const availableStaff = [
      {id: 's1', name: 'A', days: 10, percent: 50},
      {id: 's2', name: 'B', days: 5, percent: 100},
    ];

    expect(component.calcAvailableStaff(availableStaff)).toBe(10);
  });

  it('treats the owner as a writer', () => {
    expect(component.isWriter({...project, owner: 'u1'} as any)).toBe(true);
  });

  it('treats a co-writer as a writer', () => {
    expect(component.isWriter({...project, owner: 'other', coWriters: ['u1']} as any)).toBe(true);
  });

  it('does not treat an unrelated user as a writer', () => {
    expect(component.isWriter({...project, owner: 'other', coWriters: []} as any)).toBe(false);
  });

  it('resets the custom actions on destroy', () => {
    component.ngOnDestroy();

    expect(menuService.resetCustomActions).toHaveBeenCalled();
  });
});

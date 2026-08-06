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
import {of} from 'rxjs';

import {ProjectsComponent} from './projects.component';
import {ProjectService} from './project.service';
import {LoginService} from '../../login/login.service';
import {MenuService} from '../../../shared/menu/menu.service';
import {HeaderService} from '../../../shared/header/header.service';

describe('ProjectsComponent', () => {
  let component: ProjectsComponent;
  let fixture: ComponentFixture<ProjectsComponent>;
  let projectService: any;
  let menuService: any;
  let headerService: any;

  beforeEach(async () => {
    projectService = {
      getProjectsOwner: vi.fn().mockReturnValue(of([])),
      getProjectsReader: vi.fn().mockReturnValue(of([])),
      getProjectsWriter: vi.fn().mockReturnValue(of([])),
      addNewProject: vi.fn().mockResolvedValue('newId'),
    };

    menuService = {addCustomAction: vi.fn(), resetCustomActions: vi.fn()};
    headerService = {setBreadcrumb: vi.fn()};

    await TestBed.configureTestingModule({
      imports: [ProjectsComponent, CommonModule, NoopAnimationsModule],
      providers: [
        {provide: ProjectService, useValue: projectService},
        {provide: LoginService, useValue: {currentUserId$: () => of('u1')} as any},
        {provide: MenuService, useValue: menuService},
        {provide: HeaderService, useValue: headerService},
      ],
      schemas: [NO_ERRORS_SCHEMA],
    })
      .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ProjectsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('exposes the owner, reader and writer projects from the project service', () => {
    projectService.getProjectsOwner.mockReturnValue(of([{id: 'owner1'}]));
    projectService.getProjectsReader.mockReturnValue(of([{id: 'reader1'}]));
    projectService.getProjectsWriter.mockReturnValue(of([{id: 'writer1'}]));
    const fresh = TestBed.createComponent(ProjectsComponent).componentInstance;

    let owner: unknown[];
    let reader: unknown[];
    let writer: unknown[];
    fresh.projectsOwner$.subscribe(_ => owner = _);
    fresh.projectsReader$.subscribe(_ => reader = _);
    fresh.projectsWriter$.subscribe(_ => writer = _);

    expect(owner).toEqual([{id: 'owner1'}]);
    expect(reader).toEqual([{id: 'reader1'}]);
    expect(writer).toEqual([{id: 'writer1'}]);
  });

  it('sets the sprint planner breadcrumb and registers the create action on init', () => {
    expect(headerService.setBreadcrumb).toHaveBeenCalledWith([{route: '/velocity', name: 'Sprint Planer'}]);
    expect(menuService.addCustomAction).toHaveBeenCalledWith('Projekt anlegen', expect.any(Function));
  });

  it('delegates project creation to the project service using the current user', async () => {
    await component.addProject();

    expect(projectService.addNewProject).toHaveBeenCalledWith('u1');
  });

  it('creates a project when the registered custom action is triggered', async () => {
    const addAction = menuService.addCustomAction.mock.calls[0][1];

    await addAction();

    expect(projectService.addNewProject).toHaveBeenCalledWith('u1');
  });

  it('resets the custom actions on destroy', () => {
    component.ngOnDestroy();

    expect(menuService.resetCustomActions).toHaveBeenCalled();
  });
});

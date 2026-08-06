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
  let projectService: jasmine.SpyObj<ProjectService>;
  let menuService: jasmine.SpyObj<MenuService>;
  let headerService: jasmine.SpyObj<HeaderService>;

  beforeEach(async () => {
    projectService = jasmine.createSpyObj('ProjectService', [
      'getProjectsOwner', 'getProjectsReader', 'getProjectsWriter', 'addNewProject',
    ]);
    projectService.getProjectsOwner.and.returnValue(of([]));
    projectService.getProjectsReader.and.returnValue(of([]));
    projectService.getProjectsWriter.and.returnValue(of([]));
    projectService.addNewProject.and.resolveTo('newId');

    menuService = jasmine.createSpyObj('MenuService', ['addCustomAction', 'resetCustomActions']);
    headerService = jasmine.createSpyObj('HeaderService', ['setBreadcrumb']);

    await TestBed.configureTestingModule({
      declarations: [ProjectsComponent],
      imports: [CommonModule, NoopAnimationsModule],
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
    let owner: unknown[];
    let reader: unknown[];
    let writer: unknown[];
    component.projectsOwner$.subscribe(_ => owner = _);
    component.projectsReader$.subscribe(_ => reader = _);
    component.projectsWriter$.subscribe(_ => writer = _);

    expect(owner).toEqual([]);
    expect(reader).toEqual([]);
    expect(writer).toEqual([]);
  });

  it('sets the sprint planner breadcrumb and registers the create action on init', () => {
    expect(headerService.setBreadcrumb).toHaveBeenCalledWith([{route: '/velocity', name: 'Sprint Planer'}]);
    expect(menuService.addCustomAction).toHaveBeenCalledWith('Projekt anlegen', jasmine.any(Function));
  });

  it('delegates project creation to the project service using the current user', async () => {
    await component.addProject();

    expect(projectService.addNewProject).toHaveBeenCalledWith('u1');
  });

  it('creates a project when the registered custom action is triggered', async () => {
    const addAction = menuService.addCustomAction.calls.argsFor(0)[1];

    await addAction();

    expect(projectService.addNewProject).toHaveBeenCalledWith('u1');
  });

  it('resets the custom actions on destroy', () => {
    component.ngOnDestroy();

    expect(menuService.resetCustomActions).toHaveBeenCalled();
  });
});

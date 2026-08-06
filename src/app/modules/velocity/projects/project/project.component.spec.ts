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
  let velocityService: jasmine.SpyObj<VelocityService>;
  let projectService: jasmine.SpyObj<ProjectService>;
  let menuService: jasmine.SpyObj<MenuService>;
  let headerService: jasmine.SpyObj<HeaderService>;
  let router: jasmine.SpyObj<Router>;
  let project: ProjectId;

  beforeEach(async () => {
    // ProjectComponent.ngOnInit assigns to the global `setStaff` (declared via `declare var`,
    // provided by an inline script in index.html at runtime). Stub it so ngOnInit does not throw.
    (window as any).setStaff = () => undefined;

    project = {id: 'pr1', name: 'Testprojekt', sprints: [], initialVelocity: 1, coReaders: [], coWriters: []};

    velocityService = jasmine.createSpyObj('VelocityService', ['addSprint', 'updateProject']);
    velocityService.addSprint.and.resolveTo();
    velocityService.updateProject.and.resolveTo();

    projectService = jasmine.createSpyObj('ProjectService', ['getProject', 'updateProject', 'deleteProject']);
    projectService.getProject.and.returnValue(of(project));
    projectService.updateProject.and.resolveTo();
    projectService.deleteProject.and.resolveTo();

    menuService = jasmine.createSpyObj('MenuService', ['addCustomAction', 'resetCustomActions']);
    headerService = jasmine.createSpyObj('HeaderService', ['setBreadcrumb']);

    router = jasmine.createSpyObj('Router', ['navigateByUrl', 'createUrlTree']);
    router.navigateByUrl.and.resolveTo(true);
    router.createUrlTree.and.returnValue({} as any);

    await TestBed.configureTestingModule({
      declarations: [ProjectComponent],
      imports: [CommonModule, NoopAnimationsModule],
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

  beforeEach(() => {
    fixture = TestBed.createComponent(ProjectComponent);
    component = fixture.componentInstance;
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
    const names = menuService.addCustomAction.calls.allArgs().map(args => args[0]);

    expect(names).toEqual(['Sprint erstellen', 'Projekt bearbeiten', 'Projekt löschen']);
    expect(menuService.addCustomAction.calls.argsFor(2)[2]).toBe(true);
  });

  it('delegates sprint creation to the velocity service', () => {
    const createSprint = menuService.addCustomAction.calls.argsFor(0)[1];

    createSprint();

    expect(velocityService.addSprint).toHaveBeenCalledWith('pr1', project);
  });

  it('navigates to the edit page when the edit action is triggered', () => {
    const editProject = menuService.addCustomAction.calls.argsFor(1)[1];

    editProject();

    expect(router.navigateByUrl).toHaveBeenCalledWith('/velocity/pr1/edit');
  });

  it('deletes the project and navigates back when the delete action is triggered', () => {
    const deleteProject = menuService.addCustomAction.calls.argsFor(2)[1];

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
    expect(component.isWriter({...project, owner: 'u1'} as any)).toBeTrue();
  });

  it('treats a co-writer as a writer', () => {
    expect(component.isWriter({...project, owner: 'other', coWriters: ['u1']} as any)).toBeTrue();
  });

  it('does not treat an unrelated user as a writer', () => {
    expect(component.isWriter({...project, owner: 'other', coWriters: []} as any)).toBeFalse();
  });

  it('resets the custom actions on destroy', () => {
    component.ngOnDestroy();

    expect(menuService.resetCustomActions).toHaveBeenCalled();
  });
});

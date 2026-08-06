import {ComponentFixture, TestBed} from '@angular/core/testing';
import {CommonModule} from '@angular/common';
import {NO_ERRORS_SCHEMA} from '@angular/core';
import {NoopAnimationsModule} from '@angular/platform-browser/animations';
import {ActivatedRoute} from '@angular/router';
import {of} from 'rxjs';

import {EditProjectComponent} from './edit-project.component';
import {VelocityService} from '../velocity.service';
import {ProjectService} from '../../project.service';
import {MenuService} from '../../../../../shared/menu/menu.service';
import {HeaderService} from '../../../../../shared/header/header.service';
import {ProjectId} from '../../../models/project';

describe('EditProjectComponent', () => {
  let component: EditProjectComponent;
  let fixture: ComponentFixture<EditProjectComponent>;
  let velocityService: jasmine.SpyObj<VelocityService>;
  let projectService: jasmine.SpyObj<ProjectService>;
  let menusService: jasmine.SpyObj<MenuService>;
  let headerService: jasmine.SpyObj<HeaderService>;
  let project: ProjectId;

  beforeEach(async () => {
    project = {id: 'pr1', name: 'Projekt X', sprints: [], initialVelocity: 1, coReaders: [], coWriters: []};

    velocityService = jasmine.createSpyObj('VelocityService', ['updateInitialVelocity', 'addReader', 'removeReader']);
    velocityService.updateInitialVelocity.and.resolveTo();
    velocityService.addReader.and.resolveTo();
    velocityService.removeReader.and.resolveTo();

    projectService = jasmine.createSpyObj('ProjectService', ['getProject', 'updateProject']);
    projectService.getProject.and.returnValue(of(project));
    projectService.updateProject.and.resolveTo();

    menusService = jasmine.createSpyObj('MenuService', ['resetCustomActions']);
    headerService = jasmine.createSpyObj('HeaderService', ['setBreadcrumb']);

    await TestBed.configureTestingModule({
      declarations: [EditProjectComponent],
      imports: [CommonModule, NoopAnimationsModule],
      providers: [
        {provide: ActivatedRoute, useValue: {params: of({projectId: 'pr1'})} as any},
        {provide: VelocityService, useValue: velocityService},
        {provide: ProjectService, useValue: projectService},
        {provide: MenuService, useValue: menusService},
        {provide: HeaderService, useValue: headerService},
      ],
      schemas: [NO_ERRORS_SCHEMA],
    })
      .compileComponents();
  });

  beforeEach(() => {
    // Kein fixture.detectChanges(): das Template bindet "@fadeTranslateInstant", der Trigger ist
    // im @Component-Decorator dieser Komponente aber nicht registriert (siehe Bug-Hinweis in der
    // Rückmeldung). detectChanges() wuerde daher zur Laufzeit werfen. ngOnInit ist ein No-Op,
    // es geht dadurch keine Abdeckung verloren.
    fixture = TestBed.createComponent(EditProjectComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('sets the breadcrumb using the loaded project', () => {
    expect(headerService.setBreadcrumb).toHaveBeenCalledWith([
      {route: '/velocity', name: 'Sprint Planer'},
      {route: '/velocity/pr1', name: 'Projekt X'},
      {route: '/velocity/pr1', name: 'Info'},
    ]);
  });

  it('delegates name updates to the project service', () => {
    component.updateName('Neuer Name');

    expect(projectService.updateProject).toHaveBeenCalledWith('pr1', {name: 'Neuer Name'});
  });

  it('delegates initial velocity updates to the velocity service', () => {
    component.updateInitialVelocity(5);

    expect(velocityService.updateInitialVelocity).toHaveBeenCalledWith('pr1', project, 5);
  });

  it('stores the entered reader name', () => {
    component.editReaderName('newUser1');

    expect(component.newReaderName).toBe('newUser1');
  });

  it('adds a reader and resets the input', async () => {
    component.newReaderName = 'newUser1';

    await component.addReader();

    expect(velocityService.addReader).toHaveBeenCalledWith('pr1', project, 'newUser1');
    expect(component.newReaderName).toBe('');
  });

  it('delegates reader removal to the velocity service', async () => {
    await component.removeReader('coReader1');

    expect(velocityService.removeReader).toHaveBeenCalledWith('pr1', project, 'coReader1');
  });

  it('resets the custom actions on destroy', () => {
    component.ngOnDestroy();

    expect(menusService.resetCustomActions).toHaveBeenCalled();
  });
});

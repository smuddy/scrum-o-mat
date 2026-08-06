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
  let velocityService: any;
  let projectService: any;
  let menusService: any;
  let headerService: any;
  let project: ProjectId;

  beforeEach(async () => {
    project = {id: 'pr1', name: 'Projekt X', sprints: [], initialVelocity: 1, coReaders: [], coWriters: []};

    velocityService = {
      updateInitialVelocity: vi.fn().mockResolvedValue(undefined),
      addReader: vi.fn().mockResolvedValue(undefined),
      removeReader: vi.fn().mockResolvedValue(undefined),
    };

    projectService = {
      getProject: vi.fn().mockReturnValue(of(project)),
      updateProject: vi.fn().mockResolvedValue(undefined),
    };

    menusService = {resetCustomActions: vi.fn()};
    headerService = {setBreadcrumb: vi.fn()};

    await TestBed.configureTestingModule({
      imports: [EditProjectComponent, CommonModule, NoopAnimationsModule],
      providers: [
        {provide: ActivatedRoute, useValue: {params: of({projectId: 'pr1'})} as any},
        {provide: VelocityService, useValue: velocityService},
        {provide: ProjectService, useValue: projectService},
        {provide: MenuService, useValue: menusService},
        {provide: HeaderService, useValue: headerService},
      ],
      schemas: [NO_ERRORS_SCHEMA],
    })
      .overrideComponent(EditProjectComponent, {
        set: {imports: [CommonModule], schemas: [NO_ERRORS_SCHEMA]},
      })
      .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(EditProjectComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('renders the project form once the project has loaded', () => {
    expect(fixture.nativeElement.textContent).toContain('Mitarbeiter');
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

  it('rejects an invalid reader name and keeps the input untouched', async () => {
    // Alt-Bug: ungeankerte userIdRegex akzeptierte jeden String -> ungueltige Reader wurden angelegt.
    component.newReaderName = 'foo bar!';

    await component.addReader();

    expect(velocityService.addReader).not.toHaveBeenCalled();
    expect(component.newReaderName).toBe('foo bar!');
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

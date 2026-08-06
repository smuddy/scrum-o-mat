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

import {TestBed} from '@angular/core/testing';
import {Timestamp} from '@angular/fire/firestore';
import {firstValueFrom, of} from 'rxjs';

import {VelocityService} from './velocity.service';
import {ProjectService} from '../project.service';
import {Project, Sprint, Staff} from '../../models/project';

const createTimestamp = (year: number, month: number, day: number) => Timestamp.fromDate(new Date(year, month, day));

const createStaff = (overrides: Partial<Staff> = {}): Staff => ({id: 'staff1', name: 'Dev', days: 10, percent: 100, ...overrides});

const createSprint = (overrides: Partial<Sprint> = {}): Sprint => ({
  id: 'sprint1',
  sprintNumber: 1,
  sprintName: 'Sprint 1',
  fromDate: createTimestamp(2020, 0, 1),
  toDate: createTimestamp(2020, 0, 14),
  pointsPlaned: 0,
  pointsAchieved: 0,
  velocityPlaned: 0,
  velocityAchieved: 0,
  availableStaff: [],
  isForecast: false,
  ...overrides
});

const createProject = (overrides: Partial<Project> = {}): Project => ({
  name: 'P',
  sprints: [],
  initialVelocity: 1,
  coReaders: [],
  coWriters: [],
  ...overrides
});

describe('VelocityService', () => {
  let service: VelocityService;
  let projectService: any;

  beforeEach(() => {
    projectService = {
      getProject: vi.fn(),
      updateProject: vi.fn().mockResolvedValue(undefined),
    };

    TestBed.configureTestingModule({
      providers: [
        VelocityService,
        {provide: ProjectService, useValue: projectService},
      ],
    });
    service = TestBed.inject(VelocityService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('maps the sprint by id and adds the project name', async () => {
    const sprint = createSprint({id: 'sprint1', sprintNumber: 1});
    const project = createProject({name: 'My Project', sprints: [sprint]});
    projectService.getProject.mockReturnValue(of(project));

    const result = await firstValueFrom(service.getSprint$('p1', 'sprint1'));

    expect(result).toEqual({...sprint, projectName: 'My Project'});
  });

  it('adds a new sprint to the project', async () => {
    const project = createProject({sprints: []});

    await service.addSprint('p1', project);

    expect(projectService.updateProject).toHaveBeenCalledTimes(1);
    const [projectId, updatedProject] = projectService.updateProject.mock.lastCall;
    expect(projectId).toBe('p1');
    expect(updatedProject.sprints.length).toBe(1);
    expect(updatedProject.sprints[0].sprintNumber).toBe(1);
  });

  it('removes a sprint by id', async () => {
    const sprintToRemove = createSprint({id: 'sprint1', sprintNumber: 1});
    const sprintToKeep = createSprint({id: 'sprint2', sprintNumber: 2});
    const project = createProject({sprints: [sprintToRemove, sprintToKeep]});

    await service.removeSprint('p1', project, 'sprint1');

    const [, updatedProject] = projectService.updateProject.mock.lastCall;
    expect(updatedProject.sprints.length).toBe(1);
    expect(updatedProject.sprints[0].id).toBe('sprint2');
  });

  it('updates the initial velocity', async () => {
    const project = createProject({initialVelocity: 1});

    await service.updateInitialVelocity('p1', project, 5);

    const [projectId, updatedProject] = projectService.updateProject.mock.lastCall;
    expect(projectId).toBe('p1');
    expect(updatedProject.initialVelocity).toBe(5);
  });

  it('adds a co-reader to the project', async () => {
    const project = createProject({coReaders: []});

    await service.addReader('p1', project, 'user1');

    const [, updatedProject] = projectService.updateProject.mock.lastCall;
    expect(updatedProject.coReaders).toEqual(['user1']);
  });

  it('removes a co-reader from the project', async () => {
    const project = createProject({coReaders: ['user1', 'user2']});

    await service.removeReader('p1', project, 'user1');

    const [, updatedProject] = projectService.updateProject.mock.lastCall;
    expect(updatedProject.coReaders).toEqual(['user2']);
  });

  it('adds a staff member to a sprint', async () => {
    const sprint = createSprint({sprintNumber: 1, availableStaff: []});
    const project = createProject({sprints: [sprint]});

    await service.addStaff('p1', project, 1);

    const [, updatedProject] = projectService.updateProject.mock.lastCall;
    const updatedSprint = updatedProject.sprints.find((s: Sprint) => s.sprintNumber === 1);
    expect(updatedSprint.availableStaff.length).toBe(1);
    expect(updatedSprint.availableStaff[0].name).toBe('');
    expect(updatedSprint.availableStaff[0].days).toBe(10);
    expect(updatedSprint.availableStaff[0].percent).toBe(100);
  });

  it('removes a staff member from a sprint', async () => {
    const staffToRemove = createStaff({id: 'staff1', name: 'Ada'});
    const staffToKeep = createStaff({id: 'staff2', name: 'Grace'});
    const sprint = createSprint({sprintNumber: 1, availableStaff: [staffToRemove, staffToKeep]});
    const project = createProject({sprints: [sprint]});

    await service.removeStaff('p1', project, 1, 'staff1');

    const [, updatedProject] = projectService.updateProject.mock.lastCall;
    const updatedSprint = updatedProject.sprints.find((s: Sprint) => s.sprintNumber === 1);
    expect(updatedSprint.availableStaff.map((s: Staff) => s.id)).toEqual(['staff2']);
  });

  it('applies the manipulate callback and persists the result', async () => {
    const project = createProject({name: 'Old name'});

    await service.updateProject('p1', project, p => p.name = 'New name');

    const [projectId, updatedProject] = projectService.updateProject.mock.lastCall;
    expect(projectId).toBe('p1');
    expect(updatedProject.name).toBe('New name');
  });

  it('keeps an empty sprint list unchanged when recalculating', async () => {
    const project = createProject({sprints: []});

    await service.updateProject('p1', project, () => undefined);

    const [, updatedProject] = projectService.updateProject.mock.lastCall;
    expect(updatedProject.sprints).toEqual([]);
  });

  it('calculates the achieved velocity from points achieved and available staff', async () => {
    const staff = createStaff({days: 10, percent: 50});
    const sprint = createSprint({availableStaff: [staff], pointsAchieved: 100});
    const project = createProject({sprints: [sprint], initialVelocity: 1});

    await service.updateProject('p1', project, () => undefined);

    const [, updatedProject] = projectService.updateProject.mock.lastCall;
    const updatedSprint = updatedProject.sprints[0];
    expect(updatedSprint.velocityAchieved).toBeCloseTo(20);
    expect(updatedSprint.velocityPlaned).toBeCloseTo(1);
    expect(updatedSprint.pointsPlaned).toBeCloseTo(5);
  });

  it('updates the points achieved of the matching sprint', async () => {
    const project = createProject({sprints: [createSprint({sprintNumber: 1, pointsAchieved: 0})]});

    await service.updatePointsAchieved('p1', project, 1, 42);

    const [, updatedProject] = projectService.updateProject.mock.lastCall;
    const updatedSprint = updatedProject.sprints.find((s: Sprint) => s.sprintNumber === 1);
    expect(updatedSprint.pointsAchieved).toBe(42);
  });

  it('updates the from date of the matching sprint', async () => {
    const project = createProject({sprints: [createSprint({sprintNumber: 1})]});
    const from = new Date(2021, 5, 15);

    await service.updateFromDate('p1', project, 1, from);

    const updatedSprint = projectService.updateProject.mock.lastCall[1].sprints.find((s: Sprint) => s.sprintNumber === 1);
    expect(updatedSprint.fromDate.toDate()).toEqual(from);
  });

  it('updates the to date of the matching sprint', async () => {
    const project = createProject({sprints: [createSprint({sprintNumber: 1})]});
    const to = new Date(2021, 5, 29);

    await service.updateToDate('p1', project, 1, to);

    const updatedSprint = projectService.updateProject.mock.lastCall[1].sprints.find((s: Sprint) => s.sprintNumber === 1);
    expect(updatedSprint.toDate.toDate()).toEqual(to);
  });

  it('updates the sprint name of the matching sprint', async () => {
    const project = createProject({sprints: [createSprint({sprintNumber: 1, sprintName: 'Old'})]});

    await service.updateSprintName('p1', project, 1, 'New sprint name');

    const updatedSprint = projectService.updateProject.mock.lastCall[1].sprints.find((s: Sprint) => s.sprintNumber === 1);
    expect(updatedSprint.sprintName).toBe('New sprint name');
  });

  it('updates a staff member looked up by name', async () => {
    const makeProject = () => createProject({sprints: [createSprint({sprintNumber: 1, availableStaff: [createStaff({name: 'Ada', days: 10, percent: 100})]})]});

    await service.updateStaffName('p1', makeProject(), 1, 'Ada', 'Grace');
    expect(projectService.updateProject.mock.lastCall[1].sprints[0].availableStaff[0].name).toBe('Grace');

    await service.updateStaffDays('p1', makeProject(), 1, 'Ada', 7);
    expect(projectService.updateProject.mock.lastCall[1].sprints[0].availableStaff[0].days).toBe(7);

    await service.updateStaffPercent('p1', makeProject(), 1, 'Ada', 50);
    expect(projectService.updateProject.mock.lastCall[1].sprints[0].availableStaff[0].percent).toBe(50);
  });

  it('leaves the staff untouched when the name is not found', async () => {
    const project = createProject({sprints: [createSprint({sprintNumber: 1, availableStaff: [createStaff({name: 'Ada'})]})]});

    await service.updateStaffName('p1', project, 1, 'Unknown', 'Grace');

    expect(projectService.updateProject.mock.lastCall[1].sprints[0].availableStaff[0].name).toBe('Ada');
  });

});

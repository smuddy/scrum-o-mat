import {TestBed} from '@angular/core/testing';
import {AngularFirestore} from '@angular/fire/compat/firestore';
import {of} from 'rxjs';

import {PlanningService, renderStoryPoint} from './planning.service';
import {LoginService} from '../login/login.service';
import {StoryPoints} from './models/storyPoints';

describe('PlanningService', () => {
  let service: PlanningService;
  let afs: any;
  let loginService: any;
  let planningCollection: any;
  let planningDoc: any;
  let developerCollection: any;
  let developerDoc: any;

  beforeEach(() => {
    developerDoc = jasmine.createSpyObj('developerDoc', ['update', 'delete', 'valueChanges']);
    developerDoc.update.and.resolveTo();
    developerDoc.delete.and.resolveTo();
    developerDoc.valueChanges.and.returnValue(of(undefined));

    developerCollection = jasmine.createSpyObj('developerCollection', ['valueChanges', 'doc', 'add']);
    developerCollection.valueChanges.and.returnValue(of([]));
    developerCollection.doc.and.returnValue(developerDoc);
    developerCollection.add.and.resolveTo({id: 'newId'});

    planningDoc = jasmine.createSpyObj('planningDoc', ['update', 'valueChanges', 'collection', 'delete']);
    planningDoc.update.and.resolveTo();
    planningDoc.valueChanges.and.returnValue(of(undefined));
    planningDoc.collection.and.returnValue(developerCollection);
    planningDoc.delete.and.resolveTo();

    planningCollection = jasmine.createSpyObj('planningCollection', ['valueChanges', 'add', 'doc']);
    planningCollection.valueChanges.and.returnValue(of([]));
    planningCollection.add.and.resolveTo({id: 'newId'});
    planningCollection.doc.and.returnValue(planningDoc);

    afs = jasmine.createSpyObj('AngularFirestore', ['collection', 'doc']);
    afs.collection.and.returnValue(planningCollection);
    afs.doc.and.returnValue(planningDoc);

    loginService = {authStateAllowAnonymous$: of({uid: 'u1'})};

    TestBed.configureTestingModule({
      providers: [
        PlanningService,
        {provide: AngularFirestore, useValue: afs},
        {provide: LoginService, useValue: loginService},
      ],
    });
    service = TestBed.inject(PlanningService);
  });

  it('should create', () => {
    expect(service).toBeTruthy();
    expect(afs.collection).toHaveBeenCalledWith('planning');
  });

  it('updates the issue and resets the story points afterwards', async () => {
    await service.updateIssue('p1', 'New issue text');

    expect(afs.doc).toHaveBeenCalledWith('planning/p1');
    expect(planningDoc.update).toHaveBeenCalledWith(jasmine.objectContaining({
      issue: 'New issue text',
      estimateRequested: true,
      estimateSucceeded: false,
      storyPoints: null,
      count: 1,
    }));
  });

  it('creates a new session for the current user and returns the new id', async () => {
    const id = await service.createNewSession('Sprint planning');

    expect(id).toBe('newId');
    expect(planningCollection.add).toHaveBeenCalledWith(jasmine.objectContaining({
      subject: 'Sprint planning',
      issue: null,
      userId: 'u1',
      estimateRequested: true,
      estimateSucceeded: false,
      storyPoints: null,
      count: 0,
    }));
  });

  it('loads a planning by id', done => {
    planningDoc.valueChanges.and.returnValue(of({subject: 'Sprint planning'}));

    service.getPlanning('p1').subscribe(planning => {
      expect(afs.doc).toHaveBeenCalledWith('planning/p1');
      expect(planning).toEqual({subject: 'Sprint planning'} as any);
      done();
    });
  });

  it('adds a developer, stores the name locally and returns the new id', async () => {
    spyOn(localStorage, 'setItem');

    const id = await service.addUser('p1', 'Ada');

    expect(id).toBe('newId');
    expect(localStorage.setItem).toHaveBeenCalledWith('user', 'Ada');
    expect(planningDoc.collection).toHaveBeenCalledWith('developer');
    expect(developerCollection.add).toHaveBeenCalledWith({name: 'Ada', storyPoints: null});
  });

  it('updates the story points of a developer', async () => {
    await service.updateStoryPoints('p1', 'u1', StoryPoints.s5);

    expect(developerCollection.doc).toHaveBeenCalledWith('u1');
    expect(developerDoc.update).toHaveBeenCalledWith({storyPoints: StoryPoints.s5});
  });

  it('sets the estimate result', async () => {
    await service.setEstimateResult('p1', true, StoryPoints.s3);

    expect(planningDoc.update).toHaveBeenCalledWith({
      estimateRequested: false,
      estimateSucceeded: true,
      storyPoints: StoryPoints.s3,
    });
  });

  it('resets the estimate and clears the story points of all developers', async () => {
    developerCollection.valueChanges.and.returnValue(of([{id: 'u1', name: 'Ada', storyPoints: StoryPoints.s5}]));

    await service.resetEstimate('p1', 3);

    expect(developerDoc.update).toHaveBeenCalledWith({storyPoints: null});
    expect(planningDoc.update).toHaveBeenCalledWith({
      estimateRequested: true,
      estimateSucceeded: false,
      storyPoints: 0,
      count: 3,
    });
  });

  it('exposes the developers of a planning', done => {
    developerCollection.valueChanges.and.returnValue(of([{id: 'u1', name: 'Ada', storyPoints: null}]));

    service.getDevelopers('p1').subscribe(developers => {
      expect(afs.doc).toHaveBeenCalledWith('planning/p1');
      expect(planningDoc.collection).toHaveBeenCalledWith('developer');
      expect(developers).toEqual([{id: 'u1', name: 'Ada', storyPoints: null}]);
      done();
    });
  });

  it('exposes a single developer of a planning', done => {
    developerDoc.valueChanges.and.returnValue(of({name: 'Ada', storyPoints: StoryPoints.s5}));

    service.getDeveloper('p1', 'u1').subscribe(developer => {
      expect(developerCollection.doc).toHaveBeenCalledWith('u1');
      expect(developer).toEqual({name: 'Ada', storyPoints: StoryPoints.s5});
      done();
    });
  });

  it('deletes a developer from a planning', async () => {
    await service.deleteUser('p1', 'u1');

    expect(planningCollection.doc).toHaveBeenCalledWith('p1');
    expect(planningDoc.collection).toHaveBeenCalledWith('developer');
    expect(developerCollection.doc).toHaveBeenCalledWith('u1');
    expect(developerDoc.delete).toHaveBeenCalled();
  });

  it('deletes a planning together with all of its developers', async () => {
    developerCollection.valueChanges.and.returnValue(of([{id: 'u1', name: 'Ada', storyPoints: null}]));

    await service.deletePlanning('p1');

    expect(developerDoc.delete).toHaveBeenCalled();
    expect(planningDoc.delete).toHaveBeenCalled();
  });

});

describe('renderStoryPoint', () => {
  it('renders half a story point', () => {
    expect(renderStoryPoint(StoryPoints.sHalf)).toBe('1/2');
  });

  it('renders one story point', () => {
    expect(renderStoryPoint(StoryPoints.s1)).toBe('1');
  });

  it('renders five story points', () => {
    expect(renderStoryPoint(StoryPoints.s5)).toBe('5');
  });

  it('renders an unsure estimate', () => {
    expect(renderStoryPoint(StoryPoints.unsure)).toBe('?');
  });

  it('renders a coffee break', () => {
    expect(renderStoryPoint(StoryPoints.coffee)).toBe('☕️');
  });

  it('returns null for an unknown value', () => {
    expect(renderStoryPoint(999)).toBeNull();
  });
});

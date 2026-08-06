import {TestBed} from '@angular/core/testing';
import {AngularFirestore} from '@angular/fire/compat/firestore';
import {of} from 'rxjs';

import {ProjectService} from './project.service';
import {LoginService} from '../../login/login.service';

describe('ProjectService', () => {
  let service: ProjectService;
  let afs: any;
  let afsDoc: any;
  let projectCollection: any;
  let projectDoc: any;
  let loginService: any;

  beforeEach(() => {
    projectDoc = jasmine.createSpyObj('projectDoc', ['delete']);
    projectDoc.delete.and.resolveTo();

    projectCollection = jasmine.createSpyObj('projectCollection', ['valueChanges', 'add', 'doc']);
    projectCollection.valueChanges.and.returnValue(of([]));
    projectCollection.add.and.resolveTo({id: 'newId'});
    projectCollection.doc.and.returnValue(projectDoc);

    afsDoc = jasmine.createSpyObj('afsDoc', ['valueChanges', 'update']);
    afsDoc.valueChanges.and.returnValue(of(undefined));
    afsDoc.update.and.resolveTo();

    afs = jasmine.createSpyObj('AngularFirestore', ['collection', 'doc']);
    afs.collection.and.returnValue(projectCollection);
    afs.doc.and.returnValue(afsDoc);

    loginService = {currentUserId$: () => of('u1')};

    TestBed.configureTestingModule({
      providers: [
        ProjectService,
        {provide: AngularFirestore, useValue: afs},
        {provide: LoginService, useValue: loginService},
      ],
    });
    service = TestBed.inject(ProjectService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
    expect(afs.collection).toHaveBeenCalledWith('project', jasmine.any(Function));
  });

  it('exposes the projects owned by the current user', done => {
    projectCollection.valueChanges.and.returnValue(of([{id: 'p1', name: 'Owner Project'}]));

    service.getProjectsOwner().subscribe(projects => {
      expect(afs.collection).toHaveBeenCalledWith('project', jasmine.any(Function));
      expect(projects).toEqual([{id: 'p1', name: 'Owner Project'}] as any);
      done();
    });
  });

  it('exposes the projects the current user can read', done => {
    projectCollection.valueChanges.and.returnValue(of([{id: 'p2', name: 'Reader Project'}]));

    service.getProjectsReader().subscribe(projects => {
      expect(projects).toEqual([{id: 'p2', name: 'Reader Project'}] as any);
      done();
    });
  });

  it('exposes the projects the current user can write', done => {
    projectCollection.valueChanges.and.returnValue(of([{id: 'p3', name: 'Writer Project'}]));

    service.getProjectsWriter().subscribe(projects => {
      expect(projects).toEqual([{id: 'p3', name: 'Writer Project'}] as any);
      done();
    });
  });

  it('gets a single project by id', done => {
    afsDoc.valueChanges.and.returnValue(of({id: 'p1', name: 'Test Project'}));

    service.getProject('p1').subscribe(project => {
      expect(afs.doc).toHaveBeenCalledWith('project/p1');
      expect(project).toEqual({id: 'p1', name: 'Test Project'} as any);
      done();
    });
  });

  it('adds a new project owned by the given user', async () => {
    const newId = await service.addNewProject('u1');

    expect(projectCollection.add).toHaveBeenCalledWith({
      name: 'neues Projekt',
      owner: 'u1',
      sprints: [],
      initialVelocity: 1,
      coReaders: [],
      coWriters: [],
    });
    expect(newId).toEqual('newId');
  });

  it('deletes a project by id', async () => {
    await service.deleteProject('p1');

    expect(projectCollection.doc).toHaveBeenCalledWith('p1');
    expect(projectDoc.delete).toHaveBeenCalled();
  });

  it('updates a project by id', async () => {
    await service.updateProject('p1', {name: 'Updated'});

    expect(afs.doc).toHaveBeenCalledWith('project/p1');
    expect(afsDoc.update).toHaveBeenCalledWith({name: 'Updated'});
  });

});

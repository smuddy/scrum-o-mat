import {TestBed} from '@angular/core/testing';
import {AngularFirestore} from '@angular/fire/compat/firestore';
import {of} from 'rxjs';

import {AdminService} from './admin.service';

describe('AdminService', () => {
  let service: AdminService;
  let afs: any;
  let planningCollection: any;
  let planningDoc: any;
  let developerCollection: any;
  let developerDoc: any;

  beforeEach(() => {
    developerDoc = jasmine.createSpyObj('developerDoc', ['delete']);
    developerDoc.delete.and.resolveTo();

    developerCollection = jasmine.createSpyObj('developerCollection', ['doc', 'valueChanges']);
    developerCollection.doc.and.returnValue(developerDoc);
    developerCollection.valueChanges.and.returnValue(of([]));

    planningDoc = jasmine.createSpyObj('planningDoc', ['delete', 'collection']);
    planningDoc.delete.and.resolveTo();
    planningDoc.collection.and.returnValue(developerCollection);

    planningCollection = jasmine.createSpyObj('planningCollection', ['doc', 'valueChanges']);
    planningCollection.doc.and.returnValue(planningDoc);
    planningCollection.valueChanges.and.returnValue(of([]));

    afs = jasmine.createSpyObj('AngularFirestore', ['collection', 'doc']);
    afs.collection.and.returnValue(planningCollection);
    afs.doc.and.returnValue(planningDoc);

    TestBed.configureTestingModule({
      providers: [
        AdminService,
        {provide: AngularFirestore, useValue: afs},
      ],
    });
    service = TestBed.inject(AdminService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
    expect(afs.collection).toHaveBeenCalledWith('planning');
  });

  it('deletes a planning by id', async () => {
    await service.deletePlanning('p1');

    expect(planningCollection.doc).toHaveBeenCalledWith('p1');
    expect(planningDoc.delete).toHaveBeenCalled();
  });

  it('deletes a developer within a planning', async () => {
    await service.deleteUser('p1', 'u1');

    expect(planningCollection.doc).toHaveBeenCalledWith('p1');
    expect(planningDoc.collection).toHaveBeenCalledWith('developer');
    expect(developerCollection.doc).toHaveBeenCalledWith('u1');
    expect(developerDoc.delete).toHaveBeenCalled();
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

});

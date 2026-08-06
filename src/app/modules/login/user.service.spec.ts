import {TestBed} from '@angular/core/testing';
import {AngularFirestore} from '@angular/fire/compat/firestore';
import {of} from 'rxjs';

import {UserService} from './user.service';
import {LoginService} from './login.service';

describe('UserService', () => {
  let service: UserService;
  let afs: any;
  let userDoc: any;
  let loginService: any;

  beforeEach(() => {
    userDoc = jasmine.createSpyObj('userDoc', ['valueChanges', 'set', 'update']);
    userDoc.valueChanges.and.returnValue(of({name: 'x'}));
    userDoc.set.and.resolveTo();
    userDoc.update.and.resolveTo();

    afs = jasmine.createSpyObj('AngularFirestore', ['doc']);
    afs.doc.and.returnValue(userDoc);

    loginService = {authStateAllowAnonymous$: of({uid: 'u1'})};

    TestBed.configureTestingModule({
      providers: [
        UserService,
        {provide: AngularFirestore, useValue: afs},
        {provide: LoginService, useValue: loginService},
      ],
    });
    service = TestBed.inject(UserService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('exposes the current user via user$', done => {
    service.user$.subscribe(user => {
      expect(afs.doc).toHaveBeenCalledWith('user/u1');
      expect(userDoc.valueChanges).toHaveBeenCalled();
      expect(user).toEqual({name: 'x'} as any);
      done();
    });
  });

  it('creates a new user document when none exists yet', done => {
    userDoc.valueChanges.and.returnValues(of(null), of({name: null}));

    service.user$.subscribe(user => {
      expect(afs.doc).toHaveBeenCalledWith('user/u1');
      expect(userDoc.set).toHaveBeenCalledWith({name: null});
      expect(user).toEqual({name: null} as any);
      done();
    });
  });

  it('sets the name of the current user', async () => {
    await service.setUserNameAsync('Ada');

    expect(afs.doc).toHaveBeenCalledWith('user/u1');
    expect(userDoc.update).toHaveBeenCalledWith({name: 'Ada'});
  });

});

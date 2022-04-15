import {Injectable} from '@angular/core';
import {AngularFirestore} from '@angular/fire/compat/firestore';
import {LoginService} from './login.service';
import {mergeMap} from 'rxjs/operators';
import {User, UserId} from '../planning/models/user';
import {firstValueFrom, from, of} from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class UserService {

  public user$ = this.loginService.authStateAllowAnonymous$.pipe(
    // mergeMap(user => this.afs.collection<UserId>('user/', ref => ref.where('userId', '==', user.uid)).valueChanges({idField: 'id'}).pipe(
    //   map(users => users.length > 0 ? users[0] : null),
    //   mergeMap(foundUser => {
    //     if (foundUser !== null) return of(foundUser);
    //     return from(this.afs.collection<User>('user/',).add({userId: user.uid, name: null})).pipe(
    //       mergeMap(() => this.afs.collection<UserId>('user/', ref => ref.where('userId', '==', user.uid)).valueChanges({idField: 'id'}))
    //     );
    //   })
    // )),
    mergeMap(user => this.afs.doc<UserId>('user/' + user.uid).valueChanges().pipe(
        mergeMap(dbUser => {
            return dbUser
              ? of(dbUser)
              : from(this.afs.doc<User>('user/' + user.uid).set({name: null})).pipe(
                mergeMap(() => this.afs.doc<UserId>('user/' + user.uid).valueChanges())
              );
          }
        )
      ),
    )
  );

  constructor(
    private afs: AngularFirestore,
    private loginService: LoginService,
  ) {
  }

  public async setUserNameAsync(name: string) {
    const user = await firstValueFrom(this.loginService.authStateAllowAnonymous$);
    await this.afs.doc<UserId>('user/' + user.uid).update({name});
  }

}

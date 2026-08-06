import {inject, Injectable, Injector, runInInjectionContext} from '@angular/core';
import {doc, docData, Firestore, setDoc} from '@angular/fire/firestore';
import {toSignal} from '@angular/core/rxjs-interop';
import {LoginService} from './login.service';
import {mergeMap} from 'rxjs/operators';
import {User, UserId} from '../planning/models/user';
import {firstValueFrom, from, Observable, of} from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class UserService {

  private afs = inject(Firestore);
  private injector = inject(Injector);
  private loginService = inject(LoginService);

  // AngularFire-Aufrufe muessen im Injection-Kontext laufen (sonst Warnung + instabile CD/Hydration).
  private inCtx<T>(op: () => T): T {
    return runInInjectionContext(this.injector, op);
  }

  public user$: Observable<UserId> = this.loginService.authStateAllowAnonymous$.pipe(
    mergeMap(user => (this.inCtx(() => docData(doc(this.afs, 'user/' + user.uid))) as Observable<UserId>).pipe(
        mergeMap(dbUser => {
            return dbUser
              ? of(dbUser)
              : from(this.inCtx(() => setDoc(doc(this.afs, 'user/' + user.uid), {name: null} as User))).pipe(
                mergeMap(() => this.inCtx(() => docData(doc(this.afs, 'user/' + user.uid))) as Observable<UserId>)
              );
          }
        )
      ),
    )
  );

  // Signal-Variante additiv (Rückwärtskompatibilität: user$ bleibt bestehen)
  public userSignal = toSignal(this.user$, {initialValue: null as UserId | null});

  public async setUserNameAsync(name: string) {
    const user = await firstValueFrom(this.loginService.authStateAllowAnonymous$);
    await this.inCtx(() => setDoc(doc(this.afs, 'user/' + user.uid), {name}, {merge: true}));
  }

}

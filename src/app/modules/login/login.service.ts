import {Injectable} from '@angular/core';
import {AngularFireAuth} from '@angular/fire/compat/auth';
import {Router} from '@angular/router';
import {map, mergeMap} from 'rxjs/operators';
import {from, of} from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class LoginService {

  public static userIdRegex = /[a-zA-Z0-9-_;]*/gm;

  constructor(
    private afAuth: AngularFireAuth,
    private router: Router
  ) {
  }

  public authState$ = () => this.afAuth.authState;

  public authStateAllowAnonymous$ = () => this.afAuth.authState.pipe(
    mergeMap( _ => {
      if (_) return of(_);

      localStorage.getItem('annonymUser')

      return from(this.afAuth.signInAnonymously()).pipe(map(x=>x.user))
    })
  )

  public currentUserId$ = () => this.authState$().pipe(map(_ => _?.uid));

  public async login(email: string, pass: string): Promise<string | null> {
    try {
      await this.afAuth.signInWithEmailAndPassword(email, pass);
      await this.router.navigateByUrl('/');
      return null;
    } catch (e) {
      return LoginService.errorMessage(e);
    }
  }

  public async register(email: string, pass: string): Promise<string | null> {
    try {
      await this.afAuth.createUserWithEmailAndPassword(email, pass);
      await this.router.navigateByUrl('/');
      return null;
    } catch (e) {
      return LoginService.errorMessage(e);
    }
  }

  public async logout() {
    await this.afAuth.signOut();
  }

  private static errorMessage(e) {
    switch (e.code) {
      case 'auth/user-not-found':
      case 'auth/wrong-password':
        return 'E-Mail Adresse oder Passwort ist falsch!';
      case 'auth/email-already-in-use':
        return 'E-Mail Adresse ist bereits registriert!';
    }
  }
}

import {inject, Injectable, Injector, runInInjectionContext} from '@angular/core';
import {Auth, authState, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut} from '@angular/fire/auth';
import {Router} from '@angular/router';
import {map} from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class LoginService {

  public static userIdRegex = /^[a-zA-Z0-9-_;]+$/;

  private auth = inject(Auth);
  private injector = inject(Injector);
  private router = inject(Router);

  // AngularFire-Aufrufe muessen im Injection-Kontext laufen (sonst Warnung + instabile CD/Hydration).
  private inCtx<T>(op: () => T): T {
    return runInInjectionContext(this.injector, op);
  }

  public authState$ = () => this.inCtx(() => authState(this.auth));

  public authStateAllowAnonymous$ = this.inCtx(() => authState(this.auth)).pipe(
    map(_ => {
      if (_) return (_);

      const userId = localStorage.getItem('annonymUser');
      if (userId) return ({uid: userId});

      const newUserId = crypto.randomUUID();
      localStorage.setItem('annonymUser', newUserId);
      return ({uid: newUserId});
    })
  );

  public currentUserId$ = () => this.authState$().pipe(map(_ => _?.uid));

  public async login(email: string, pass: string): Promise<string | null> {
    try {
      await this.inCtx(() => signInWithEmailAndPassword(this.auth, email, pass));
      await this.router.navigateByUrl('/');
      return null;
    } catch (e) {
      return LoginService.errorMessage(e);
    }
  }

  public async register(email: string, pass: string): Promise<string | null> {
    try {
      await this.inCtx(() => createUserWithEmailAndPassword(this.auth, email, pass));
      await this.router.navigateByUrl('/');
      return null;
    } catch (e) {
      return LoginService.errorMessage(e);
    }
  }

  public async logout() {
    await this.inCtx(() => signOut(this.auth));
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

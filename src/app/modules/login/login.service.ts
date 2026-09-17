import {inject, Injectable, Injector, runInInjectionContext} from '@angular/core';
import {Auth, authState, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut} from '@angular/fire/auth';
import {doc, Firestore, setDoc} from '@angular/fire/firestore';
import {Router} from '@angular/router';
import {map} from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class LoginService {

  public static userIdRegex = /^[a-zA-Z0-9-_;]+$/;

  private auth = inject(Auth);
  private afs = inject(Firestore);
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
      const cred = await this.inCtx(() => signInWithEmailAndPassword(this.auth, email, pass));
      await this.inCtx(() => setDoc(doc(this.afs, 'user/' + cred.user.uid), {email}, {merge: true}));
      await this.navigateAfterAuth();
      return null;
    } catch (e) {
      return LoginService.errorMessage(e);
    }
  }

  public async register(email: string, pass: string): Promise<string | null> {
    try {
      const cred = await this.inCtx(() => createUserWithEmailAndPassword(this.auth, email, pass));
      await this.inCtx(() => setDoc(doc(this.afs, 'user/' + cred.user.uid), {email}, {merge: true}));
      await this.navigateAfterAuth();
      return null;
    } catch (e) {
      return LoginService.errorMessage(e);
    }
  }

  // Vertreter-Feature (Ticket 02): eine anonym besuchte Einloese-Seite (/retrospective/join/:code)
  // legt vor dem Redirect zu /login die eigene URL unter diesem Schluessel ab, damit nach
  // erfolgreichem Anmelden/Registrieren dorthin zurueckgesprungen wird statt hart auf '/'.
  private async navigateAfterAuth(): Promise<void> {
    const returnUrl = localStorage.getItem('retroReturnUrl');
    if (returnUrl) {
      localStorage.removeItem('retroReturnUrl');
      await this.router.navigateByUrl(returnUrl);
      return;
    }
    await this.router.navigateByUrl('/');
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

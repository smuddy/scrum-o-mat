import {Injectable} from '@angular/core';
import {AngularFireAuth} from '@angular/fire/auth';
import {Router} from '@angular/router';

@Injectable({
  providedIn: 'root'
})
export class LoginService {

  constructor(
    private afAuth: AngularFireAuth,
    private router: Router
  ) {
  }

  public authState = () => this.afAuth.authState;

  public async login(email: string, pass: string): Promise<string | null> {
    try {
      await this.afAuth.signInWithEmailAndPassword(email, pass);
      await this.router.navigateByUrl('/');
      return null;
    } catch (e) {
      return this.errorMessage(e);
    }
  }

  public async register(email: string, pass: string): Promise<string | null> {
    try {
      await this.afAuth.createUserWithEmailAndPassword(email, pass);
      await this.router.navigateByUrl('/');
      return null;
    } catch (e) {
      return this.errorMessage(e);
    }
  }

  public async logout() {
    await this.afAuth.signOut();
  }

  private errorMessage(e) {
    switch (e.code) {
      case 'auth/user-not-found':
      case 'auth/wrong-password':
        return 'E-Mail Adresse oder Passwort ist falsch!';
      case 'auth/email-already-in-use':
        return 'E-Mail Adresse ist bereits registriert!';
    }
  }
}

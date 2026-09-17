import {Component, inject, OnInit} from '@angular/core';
import {CommonModule} from '@angular/common';
import {ActivatedRoute, Router, RouterLink} from '@angular/router';
import {firstValueFrom} from 'rxjs';

import {RetroService} from '../../retro.service';
import {LoginService} from '../../../login/login.service';
import {HeaderService} from '../../../../shared/header/header.service';
import {fadeTranslateInstant} from '../../../../animation';
import {ButtonComponent} from '../../../../shared/ui/button.component';

// Vertreter-Feature (Ticket 02): Einloese-Seite fuer einen einmaligen Freigabe-Code
// (/retrospective/join/:code). Bewusst OHNE AuthGuard (siehe app.routes.ts) -- anonyme Besucher
// muessen die Seite erreichen, um den Login-/Registrier-Hinweis zu sehen. Die eigentliche
// Gueltigkeits-/Einmaligkeits-Pruefung liegt in der Firestore-Transaktion redeemInvite() (Ticket 01);
// die Vorschau hier liest nur lesend vor, um Gruppennamen + Fehlerzustaende anzuzeigen.
type JoinState = 'loading' | 'invalid' | 'expired' | 'ready' | 'joining' | 'success';

@Component({
  selector: 'app-retro-group-join',
  standalone: true,
  imports: [CommonModule, RouterLink, ButtonComponent],
  templateUrl: './group-join.component.html',
  styleUrls: ['./group-join.component.less'],
  animations: [fadeTranslateInstant],
})
export class GroupJoinComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private retroService = inject(RetroService);
  private loginService = inject(LoginService);
  private headerService = inject(HeaderService);

  public code = this.route.snapshot.paramMap.get('code') ?? '';

  public state: JoinState = 'loading';
  public groupName = '';
  // Reale uid (LoginService.currentUserId$) -- anonyme Link-Mitglieder (localStorage-uid) zaehlen
  // hier bewusst NICHT als eingeloggt, siehe Map "Einladung/Identitaet".
  public isLoggedIn = false;
  // Fehlermeldung aus einem gescheiterten redeemInvite()-Versuch (Transaktion war die massgebliche
  // Pruefung, nicht die Vorschau) -- unterscheidet sich ggf. vom initialen Vorschau-Fehler.
  public joinErrorMessage = '';

  public async ngOnInit(): Promise<void> {
    this.headerService.setBreadcrumb([{route: '/retrospective', name: 'Retrospektive'}]);

    const uid = await firstValueFrom(this.loginService.currentUserId$());
    this.isLoggedIn = !!uid;

    await this.loadInvite();
  }

  private async loadInvite(): Promise<void> {
    const invite = await this.retroService.getInvite(this.code);
    if (!invite) {
      this.state = 'invalid';
      return;
    }
    if (GroupJoinComponent.expiresMs(invite.expiresAt) < Date.now()) {
      this.state = 'expired';
      return;
    }
    const group = await firstValueFrom(this.retroService.getGroup$(invite.groupId));
    this.groupName = group?.name ?? '';
    this.state = 'ready';
  }

  // Normalisiert expiresAt (Firestore-Timestamp mit toDate() ODER Date/String) zu Millis -- 1:1 wie
  // die Pruefung in RetroService.redeemInvite(), damit Vorschau und Transaktion konsistent urteilen.
  private static expiresMs(expiresAt: any): number {
    return expiresAt?.toDate ? expiresAt.toDate().getTime() : new Date(expiresAt).getTime();
  }

  // Legt die aktuelle Join-URL fuer den Ruecksprung nach Login/Registrieren ab (siehe
  // LoginService.navigateAfterAuth()) und navigiert zur Login-Seite.
  public async goToLogin(): Promise<void> {
    localStorage.setItem('retroReturnUrl', '/retrospective/join/' + this.code);
    await this.router.navigateByUrl('/login');
  }

  public async join(): Promise<void> {
    const uid = await firstValueFrom(this.loginService.currentUserId$());
    if (!uid) {
      // Defensive Absicherung -- der Button ist fuer nicht eingeloggte Nutzer ausgeblendet
      // (siehe Template), sollte also praktisch nie erreicht werden.
      return;
    }
    this.state = 'joining';
    const result = await this.retroService.redeemInvite(this.code, uid);
    if (result === 'not-found') {
      this.joinErrorMessage = 'Der Code wurde in der Zwischenzeit bereits eingeloest oder widerrufen.';
      this.state = 'invalid';
      return;
    }
    if (result === 'expired') {
      this.joinErrorMessage = 'Der Code ist mittlerweile abgelaufen.';
      this.state = 'expired';
      return;
    }
    this.state = 'success';
    // Kurze Erfolgsbestaetigung, bevor auf die Gruppen-Seite weitergeleitet wird.
    setTimeout(() => void this.router.navigateByUrl('/retrospective/group/' + result.groupId), 1200);
  }
}

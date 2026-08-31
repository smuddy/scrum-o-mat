import {Component, inject, OnInit} from '@angular/core';
import {CommonModule} from '@angular/common';
import {FormsModule} from '@angular/forms';
import {ActivatedRoute, Router} from '@angular/router';
import {fade, fadeTranslate, fadeTranslateInstant} from '../../../animation';
import {PlanningService} from '../planning.service';
import {HeaderService} from '../../../shared/header/header.service';
import {UserService} from '../../login/user.service';
import {firstValueFrom} from 'rxjs';
import {MySessionsComponent} from './my-sessions/my-sessions.component';
import {ButtonComponent} from '../../../shared/ui/button.component';

@Component({
  selector: 'app-init',
  standalone: true,
  imports: [CommonModule, FormsModule, MySessionsComponent, ButtonComponent],
  templateUrl: './init.component.html',
  styleUrls: ['./init.component.less'],
  animations: [fadeTranslateInstant, fade, fadeTranslate]
})
export class InitComponent implements OnInit {
  public planningId: string;
  public username: string;

  public subject: string;
  public showMySessions = false;

  private planningService = inject(PlanningService);
  private router = inject(Router);
  private activatedRoute = inject(ActivatedRoute);
  private headerService = inject(HeaderService);
  private userService = inject(UserService);

  public myPlannings$ = this.planningService.listMyPlannings$;
  public user$ = this.userService.user$;

  ngOnInit() {
    this.headerService.setBreadcrumb([{route: '/planning', name: 'Scrum Poker'}]);
    this.headerService.setFullscreen(false);
    this.activatedRoute.queryParams.subscribe(_ => this.paramsChanged(_));
    firstValueFrom(this.user$).then(_ => this.username = _.name);
  }

  public async goMaster() {
    if (this.subject) {
      this.planningId = await this.planningService.createNewSession(this.subject);
      await this.router.navigateByUrl('/planning/' + this.planningId + '/master');
    }
  }

  public async goDeveloper() {
    if (this.planningService && this.username) {
      await this.userService.setUserNameAsync(this.username);
      const userId = await this.planningService.addUser(this.planningId, this.username);

      if (userId) {
        localStorage.setItem('last-session', userId);
        await this.router.navigateByUrl('/planning/' + this.planningId + '/' + userId);
      }

    }
  }

  public hasLastSession(): boolean {
    return !!localStorage.getItem('last-session');
  }

  public async goDeveloperLastSession(): Promise<void> {
    const userId = localStorage.getItem('last-session');
    await this.router.navigateByUrl('/planning/' + this.planningId + '/' + userId);
  }

  public async goGuest(): Promise<void> {
    await this.router.navigateByUrl('/planning/' + this.planningId + '/guest');
  }

  // Navigation als (click) statt routerLink am <app-button>: der routerLink saesse sonst auf dem
  // Wrapper-Host, waehrend der fokussierbare Button das gekapselte innere <button> ist -> zwei Ziele.
  public goScan(): void {
    void this.router.navigate(['scan'], {relativeTo: this.activatedRoute});
  }

  private paramsChanged(params) {
    this.planningId = params.session;
  }

}

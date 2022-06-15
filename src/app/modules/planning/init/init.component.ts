import {Component, OnInit} from '@angular/core';
import {ActivatedRoute, Router} from '@angular/router';
import {fade, fadeTranslate, fadeTranslateInstant} from '../../../animation';
import {PlanningService} from '../planning.service';
import {HeaderService} from '../../../shared/header/header.service';
import {UserService} from '../../login/user.service';
import {firstValueFrom} from 'rxjs';

@Component({
  selector: 'app-init',
  templateUrl: './init.component.html',
  styleUrls: ['./init.component.less'],
  animations: [fadeTranslateInstant, fade, fadeTranslate]
})
export class InitComponent implements OnInit {
  public planningId: string;
  public username: string;

  public subject: string;
  public showMySessions = false;
  public myPlannings$ = this.planningService.listMyPlannings$;
  public user$ = this.userService.user$;

  constructor(
    private planningService: PlanningService,
    private router: Router,
    private activatedRoute: ActivatedRoute, private headerService: HeaderService,
    private userService: UserService,
  ) {
  }

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

  private paramsChanged(params) {
    this.planningId = params.session;
  }

}

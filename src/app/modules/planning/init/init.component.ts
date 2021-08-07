import {Component, OnInit} from '@angular/core';
import {ActivatedRoute, Router} from '@angular/router';
import {fadeTranslateInstant} from '../../../animation';
import {PlanningService} from '../planning.service';
import {Planning} from '../models/planning';
import {HeaderService} from '../../../shared/header/header.service';

@Component({
  selector: 'app-init',
  templateUrl: './init.component.html',
  styleUrls: ['./init.component.less'],
  animations: [fadeTranslateInstant]
})
export class InitComponent implements OnInit {
  public planningId: string;
  public user: string;
  public subject: string;


  constructor(
    private planningService: PlanningService,
    private router: Router,
    private activatedRoute: ActivatedRoute,    private headerService: HeaderService,

  ) {
  }

  ngOnInit() {
    this.headerService.setBreadcrumb([{route: '/planning', name: 'Scrum Poker'}]);
    this.headerService.setFullscreen(false);
    this.activatedRoute.queryParams.subscribe(_ => this.paramsChanged(_));
    this.user = localStorage.getItem('user');
  }

  public async goMaster() {
    if (this.subject) {
      this.planningId = await this.planningService.createNewSession(this.subject);
      await this.router.navigateByUrl('/planning/' + this.planningId + '/master');
    }
  }

  public async goDeveloper() {
    if (this.planningService && this.user) {
      const userId = await this.planningService.addUser(this.planningId, this.user);
      localStorage.setItem('user', this.user);

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
    this.planningService.getPlanning(params.session).subscribe(_ => this.planningChanged(_));
  }

  private planningChanged(_: Planning) {
    if (!_) {
      this.router.navigateByUrl('/');
    }
  }
}

import {Component, OnInit} from '@angular/core';
import {PlanningService} from '../services/planning.service';
import {ActivatedRoute, Router} from '@angular/router';
import {Planning} from '../models/planning';
import {fade} from '../animation';

@Component({
  selector: 'app-init',
  templateUrl: './init.component.html',
  styleUrls: ['./init.component.less'],
  animations: [fade]
})
export class InitComponent implements OnInit {
  public planningId: string;
  public user: string;
  public subject: string;


  constructor(
    private planningService: PlanningService,
    private router: Router,
    private activatedRoute: ActivatedRoute
  ) {
  }

  ngOnInit() {
    this.activatedRoute.queryParams.subscribe(_ => this.paramsChanged(_));
    this.user = localStorage.getItem('user');
  }

  public async goMaster() {
    if (this.subject) {
      this.planningId = await this.planningService.createNewSession(this.subject);
      await this.router.navigateByUrl('/' + this.planningId + '/master');
    }
  }

  public async goDeveloper() {
    if (this.planningService && this.user) {
      const userId = await this.planningService.addUser(this.planningId, this.user);
      localStorage.setItem('user',this.user);

      if (userId) {
        localStorage.setItem('last-session', userId);
        await this.router.navigateByUrl('/' + this.planningId + '/' + userId);
      }

    }
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

  public hasLastSession(): boolean {
    return !!localStorage.getItem('last-session');
  }

  public async goDeveloperLastSession(): Promise<void> {
    const userId = localStorage.getItem('last-session');
    await this.router.navigateByUrl('/' + this.planningId + '/' + userId );
  }
}

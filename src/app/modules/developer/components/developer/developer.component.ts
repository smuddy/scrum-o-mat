import {Component, OnInit} from '@angular/core';
import {ActivatedRoute, Router} from '@angular/router';
import {PlanningService, renderStorypoint} from '../../../../services/planning.service';
import {Storypoints} from '../../../../models/storypoints';
import {fade} from '../../../../animation';
import {faTimes} from '@fortawesome/free-solid-svg-icons';

declare var fireworks;

@Component({
  selector: 'app-developer',
  templateUrl: './developer.component.html',
  styleUrls: ['./developer.component.less'],
  animations: [fade]
})
export class DeveloperComponent implements OnInit {
  public issue: string;
  public subject: string;
  public estimateRequested: boolean;
  public estimateSucceeded: boolean;
  public storypoints: Storypoints;
  public faTimes = faTimes;
  private planningId: string;
  private userId: string;

  constructor(activatedRoute: ActivatedRoute, private planningService: PlanningService, private router: Router) {
    activatedRoute.params.subscribe(_ => {
      this.planningId = _.planningId;
      this.userId = _.userId;
    });
  }

  ngOnInit() {
    window.scrollTo(0, 0);
    this.planningService.getPlanning(this.planningId).subscribe(planning => {
      if (!planning) {
        this.router.navigateByUrl(this.router.createUrlTree(['/'], {queryParams: {session: this.planningId}}));
      } else {
        this.issue = planning.issue;
        this.subject = planning.subject;
        this.estimateRequested = planning.estimateRequested;
        this.estimateSucceeded = planning.estimateSucceeded;
        this.storypoints = planning.storypoints;

        fireworks._particlesPerExplosion = planning.estimateSucceeded ? 40 : 0;
      }
    });
    this.planningService.getDeveloper(this.planningId, this.userId).subscribe(_ => {
      if (!_) {
        this.router.navigateByUrl(this.router.createUrlTree(['/'], {queryParams: {session: this.planningId}}));
      }
    });
  }

  public async onCardSelected(storypoints: Storypoints) {
    await this.planningService.updateStorypoints(this.planningId, this.userId, storypoints);
  }

  public renderStorypoint = () => renderStorypoint(this.storypoints);

  public async logout() {
    localStorage.removeItem('last-session');
    await this.planningService.deleteUser(this.planningId, this.userId);
    await this.router.navigateByUrl(this.router.createUrlTree(['/'], {queryParams: {session: this.planningId}}));
  }
}

import {Storypoints} from '../../../../models/storypoints';
import {DeveloperId} from '../../../../models/delevoper';
import {Component, Input, OnInit} from '@angular/core';
import {ActivatedRoute, Router} from '@angular/router';
import {PlanningService, renderStorypoint} from '../../../../services/planning.service';
import {fade, listAnimation} from '../../../../animation';
import {faTimes} from '@fortawesome/free-solid-svg-icons';
import {AdminService} from 'src/app/modules/admin/components/admin.service';

declare var fireworks;

@Component({
  selector: 'app-developer',
  templateUrl: './developer.component.html',
  styleUrls: ['./developer.component.less'],
  animations: [fade, listAnimation]
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
  public maxPoints = 1;
  @Input() public developers: DeveloperId[];
  public selectedStorypoints: { storypoint: Storypoints, count: number }[] = [];

  constructor(activatedRoute: ActivatedRoute, private planningService: PlanningService, private router: Router,
              private adminService: AdminService) {
    activatedRoute.params.subscribe(_ => {
      this.planningId = _.planningId;
      this.userId = _.userId;
    });
  }

  ngOnInit() {
    window.scrollTo(0, 0);

    this.adminService.getDevelopers(this.planningId).subscribe(_ => {
      this.developers = _;

      if (!this.developers.find(x => x.storypoints === null)) {
        this.maxPoints = 1;

        this.selectedStorypoints = [];
        this.developers.forEach(developer => {
          const findSelectedStorypoint = this.selectedStorypoints.find(x => x.storypoint === developer.storypoints);
          if (findSelectedStorypoint) {
            findSelectedStorypoint.count++;
            if (findSelectedStorypoint.count > this.maxPoints) {
              this.maxPoints = findSelectedStorypoint.count;
            }
          } else {
            this.selectedStorypoints.push({storypoint: developer.storypoints, count: 1});
          }

        });

      }
    });

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

  renderStorypoints(storypoints: Storypoints): string {
    return renderStorypoint(storypoints);
  }


  public async logout() {
    localStorage.removeItem('last-session');
    await this.planningService.deleteUser(this.planningId, this.userId);
    await this.router.navigateByUrl(this.router.createUrlTree(['/'], {queryParams: {session: this.planningId}}));
  }

  public getWidthPercentage = (count: number) => Math.floor(60 / this.maxPoints * count);

}

import {Component, Input, OnInit} from '@angular/core';
import {fade, listAnimation} from '../../../animation';
import {ActivatedRoute, Router} from '@angular/router';
import {AdminService} from '../admin/components/admin.service';
import {faTimes} from '@fortawesome/free-solid-svg-icons/faTimes';
import {PlanningService, renderStoryPoint} from '../planning.service';
import {StoryPoints} from '../models/storyPoints';
import {DeveloperId} from '../models/delevoper';

declare var fireworks;

@Component({
  selector: 'app-developer',
  templateUrl: './guest.component.html',
  styleUrls: ['./guest.component.less'],
  animations: [fade, listAnimation]
})
export class GuestComponent implements OnInit {
  public issue: string;
  public subject: string;
  public estimateRequested: boolean;
  public estimateSucceeded: boolean;
  public storyPoints: StoryPoints;
  public faTimes = faTimes;
  public maxPoints = 1;
  @Input() public developers: DeveloperId[];
  public selectedStoryPoints: { storyPoint: StoryPoints, count: number }[] = [];
  private planningId: string;
  public chosenPercent: number;

  constructor(
    activatedRoute: ActivatedRoute,
    private planningService: PlanningService,
    private router: Router,
    private adminService: AdminService,
  ) {
    activatedRoute.params.subscribe(_ => {
      this.planningId = _.planningId;
    });
  }

  public ngOnInit() {
    window.scrollTo(0, 0);

    this.adminService.getDevelopers(this.planningId).subscribe(_ => {
      this.developers = _;
      const developersCount = _.length;
      const chosenCount = _.filter(d => d.storyPoints).length;
      const percent = developersCount > 0 ? chosenCount / developersCount * 100 : this.chosenPercent;
      if (percent !== this.chosenPercent) this.chosenPercent = percent;

      if (!this.developers.find(x => x.storyPoints === null)) {
        this.maxPoints = 1;

        this.selectedStoryPoints = [];
        this.developers.forEach(developer => {
          const findSelectedStoryPoint = this.selectedStoryPoints.find(x => x.storyPoint === developer.storyPoints);
          if (findSelectedStoryPoint) {
            findSelectedStoryPoint.count++;
            if (findSelectedStoryPoint.count > this.maxPoints) {
              this.maxPoints = findSelectedStoryPoint.count;
            }
          } else {
            this.selectedStoryPoints.push({storyPoint: developer.storyPoints, count: 1});
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
        this.storyPoints = planning.storyPoints;
        fireworks._particlesPerExplosion = planning.estimateSucceeded ? 40 : 0;
      }
    });
  }

  public renderStoryPoint = () => renderStoryPoint(this.storyPoints);

  renderStoryPoints(storyPoints: StoryPoints): string {
    return renderStoryPoint(storyPoints);
  }


  public getWidthPercentage = (count: number) => Math.floor(60 / this.maxPoints * count);

}
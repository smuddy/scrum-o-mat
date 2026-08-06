import {Component, inject, Input, OnDestroy, OnInit} from '@angular/core';
import {CommonModule} from '@angular/common';
import {fade, listAnimation} from '../../../animation';
import {ActivatedRoute, Router} from '@angular/router';
import {AdminService} from '../admin/components/admin.service';
import {faTimes} from '@fortawesome/free-solid-svg-icons/faTimes';
import {PlanningService, renderStoryPoint} from '../planning.service';
import {StoryPoints} from '../models/storyPoints';
import {DeveloperId} from '../models/delevoper';
import {HeaderService} from '../../../shared/header/header.service';
import {BubblesComponent} from '../../../shared/bubbles/bubbles.component';
import {ProgressCircleComponent} from './progress-circle.component';
import {FireworksService} from '../../../shared/fireworks/fireworks.service';

@Component({
  selector: 'app-developer',
  standalone: true,
  imports: [CommonModule, BubblesComponent, ProgressCircleComponent],
  templateUrl: './guest.component.html',
  styleUrls: ['./guest.component.less'],
  animations: [fade, listAnimation]
})
export class GuestComponent implements OnInit, OnDestroy {
  public count: number;
  public issue: string;
  public subject: string;
  public estimateRequested: boolean;
  public estimateSucceeded: boolean;
  public coffeeBreak: boolean;
  public storyPoints: StoryPoints;
  public faTimes = faTimes;
  public maxPoints = 1;
  @Input() public developers: DeveloperId[];
  public selectedStoryPoints: { storyPoint: StoryPoints, count: number }[] = [];
  public chosenPercent: number;
  private planningId: string;

  private planningService = inject(PlanningService);
  private router = inject(Router);
  private adminService = inject(AdminService);
  private headerService = inject(HeaderService);
  private fireworksService = inject(FireworksService);

  constructor() {
    const activatedRoute = inject(ActivatedRoute);
    activatedRoute.params.subscribe(_ => {
      this.planningId = _.planningId;
    });
  }

  public ngOnInit() {
    this.headerService.setFullscreen(true);
    this.headerService.setBreadcrumb([{route: '/planning', name: 'Scrum Poker'}]);
    window.scrollTo(0, 0);
    this.fireworksService.start();

    this.adminService.getDevelopers(this.planningId).subscribe(_ => {
      this.developers = _;
      const developersCount = _.length;
      // storyPoints != null statt truthy: StoryPoints.sHalf ist der Enum-Wert 0 (falsy) -
      // wer "1/2" schaetzt, wurde sonst faelschlich als "noch nicht geschaetzt" gezaehlt.
      const chosenCount = _.filter(d => d.storyPoints != null).length;
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

        // Ersetzt den frueheren |orderBy:'storyPoint'-Pipe im Template.
        this.selectedStoryPoints.sort((a, b) => a.storyPoint - b.storyPoint);
      }
    });

    this.planningService.getPlanning(this.planningId).subscribe(planning => {
      if (!planning) {
        this.router.navigateByUrl(this.router.createUrlTree(['/'], {queryParams: {session: this.planningId}}));
      } else {
        this.count = planning.count;
        this.issue = planning.issue;
        this.subject = planning.subject;
        this.estimateRequested = planning.estimateRequested;
        this.estimateSucceeded = planning.estimateSucceeded;
        this.coffeeBreak = planning.estimateSucceeded && planning.storyPoints === StoryPoints.coffee;
        this.storyPoints = planning.storyPoints;
        const particlesPerExplosion = planning.estimateSucceeded && planning.storyPoints !== StoryPoints.coffee ? 50 : 0;
        const interval: [number, number] = [200 * planning.count * planning.count, 1500 * planning.count * planning.count];
        this.fireworksService.configure(particlesPerExplosion, interval);
      }
    });
  }

  public ngOnDestroy(): void {
    this.headerService.setFullscreen(false);
    this.fireworksService.stop();
  }

  public renderStoryPoint = () => renderStoryPoint(this.storyPoints);

  renderStoryPoints(storyPoints: StoryPoints): string {
    return renderStoryPoint(storyPoints);
  }


  public getWidthPercentage = (count: number) => Math.floor(60 / this.maxPoints * count);

}

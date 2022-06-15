import {Component, Input, OnDestroy, OnInit} from '@angular/core';
import {fade, listAnimation} from '../../../../../animation';
import {ActivatedRoute, Router} from '@angular/router';
import {AdminService} from '../../../admin/components/admin.service';
import {faTimes} from '@fortawesome/free-solid-svg-icons/faTimes';
import {PlanningService, renderStoryPoint} from '../../../planning.service';
import {StoryPoints} from '../../../models/storyPoints';
import {DeveloperId} from '../../../models/delevoper';
import {MenuService} from '../../../../../shared/menu/menu.service';
import {HeaderService} from '../../../../../shared/header/header.service';

declare var fireworks;

@Component({
  selector: 'app-developer',
  templateUrl: './developer.component.html',
  styleUrls: ['./developer.component.less'],
  animations: [fade, listAnimation]
})
export class DeveloperComponent implements OnInit, OnDestroy {
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
  private planningId: string;
  private userId: string;

  constructor(
    activatedRoute: ActivatedRoute,
    private planningService: PlanningService,
    private router: Router,
    private adminService: AdminService,
    private menuService: MenuService,
    private headerService: HeaderService,
  ) {
    activatedRoute.params.subscribe(_ => {
      this.planningId = _.planningId;
      this.userId = _.userId;
    });
  }

  public ngOnInit() {
    this.headerService.setBreadcrumb([{route: '/planning', name: 'Scrum Poker'}]);
    this.headerService.setFullscreen(true);

    window.scrollTo(0, 0);

    this.adminService.getDevelopers(this.planningId).subscribe(_ => {
      this.developers = _;

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
        this.count = planning.count;
        this.issue = planning.issue;
        this.subject = planning.subject;
        this.estimateRequested = planning.estimateRequested;
        this.estimateSucceeded = planning.estimateSucceeded;
        this.coffeeBreak = planning.estimateSucceeded && planning.storyPoints === StoryPoints.coffee;
        this.storyPoints = planning.storyPoints;

        fireworks._particlesPerExplosion = planning.estimateSucceeded && planning.storyPoints !== StoryPoints.coffee ? 50 : 0;
        fireworks._interval = [200 * planning.count * planning.count, 1500 * planning.count * planning.count];

      }
    });
    this.planningService.getDeveloper(this.planningId, this.userId).subscribe(_ => {
      if (!_) {
        fireworks._particlesPerExplosion = 0;
        this.router.navigateByUrl(this.router.createUrlTree(['/planning/'], {queryParams: {session: this.planningId}}));
      }
    });

    this.menuService.resetCustomActions();
    this.menuService.addCustomAction('Planung verlassen', () => this.logout());
  }

  public ngOnDestroy(): void {
    this.headerService.setFullscreen(false);
    this.menuService.resetCustomActions();
  }

  public async onCardSelected(storyPoints: StoryPoints) {
    await this.planningService.updateStoryPoints(this.planningId, this.userId, storyPoints);
  }

  public renderStoryPoint = () => renderStoryPoint(this.storyPoints);

  renderStoryPoints(storyPoints: StoryPoints): string {
    return renderStoryPoint(storyPoints);
  }

  public async logout() {
    fireworks._particlesPerExplosion = 0;
    localStorage.removeItem('last-session');
    await this.planningService.deleteUser(this.planningId, this.userId);
    await this.router.navigateByUrl(this.router.createUrlTree(['/planning/'], {queryParams: {session: this.planningId}}));
  }

  public getWidthPercentage = (count: number) => Math.floor(60 / this.maxPoints * count);

}

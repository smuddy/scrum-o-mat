import {Component, OnInit} from '@angular/core';
import {ActivatedRoute, Router} from '@angular/router';
import {Developer} from '../../../../models/delevoper';
import {PlanningService} from '../../../../services/planning.service';
import {Planning} from '../../../../models/planning';
import {Storypoints} from '../../../../models/storypoints';
import {environment} from '../../../../../environments/environment';
import {fadeTranslate} from '../../../../animation';
import {faClipboard} from '@fortawesome/free-solid-svg-icons/faClipboard';
import {faQrcode} from '@fortawesome/free-solid-svg-icons/faQrcode';
import {faTimes} from '@fortawesome/free-solid-svg-icons/faTimes';

declare var fireworks;

@Component({
  selector: 'app-scrum-master',
  templateUrl: './scrum-master.component.html',
  styleUrls: ['./scrum-master.component.less'],
  animations: [fadeTranslate]
})
export class ScrumMasterComponent implements OnInit {
  public planningId: string;
  public developers: Developer[];
  public planning: Planning;
  public showQrCode = true;
  public faQrcode = faQrcode;
  public faTimes = faTimes;
  public faClipboard = faClipboard;

  constructor(private activatedRoute: ActivatedRoute, private planningService: PlanningService, private router: Router) {
    activatedRoute.params.subscribe(_ => this.planningId = _.planningId);
  }

  ngOnInit() {
    this.planningService.getDevelopers(this.planningId).subscribe(_ => this.developersChanged(_));
    this.planningService.getPlanning(this.planningId).subscribe(_ => this.planningChanged(_));
  }

  public estimateSucceeded = () => this.planning && !this.planning.estimateRequested && this.planning.estimateSucceeded;

  public estimateFailed = () => this.planning && !this.planning.estimateRequested && !this.planning.estimateSucceeded;

  public estimateRequested = () => this.planning && this.planning.estimateRequested;

  public async requestEstimate() {
    await this.planningService.resetEstimate(this.planningId);
  }

  public link = (): string => environment.url + this.planningId;

  public async logout() {
    await this.planningService.deletePlanning(this.planningId);
    await this.router.navigateByUrl('/');
  }

  private planningChanged(_: Planning) {
    if (!_ || !_.subject) {
      this.router.navigateByUrl('/');
    }
    this.planning = _;
    fireworks._particlesPerExplosion = _.estimateSucceeded ? 40 : 0;
  }

  private async developersChanged(developers: Developer[]) {
    this.developers = developers;
    if (!this.estimateRequested()) {
      return;
    }

    const allStorypoints = developers.map(_ => _.storypoints);
    const allHaveChosen = !allStorypoints.some(_ => _ == null);
    const allValidStorypoints = allStorypoints.filter(_ => _ !== Storypoints.unsure);
    const coffeeIndex = allValidStorypoints.findIndex(storypoints => storypoints === Storypoints.coffee);

    if (allStorypoints.length === 0 || (!allHaveChosen && coffeeIndex === -1)) {
      return;
    }
    // tslint:disable-next-line: triple-equals
    if (!allHaveChosen && coffeeIndex != -1) {
      // tslint:disable-next-line: no-use-before-declare
      await this.planningService.setEstimateResult(this.planningId, true, allValidStorypoints[coffeeIndex]);
    }

    const allValidStorypointsAreEqual = allValidStorypoints.every((val, i, array) => val === array[0]) || coffeeIndex !== -1;

    let StorypointsElement;
    if (coffeeIndex === -1) {
      StorypointsElement = allValidStorypoints[0];
    } else {
      StorypointsElement = allValidStorypoints[coffeeIndex];
    }

    await this.planningService.setEstimateResult(this.planningId, allValidStorypointsAreEqual, StorypointsElement);
  }

  public copyLink(link: string) {
    const selBox = document.createElement('textarea');
    selBox.style.position = 'fixed';
    selBox.style.left = '0';
    selBox.style.top = '0';
    selBox.style.opacity = '0';
    selBox.value = link;
    document.body.appendChild(selBox);
    selBox.focus();
    selBox.select();
    document.execCommand('copy');
    document.body.removeChild(selBox);
  }
}

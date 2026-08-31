import {Component, inject, OnDestroy, OnInit} from '@angular/core';

import {ActivatedRoute, Router} from '@angular/router';
import {QRCodeComponent} from 'angularx-qrcode';
import {faClipboard} from '@fortawesome/free-solid-svg-icons/faClipboard';
import {faQrcode} from '@fortawesome/free-solid-svg-icons/faQrcode';
import {faTimes} from '@fortawesome/free-solid-svg-icons/faTimes';
import {fadeBlur, fadeTranslateInstant} from '../../../../../animation';
import {StoryPoints} from '../../../models/storyPoints';
import {PlanningService} from '../../../planning.service';
import {DeveloperId} from '../../../models/delevoper';
import {Planning} from '../../../models/planning';
import {environment} from '../../../../../../environments/environment';
import {MenuService} from '../../../../../shared/menu/menu.service';
import {HeaderService} from '../../../../../shared/header/header.service';
import {EditIssueComponent} from '../edit-issue/edit-issue.component';
import {DashboardComponent} from '../dashboard/dashboard.component';
import {DevelopersComponent} from '../developers/developers.component';
import {FireworksService} from '../../../../../shared/fireworks/fireworks.service';
import {ButtonComponent} from '../../../../../shared/ui/button.component';
import {IconButtonComponent} from '../../../../../shared/ui/icon-button.component';

@Component({
  selector: 'app-scrum-master',
  standalone: true,
  imports: [QRCodeComponent, EditIssueComponent, DashboardComponent, DevelopersComponent, ButtonComponent, IconButtonComponent],
  templateUrl: './scrum-master.component.html',
  styleUrls: ['./scrum-master.component.less'],
  animations: [fadeTranslateInstant, fadeBlur]
})
export class ScrumMasterComponent implements OnInit, OnDestroy {
  public count: number;
  public planningId: string;
  public developers: DeveloperId[];
  public planning: Planning;
  public showQrCode = true;
  public faQrcode = faQrcode;
  public faTimes = faTimes;
  public faClipboard = faClipboard;

  private activatedRoute = inject(ActivatedRoute);
  private planningService = inject(PlanningService);
  private router = inject(Router);
  private menuService = inject(MenuService);
  private headerService = inject(HeaderService);
  private fireworksService = inject(FireworksService);

  constructor() {
    this.activatedRoute.params.subscribe(_ => this.planningId = _.planningId);
    this.menuService.menuOpen$.subscribe(_ => {
      if (_) {
        this.showQrCode = false;
      }
    });
  }

  ngOnInit() {
    this.headerService.setBreadcrumb([{route: '/planning', name: 'Scrum Poker'}]);
    this.fireworksService.start();
    this.planningService.getDevelopers(this.planningId).subscribe(_ => this.developersChanged(_));
    this.planningService.getPlanning(this.planningId).subscribe(_ => this.planningChanged(_));
    this.menuService.addCustomAction('Session beenden', () => this.logout());
  }

  ngOnDestroy() {
    this.menuService.resetCustomActions();
    this.headerService.setFullscreen(false);
    this.fireworksService.stop();
  }

  public estimateSucceeded = () => this.planning && !this.planning.estimateRequested && this.planning.estimateSucceeded && this.planning.storyPoints !== StoryPoints.coffee;
  public coffeeBreak = () => this.planning && !this.planning.estimateRequested && this.planning.estimateSucceeded && this.planning.storyPoints === StoryPoints.coffee;
  public estimateFailed = () => this.planning && !this.planning.estimateRequested && !this.planning.estimateSucceeded;
  public estimateRequested = () => this.planning && this.planning.estimateRequested;

  public async requestEstimate() {
    await this.planningService.resetEstimate(this.planningId, this.planning.count + 1);
  }

  public async resumeAfterCoffeeBreak() {
    await this.planningService.resetEstimate(this.planningId, this.planning.count);
  }

  public link = (): string => environment.url + this.planningId;

  public async logout() {
    await this.router.navigateByUrl('/planning');
    await this.planningService.deletePlanning(this.planningId);
  }

  public copyLink(link: string) {
    void navigator.clipboard.writeText(link);
    // const blobInput = this.convertBase64ToBlob(base64Data, 'image/png');
    // const clipboardItemInput = new ClipboardItem({ 'image/png': blobInput });
    // navigator.clipboard.write([clipboardItemInput]);

  }

  convertBase64ToBlob(base64, type) {
    var bytes = window.atob(base64);
    var ab = new ArrayBuffer(bytes.length);
    var ia = new Uint8Array(ab);
    for (var i = 0; i < bytes.length; i++) {
      ia[i] = bytes.charCodeAt(i);
    }
    return new Blob([ab], { type: type });
  }

  private planningChanged(_: Planning) {
    if (!_ || !_.subject) {
      this.router.navigateByUrl('/planning').then();
      return;
    }
    this.planning = _;
    this.count = _.count;
    this.headerService.setFullscreen(!!_.issue);

    if (_.storyPoints !== StoryPoints.coffee) {
      this.fireworksService.configure(_.estimateSucceeded ? 50 : 0, [200 * _.count * _.count, 1500 * _.count * _.count]);
    }
  }

  private async developersChanged(developers: DeveloperId[]) {
    this.developers = developers;
    if (!this.estimateRequested()) {
      return;
    }

    const allStoryPoints = developers.map(_ => _.storyPoints);
    const allHaveChosen = !allStoryPoints.some(_ => _ == null);
    const allValidStoryPoints = allStoryPoints.filter(_ => _ !== StoryPoints.unsure);
    const coffeeIndex = allValidStoryPoints.findIndex(sp => sp === StoryPoints.coffee);

    if (allStoryPoints.length === 0 || (!allHaveChosen && coffeeIndex === -1)) {
      return;
    }

    if (!allHaveChosen && coffeeIndex !== -1) {
      await this.planningService.setEstimateResult(this.planningId, true, allValidStoryPoints[coffeeIndex]);
    }

    const allValidStoryPointsAreEqual = allValidStoryPoints.every((val, i, array) => val === array[0]) || coffeeIndex !== -1;

    const storyPointsElement = coffeeIndex === -1 ? allValidStoryPoints[0] : allValidStoryPoints[coffeeIndex];
    await this.planningService.setEstimateResult(this.planningId, allValidStoryPointsAreEqual, storyPointsElement);
  }
}

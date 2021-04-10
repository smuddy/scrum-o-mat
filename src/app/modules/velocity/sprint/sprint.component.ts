import {Component} from '@angular/core';
import {ActivatedRoute} from '@angular/router';
import {mergeMap} from 'rxjs/operators';
import {VelocityService} from '../velocity.service';
import {Staff} from '../models/velocity';

@Component({
  selector: 'app-sprint',
  templateUrl: './sprint.component.html',
  styleUrls: ['./sprint.component.less']
})
export class SprintComponent {
  public sprint$ = this.activatedRoute.params.pipe(
    mergeMap(params => this.velocityService.getSprint$(+params.id))
  );

  constructor(
    private activatedRoute: ActivatedRoute,
    private velocityService: VelocityService,
  ) {
  }

  updateFromDate = (id: number, $event: Date) => this.velocityService.updateFromDate(id, $event);
  updateToDate = (id: number, $event: Date) => this.velocityService.updateToDate(id, $event);
  updatePointsAchieved = (id: number, $event: number) => this.velocityService.updatePointsAchieved(id, $event);

  public updateStaffName = (id: number, name: string, newName: string) => this.velocityService.updateStaffName(id, name, newName);
  public updateStaffDays = (id: number, name: string, newDays: number) => this.velocityService.updateStaffDays(id, name, newDays);
  public updateStaffPercent = (id: number, name: string, newPercent: number) => this.velocityService.updateStaffPercent(id, name, newPercent);

  addStaff(id: number) {
    this.velocityService.addStaff(id);
  }

  sumDays = (availableStaff: Staff[])  => availableStaff.reduce((pv, cv) => pv + cv.days, 0);
}

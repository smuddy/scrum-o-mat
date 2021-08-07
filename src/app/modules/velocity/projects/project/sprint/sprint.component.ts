import {Component, OnDestroy, OnInit} from '@angular/core';
import {ActivatedRoute, Router} from '@angular/router';
import {map, mergeMap, tap} from 'rxjs/operators';
import {VelocityService} from '../velocity.service';
import {Project, Staff} from '../../../models/project';
import {Observable} from 'rxjs';
import {ProjectService} from '../../project.service';
import {MenuService} from '../../../../../shared/menu/menu.service';
import {fadeTranslateInstant} from '../../../../../animation';
import {faTrash} from '@fortawesome/free-solid-svg-icons/faTrash';
import {HeaderService} from '../../../../../shared/header/header.service';

@Component({
  selector: 'app-sprint',
  templateUrl: './sprint.component.html',
  styleUrls: ['./sprint.component.less'],
  animations: [fadeTranslateInstant],
})
export class SprintComponent implements OnInit, OnDestroy {
  public sprint$ = this.activatedRoute.params.pipe(
    mergeMap(params => this.velocityService.getSprint$(params.projectId, params.sprintId).pipe(tap(sprint =>
      this.headerService.setBreadcrumb([
        {route: '/velocity', name: 'Sprint Planer'},
        {route: '/velocity/' + params.projectId, name: sprint.projectName},
        {route: '/velocity/' + params.projectId + '/' + sprint.id, name: 'Sprint ' + sprint.sprintNumber},
      ])
    )))
  );
  public project$: Observable<Project> = this.activatedRoute.params.pipe(
    mergeMap(params => this.projectService.getProject(params.projectId))
  );
  public projectId$ = this.activatedRoute.params.pipe(map(params => params.projectId));
  public faTrash = faTrash;
  private project: Project;
  private projectId: string;
  private sprintId: string;

  constructor(
    private activatedRoute: ActivatedRoute,
    private velocityService: VelocityService,
    private projectService: ProjectService,
    private menusService: MenuService,
    private headerService: HeaderService,
    private router: Router,
  ) {
    this.projectId$.subscribe(_ => this.projectId = _);
    this.project$.subscribe(_ => this.project = _);
    this.sprint$.subscribe(_ => this.sprintId = _.id);
  }

  public ngOnInit(): void {
    this.menusService.addCustomAction('Sprint löschen', () => this.removeSprint(), true);
  }

  public ngOnDestroy() {
    this.menusService.resetCustomActions();
  }

  updateFromDate = (sprintId: number, $event: Date) => this.velocityService.updateFromDate(this.projectId, this.project, sprintId, $event);

  updateToDate = (sprintId: number, $event: Date) => this.velocityService.updateToDate(this.projectId, this.project, sprintId, $event);

  updatePointsAchieved = (sprintId: number, $event: number) => this.velocityService.updatePointsAchieved(this.projectId, this.project, sprintId, $event);

  public updateStaffName = (sprintId: number, name: string, newName: string) => this.velocityService.updateStaffName(this.projectId, this.project, sprintId, name, newName);

  public updateStaffDays = (sprintId: number, name: string, newDays: number) => this.velocityService.updateStaffDays(this.projectId, this.project, sprintId, name, newDays);

  public updateStaffPercent = (sprintId: number, name: string, newPercent: number) => this.velocityService.updateStaffPercent(this.projectId, this.project, sprintId, name, newPercent);

  public addStaff = (sprintId: number) => this.velocityService.addStaff(this.projectId, this.project, sprintId);

  public removeStaff = (sprintId: number, staff: Staff) => this.velocityService.removeStaff(this.projectId, this.project, sprintId, staff.id);

  public sumDays = (availableStaff: Staff[]) => availableStaff.reduce((pv, cv) => pv + cv.days * cv.percent / 100, 0);

  private async removeSprint() {
    this.velocityService.removeSprint(this.projectId, this.project, this.sprintId);
    this.router.navigateByUrl('/velocity/' + this.projectId);
  }
}

import {Component, OnDestroy, OnInit} from '@angular/core';
import {ActivatedRoute, Router} from '@angular/router';
import {debounceTime, distinctUntilChanged, map, mergeMap, tap} from 'rxjs/operators';
import {VelocityService} from '../velocity.service';
import {Project, Staff} from '../../../models/project';
import {Observable} from 'rxjs';
import {ProjectService} from '../../project.service';
import {MenuService} from '../../../../../shared/menu/menu.service';
import {fadeTranslateInstant} from '../../../../../animation';
import {faTrash} from '@fortawesome/free-solid-svg-icons/faTrash';
import {HeaderService} from '../../../../../shared/header/header.service';
import {faAngleRight} from '@fortawesome/free-solid-svg-icons/faAngleRight';
import {faAngleLeft} from '@fortawesome/free-solid-svg-icons/faAngleLeft';

@Component({
  selector: 'app-sprint',
  templateUrl: './sprint.component.html',
  styleUrls: ['./sprint.component.less'],
  animations: [fadeTranslateInstant],
})
export class SprintComponent implements OnInit, OnDestroy {
  public sprint$ = this.activatedRoute.params.pipe(
    distinctUntilChanged((x, y) => JSON.stringify(x) === JSON.stringify(y)),
    mergeMap(params => this.velocityService.getSprint$(params.projectId, params.sprintId).pipe(
      distinctUntilChanged((x, y) => JSON.stringify(x) === JSON.stringify(y)),
      debounceTime(10),
      tap(sprint => {
          this.headerService.setBreadcrumb([
            {route: '/velocity', name: 'Sprint Planer'},
            {route: '/velocity/' + params.projectId, name: sprint.projectName},
            {route: '/velocity/' + params.projectId + '/' + sprint.id, name: 'Sprint ' + sprint.sprintName},
          ]);
        }
      )))
  );

  public faRight = faAngleRight;
  public faLeft = faAngleLeft;

  public sprintNumber$ = this.sprint$.pipe(map(_ => _.sprintNumber), distinctUntilChanged(), debounceTime(10));
  public sprintName$ = this.sprint$.pipe(map(_ => _.sprintName), distinctUntilChanged(), debounceTime(10));
  public fromDate$ = this.sprint$.pipe(map(_ => _.fromDate), distinctUntilChanged(), debounceTime(10));
  public toDate$ = this.sprint$.pipe(map(_ => _.toDate), distinctUntilChanged(), debounceTime(10));
  public pointsAchieved$ = this.sprint$.pipe(map(_ => _.pointsAchieved), distinctUntilChanged(), debounceTime(10));
  public availableStaff$ = this.sprint$.pipe(map(_ => _.availableStaff), distinctUntilChanged((x, y) => JSON.stringify(x) === JSON.stringify(y)), debounceTime(10));

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

  public updateFromDate = (sprintId: number, $event: Date) => this.velocityService.updateFromDate(this.projectId, this.project, sprintId, $event);

  public updateToDate = (sprintId: number, $event: Date) => this.velocityService.updateToDate(this.projectId, this.project, sprintId, $event);

  public updateSprintText = (sprintId: number, $event: string) => this.velocityService.updateSprintName(this.projectId, this.project, sprintId, $event);

  public updatePointsAchieved = (sprintId: number, $event: number) => this.velocityService.updatePointsAchieved(this.projectId, this.project, sprintId, $event);

  public updateStaffName = (sprintId: number, name: string, newName: string) => this.velocityService.updateStaffName(this.projectId, this.project, sprintId, name, newName);

  public updateStaffDays = (sprintId: number, name: string, newDays: number) => this.velocityService.updateStaffDays(this.projectId, this.project, sprintId, name, newDays);

  public updateStaffPercent = (sprintId: number, name: string, newPercent: number) => this.velocityService.updateStaffPercent(this.projectId, this.project, sprintId, name, newPercent);

  public addStaff = (sprintId: number) => this.velocityService.addStaff(this.projectId, this.project, sprintId);

  public removeStaff = (sprintId: number, staff: Staff) => this.velocityService.removeStaff(this.projectId, this.project, sprintId, staff.id);

  public sumDays = (availableStaff: Staff[]) => availableStaff.reduce((pv, cv) => pv + cv.days * cv.percent / 100, 0);

  public trackBy(index, item) {
    return item.id;
  }

  public onClickRight(): void {
    const sprint = this.project.sprints.find(_ => _.id === this.sprintId);
    const index = this.project.sprints.indexOf(sprint);
    const max = this.project.sprints.length - 1;
    if (index < max) this.router.navigateByUrl('/velocity/' + this.projectId + '/' + this.project.sprints[index + 1].id);
  }

  public onClickLeft(): void {
    const sprint = this.project.sprints.find(_ => _.id === this.sprintId);
    const index = this.project.sprints.indexOf(sprint);
    if (index > 0) this.router.navigateByUrl('/velocity/' + this.projectId + '/' + this.project.sprints[index - 1].id);
  }

  private async removeSprint() {
    await this.velocityService.removeSprint(this.projectId, this.project, this.sprintId);
    await this.router.navigateByUrl('/velocity/' + this.projectId);
  }


}

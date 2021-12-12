import {Component, OnDestroy, OnInit} from '@angular/core';
import {VelocityService} from './velocity.service';
import {Observable} from 'rxjs';
import {Project, ProjectOwner, Staff} from '../../models/project';
import {ActivatedRoute, Router} from '@angular/router';
import {map, mergeMap, tap} from 'rxjs/operators';
import {ProjectService} from '../project.service';
import {MenuService} from '../../../../shared/menu/menu.service';
import {fadeTranslateInstant} from '../../../../animation';
import {HeaderService} from '../../../../shared/header/header.service';
import {LoginService} from '../../../login/login.service';

@Component({
  selector: 'app-velocity',
  templateUrl: './project.component.html',
  styleUrls: ['./project.component.less'],
  animations: [fadeTranslateInstant],
})
export class ProjectComponent implements OnInit, OnDestroy {
  public project$: Observable<Project> = this.activatedRoute.params.pipe(
    mergeMap(params =>
      this.projectService.getProject(params.projectId).pipe(tap(project =>
        this.headerService.setBreadcrumb([
          {route: '/velocity', name: 'Sprint Planer'},
          {route: '/velocity/' + params.projectId, name: project.name},
        ])
      )))
  );
  public projectId$ = this.activatedRoute.params.pipe(map(params => params.projectId));
  public projectId: string;
  public currentUserId: string;
  private project: Project;

  constructor(
    private velocityService: VelocityService,
    private activatedRoute: ActivatedRoute,
    private projectService: ProjectService,
    private menuService: MenuService,
    private headerService: HeaderService,
    private router: Router,
    private loginService: LoginService,
  ) {
    this.projectId$.subscribe(_ => this.projectId = _);
    this.project$.subscribe(_ => this.project = _);
    this.loginService.currentUserId$().subscribe(_ => this.currentUserId = _);
  }

  public ngOnInit() {
    this.headerService.setBreadcrumb([{route: '/velocity', name: 'Sprint Planer'}]);
    this.menuService.addCustomAction('Sprint erstellen', () => this.velocityService.addSprint(this.projectId, this.project));
    this.menuService.addCustomAction('Projekt bearbeiten', () => this.router.navigateByUrl(`/velocity/${this.projectId}/edit`));
    this.menuService.addCustomAction('Projekt löschen', () => this.deleteProject(), true);
  }

  public ngOnDestroy() {
    this.menuService.resetCustomActions();
  }

  public updateName = ($event: string) => this.projectService.updateProject(this.projectId, {name: $event});

  calcAvailableStaff(availableStaff: Staff[]) {
    return availableStaff.reduce((count, staff) => count + staff.days * staff.percent / 100, 0) * 0.9;
  }

  public isWriter = (project: Project) => this.currentUserId === ((project as ProjectOwner).owner) || (project.coWriters ?? []).includes(this.currentUserId);

  private deleteProject() {
    this.router.navigateByUrl('/velocity');
    return this.projectService.deleteProject(this.projectId);
  }
}

import {Component, inject, OnDestroy, OnInit} from '@angular/core';
import {CommonModule} from '@angular/common';
import {VelocityService} from './velocity.service';
import {Observable, Subscription} from 'rxjs';
import {Project, ProjectId, ProjectOwner, Staff} from '../../models/project';
import {ActivatedRoute, Router, RouterLink} from '@angular/router';
import {debounceTime, map, mergeMap} from 'rxjs/operators';
import {ProjectService} from '../project.service';
import {MenuService} from '../../../../shared/menu/menu.service';
import {fadeTranslateInstant} from '../../../../animation';
import {HeaderService} from '../../../../shared/header/header.service';
import {LoginService} from '../../../login/login.service';

@Component({
  selector: 'app-velocity',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './project.component.html',
  styleUrls: ['./project.component.less'],
  animations: [fadeTranslateInstant],
})
export class ProjectComponent implements OnInit, OnDestroy {
  private velocityService = inject(VelocityService);
  private activatedRoute = inject(ActivatedRoute);
  private projectService = inject(ProjectService);
  private menuService = inject(MenuService);
  private headerService = inject(HeaderService);
  private router = inject(Router);
  private loginService = inject(LoginService);

  public project$: Observable<ProjectId> = this.activatedRoute.params.pipe(
    debounceTime(500),
    mergeMap(params =>
      this.projectService.getProject(params.projectId))
  );
  public projectId$ = this.activatedRoute.params.pipe(map(params => params.projectId));
  public projectId: string;
  public currentUserId: string;
  public subs: Subscription[] = [];
  private project: Project;

  constructor() {
    this.projectId$.subscribe(_ => this.projectId = _);
    this.project$.subscribe(_ => this.project = _);
    this.loginService.currentUserId$().subscribe(_ => this.currentUserId = _);
  }

  public ngOnInit(): void {
    this.headerService.setBreadcrumb([{route: '/velocity', name: 'Sprint Planer'}]);
    this.menuService.addCustomAction('Sprint erstellen', () => this.velocityService.addSprint(this.projectId, this.project));
    this.menuService.addCustomAction('Projekt bearbeiten', () => this.router.navigateByUrl(`/velocity/${this.projectId}/edit`));
    this.menuService.addCustomAction('Projekt löschen', () => this.deleteProject(), true);

    this.subs.push(this.project$.subscribe(project =>
      this.headerService.setBreadcrumb([
        {route: '/velocity', name: 'Sprint Planer'},
        {route: '/velocity/' + project.id, name: project.name},
      ])
    ));
  }

  public ngOnDestroy(): void {
    this.menuService.resetCustomActions();
    this.subs.forEach(_ => _.unsubscribe());
  }

  public updateName = ($event: string) => this.projectService.updateProject(this.projectId, {name: $event});

  calcAvailableStaff(availableStaff: Staff[]) {
    return availableStaff.reduce((count, staff) => count + staff.days * staff.percent / 100, 0);
  }

  public isWriter = (project: Project) => this.currentUserId === ((project as ProjectOwner).owner) || (project.coWriters ?? []).includes(this.currentUserId);

  private deleteProject() {
    this.router.navigateByUrl('/velocity');
    return this.projectService.deleteProject(this.projectId);
  }
}

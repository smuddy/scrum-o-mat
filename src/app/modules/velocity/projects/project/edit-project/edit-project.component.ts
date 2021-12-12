import {Component, OnDestroy, OnInit} from '@angular/core';
import {map, mergeMap, tap} from 'rxjs/operators';
import {Observable} from 'rxjs';
import {Project} from '../../../models/project';
import {ActivatedRoute} from '@angular/router';
import {VelocityService} from '../velocity.service';
import {ProjectService} from '../../project.service';
import {MenuService} from '../../../../../shared/menu/menu.service';
import {HeaderService} from '../../../../../shared/header/header.service';
import {LoginService} from '../../../../login/login.service';
import {faTrash} from '@fortawesome/free-solid-svg-icons/faTrash';

@Component({
  selector: 'app-edit-project',
  templateUrl: './edit-project.component.html',
  styleUrls: ['./edit-project.component.less']
})
export class EditProjectComponent implements OnInit, OnDestroy {
  public project$: Observable<Project> = this.activatedRoute.params.pipe(
    mergeMap(params =>
      this.projectService.getProject(params.projectId).pipe(tap(project =>
        this.headerService.setBreadcrumb([
          {route: '/velocity', name: 'Sprint Planer'},
          {route: '/velocity/' + params.projectId, name: project.name},
          {route: '/velocity/' + params.projectId, name: 'Info'},
        ])
      )))
  );
  public projectId$ = this.activatedRoute.params.pipe(map(params => params.projectId));
  public newReaderName = '';
  public faTrash = faTrash;
  private project: Project;
  private projectId: string;

  constructor(
    private activatedRoute: ActivatedRoute,
    private velocityService: VelocityService,
    private projectService: ProjectService,
    private menusService: MenuService,
    private headerService: HeaderService,
  ) {
    this.projectId$.subscribe(_ => this.projectId = _);
    this.project$.subscribe(_ => this.project = _);
  }

  public ngOnInit(): void {

  }

  public ngOnDestroy() {
    this.menusService.resetCustomActions();
  }

  public updateName = ($event: string) => this.projectService.updateProject(this.projectId, {name: $event});

  public updateInitialVelocity(initialVelocity: number): void {
    this.velocityService.updateInitialVelocity(this.projectId, this.project, initialVelocity);
  }

  public async addReader(): Promise<void> {
    if (LoginService.userIdRegex.test(this.newReaderName)) {
      await this.velocityService.addReader(this.projectId, this.project, this.newReaderName);
      this.newReaderName = '';
    }
  }

  public editReaderName($event: string): void {
    this.newReaderName = $event;
  }

  public async removeReader(coReader: string): Promise<void> {
    await this.velocityService.removeReader(this.projectId, this.project, coReader);

  }
}

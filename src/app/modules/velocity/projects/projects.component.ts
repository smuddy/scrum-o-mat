import {Component, OnDestroy, OnInit} from '@angular/core';
import {ProjectService} from './project.service';
import {Observable} from 'rxjs';
import {ProjectId} from '../models/project';
import {LoginService} from '../../login/login.service';
import {MenuService} from '../../../shared/menu/menu.service';
import {fadeTranslateInstant} from '../../../animation';
import {HeaderService} from '../../../shared/header/header.service';

@Component({
  selector: 'app-velocity-list',
  templateUrl: './projects.component.html',
  styleUrls: ['./projects.component.less'],
  animations: [fadeTranslateInstant],
})
export class ProjectsComponent implements OnInit, OnDestroy {
  public projects$: Observable<ProjectId[]>;
  private currentUser: string;

  constructor(
    private projectService: ProjectService,
    private loginService: LoginService,
    private menuService: MenuService,
    private headerService: HeaderService,
  ) {
    this.projects$ = projectService.getProjects();
    loginService.currentUserId$().subscribe(_ => this.currentUser = _);
  }

  public ngOnInit() {
    this.menuService.addCustomAction('Projekt anlegen', () => this.addProject());
    this.headerService.setBreadcrumb([{route: '/velocity', name: 'Sprint Planer'}]);
  }

  public ngOnDestroy() {
    this.menuService.resetCustomActions();
  }

  public async addProject() {
    await this.projectService.addNewProject(this.currentUser);
  }
}

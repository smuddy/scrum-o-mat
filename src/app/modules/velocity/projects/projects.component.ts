import {Component, inject, OnDestroy, OnInit} from '@angular/core';
import {CommonModule} from '@angular/common';
import {RouterLink} from '@angular/router';
import {ProjectService} from './project.service';
import {Observable} from 'rxjs';
import {ProjectId} from '../models/project';
import {LoginService} from '../../login/login.service';
import {MenuService} from '../../../shared/menu/menu.service';
import {fadeTranslateInstant} from '../../../animation';
import {HeaderService} from '../../../shared/header/header.service';

@Component({
  selector: 'app-velocity-list',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './projects.component.html',
  styleUrls: ['./projects.component.less'],
  animations: [fadeTranslateInstant],
})
export class ProjectsComponent implements OnInit, OnDestroy {
  private projectService = inject(ProjectService);
  private loginService = inject(LoginService);
  private menuService = inject(MenuService);
  private headerService = inject(HeaderService);

  public projectsOwner$: Observable<ProjectId[]> = this.projectService.getProjectsOwner();
  public projectsReader$: Observable<ProjectId[]> = this.projectService.getProjectsReader();
  public projectsWriter$: Observable<ProjectId[]> = this.projectService.getProjectsWriter();
  private currentUser: string;

  constructor() {
    this.loginService.currentUserId$().subscribe(_ => this.currentUser = _);
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

import {Routes} from '@angular/router';
import {AuthGuard, redirectLoggedInTo, redirectUnauthorizedTo} from '@angular/fire/auth-guard';
import {loginCanActivateGuard, loginCanDeactivateGuard} from './modules/login/login.guard';
import {leavePlanningGuard} from './modules/planning/guards/leave-planning.guard';
import {sessionRedirectGuard} from './shared/session-redirect.guard';

const redirectUnauthorizedToLogin = () => redirectUnauthorizedTo(['login']);
const redirectLoggedInToRoot = () => redirectLoggedInTo(['']);

export const routes: Routes = [
  {
    path: '',
    pathMatch: 'full',
    loadComponent: () => import('./modules/init/init.component').then(m => m.InitComponent),
    canActivate: [sessionRedirectGuard],
  },
  {
    path: 'planning',
    data: {moduleName: 'Scrum Poker'},
    children: [
      {
        path: '',
        pathMatch: 'full',
        loadComponent: () => import('./modules/planning/init/init.component').then(m => m.InitComponent),
      },
      {
        path: 'scan',
        loadComponent: () => import('./modules/planning/qrcode/components/qrcode/qrcode.component').then(m => m.QrcodeComponent),
      },
      {
        path: 'admin',
        loadComponent: () => import('./modules/planning/admin/components/admin/admin.component').then(m => m.AdminComponent),
      },
      {
        path: ':planningId/master',
        loadComponent: () => import('./modules/planning/scrum-master/components/scrum-master/scrum-master.component').then(m => m.ScrumMasterComponent),
        canDeactivate: [leavePlanningGuard],
      },
      {
        path: ':planningId/guest',
        loadComponent: () => import('./modules/planning/guest/guest.component').then(m => m.GuestComponent),
      },
      {
        path: ':planningId/:userId',
        loadComponent: () => import('./modules/planning/developer/components/developer/developer.component').then(m => m.DeveloperComponent),
      },
    ],
  },
  {
    path: 'velocity',
    canActivate: [AuthGuard],
    data: {authGuardPipe: redirectUnauthorizedToLogin, moduleName: 'Sprint Planer'},
    children: [
      {
        path: '',
        pathMatch: 'full',
        loadComponent: () => import('./modules/velocity/projects/projects.component').then(m => m.ProjectsComponent),
      },
      {
        path: ':projectId',
        loadComponent: () => import('./modules/velocity/projects/project/project.component').then(m => m.ProjectComponent),
      },
      {
        path: ':projectId/edit',
        loadComponent: () => import('./modules/velocity/projects/project/edit-project/edit-project.component').then(m => m.EditProjectComponent),
      },
      {
        path: ':projectId/:sprintId',
        loadComponent: () => import('./modules/velocity/projects/project/sprint/sprint.component').then(m => m.SprintComponent),
      },
    ],
  },
  {
    path: 'retrospective',
    data: {moduleName: 'Retrospektive'},
    children: [
      {
        path: '',
        pathMatch: 'full',
        loadComponent: () => import('./modules/retrospective/board-list/board-list.component').then(m => m.BoardListComponent),
        canActivate: [AuthGuard],
        data: {authGuardPipe: redirectUnauthorizedToLogin, moduleName: 'Retrospektive'},
      },
      {
        path: 'new',
        loadComponent: () => import('./modules/retrospective/create/create.component').then(m => m.CreateComponent),
        canActivate: [AuthGuard],
        data: {authGuardPipe: redirectUnauthorizedToLogin, moduleName: 'Retrospektive'},
      },
      {
        path: ':boardId',
        loadComponent: () => import('./modules/retrospective/board/board.component').then(m => m.BoardComponent),
      },
    ],
  },
  {
    path: 'login',
    loadComponent: () => import('./modules/login/login.component').then(m => m.LoginComponent),
    canActivate: [AuthGuard, loginCanActivateGuard],
    canDeactivate: [loginCanDeactivateGuard],
    data: {authGuardPipe: redirectLoggedInToRoot, moduleName: 'Login'},
  },
];

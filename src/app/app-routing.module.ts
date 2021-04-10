import {NgModule} from '@angular/core';
import {RouterModule, Routes} from '@angular/router';
import {AngularFireAuthGuard, AngularFireAuthGuardModule, redirectLoggedInTo, redirectUnauthorizedTo} from '@angular/fire/auth-guard';

const redirectUnauthorizedToLogin = () => redirectUnauthorizedTo(['login']);
const redirectLoggedInToRoot = () => redirectLoggedInTo([]);

const routes: Routes = [
  {
    path: '',
    pathMatch: 'full',
    redirectTo: 'planning'
  },
  {path: 'planning', loadChildren: () => import('./modules/planning/planning.module').then(m => m.PlanningModule)},
  {
    path: 'velocity',
    loadChildren: () => import('./modules/velocity/velocity.module').then(m => m.VelocityModule),
    canActivate: [AngularFireAuthGuard],
    data: {authGuardPipe: redirectUnauthorizedToLogin}
  },
  {
    path: 'login',
    loadChildren: () => import('./modules/login/login.module').then(m => m.LoginModule),
    canActivate: [AngularFireAuthGuard],
    data: {authGuardPipe: redirectLoggedInToRoot}
  },
];

@NgModule({
  imports: [RouterModule.forRoot(routes, {relativeLinkResolution: 'legacy'}), AngularFireAuthGuardModule],
  exports: [RouterModule]
})
export class AppRoutingModule {
}

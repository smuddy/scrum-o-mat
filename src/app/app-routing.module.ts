import {NgModule} from '@angular/core';
import {RouterModule, Routes} from '@angular/router';

const routes: Routes = [
  {
    path: '',
    pathMatch: 'full',
    redirectTo: 'planning'
  },
  {path: 'planning', loadChildren: () => import('./modules/planning/planning.module').then(m => m.PlanningModule)},
  {path: 'velocity', loadChildren: () => import('./modules/velocity/velocity.module').then(m => m.VelocityModule)},
];

@NgModule({
  imports: [RouterModule.forRoot(routes, {relativeLinkResolution: 'legacy'})],
  exports: [RouterModule]
})
export class AppRoutingModule {
}

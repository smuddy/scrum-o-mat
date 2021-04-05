import {NgModule} from '@angular/core';
import {RouterModule, Routes} from '@angular/router';

import {VelocityComponent} from './velocity.component';
import {SprintComponent} from './sprint/sprint.component';

const routes: Routes = [
  {
    path: '', component: VelocityComponent,
    pathMatch: 'full',
  },
  {path: ':id', component: SprintComponent},
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class VelocityRoutingModule {
}

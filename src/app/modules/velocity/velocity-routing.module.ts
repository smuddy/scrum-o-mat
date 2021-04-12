import {NgModule} from '@angular/core';
import {RouterModule, Routes} from '@angular/router';
import {SprintComponent} from './projects/project/sprint/sprint.component';
import {ProjectsComponent} from './projects/projects.component';
import {ProjectComponent} from './projects/project/project.component';

const routes: Routes = [
  {
    path: '', component: ProjectsComponent,
    pathMatch: 'full',
  },
  {path: ':projectId', component: ProjectComponent},
  {path: ':projectId/:sprintId', component: SprintComponent},
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class VelocityRoutingModule {
}

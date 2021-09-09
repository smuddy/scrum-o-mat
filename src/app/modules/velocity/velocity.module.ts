import {NgModule} from '@angular/core';
import {CommonModule} from '@angular/common';

import {VelocityRoutingModule} from './velocity-routing.module';
import {ProjectComponent} from './projects/project/project.component';
import {SprintComponent} from './projects/project/sprint/sprint.component';
import {FormsModule, ReactiveFormsModule} from '@angular/forms';
import {EditDateComponent} from './projects/project/sprint/edit-date/edit-date.component';
import {EditNumberComponent} from './projects/project/sprint/edit-number/edit-number.component';
import {EditTextComponent} from './projects/project/sprint/edit-text/edit-text.component';
import {ProjectsComponent} from './projects/projects.component';
import {FontAwesomeModule} from '@fortawesome/angular-fontawesome';
import { EditProjectComponent } from './projects/project/edit-project/edit-project.component';


@NgModule({
  declarations: [ProjectComponent, SprintComponent, EditDateComponent, EditNumberComponent, EditTextComponent, ProjectsComponent, EditProjectComponent],
  imports: [
    CommonModule,
    VelocityRoutingModule,
    FormsModule,
    ReactiveFormsModule,
    FontAwesomeModule,

  ]
})
export class VelocityModule {
}

import {NgModule} from '@angular/core';
import {CommonModule} from '@angular/common';

import {VelocityRoutingModule} from './velocity-routing.module';
import {VelocityComponent} from './velocity.component';
import {SprintComponent} from './sprint/sprint.component';
import {FormsModule, ReactiveFormsModule} from '@angular/forms';
import {EditDateComponent} from './sprint/edit-date/edit-date.component';
import {EditNumberComponent} from './sprint/edit-number/edit-number.component';
import {EditTextComponent} from './sprint/edit-text/edit-text.component';


@NgModule({
  declarations: [VelocityComponent, SprintComponent, EditDateComponent, EditNumberComponent, EditTextComponent],
  imports: [
    CommonModule,
    VelocityRoutingModule,
    FormsModule,
    ReactiveFormsModule,

  ]
})
export class VelocityModule {
}

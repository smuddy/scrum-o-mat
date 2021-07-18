import {NgModule} from '@angular/core';
import {CommonModule} from '@angular/common';

import {InitRoutingModule} from './init-routing.module';
import {InitComponent} from './init.component';
import {FormsModule, ReactiveFormsModule} from '@angular/forms';


@NgModule({
  declarations: [InitComponent],
  imports: [
    CommonModule,
    InitRoutingModule,
    FormsModule,
    ReactiveFormsModule,
  ]
})
export class InitModule {
}

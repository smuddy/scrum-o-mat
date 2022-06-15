import {NgModule} from '@angular/core';
import {CommonModule} from '@angular/common';

import {InitRoutingModule} from './init-routing.module';
import {InitComponent} from './init.component';
import {FormsModule, ReactiveFormsModule} from '@angular/forms';
import {FontAwesomeModule} from '@fortawesome/angular-fontawesome';


@NgModule({
  declarations: [InitComponent],
    imports: [
        CommonModule,
        InitRoutingModule,
        FormsModule,
        ReactiveFormsModule,
        FontAwesomeModule,
    ]
})
export class InitModule {
}

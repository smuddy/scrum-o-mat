import {NgModule} from '@angular/core';

import {PlanningRoutingModule} from './planning-routing.module';
import {FormsModule} from '@angular/forms';
import {QrcodeModule} from './qrcode/qrcode.module';
import {DeveloperModule} from './developer/developer.module';
import {ScrumMasterModule} from './scrum-master/scrum-master.module';
import {AdminModule} from './admin/admin.module';
import {InitComponent} from './init/init.component';
import {CommonModule} from '@angular/common';


@NgModule({
  declarations: [InitComponent],
  imports: [
    CommonModule,
    PlanningRoutingModule,
    FormsModule,

    ScrumMasterModule,
    DeveloperModule,
    AdminModule,
    QrcodeModule
  ]
})
export class PlanningModule {
}

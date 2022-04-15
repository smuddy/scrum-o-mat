import {NgModule} from '@angular/core';

import {PlanningRoutingModule} from './planning-routing.module';
import {FormsModule} from '@angular/forms';
import {QrcodeModule} from './qrcode/qrcode.module';
import {DeveloperModule} from './developer/developer.module';
import {ScrumMasterModule} from './scrum-master/scrum-master.module';
import {AdminModule} from './admin/admin.module';
import {InitComponent} from './init/init.component';
import {CommonModule} from '@angular/common';
import {GuestModule} from './guest/guest.module';
import {MySessionsComponent} from './init/my-sessions/my-sessions.component';
import {FontAwesomeModule} from '@fortawesome/angular-fontawesome';


@NgModule({
  declarations: [InitComponent, MySessionsComponent],
  imports: [
    CommonModule,
    PlanningRoutingModule,
    FormsModule,

    ScrumMasterModule,
    DeveloperModule,
    AdminModule,
    QrcodeModule,
    GuestModule,
    FontAwesomeModule,
  ]
})
export class PlanningModule {
}

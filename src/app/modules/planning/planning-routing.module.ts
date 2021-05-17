import {NgModule} from '@angular/core';
import {RouterModule, Routes} from '@angular/router';
import {AdminComponent} from './admin/components/admin/admin.component';
import {ScrumMasterComponent} from './scrum-master/components/scrum-master/scrum-master.component';
import {DeveloperComponent} from './developer/components/developer/developer.component';
import {QrcodeComponent} from './qrcode/components/qrcode/qrcode.component';
import {InitComponent} from './init/init.component';
import {GuestComponent} from './guest/guest.component';


const routes: Routes = [{
  path: '',
  pathMatch: 'full',
  component: InitComponent
},
  {
    path: 'scan',
    component: QrcodeComponent,
  },
  {
    path: 'admin',
    component: AdminComponent,
  },
  {
    path: ':planningId/master',
    component: ScrumMasterComponent,
  },
  {
    path: ':planningId/guest',
    component: GuestComponent,
  },
  {
    path: ':planningId/:userId',
    component: DeveloperComponent,
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class PlanningRoutingModule {
}

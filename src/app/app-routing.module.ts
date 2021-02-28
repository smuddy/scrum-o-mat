import {NgModule} from '@angular/core';
import {RouterModule, Routes} from '@angular/router';
import {InitComponent} from './init/init.component';
import {ScrumMasterComponent} from './modules/scrum-master/components/scrum-master/scrum-master.component';
import {DeveloperComponent} from './modules/developer/components/developer/developer.component';
import {AdminComponent} from './modules/admin/components/admin/admin.component';
import {QrcodeComponent} from './modules/qrcode/components/qrcode/qrcode.component';

const routes: Routes = [
  {
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
    path: ':planningId/:userId',
    component: DeveloperComponent,
  },
];

@NgModule({
  imports: [RouterModule.forRoot(routes, { relativeLinkResolution: 'legacy' })],
  exports: [RouterModule]
})
export class AppRoutingModule {
}

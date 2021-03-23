import {NgModule} from '@angular/core';
import {CommonModule} from '@angular/common';
import {ScrumMasterComponent} from './components/scrum-master/scrum-master.component';
import {EditIssueComponent} from './components/edit-issue/edit-issue.component';
import {FormsModule} from '@angular/forms';
import {FontAwesomeModule} from '@fortawesome/angular-fontawesome';
import {DevelopersComponent} from './components/developers/developers.component';
import {DashboardComponent} from './components/dashboard/dashboard.component';
import {NgxQRCodeModule} from 'ngx-qrcode2';
import {OrderModule} from 'ngx-order-pipe';

@NgModule({
  declarations: [
    ScrumMasterComponent,
    EditIssueComponent,
    DevelopersComponent,
    DashboardComponent
  ],
  imports: [
    CommonModule,
    FormsModule,
    FontAwesomeModule,
    NgxQRCodeModule,
    OrderModule
  ],
  exports: [
    ScrumMasterComponent
  ]
})
export class ScrumMasterModule {
}

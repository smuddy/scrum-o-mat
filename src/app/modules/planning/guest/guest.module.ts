import {NgModule} from '@angular/core';
import {CommonModule} from '@angular/common';
import {GuestComponent} from './guest.component';
import {FontAwesomeModule} from '@fortawesome/angular-fontawesome';
import {OrderModule} from 'ngx-order-pipe';
import {NgCircleProgressModule} from 'ng-circle-progress';
import {BubblesModule} from '../../../shared/bubbles/bubbles.module';

@NgModule({
  declarations: [GuestComponent],
  exports: [GuestComponent],
  imports: [
    CommonModule,
    FontAwesomeModule,
    OrderModule,
    NgCircleProgressModule.forRoot(),
    BubblesModule
  ],
})
export class GuestModule {
}

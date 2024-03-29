import {NgModule} from '@angular/core';
import {CommonModule} from '@angular/common';
import {DeveloperComponent} from './components/developer/developer.component';
import {CardsComponent} from './components/cards/cards.component';
import {CardComponent} from './components/card/card.component';
import {FontAwesomeModule} from '@fortawesome/angular-fontawesome';
import {OrderModule} from 'ngx-order-pipe';
import {BubblesModule} from '../../../shared/bubbles/bubbles.module';

@NgModule({
  declarations: [DeveloperComponent, CardsComponent, CardComponent],
  imports: [
    CommonModule,
    FontAwesomeModule,
    OrderModule,
    BubblesModule
  ],
  exports: [
    DeveloperComponent
  ]
})
export class DeveloperModule {
}

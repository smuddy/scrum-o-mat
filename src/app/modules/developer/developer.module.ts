import {NgModule} from '@angular/core';
import {CommonModule} from '@angular/common';
import {DeveloperComponent} from './components/developer/developer.component';
import {CardsComponent} from './components/cards/cards.component';
import {CardComponent} from './components/card/card.component';
import {BrowserAnimationsModule} from '@angular/platform-browser/animations';
import {FontAwesomeModule} from '@fortawesome/angular-fontawesome';

@NgModule({
  declarations: [DeveloperComponent, CardsComponent, CardComponent],
  imports: [
    CommonModule,
    BrowserAnimationsModule,
    FontAwesomeModule
  ],
  exports: [
    DeveloperComponent
  ]
})
export class DeveloperModule {
}

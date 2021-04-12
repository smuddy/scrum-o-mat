import {NgModule} from '@angular/core';
import {CommonModule} from '@angular/common';
import {MenuComponent} from './menu.component';
import {RouterModule} from '@angular/router';
import {FontAwesomeModule} from '@fortawesome/angular-fontawesome';


@NgModule({
  declarations: [MenuComponent],
  exports: [
    MenuComponent
  ],
  imports: [
    CommonModule,
    RouterModule,
    FontAwesomeModule
  ]
})
export class MenuModule {
}

import {NgModule} from '@angular/core';
import {CommonModule} from '@angular/common';
import {HeaderComponent} from './header.component';
import {RouterModule} from '@angular/router';
import {FontAwesomeModule} from '@fortawesome/angular-fontawesome';


@NgModule({
  declarations: [HeaderComponent],
  exports: [HeaderComponent],
    imports: [
        CommonModule,
        RouterModule,
        FontAwesomeModule
    ]
})
export class HeaderModule {
}

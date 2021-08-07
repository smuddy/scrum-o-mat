import {NgModule} from '@angular/core';
import {CommonModule} from '@angular/common';
import {BubblesComponent} from './bubbles.component';


@NgModule({
  declarations: [BubblesComponent],
  exports: [BubblesComponent],
  imports: [
    CommonModule
  ]
})
export class BubblesModule {
}

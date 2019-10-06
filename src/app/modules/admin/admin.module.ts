import {NgModule} from '@angular/core';
import {CommonModule} from '@angular/common';
import {AdminComponent} from './components/admin/admin.component';
import {FontAwesomeModule} from '@fortawesome/angular-fontawesome';
import {UsersComponent} from './components/users/users.component';

@NgModule({
  declarations: [AdminComponent, UsersComponent],
  imports: [
    CommonModule,
    FontAwesomeModule
  ],
  exports: [
    AdminComponent
  ]
})
export class AdminModule {
}

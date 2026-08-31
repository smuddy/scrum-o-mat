import {Component, inject, OnInit} from '@angular/core';

import {fadeTranslateInstant} from '../../animation';
import {FormControl, ReactiveFormsModule, Validators} from '@angular/forms';
import {LoginService} from './login.service';
import {HeaderService} from '../../shared/header/header.service';
import {ButtonComponent} from '../../shared/ui/button.component';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [ReactiveFormsModule, ButtonComponent],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.less'],
  animations: [fadeTranslateInstant]
})
export class LoginComponent implements OnInit {
  public email = new FormControl('', [Validators.required, Validators.email]);
  public pass = new FormControl('', [Validators.required, Validators.minLength(6)]);
  public errorMessage = '';

  private loginService = inject(LoginService);
  private headerService = inject(HeaderService);

  public async ngOnInit(): Promise<void> {
    this.headerService.setBreadcrumb([{route: '/login', name: 'Anmelden'}]);
    // await this.loginService.logout();
  }

  public async login(): Promise<void> {
    if (!this.email.valid || !this.pass.valid) {
      return;
    }
    this.errorMessage = await this.loginService.login(this.email.value ?? '', this.pass.value ?? '') ?? '';
  }

  public async register(): Promise<void> {
    if (!this.email.valid || !this.pass.valid) {
      return;
    }
    this.errorMessage = await this.loginService.register(this.email.value ?? '', this.pass.value ?? '') ?? '';
  }

}

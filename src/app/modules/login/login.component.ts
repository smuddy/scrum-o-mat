import {Component, OnInit} from '@angular/core';
import {fadeTranslateInstant} from '../../animation';
import {FormControl, Validators} from '@angular/forms';
import {LoginService} from './login.service';
import {HeaderService} from '../../shared/header/header.service';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.less'],
  animations: [fadeTranslateInstant]
})
export class LoginComponent implements OnInit {
  public email = new FormControl('', [Validators.required, Validators.email]);
  public pass = new FormControl('', [Validators.required, Validators.minLength(6)]);
  public errorMessage = '';

  constructor(
    private loginService: LoginService,
    private headerService: HeaderService,
  ) {
  }

  public async ngOnInit(): Promise<void> {
    this.headerService.setBreadcrumb([{route: '/login', name: 'Anmelden'}]);
    await this.loginService.logout();
  }

  public async login(): Promise<void> {
    if (!this.email.valid || !this.pass.valid) {
      return;
    }
    this.errorMessage = await this.loginService.login(this.email.value, this.pass.value);
  }

  public async register(): Promise<void> {
    if (!this.email.valid || !this.pass.valid) {
      return;
    }
    this.errorMessage = await this.loginService.register(this.email.value, this.pass.value);
  }

}

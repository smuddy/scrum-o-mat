import {ComponentFixture, TestBed} from '@angular/core/testing';
import {NO_ERRORS_SCHEMA} from '@angular/core';
import {ReactiveFormsModule} from '@angular/forms';
import {NoopAnimationsModule} from '@angular/platform-browser/animations';

import {LoginComponent} from './login.component';
import {LoginService} from './login.service';
import {HeaderService} from '../../shared/header/header.service';

describe('LoginComponent', () => {
  let component: LoginComponent;
  let fixture: ComponentFixture<LoginComponent>;
  let loginServiceSpy: jasmine.SpyObj<LoginService>;
  let headerServiceMock: any;

  beforeEach(async () => {
    loginServiceSpy = jasmine.createSpyObj('LoginService', ['login', 'register']);
    loginServiceSpy.login.and.resolveTo(null);
    loginServiceSpy.register.and.resolveTo(null);

    headerServiceMock = {
      setBreadcrumb: jasmine.createSpy(),
    };

    await TestBed.configureTestingModule({
      declarations: [LoginComponent],
      imports: [ReactiveFormsModule, NoopAnimationsModule],
      providers: [
        {provide: LoginService, useValue: loginServiceSpy},
        {provide: HeaderService, useValue: headerServiceMock},
      ],
      schemas: [NO_ERRORS_SCHEMA],
    })
      .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(LoginComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('delegates login submit to the login service with the form values', async () => {
    component.email.setValue('user@example.com');
    component.pass.setValue('secret1');

    await component.login();

    expect(loginServiceSpy.login).toHaveBeenCalledWith('user@example.com', 'secret1');
  });

  it('delegates register submit to the login service with the form values', async () => {
    component.email.setValue('user@example.com');
    component.pass.setValue('secret1');

    await component.register();

    expect(loginServiceSpy.register).toHaveBeenCalledWith('user@example.com', 'secret1');
  });

  it('sets the error message when the login service returns a string', async () => {
    component.email.setValue('user@example.com');
    component.pass.setValue('secret1');
    loginServiceSpy.login.and.resolveTo('E-Mail Adresse oder Passwort ist falsch!');

    await component.login();

    expect(component.errorMessage).toBe('E-Mail Adresse oder Passwort ist falsch!');
  });

});

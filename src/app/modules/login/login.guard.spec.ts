import {TestBed} from '@angular/core/testing';

import {LoginGuard} from './login.guard';
import {HeaderService} from '../../shared/header/header.service';

describe('LoginGuard', () => {
  let guard: LoginGuard;
  let headerService: jasmine.SpyObj<HeaderService>;

  beforeEach(() => {
    headerService = jasmine.createSpyObj('HeaderService', ['setBreadcrumb']);

    TestBed.configureTestingModule({
      providers: [
        LoginGuard,
        {provide: HeaderService, useValue: headerService},
      ],
    });
    guard = TestBed.inject(LoginGuard);
  });

  it('should be created', () => {
    expect(guard).toBeTruthy();
  });

  it('sets the login breadcrumb and allows activation', () => {
    const result = guard.canActivate();
    expect(result).toBe(true);
    expect(headerService.setBreadcrumb).toHaveBeenCalledWith([{route: '/login', name: 'Anmelden'}]);
  });

  it('clears the breadcrumb and allows deactivation', () => {
    const result = guard.canDeactivate();
    expect(result).toBe(true);
    expect(headerService.setBreadcrumb).toHaveBeenCalledWith([]);
  });

});

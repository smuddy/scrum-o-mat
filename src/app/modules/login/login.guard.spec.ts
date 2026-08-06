import {describe, it, expect, beforeEach, vi} from 'vitest';
import {TestBed} from '@angular/core/testing';
import {ActivatedRouteSnapshot, RouterStateSnapshot} from '@angular/router';

import {loginCanActivateGuard, loginCanDeactivateGuard} from './login.guard';
import {HeaderService} from '../../shared/header/header.service';

describe('login.guard', () => {
  let headerService: {setBreadcrumb: ReturnType<typeof vi.fn>};

  beforeEach(() => {
    headerService = {setBreadcrumb: vi.fn()};

    TestBed.configureTestingModule({
      providers: [
        {provide: HeaderService, useValue: headerService},
      ],
    });
  });

  it('sets the login breadcrumb and allows activation', () => {
    const result = TestBed.runInInjectionContext(() =>
      loginCanActivateGuard({} as ActivatedRouteSnapshot, {} as RouterStateSnapshot));

    expect(result).toBe(true);
    expect(headerService.setBreadcrumb).toHaveBeenCalledWith([{route: '/login', name: 'Anmelden'}]);
  });

  it('clears the breadcrumb and allows deactivation', () => {
    const result = TestBed.runInInjectionContext(() =>
      loginCanDeactivateGuard({}, {} as ActivatedRouteSnapshot, {} as RouterStateSnapshot, {} as RouterStateSnapshot));

    expect(result).toBe(true);
    expect(headerService.setBreadcrumb).toHaveBeenCalledWith([]);
  });

});

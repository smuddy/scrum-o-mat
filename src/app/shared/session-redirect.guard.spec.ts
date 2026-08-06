import {describe, it, expect, beforeEach, vi} from 'vitest';
import {TestBed} from '@angular/core/testing';
import {ActivatedRouteSnapshot, CanActivateFn, Router, RouterStateSnapshot, UrlTree} from '@angular/router';

import {sessionRedirectGuard} from './session-redirect.guard';

describe('sessionRedirectGuard', () => {
  let router: { createUrlTree: ReturnType<typeof vi.fn> };

  const executeGuard = (route: ActivatedRouteSnapshot, state: RouterStateSnapshot) =>
    TestBed.runInInjectionContext(() => (sessionRedirectGuard as CanActivateFn)(route, state));

  beforeEach(() => {
    router = {createUrlTree: vi.fn()};

    TestBed.configureTestingModule({
      providers: [
        {provide: Router, useValue: router},
      ],
    });
  });

  it('should be created', () => {
    expect(sessionRedirectGuard).toBeTruthy();
  });

  it('redirects to the planning route when a session query param is present', () => {
    const urlTree = {} as UrlTree;
    router.createUrlTree.mockReturnValue(urlTree);
    const route = {queryParams: {session: 'abc'}} as unknown as ActivatedRouteSnapshot;

    const result = executeGuard(route, {} as RouterStateSnapshot);

    expect(result).toBe(urlTree);
    expect(router.createUrlTree).toHaveBeenCalledWith(['planning'], {queryParams: {session: 'abc'}});
  });

  it('allows activation when no session query param is present', () => {
    const route = {queryParams: {}} as unknown as ActivatedRouteSnapshot;

    const result = executeGuard(route, {} as RouterStateSnapshot);

    expect(result).toBe(true);
    expect(router.createUrlTree).not.toHaveBeenCalled();
  });

});

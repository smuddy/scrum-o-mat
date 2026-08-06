import {TestBed} from '@angular/core/testing';
import {ActivatedRouteSnapshot, Router, RouterStateSnapshot, UrlTree} from '@angular/router';

import {SessionRedirectGuard} from './session-redirect.guard';

describe('SessionRedirectGuard', () => {
  let guard: SessionRedirectGuard;
  let router: jasmine.SpyObj<Router>;

  beforeEach(() => {
    router = jasmine.createSpyObj('Router', ['createUrlTree']);

    TestBed.configureTestingModule({
      providers: [
        SessionRedirectGuard,
        {provide: Router, useValue: router},
      ],
    });
    guard = TestBed.inject(SessionRedirectGuard);
  });

  it('should be created', () => {
    expect(guard).toBeTruthy();
  });

  it('redirects to the planning route when a session query param is present', () => {
    const urlTree = {} as UrlTree;
    router.createUrlTree.and.returnValue(urlTree);
    const route = {queryParams: {session: 'abc'}} as unknown as ActivatedRouteSnapshot;

    const result = guard.canActivate(route, {} as RouterStateSnapshot);

    expect(result).toBe(urlTree);
    expect(router.createUrlTree).toHaveBeenCalledWith(['planning'], {queryParams: {session: 'abc'}});
  });

  it('allows activation when no session query param is present', () => {
    const route = {queryParams: {}} as unknown as ActivatedRouteSnapshot;

    const result = guard.canActivate(route, {} as RouterStateSnapshot);

    expect(result).toBe(true);
    expect(router.createUrlTree).not.toHaveBeenCalled();
  });

});

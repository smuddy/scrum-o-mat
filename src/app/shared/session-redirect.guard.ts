import {inject} from '@angular/core';
import {ActivatedRouteSnapshot, CanActivateFn, Router} from '@angular/router';

export const sessionRedirectGuard: CanActivateFn = (route: ActivatedRouteSnapshot) => {
  const router = inject(Router);

  return route.queryParams.session
    ? router.createUrlTree(['planning'], {queryParams: {session: route.queryParams.session}})
    : true;
};

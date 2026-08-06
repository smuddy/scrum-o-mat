import {inject} from '@angular/core';
import {CanActivateFn, CanDeactivateFn} from '@angular/router';
import {HeaderService} from '../../shared/header/header.service';

export const loginCanActivateGuard: CanActivateFn = () => {
  inject(HeaderService).setBreadcrumb([{route: '/login', name: 'Anmelden'}]);
  return true;
};

export const loginCanDeactivateGuard: CanDeactivateFn<unknown> = () => {
  inject(HeaderService).setBreadcrumb([]);
  return true;
};

import {Injectable} from '@angular/core';
import {CanActivate, CanDeactivate} from '@angular/router';
import {HeaderService} from '../../shared/header/header.service';

@Injectable({
  providedIn: 'root'
})
export class LoginGuard implements CanActivate, CanDeactivate<unknown> {
  constructor(private headerService: HeaderService) {
  }

  public canActivate(): boolean {
    this.headerService.setBreadcrumb([{route: '/login', name: 'Anmelden'}]);
    return true;
  }

  public canDeactivate(): boolean {
    this.headerService.setBreadcrumb([]);
    return true;
  }

}

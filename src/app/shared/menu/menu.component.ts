import {Component, inject, Input} from '@angular/core';
import {CommonModule} from '@angular/common';
import {Router, RouterLink} from '@angular/router';
import {FaIconComponent} from '@fortawesome/angular-fontawesome';
import {listAnimation} from '../../animation';
import {LoginService} from '../../modules/login/login.service';
import {map} from 'rxjs/operators';
import {Observable} from 'rxjs';
import {MenuService} from './menu.service';
import version from '../../../../package.json';
import {faCheck} from '@fortawesome/free-solid-svg-icons/faCheck';
import {faTimes} from '@fortawesome/free-solid-svg-icons/faTimes';
import {faDice} from '@fortawesome/free-solid-svg-icons/faDice';
import {faCalendarAlt} from '@fortawesome/free-solid-svg-icons/faCalendarAlt';

@Component({
  standalone: true,
  selector: 'app-menu',
  templateUrl: './menu.component.html',
  styleUrls: ['./menu.component.less'],
  imports: [CommonModule, RouterLink, FaIconComponent],
  animations: [listAnimation]
})
export class MenuComponent {
  @Input() visible = false;

  private loginService = inject(LoginService);
  private router = inject(Router);
  private menuService = inject(MenuService);

  public version = version.version;
  public loggedIn: Observable<boolean> = this.loginService.authState$().pipe(map(_ => !!_));
  public menuEntries$: Observable<{ name: string; action: () => void, confirm?: boolean, open?: boolean }[]> = this.menuService.menuEntries$;
  public faCheck = faCheck;
  public faTimes = faTimes;

  public faDice = faDice;
  public faCalendar = faCalendarAlt;

  async logout() {
    await this.loginService.logout();
    await this.router.navigateByUrl('/');
    this.closeMenu();
  }

  async login() {
    await this.router.navigateByUrl('/login');
    this.closeMenu();
  }

  public closeMenu = () => this.menuService.closeMenu();
}

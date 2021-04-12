import {Component, Input, OnInit} from '@angular/core';
import {listAnimation} from '../../animation';
import {LoginService} from '../../modules/login/login.service';
import {map} from 'rxjs/operators';
import {Observable} from 'rxjs';
import {MenuService} from './menu.service';
import {Router} from '@angular/router';
import {version} from '../../../../package.json';
import {faCheck} from '@fortawesome/free-solid-svg-icons/faCheck';
import {faTimes} from '@fortawesome/free-solid-svg-icons/faTimes';

@Component({
  selector: 'app-menu',
  templateUrl: './menu.component.html',
  styleUrls: ['./menu.component.less'],
  animations: [listAnimation]
})
export class MenuComponent implements OnInit {
  @Input() visible = false;
  public version = version;
  public loggedIn: Observable<boolean> = this.loginService.authState$().pipe(map(_ => !!_));
  public menuEntries$: Observable<{ name: string; action: () => void, confirm?: boolean, open?: boolean }[]>;
  public faCheck = faCheck;
  public faTimes = faTimes;


  constructor(
    private loginService: LoginService,
    private router: Router,
    private menuService: MenuService,
  ) {
    this.menuEntries$ = menuService.menuEntries$;

  }


  ngOnInit(): void {
  }

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

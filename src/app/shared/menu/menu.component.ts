import {Component, Input, OnInit} from '@angular/core';
import {listAnimation} from '../../animation';
import {LoginService} from '../../modules/login/login.service';
import {map} from 'rxjs/operators';
import {Observable} from 'rxjs';
import {MenuService} from './menu.service';
import {Router} from '@angular/router';
import { version } from '../../../../package.json';

@Component({
  selector: 'app-menu',
  templateUrl: './menu.component.html',
  styleUrls: ['./menu.component.less'],
  animations: [listAnimation]
})
export class MenuComponent implements OnInit {
  @Input() visible = false;
  public version = version;
  public loggedIn: Observable<boolean> = this.loginService.authState().pipe(map(_ => !!_));
  public menuEntries$: Observable<{ name: string; action: () => void }[]>;

  constructor(
    private loginService: LoginService,
    public router: Router,
    menuService: MenuService,
    ) {
    this.menuEntries$ = menuService.menuEntries$;

  }


  ngOnInit(): void {
  }

  async logout() {
    await this.loginService.logout();
    await this.router.navigateByUrl('/');
  }
}

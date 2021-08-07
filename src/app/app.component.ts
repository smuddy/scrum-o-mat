import {Component} from '@angular/core';
import {faBars} from '@fortawesome/free-solid-svg-icons/faBars';
import {MenuService} from './shared/menu/menu.service';
import {HeaderService} from './shared/header/header.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.less'],
})
export class AppComponent {
  public faBars = faBars;
  public menuOpen: boolean;
  public fullscreen$ = this.headerService.fullscreen$;

  constructor(
    private menuService: MenuService,
    private headerService: HeaderService,
  ) {
    menuService.menuOpen$.subscribe(_ => this.menuOpen = _);
  }

  public onClickMenuButton() {
    this.menuService.toggleMenu();
  }

  public onClickOutlet() {
    this.menuService.closeMenu();
  }
}

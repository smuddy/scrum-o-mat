import {Component, inject} from '@angular/core';
import {CommonModule} from '@angular/common';
import {RouterOutlet} from '@angular/router';
import {asapScheduler} from 'rxjs';
import {observeOn} from 'rxjs/operators';
import {IconButtonComponent} from './shared/ui/icon-button.component';
import {faBars} from '@fortawesome/free-solid-svg-icons/faBars';
import {MenuComponent} from './shared/menu/menu.component';
import {HeaderComponent} from './shared/header/header.component';
import {MenuService} from './shared/menu/menu.service';
import {HeaderService} from './shared/header/header.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule,
    RouterOutlet,
    MenuComponent,
    HeaderComponent,
    IconButtonComponent,
  ],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.less'],
})
export class AppComponent {
  private menuService = inject(MenuService);
  private headerService = inject(HeaderService);

  public faBars = faBars;
  public menuOpen: boolean;
  // observeOn(asapScheduler): verzoegert die Emission um einen Microtask, damit die
  // [class.fullscreen]-Bindung nicht im selben CD-Zyklus wechselt, in dem ein Kind
  // (guest/developer via ngOnInit) setFullscreen(true) aufruft (sonst NG0100).
  public fullscreen$ = this.headerService.fullscreen$.pipe(observeOn(asapScheduler));

  constructor() {
    this.menuService.menuOpen$.subscribe(_ => this.menuOpen = _);
  }

  public onClickMenuButton() {
    this.menuService.toggleMenu();
  }

  public onClickOutlet() {
    this.menuService.closeMenu();
  }
}

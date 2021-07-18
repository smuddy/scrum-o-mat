import {Component} from '@angular/core';
import {Router} from '@angular/router';
import {HeaderService} from './header.service';

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.less']
})
export class HeaderComponent {
  public fullscreen$ = this.headerService.fullscreen$;

  constructor(
    private router: Router,
    private headerService: HeaderService
  ) {
  }

  public moduleName(): string {
    if (this.router.url.startsWith('/planning')) return 'Scrum Poker';
    if (this.router.url.startsWith('/velocity')) return 'Sprint Planer';
    if (this.router.url.startsWith('/login')) return 'Login';
  }

}

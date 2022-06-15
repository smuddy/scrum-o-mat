import {Component} from '@angular/core';
import {Router} from '@angular/router';
import {faHome} from '@fortawesome/free-solid-svg-icons';
import {HeaderService} from './header.service';
import {fadefast} from '../../animation';

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.less'],
  animations: [fadefast],
})
export class HeaderComponent {
  public fullscreen$ = this.headerService.fullscreen$;
  public breadcrumb$ = this.headerService.breadcrumb$;
  public faHome = faHome;

  constructor(
    private router: Router,
    private headerService: HeaderService,
  ) {
  }

  public trackBy = (index, route) => route.name;
}

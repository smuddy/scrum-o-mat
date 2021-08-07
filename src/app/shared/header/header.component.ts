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
  public breadcrumb$ = this.headerService.breadcrumb$;

  constructor(
    private router: Router,
    private headerService: HeaderService,
  ) {
  }

}

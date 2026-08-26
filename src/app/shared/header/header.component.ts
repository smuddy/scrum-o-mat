import {Component, inject} from '@angular/core';
import {CommonModule} from '@angular/common';
import {Router, RouterLink} from '@angular/router';
import {FaIconComponent} from '@fortawesome/angular-fontawesome';
import {faChevronRight, faHome} from '@fortawesome/free-solid-svg-icons';
import {HeaderService} from './header.service';
import {fadefast} from '../../animation';

@Component({
  standalone: true,
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.less'],
  imports: [CommonModule, RouterLink, FaIconComponent],
  animations: [fadefast],
})
export class HeaderComponent {
  private router = inject(Router);
  private headerService = inject(HeaderService);

  public fullscreen$ = this.headerService.fullscreen$;
  public breadcrumb$ = this.headerService.breadcrumb$;
  public faHome = faHome;
  public faChevronRight = faChevronRight;

  public trackBy = (index, route) => route.name;
}

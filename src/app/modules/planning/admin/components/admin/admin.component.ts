import {Component, inject, OnInit} from '@angular/core';
import {CommonModule} from '@angular/common';
import {AdminService} from '../admin.service';
import {faExternalLinkAlt, faTrash, faUserCog} from '@fortawesome/free-solid-svg-icons';
import {Router} from '@angular/router';
import {PlanningId} from '../../../models/planning';
import {UsersComponent} from '../users/users.component';
import {IconButtonComponent} from '../../../../../shared/ui/icon-button.component';

@Component({
  selector: 'app-admin',
  standalone: true,
  imports: [CommonModule, UsersComponent, IconButtonComponent],
  templateUrl: './admin.component.html',
  styleUrls: ['./admin.component.less']
})
export class AdminComponent implements OnInit {
  public plannings: PlanningId[] = [];
  public faTrash = faTrash;
  public faUsers = faUserCog;
  public faLink = faExternalLinkAlt;
  public openUser: string;

  private adminService = inject(AdminService);
  private router = inject(Router);

  ngOnInit() {
    this.adminService.plannings.subscribe(_ => this.plannings = _);
  }

  public async goto(id: string) {
    await this.router.navigateByUrl('/planning/' + id + '/master');
  }

  public async delete(id: string) {
    await this.adminService.deletePlanning(id);
  }
}

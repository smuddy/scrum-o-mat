import {Component, inject, Input, OnInit} from '@angular/core';

import {AdminService} from '../admin.service';
import {faTrash} from '@fortawesome/free-solid-svg-icons';
import {DeveloperId} from '../../../models/delevoper';
import {IconButtonComponent} from '../../../../../shared/ui/icon-button.component';

@Component({
  selector: 'app-users',
  standalone: true,
  imports: [IconButtonComponent],
  templateUrl: './users.component.html',
  styleUrls: ['./users.component.less']
})
export class UsersComponent implements OnInit {
  @Input() planningId: string;
  public users: DeveloperId[];
  public faTrash = faTrash;

  private adminService = inject(AdminService);

  ngOnInit() {
    if (this.planningId) {
      this.adminService.getDevelopers(this.planningId).subscribe(_ => this.users = _);
    }
  }

  public async delete(id: string) {
    await this.adminService.deleteUser(this.planningId, id);
  }
}

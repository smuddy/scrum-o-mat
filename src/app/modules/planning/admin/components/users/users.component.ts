import {Component, Input, OnInit} from '@angular/core';
import {AdminService} from '../admin.service';
import {faTrash} from '@fortawesome/free-solid-svg-icons';
import {DeveloperId} from '../../../models/delevoper';

@Component({
  selector: 'app-users',
  templateUrl: './users.component.html',
  styleUrls: ['./users.component.less']
})
export class UsersComponent implements OnInit {
  @Input() planningId: string;
  public users: DeveloperId[];
  public faTrash = faTrash;

  constructor(private adminService: AdminService) {
  }

  ngOnInit() {
    if (this.planningId) {
      this.adminService.getDevelopers(this.planningId).subscribe(_ => this.users = _);
    }
  }

  public async delete(id: string) {
    await this.adminService.deleteUser(this.planningId, id);
  }
}

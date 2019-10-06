import {Component, OnInit} from '@angular/core';
import {AdminService} from '../admin.service';
import {Planning} from '../../../../models/planning';
import {faExternalLinkAlt, faTrash, faUserCog} from '@fortawesome/free-solid-svg-icons';
import {Router} from '@angular/router';

@Component({
  selector: 'app-admin',
  templateUrl: './admin.component.html',
  styleUrls: ['./admin.component.less']
})
export class AdminComponent implements OnInit {
  public plannings: { id: string, data: Planning }[] = [];
  public faTrash = faTrash;
  public faUsers = faUserCog;
  public faLink = faExternalLinkAlt;
  public openUser: string;

  constructor(private adminService: AdminService, private router: Router) {
  }

  ngOnInit() {
    this.adminService.plannings.subscribe(_ => this.plannings = _);
  }

  public async goto(id: string) {
    await this.router.navigateByUrl(id + '/master');
  }

  public async delete(id: string) {
    await this.adminService.deletePlanning(id);
  }
}

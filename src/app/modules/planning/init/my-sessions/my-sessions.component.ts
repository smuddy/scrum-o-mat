import {Component, inject, Input} from '@angular/core';
import {CommonModule} from '@angular/common';
import {RouterLink} from '@angular/router';
import {FaIconComponent} from '@fortawesome/angular-fontawesome';
import {PlanningService} from '../../planning.service';
import {fade} from '../../../../animation';
import {faTrash} from '@fortawesome/free-solid-svg-icons/faTrash';
import {PlanningId} from '../../models/planning';

@Component({
  selector: 'app-my-sessions',
  standalone: true,
  imports: [CommonModule, RouterLink, FaIconComponent],
  templateUrl: './my-sessions.component.html',
  styleUrls: ['./my-sessions.component.less'],
  animations: [fade],
})
export class MySessionsComponent {
  public faTrash = faTrash;
  @Input() plannings: PlanningId[];

  private planningService = inject(PlanningService);

  public async delete(id: string) {
    await this.planningService.deletePlanning(id);
  }

}

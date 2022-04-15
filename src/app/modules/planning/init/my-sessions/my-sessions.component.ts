import {Component, Input} from '@angular/core';
import {PlanningService} from '../../planning.service';
import {fade} from '../../../../animation';
import {faTrash} from '@fortawesome/free-solid-svg-icons/faTrash';
import {PlanningId} from '../../models/planning';

@Component({
  selector: 'app-my-sessions',
  templateUrl: './my-sessions.component.html',
  styleUrls: ['./my-sessions.component.less'],
  animations: [fade],
})
export class MySessionsComponent {
  public faTrash = faTrash;
  @Input() plannings: PlanningId[];

  constructor(
    private planningService: PlanningService,
  ) {
  }

  public async delete(id: string) {
    await this.planningService.deletePlanning(id);
  }

}

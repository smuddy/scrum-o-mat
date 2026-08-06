import {Component, inject, Input, OnInit} from '@angular/core';

import {FaIconComponent} from '@fortawesome/angular-fontawesome';
import {faTimes, faTrash} from '@fortawesome/free-solid-svg-icons';
import {ActivatedRoute, Router} from '@angular/router';
import {AdminService} from '../../../admin/components/admin.service';
import {listAnimation} from '../../../../../animation';
import {PlanningService, renderStoryPoint} from '../../../planning.service';
import {StoryPoints} from '../../../models/storyPoints';
import {Developer, DeveloperId} from '../../../models/delevoper';

@Component({
  selector: 'app-developers',
  standalone: true,
  imports: [FaIconComponent],
  templateUrl: './developers.component.html',
  styleUrls: ['./developers.component.less'],
  animations: [listAnimation],
})
export class DevelopersComponent implements OnInit {
  @Input() public developers: DeveloperId[];
  @Input() public showResults: boolean = false;
  @Input() public showIndicators: boolean = false;
  public faTimes = faTimes;
  public faTrash = faTrash;
  public planningId: string;


  public users: { id: string, data: Developer }[];

  private activatedRoute = inject(ActivatedRoute);
  private planningService = inject(PlanningService);
  private router = inject(Router);
  private adminService = inject(AdminService);

  // Ersetzt den frueheren |orderBy:'name'-Pipe: liefert eine nach Name sortierte Kopie.
  public get sortedDevelopers(): DeveloperId[] {
    return (this.developers ?? []).slice()
      .sort((a, b) => (a.name ?? '').localeCompare(b.name ?? ''));
  }

  constructor() {
    this.activatedRoute.params.subscribe(_ => this.planningId = _.planningId);
  }

  ngOnInit() {
    // added
    if (this.planningId) {
      this.adminService.getDevelopers(this.planningId).subscribe(_ => this.developers = _);
    }
  }

  public async delete(id: string) {
    await this.adminService.deleteUser(this.planningId, id);
  }

  renderStoryPoints(storyPoints: StoryPoints): string {
    return renderStoryPoint(storyPoints);

  }

  public devIsReady(storyPoints: StoryPoints) {
    const hasStoryPoints = storyPoints != null;
    const unsure = storyPoints === StoryPoints.unsure;

    return (!this.showResults && hasStoryPoints) || (this.showResults && !unsure);
  }

  public trackById = (index: number, item: DeveloperId) => item.id;
}

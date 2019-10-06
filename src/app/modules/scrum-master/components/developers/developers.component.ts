import {Component, Input} from '@angular/core';
import {renderStorypoint} from '../../../../services/planning.service';
import {Developer} from '../../../../models/delevoper';
import {Storypoints} from '../../../../models/storypoints';
import {faTimes} from '@fortawesome/free-solid-svg-icons';

@Component({
  selector: 'app-developers',
  templateUrl: './developers.component.html',
  styleUrls: ['./developers.component.less']
})
export class DevelopersComponent {
  @Input() public developers: Developer[];
  @Input() public showResults: boolean;
  public faTimes = faTimes;

  renderStorypoints(storypoints: Storypoints): string {
    return renderStorypoint(storypoints);
  }

  public devIsReady(storypoints: Storypoints) {
    const hasStorypoints = storypoints != null;
    const unsure = storypoints === Storypoints.unsure;

    return (!this.showResults && hasStorypoints) || (this.showResults && !unsure);
  }
}

import {Component, Input} from '@angular/core';
import {StoryPoints} from '../../../models/storyPoints';
import {renderStoryPoint} from '../../../planning.service';

@Component({
  selector: 'app-card',
  templateUrl: './card.component.html',
  styleUrls: ['./card.component.less']
})
export class CardComponent {
  @Input() storyPoint: StoryPoints;
  public renderStoryPoint = renderStoryPoint;
}

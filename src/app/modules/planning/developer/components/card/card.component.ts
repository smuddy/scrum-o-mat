import {Component, Input} from '@angular/core';
import {Storypoints} from '../../../models/storypoints';
import {renderStorypoint} from '../../../planning.service';

@Component({
  selector: 'app-card',
  templateUrl: './card.component.html',
  styleUrls: ['./card.component.less']
})
export class CardComponent {
  @Input() storypoint: Storypoints;
  public renderStorypoint = renderStorypoint;
}

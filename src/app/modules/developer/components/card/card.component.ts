import {Component, Input, OnInit} from '@angular/core';
import {Storypoints} from '../../../../models/storypoints';
import {renderStorypoint} from '../../../../services/planning.service';

@Component({
  selector: 'app-card',
  templateUrl: './card.component.html',
  styleUrls: ['./card.component.less']
})
export class CardComponent implements OnInit {
  @Input() storypoint: Storypoints;
  public renderStorypoint = renderStorypoint;

  constructor() {
  }

  ngOnInit() {
  }

}

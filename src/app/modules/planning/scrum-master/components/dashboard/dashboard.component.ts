import {Component, Input} from '@angular/core';
import {faChalkboardTeacher, faCheckDouble, faComments} from '@fortawesome/free-solid-svg-icons';
import {renderStorypoint} from '../../../planning.service';
import {Storypoints} from '../../../models/storypoints';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.less']
})
export class DashboardComponent {
  @Input() public estimateSucceeded: boolean;
  @Input() public estimateFailed: boolean;
  @Input() public estimateRequested: boolean;
  @Input() public storypoints: Storypoints;

  public faTachometer = faChalkboardTeacher;
  public faSuccess = faCheckDouble;
  public faFailed = faComments;

  public renderStorypoint = () => renderStorypoint(this.storypoints);

}

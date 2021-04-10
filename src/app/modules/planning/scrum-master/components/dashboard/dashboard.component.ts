import {Component, Input} from '@angular/core';
import {faChalkboardTeacher, faCheckDouble, faComments} from '@fortawesome/free-solid-svg-icons';
import {renderStoryPoint} from '../../../planning.service';
import {StoryPoints} from '../../../models/storyPoints';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.less']
})
export class DashboardComponent {
  @Input() public estimateSucceeded: boolean;
  @Input() public estimateFailed: boolean;
  @Input() public estimateRequested: boolean;
  @Input() public storyPoints: StoryPoints;

  public faTachometer = faChalkboardTeacher;
  public faSuccess = faCheckDouble;
  public faFailed = faComments;

  public renderStoryPoint = () => renderStoryPoint(this.storyPoints);

}

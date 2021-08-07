import {Component} from '@angular/core';
import {fadeTranslateInstant} from '../../animation';

@Component({
  selector: 'app-init',
  templateUrl: './init.component.html',
  styleUrls: ['./init.component.less'],
  animations: [fadeTranslateInstant]
})
export class InitComponent {


}

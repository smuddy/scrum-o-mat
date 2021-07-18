import {Component, OnInit} from '@angular/core';
import {fadeTranslateInstant} from '../../animation';
import {FormControl, Validators} from '@angular/forms';

@Component({
  selector: 'app-init',
  templateUrl: './init.component.html',
  styleUrls: ['./init.component.less'],
  animations: [fadeTranslateInstant]
})
export class InitComponent {



}

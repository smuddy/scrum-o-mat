import {Component} from '@angular/core';
import {VelocityService} from './velocity.service';
import {Observable} from 'rxjs';
import {Velocity} from './models/velocity';

@Component({
  selector: 'app-velocity',
  templateUrl: './velocity.component.html',
  styleUrls: ['./velocity.component.less']
})
export class VelocityComponent {
  public velocity$: Observable<Velocity>;

  constructor(
    private velocityService: VelocityService,
  ) {
    this.velocity$ = velocityService.getVelocity$();
  }

  public addSprint(): void {
    this.velocityService.addSprint();
  }
}

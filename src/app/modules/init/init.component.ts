import {Component} from '@angular/core';
import {cardTransition, fadeTranslateInstant} from '../../animation';
import {HeaderService} from '../../shared/header/header.service';
import {faCalendarAlt} from '@fortawesome/free-solid-svg-icons/faCalendarAlt';
import {faDice} from '@fortawesome/free-solid-svg-icons/faDice';

@Component({
  selector: 'app-init',
  templateUrl: './init.component.html',
  styleUrls: ['./init.component.less'],
  animations: [fadeTranslateInstant, cardTransition]
})
export class InitComponent {
  public faDice = faDice;
  public faCalendar = faCalendarAlt;

  constructor(
    private headerService: HeaderService,
  ) {
  }


  public ngOnInit(): void {
    this.headerService.setBreadcrumb([]);
  }

}

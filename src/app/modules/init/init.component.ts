import {Component, inject, OnInit} from '@angular/core';
import {RouterLink} from '@angular/router';
import {FaIconComponent} from '@fortawesome/angular-fontawesome';
import {cardTransition, fadeTranslateInstant} from '../../animation';
import {HeaderService} from '../../shared/header/header.service';
import {faCalendarAlt} from '@fortawesome/free-solid-svg-icons/faCalendarAlt';
import {faDice} from '@fortawesome/free-solid-svg-icons/faDice';

@Component({
  selector: 'app-init',
  standalone: true,
  imports: [RouterLink, FaIconComponent],
  templateUrl: './init.component.html',
  styleUrls: ['./init.component.less'],
  animations: [fadeTranslateInstant, cardTransition]
})
export class InitComponent implements OnInit {
  public faDice = faDice;
  public faCalendar = faCalendarAlt;

  private headerService = inject(HeaderService);

  public ngOnInit(): void {
    this.headerService.setBreadcrumb([]);
  }

}

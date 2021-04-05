import {Component, EventEmitter, Input, OnDestroy, OnInit, Output} from '@angular/core';
import {Subscription} from 'rxjs';

@Component({
  selector: 'app-edit-date',
  templateUrl: './edit-date.component.html',
  styleUrls: ['./edit-date.component.less']
})
export class EditDateComponent implements OnInit, OnDestroy {

  public boundDate: Date;
  @Output() dateChanged = new EventEmitter<Date>();
  private sub: Subscription;

  @Input() set date(date: Date) {
    console.log(date);
    this.boundDate = date;
  }

  ngOnInit = (): void => {
  };

  ngOnDestroy = (): void => this.sub.unsubscribe();

  onDateChange($event: any) {
    this.dateChanged.emit($event.target.valueAsDate);
  }
}

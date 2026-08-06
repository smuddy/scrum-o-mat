import {Component, EventEmitter, Input, Output} from '@angular/core';
import {CommonModule} from '@angular/common';

@Component({
  selector: 'app-edit-date',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './edit-date.component.html',
  styleUrls: ['./edit-date.component.less']
})
export class EditDateComponent {

  public boundDate: Date;
  @Output() dateChanged = new EventEmitter<Date>();

  @Input() set date(date: Date) {
    this.boundDate = date;
  }

  onDateChange($event: any) {
    this.dateChanged.emit($event.target.valueAsDate);
  }
}

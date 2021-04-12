import {Component, EventEmitter, Input, OnDestroy, OnInit, Output} from '@angular/core';
import {FormControl} from '@angular/forms';
import {Subscription} from 'rxjs';

@Component({
  selector: 'app-edit-number',
  templateUrl: './edit-number.component.html',
  styleUrls: ['./edit-number.component.less']
})
export class EditNumberComponent implements OnInit, OnDestroy {
  public numControl = new FormControl(0, {updateOn: 'blur'});
  @Output() numberChanged = new EventEmitter<number>();
  private sub: Subscription;

  @Input() set number(n: number) {
    this.numControl.patchValue(n, {emitEvent: false});
  }

  ngOnInit(): void {
    this.sub = this.numControl.valueChanges.subscribe(_ => this.numberChanged.emit(_));
  }

  ngOnDestroy = (): void => this.sub.unsubscribe();
}

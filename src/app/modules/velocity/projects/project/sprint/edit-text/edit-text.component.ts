import {Component, EventEmitter, Input, OnDestroy, OnInit, Output} from '@angular/core';
import {FormControl, ReactiveFormsModule} from '@angular/forms';
import {Subscription} from 'rxjs';

@Component({
  selector: 'app-edit-text',
  standalone: true,
  imports: [ReactiveFormsModule],
  templateUrl: './edit-text.component.html',
  styleUrls: ['./edit-text.component.less']
})
export class EditTextComponent implements OnInit, OnDestroy {
  public textControl = new FormControl('', {updateOn: 'blur'});
  @Output() textChanged = new EventEmitter<string>();
  @Input() public noUnderscore = false;
  @Input() public placeholder: string;
  @Input() public width: string = '100%';
  private sub: Subscription;

  @Input() set text(t: string) {
    this.textControl.patchValue(t, {emitEvent: false});
  }

  public ngOnInit(): void {
    this.sub = this.textControl.valueChanges.subscribe(_ => this.textChanged.emit(_));
  }

  ngOnDestroy = (): void => this.sub.unsubscribe();
}

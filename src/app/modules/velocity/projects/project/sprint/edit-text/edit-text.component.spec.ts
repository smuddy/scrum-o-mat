import {describe, it, expect, beforeEach, vi} from 'vitest';
import {ComponentFixture, TestBed} from '@angular/core/testing';
import {NO_ERRORS_SCHEMA} from '@angular/core';
import {ReactiveFormsModule} from '@angular/forms';

import {EditTextComponent} from './edit-text.component';

describe('EditTextComponent', () => {
  let component: EditTextComponent;
  let fixture: ComponentFixture<EditTextComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EditTextComponent, ReactiveFormsModule],
      schemas: [NO_ERRORS_SCHEMA],
    })
      .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(EditTextComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('patches the incoming text into the control without emitting', () => {
    const emitSpy = vi.spyOn(component.textChanged, 'emit');

    component.text = 'hello';

    expect(component.textControl.value).toBe('hello');
    expect(emitSpy).not.toHaveBeenCalled();
  });

  it('emits the changed text once initialised', () => {
    const emitSpy = vi.spyOn(component.textChanged, 'emit');

    component.textControl.setValue('changed');

    expect(emitSpy).toHaveBeenCalledWith('changed');
  });

  it('unsubscribes from the control on destroy', () => {
    const emitSpy = vi.spyOn(component.textChanged, 'emit');

    component.ngOnDestroy();
    component.textControl.setValue('after destroy');

    expect(emitSpy).not.toHaveBeenCalled();
  });

});

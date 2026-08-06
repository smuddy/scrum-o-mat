import {describe, it, expect, beforeEach, vi} from 'vitest';
import {ComponentFixture, TestBed} from '@angular/core/testing';
import {NO_ERRORS_SCHEMA} from '@angular/core';
import {ReactiveFormsModule} from '@angular/forms';

import {EditNumberComponent} from './edit-number.component';

describe('EditNumberComponent', () => {
  let component: EditNumberComponent;
  let fixture: ComponentFixture<EditNumberComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EditNumberComponent, ReactiveFormsModule],
      schemas: [NO_ERRORS_SCHEMA],
    })
      .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(EditNumberComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('patches the incoming number into the control without emitting', () => {
    const emitSpy = vi.spyOn(component.numberChanged, 'emit');

    component.number = 42;

    expect(component.numControl.value).toBe(42);
    expect(emitSpy).not.toHaveBeenCalled();
  });

  it('emits the changed number once initialised', () => {
    const emitSpy = vi.spyOn(component.numberChanged, 'emit');

    component.numControl.setValue(7);

    expect(emitSpy).toHaveBeenCalledWith(7);
  });

  it('unsubscribes from the control on destroy', () => {
    const emitSpy = vi.spyOn(component.numberChanged, 'emit');

    component.ngOnDestroy();
    component.numControl.setValue(99);

    expect(emitSpy).not.toHaveBeenCalled();
  });

});

import {ComponentFixture, TestBed} from '@angular/core/testing';
import {NO_ERRORS_SCHEMA} from '@angular/core';

import {EditDateComponent} from './edit-date.component';

describe('EditDateComponent', () => {
  let component: EditDateComponent;
  let fixture: ComponentFixture<EditDateComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [EditDateComponent],
      schemas: [NO_ERRORS_SCHEMA],
    })
      .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(EditDateComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('sets the bound date from the incoming date without emitting', () => {
    const emitSpy = spyOn(component.dateChanged, 'emit');
    const date = new Date('2024-01-15');

    component.date = date;

    expect(component.boundDate).toBe(date);
    expect(emitSpy).not.toHaveBeenCalled();
  });

  it('emits the changed date when the native change event fires', () => {
    const emitSpy = spyOn(component.dateChanged, 'emit');
    const changedDate = new Date('2024-02-20');

    component.onDateChange({target: {valueAsDate: changedDate}});

    expect(emitSpy).toHaveBeenCalledWith(changedDate);
  });

});

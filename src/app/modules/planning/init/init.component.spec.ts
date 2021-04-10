import {ComponentFixture, TestBed, waitForAsync} from '@angular/core/testing';

import {InitComponent} from './init.component';

describe('InitComponent', () => {
  let component: InitComponent;
  let fixture: ComponentFixture<InitComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [InitComponent]
    })
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(InitComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

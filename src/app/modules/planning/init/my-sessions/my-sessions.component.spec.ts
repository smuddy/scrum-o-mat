import {ComponentFixture, TestBed} from '@angular/core/testing';
import {NO_ERRORS_SCHEMA} from '@angular/core';
import {NoopAnimationsModule} from '@angular/platform-browser/animations';

import {MySessionsComponent} from './my-sessions.component';
import {PlanningService} from '../../planning.service';

describe('MySessionsComponent', () => {
  let component: MySessionsComponent;
  let fixture: ComponentFixture<MySessionsComponent>;
  let planningService: any;

  beforeEach(async () => {
    planningService = {
      deletePlanning: jasmine.createSpy('deletePlanning').and.resolveTo(),
    };

    await TestBed.configureTestingModule({
      declarations: [MySessionsComponent],
      imports: [NoopAnimationsModule],
      providers: [
        {provide: PlanningService, useValue: planningService},
      ],
      schemas: [NO_ERRORS_SCHEMA],
    })
      .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(MySessionsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('deletes a planning via the planning service', async () => {
    await component.delete('p1');

    expect(planningService.deletePlanning).toHaveBeenCalledWith('p1');
  });

  it('exposes the plannings input', () => {
    const plannings = [{id: 'p1', subject: 'Sprint 1'}] as any;

    component.plannings = plannings;

    expect(component.plannings).toBe(plannings);
  });

});

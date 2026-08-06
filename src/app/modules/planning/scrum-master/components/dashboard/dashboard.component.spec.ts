import {ComponentFixture, TestBed} from '@angular/core/testing';
import {NO_ERRORS_SCHEMA} from '@angular/core';

import {DashboardComponent} from './dashboard.component';
import {StoryPoints} from '../../../models/storyPoints';

describe('DashboardComponent', () => {
  let component: DashboardComponent;
  let fixture: ComponentFixture<DashboardComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [DashboardComponent],
      schemas: [NO_ERRORS_SCHEMA],
    })
      .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(DashboardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('renders the current story points using the shared formatter', () => {
    component.storyPoints = StoryPoints.s8;

    expect(component.renderStoryPoint()).toBe('8');
  });

  it('renders nothing for an unset story point', () => {
    component.storyPoints = undefined;

    expect(component.renderStoryPoint()).toBeNull();
  });

});

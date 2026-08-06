import {ComponentFixture, TestBed} from '@angular/core/testing';
import {NO_ERRORS_SCHEMA} from '@angular/core';

import {CardComponent} from './card.component';
import {StoryPoints} from '../../../models/storyPoints';

describe('CardComponent', () => {
  let component: CardComponent;
  let fixture: ComponentFixture<CardComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [CardComponent],
      schemas: [NO_ERRORS_SCHEMA],
    })
      .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(CardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('exposes the storyPoint input', () => {
    component.storyPoint = StoryPoints.s8;

    expect(component.storyPoint).toBe(StoryPoints.s8);
  });

  it('renders the story point label', () => {
    expect(component.renderStoryPoint(StoryPoints.s2)).toBe('2');
    expect(component.renderStoryPoint(StoryPoints.unsure)).toBe('?');
  });

  it('returns null for an unknown story point', () => {
    expect(component.renderStoryPoint(999 as StoryPoints)).toBeNull();
  });

});

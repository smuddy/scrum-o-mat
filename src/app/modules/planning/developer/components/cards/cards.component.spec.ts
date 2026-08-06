import {ComponentFixture, TestBed} from '@angular/core/testing';
import {NO_ERRORS_SCHEMA} from '@angular/core';

import {CardsComponent} from './cards.component';
import {StoryPoints} from '../../../models/storyPoints';

describe('CardsComponent', () => {
  let component: CardsComponent;
  let fixture: ComponentFixture<CardsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [CardsComponent],
      schemas: [NO_ERRORS_SCHEMA],
    })
      .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(CardsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('builds the list of cards from all StoryPoints values', () => {
    expect(component.cards.length).toBe(13);
    expect(component.cards).toContain(StoryPoints.sHalf);
    expect(component.cards).toContain(StoryPoints.coffee);
  });

  it('has no selected card after init', () => {
    expect(component.selectedCard).toBeNull();
  });

  it('selects a card and emits it', () => {
    const emitSpy = spyOn(component.cardSelected, 'emit');

    component.selectCard(StoryPoints.s5);

    expect(component.selectedCard).toBe(StoryPoints.s5);
    expect(emitSpy).toHaveBeenCalledWith(StoryPoints.s5);
  });

  it('deselects a card when the same card is selected again', () => {
    const emitSpy = spyOn(component.cardSelected, 'emit');
    component.selectCard(StoryPoints.s5);

    component.selectCard(StoryPoints.s5);

    expect(component.selectedCard).toBeNull();
    expect(emitSpy).toHaveBeenCalledWith(null);
  });

  it('switches the selection when a different card is selected', () => {
    const emitSpy = spyOn(component.cardSelected, 'emit');
    component.selectCard(StoryPoints.s5);

    component.selectCard(StoryPoints.s8);

    expect(component.selectedCard).toBe(StoryPoints.s8);
    expect(emitSpy).toHaveBeenCalledWith(StoryPoints.s8);
  });

});

import {Component, EventEmitter, OnInit, Output} from '@angular/core';
import {StoryPoints} from '../../../models/storyPoints';

@Component({
  selector: 'app-cards',
  templateUrl: './cards.component.html',
  styleUrls: ['./cards.component.less'],
})
export class CardsComponent implements OnInit {
  @Output() cardSelected = new EventEmitter<StoryPoints>();
  public cards: StoryPoints[] = [];
  public selectedCard: StoryPoints;

  constructor() {
    for (const item in StoryPoints) {
      if (isNaN(Number(item))) {
        const storyPoint = StoryPoints[item] as any;
        this.cards.push(storyPoint);
      }
    }
  }

  ngOnInit() {
    this.selectedCard = null;
  }

  public selectCard(card: StoryPoints): void {
    this.selectedCard = this.selectedCard === card ? null : card;
    this.cardSelected.emit(this.selectedCard);
  }
}

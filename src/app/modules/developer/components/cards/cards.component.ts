import {Component, EventEmitter, OnInit, Output} from '@angular/core';
import {Storypoints} from '../../../../models/storypoints';

@Component({
  selector: 'app-cards',
  templateUrl: './cards.component.html',
  styleUrls: ['./cards.component.less']
})
export class CardsComponent implements OnInit {
  @Output() cardSelected = new EventEmitter<Storypoints>();
  public cards: Storypoints[] = [];
  public selectedCard: Storypoints;

  constructor() {
    for (const item in Storypoints) {
      if (isNaN(Number(item))) {
        const storypoint = Storypoints[item] as any;
        this.cards.push(storypoint);
      }
    }
  }

  ngOnInit() {
    this.selectedCard = null;
  }

  public selectCard(card: Storypoints): void {
    this.selectedCard = this.selectedCard === card ? null : card;
    this.cardSelected.emit(this.selectedCard);
  }
}

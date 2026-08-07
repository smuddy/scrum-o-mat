import {Component, inject, Input, OnInit} from '@angular/core';
import {CommonModule} from '@angular/common';
import {FormsModule} from '@angular/forms';
import {Observable} from 'rxjs';
import {map} from 'rxjs/operators';
import {FaIconComponent} from '@fortawesome/angular-fontawesome';
import {faPlus} from '@fortawesome/free-solid-svg-icons/faPlus';
import {faPen} from '@fortawesome/free-solid-svg-icons/faPen';
import {faTrash} from '@fortawesome/free-solid-svg-icons/faTrash';
import {faCheck} from '@fortawesome/free-solid-svg-icons/faCheck';
import {faTimes} from '@fortawesome/free-solid-svg-icons/faTimes';

import {RetroService} from '../../retro.service';
import {RetroActionItemId} from '../../models/retro';

// Ticket 17: Action-Items/To-dos -- eigene Sektion unter dem Board (keine Spalte, siehe
// board.component.html), self-contained analog zu TimerControlComponent: haelt eine eigene
// Subscription/Observable auf die live Action-Items (RetroService.getActionItems$).
@Component({
  selector: 'app-action-items',
  standalone: true,
  imports: [CommonModule, FormsModule, FaIconComponent],
  templateUrl: './action-items.component.html',
  styleUrls: ['./action-items.component.less'],
})
export class ActionItemsComponent implements OnInit {
  // boardId ist ein @Input und steht bei Feld-Initialisierern im Konstruktor noch nicht zur
  // Verfuegung -- items$ wird deshalb erst in ngOnInit aufgebaut (analog zu
  // TimerControlComponent.ngOnInit, siehe dort fuer die ausfuehrliche Begruendung).
  @Input() boardId!: string;
  @Input() isOwner = false;
  @Input() myUid = '';

  private retroService = inject(RetroService);

  public faPlus = faPlus;
  public faPen = faPen;
  public faTrash = faTrash;
  public faCheck = faCheck;
  public faTimes = faTimes;

  public items$!: Observable<RetroActionItemId[]>;

  public newItemText = '';
  public newItemAssignee = '';

  public editingItemId: string | null = null;
  public editingText = '';
  public editingAssignee = '';

  public ngOnInit(): void {
    this.items$ = this.retroService.getActionItems$(this.boardId).pipe(
      map(items => ActionItemsComponent.sortItems(items)),
    );
  }

  // Bearbeiten/Loeschen ist Autor- oder Owner-Sache, Anlegen/Togglen darf jeder (siehe Template).
  public canEdit(item: RetroActionItemId): boolean {
    return item.authorId === this.myUid || this.isOwner;
  }

  public async addItem(): Promise<void> {
    const text = this.newItemText.trim();
    if (!text) {
      return;
    }
    const assignee = this.newItemAssignee.trim();
    await this.retroService.addActionItem(this.boardId, text, assignee ? assignee : undefined);
    this.newItemText = '';
    this.newItemAssignee = '';
  }

  // Togglen ist fuer alle Teilnehmer erlaubt, unabhaengig von canEdit().
  public async toggleDone(item: RetroActionItemId): Promise<void> {
    await this.retroService.toggleActionItemDone(this.boardId, item.id, !item.done);
  }

  public startEdit(item: RetroActionItemId): void {
    this.editingItemId = item.id;
    this.editingText = item.text;
    this.editingAssignee = item.assignee ?? '';
  }

  public cancelEdit(): void {
    this.editingItemId = null;
    this.editingText = '';
    this.editingAssignee = '';
  }

  public async saveEdit(itemId: string): Promise<void> {
    const text = this.editingText.trim();
    if (!text) {
      return;
    }
    await this.retroService.updateActionItem(this.boardId, itemId, {text, assignee: this.editingAssignee.trim()});
    this.cancelEdit();
  }

  public async deleteItem(itemId: string): Promise<void> {
    if (this.editingItemId === itemId) {
      this.cancelEdit();
    }
    await this.retroService.deleteActionItem(this.boardId, itemId);
  }

  // Offene Action-Items zuerst (nach order), erledigte sinken ans Ende (ebenfalls nach order) --
  // bleiben so als Nachweis sichtbar, ohne die offene Liste zuzumuellen.
  private static sortItems(items: RetroActionItemId[]): RetroActionItemId[] {
    return [...items].sort((a, b) => {
      if (a.done !== b.done) {
        return a.done ? 1 : -1;
      }
      return a.order - b.order;
    });
  }
}

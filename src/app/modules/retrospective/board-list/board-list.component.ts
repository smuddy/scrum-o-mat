import {Component, inject, OnDestroy, OnInit} from '@angular/core';
import {CommonModule} from '@angular/common';
import {FormsModule} from '@angular/forms';
import {Router, RouterLink} from '@angular/router';
import {Observable} from 'rxjs';
import {map, shareReplay} from 'rxjs/operators';
import {FaIconComponent} from '@fortawesome/angular-fontawesome';
import {faPen} from '@fortawesome/free-solid-svg-icons/faPen';
import {faCheck} from '@fortawesome/free-solid-svg-icons/faCheck';
import {faTimes} from '@fortawesome/free-solid-svg-icons/faTimes';
import {faBoxArchive} from '@fortawesome/free-solid-svg-icons/faBoxArchive';
import {faTrashCanArrowUp} from '@fortawesome/free-solid-svg-icons/faTrashCanArrowUp';
import {faChevronDown} from '@fortawesome/free-solid-svg-icons/faChevronDown';
import {faChevronUp} from '@fortawesome/free-solid-svg-icons/faChevronUp';
import {RetroService} from '../retro.service';
import {RetroBoardId} from '../models/retro';
import {HeaderService} from '../../../shared/header/header.service';
import {MenuService} from '../../../shared/menu/menu.service';
import {cardTransition, fadeTranslateInstant} from '../../../animation';

@Component({
  selector: 'app-retro-board-list',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, FaIconComponent],
  templateUrl: './board-list.component.html',
  styleUrls: ['./board-list.component.less'],
  animations: [fadeTranslateInstant, cardTransition],
})
export class BoardListComponent implements OnInit, OnDestroy {
  private retroService = inject(RetroService);
  private headerService = inject(HeaderService);
  private menuService = inject(MenuService);
  private router = inject(Router);

  public faPen = faPen;
  public faCheck = faCheck;
  public faTimes = faTimes;
  public faBoxArchive = faBoxArchive;
  public faTrashCanArrowUp = faTrashCanArrowUp;
  public faChevronDown = faChevronDown;
  public faChevronUp = faChevronUp;

  // Ticket 12: Id des Boards, dessen Titel gerade inline bearbeitet wird (null = keine Bearbeitung aktiv).
  public editingBoardId: string | null = null;
  public editingTitle = '';

  // Ticket 12: Archiv-Abschnitt ist standardmaessig eingeklappt (Nebenbereich, keine primaere Ansicht).
  public archivedExpanded = false;

  // Alle Boards des Nutzers, sortiert wie bisher (neueste zuerst nach created, Fallback modified).
  // shareReplay(1): boards$ und archivedBoards$ leiten beide von diesem Stream ab -- ohne shareReplay
  // wuerde jeder der beiden Konsumenten (siehe Template, je ein async-Pipe) eine eigene Subscription
  // (und damit einen eigenen Firestore-Listener via retroService.listMyBoards$) aufbauen.
  private allBoards$: Observable<RetroBoardId[]> = this.retroService.listMyBoards$.pipe(
    map(boards => [...boards].sort((a, b) => BoardListComponent.createdMillis(b) - BoardListComponent.createdMillis(a))),
    shareReplay(1),
  );

  // Aktive Boards (Hauptliste): alles ohne archived-Flag, Sortierung bleibt erhalten (created desc).
  public boards$: Observable<RetroBoardId[]> = this.allBoards$.pipe(
    map(boards => boards.filter(board => !board.archived)),
  );

  // Archivierte Boards (eigener, einklappbarer Abschnitt), gleiche Sortierung.
  public archivedBoards$: Observable<RetroBoardId[]> = this.allBoards$.pipe(
    map(boards => boards.filter(board => board.archived)),
  );

  // Normalisiert created/modified (Firestore-Timestamp mit toDate(), Date oder String) zu Millis.
  private static createdMillis(board: RetroBoardId): number {
    const value: any = board.created ?? board.modified;
    if (!value) {
      return 0;
    }
    if (typeof value.toDate === 'function') {
      return value.toDate().getTime();
    }
    return new Date(value).getTime();
  }

  public ngOnInit(): void {
    this.menuService.addCustomAction('Neues Board anlegen', () => this.newBoard());
    this.headerService.setBreadcrumb([{route: '/retrospective', name: 'Retrospektive'}]);
  }

  public ngOnDestroy(): void {
    this.menuService.resetCustomActions();
  }

  public newBoard(): void {
    this.router.navigateByUrl('/retrospective/new');
  }

  public toggleArchivedSection(): void {
    this.archivedExpanded = !this.archivedExpanded;
  }

  public startEdit(board: RetroBoardId): void {
    this.editingBoardId = board.id;
    this.editingTitle = board.title;
  }

  public cancelEdit(): void {
    this.editingBoardId = null;
    this.editingTitle = '';
  }

  public async saveEdit(boardId: string): Promise<void> {
    const title = this.editingTitle.trim();
    if (!title) {
      return;
    }
    await this.retroService.renameBoard(boardId, title);
    this.cancelEdit();
  }

  // Toggle: aktives Board -> archivieren, archiviertes Board -> wiederherstellen.
  public async toggleArchived(board: RetroBoardId): Promise<void> {
    if (this.editingBoardId === board.id) {
      this.cancelEdit();
    }
    await this.retroService.setArchived(board.id, !board.archived);
  }
}

import {Component, inject, OnDestroy, OnInit} from '@angular/core';
import {CommonModule} from '@angular/common';
import {FormsModule} from '@angular/forms';
import {Router, RouterLink} from '@angular/router';
import {combineLatest, Observable} from 'rxjs';
import {map, shareReplay} from 'rxjs/operators';
import {FaIconComponent} from '@fortawesome/angular-fontawesome';
import {faPen} from '@fortawesome/free-solid-svg-icons/faPen';
import {faCheck} from '@fortawesome/free-solid-svg-icons/faCheck';
import {faTimes} from '@fortawesome/free-solid-svg-icons/faTimes';
import {faBoxArchive} from '@fortawesome/free-solid-svg-icons/faBoxArchive';
import {faTrashCanArrowUp} from '@fortawesome/free-solid-svg-icons/faTrashCanArrowUp';
import {faTrash} from '@fortawesome/free-solid-svg-icons/faTrash';
import {faLayerGroup} from '@fortawesome/free-solid-svg-icons/faLayerGroup';
import {faChevronDown} from '@fortawesome/free-solid-svg-icons/faChevronDown';
import {faChevronUp} from '@fortawesome/free-solid-svg-icons/faChevronUp';
import {RetroService} from '../retro.service';
import {RetroBoardId, RetroGroupId} from '../models/retro';
import {HeaderService} from '../../../shared/header/header.service';
import {MenuService} from '../../../shared/menu/menu.service';
import {cardTransition, fadeTranslateInstant} from '../../../animation';

// Gruppen-Feature: eine Gruppe in der Uebersicht + die Anzahl ihrer Boards (Basis fuer die Gruppen-Karte).
interface GroupCardView {
  group: RetroGroupId;
  boardCount: number;
}

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
  public faTrash = faTrash;
  public faLayerGroup = faLayerGroup;
  public faChevronDown = faChevronDown;
  public faChevronUp = faChevronUp;

  // Ticket 12: Id des Boards, dessen Titel gerade inline bearbeitet wird (null = keine Bearbeitung aktiv).
  public editingBoardId: string | null = null;
  public editingTitle = '';

  // Gruppen-Feature: Inline-Umbenennung einer Gruppe (analog zum Board-Rename).
  public editingGroupId: string | null = null;
  public editingGroupName = '';

  // Gruppen-Feature: Inline-Anlage einer neuen Gruppe (per Seitenleisten-Aktion aufgeklappt).
  public creatingGroup = false;
  public newGroupName = '';

  // Ticket 12: Archiv-Abschnitt ist standardmaessig eingeklappt (Nebenbereich, keine primaere Ansicht).
  public archivedExpanded = false;

  // Alle Boards des Nutzers, sortiert wie bisher (neueste zuerst nach created, Fallback modified).
  // shareReplay(1): mehrere Konsumenten (boards$, archivedBoards$, groupViews$) leiten davon ab -- ohne
  // shareReplay wuerde jeder Konsument eine eigene Subscription (Firestore-Listener) aufbauen.
  private allBoards$: Observable<RetroBoardId[]> = this.retroService.listMyBoards$.pipe(
    map(boards => [...boards].sort((a, b) => BoardListComponent.createdMillis(b) - BoardListComponent.createdMillis(a))),
    shareReplay(1),
  );

  // Aktive Boards OHNE Gruppe (Hauptliste "Ohne Gruppe"). Gruppierte Boards erscheinen nur auf der
  // jeweiligen Gruppen-Seite, nicht in dieser Uebersicht.
  public boards$: Observable<RetroBoardId[]> = this.allBoards$.pipe(
    map(boards => boards.filter(board => !board.archived && !board.groupId)),
  );

  // Archivierte Boards OHNE Gruppe (eigener, einklappbarer Abschnitt), gleiche Sortierung.
  public archivedBoards$: Observable<RetroBoardId[]> = this.allBoards$.pipe(
    map(boards => boards.filter(board => board.archived && !board.groupId)),
  );

  // Gruppen des Owners als Karten (Name + Board-Anzahl), alphabetisch nach Name sortiert.
  public groupViews$: Observable<GroupCardView[]> = combineLatest([this.retroService.listMyGroups$, this.allBoards$]).pipe(
    map(([groups, boards]) => [...groups]
      .map(group => ({group, boardCount: boards.filter(b => b.groupId === group.id).length}))
      .sort((a, b) => a.group.name.localeCompare(b.group.name))),
  );

  // Gruppenliste fuer die "In Gruppe verschieben"-Auswahl an den ungruppierten Board-Zeilen.
  public sortedGroups$: Observable<RetroGroupId[]> = this.retroService.listMyGroups$.pipe(
    map(groups => [...groups].sort((a, b) => a.name.localeCompare(b.name))),
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
    this.menuService.addCustomAction('Neue Gruppe anlegen', () => this.startCreateGroup());
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

  // --- Board umbenennen (Ticket 12) -------------------------------------------------------------

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

  // --- Gruppe anlegen / umbenennen / loeschen (Ticket 03) ---------------------------------------

  public startCreateGroup(): void {
    this.creatingGroup = true;
    this.newGroupName = '';
  }

  public cancelCreateGroup(): void {
    this.creatingGroup = false;
    this.newGroupName = '';
  }

  public async saveNewGroup(): Promise<void> {
    const name = this.newGroupName.trim();
    if (!name) {
      return;
    }
    await this.retroService.createGroup(name);
    this.cancelCreateGroup();
  }

  public startEditGroup(group: RetroGroupId): void {
    this.editingGroupId = group.id;
    this.editingGroupName = group.name;
  }

  public cancelGroupEdit(): void {
    this.editingGroupId = null;
    this.editingGroupName = '';
  }

  public async saveGroupEdit(groupId: string): Promise<void> {
    const name = this.editingGroupName.trim();
    if (!name) {
      return;
    }
    await this.retroService.renameGroup(groupId, name);
    this.cancelGroupEdit();
  }

  // Loescht die Gruppe nach Bestaetigung. Enthaltene Boards bleiben erhalten (werden zu Einzel-Boards,
  // siehe RetroService.deleteGroup) -- der Confirm-Text macht das explizit.
  public async deleteGroup(group: RetroGroupId): Promise<void> {
    if (!confirm(`Gruppe „${group.name}" löschen? Die enthaltenen Boards bleiben erhalten und werden zu Einzel-Boards.`)) {
      return;
    }
    if (this.editingGroupId === group.id) {
      this.cancelGroupEdit();
    }
    await this.retroService.deleteGroup(group.id);
  }

  // --- Board in eine Gruppe verschieben (Ticket 05) ---------------------------------------------

  // Ordnet ein (bisher ungruppiertes) Board der ausgewaehlten Gruppe zu. Der Select-Wert wird sofort
  // auf den Platzhalter zurueckgesetzt; das Board wandert danach reaktiv in die Gruppen-Seite.
  public async moveBoardToGroup(boardId: string, event: Event): Promise<void> {
    const select = event.target as HTMLSelectElement;
    const groupId = select.value;
    select.value = '';
    if (groupId) {
      await this.retroService.assignBoardToGroup(boardId, groupId);
    }
  }
}

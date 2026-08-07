import {Component, inject, OnDestroy} from '@angular/core';
import {CommonModule} from '@angular/common';
import {FormsModule} from '@angular/forms';
import {ActivatedRoute, Router, RouterLink} from '@angular/router';
import {combineLatest, Observable, Subscription} from 'rxjs';
import {map, shareReplay} from 'rxjs/operators';
import {FaIconComponent} from '@fortawesome/angular-fontawesome';
import {faChevronDown} from '@fortawesome/free-solid-svg-icons/faChevronDown';
import {faChevronUp} from '@fortawesome/free-solid-svg-icons/faChevronUp';
import {faCheck} from '@fortawesome/free-solid-svg-icons/faCheck';
import {faTimes} from '@fortawesome/free-solid-svg-icons/faTimes';

import {RetroService} from '../retro.service';
import {LoginService} from '../../login/login.service';
import {HeaderService} from '../../../shared/header/header.service';
import {MenuService} from '../../../shared/menu/menu.service';
import {RetroBoardId, RetroGroupId} from '../models/retro';
import {cardTransition, fadeTranslateInstant} from '../../../animation';

interface GroupView {
  group: RetroGroupId | null;
  isOwner: boolean;
  // Aktuelles Sprint-Board = neuestes nicht-archiviertes Board (hervorgehoben). null, wenn die Gruppe
  // keine aktiven Boards hat.
  currentBoard: RetroBoardId | null;
  otherActiveBoards: RetroBoardId[];
  archivedBoards: RetroBoardId[];
  // Alle Gruppen des Owners -- Basis fuer die "Verschieben nach"-Auswahl (nur Owner, siehe Template).
  allGroups: RetroGroupId[];
}

@Component({
  selector: 'app-retro-group',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, FaIconComponent],
  templateUrl: './group.component.html',
  styleUrls: ['./group.component.less'],
  animations: [fadeTranslateInstant, cardTransition],
})
export class GroupComponent implements OnDestroy {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private retroService = inject(RetroService);
  private loginService = inject(LoginService);
  private headerService = inject(HeaderService);
  private menuService = inject(MenuService);

  public groupId = this.route.snapshot.paramMap.get('groupId') ?? '';

  public faChevronDown = faChevronDown;
  public faChevronUp = faChevronUp;
  public faCheck = faCheck;
  public faTimes = faTimes;

  public archivedExpanded = false;

  // Inline-Umbenennung des Gruppennamens (nur Owner), analog zum Board-Rename in board-list.
  public editingName = false;
  public editingNameValue = '';
  // Aktueller Gruppenname, ausserhalb von vm$ vorgehalten -- die Menu-Aktion "Gruppe umbenennen" hat
  // sonst keinen Snapshot zur Hand (siehe startRename()).
  private currentGroupName = '';

  // Kurzes visuelles Feedback nach "Gruppen-Link kopieren" (Menu-Aktion, kein direktes Feedback im Menu).
  public linkCopied = false;

  private group$ = this.retroService.getGroup$(this.groupId).pipe(shareReplay({bufferSize: 1, refCount: true}));
  private boards$ = this.retroService.listBoardsByGroup$(this.groupId).pipe(shareReplay({bufferSize: 1, refCount: true}));
  // Owner nur fuer den eingeloggten Ersteller (reale uid == group.ownerId). currentUserId$ (NICHT
  // authStateAllowAnonymous$) liefert fuer anonyme Link-Mitglieder undefined -> nie Owner.
  private isOwner$ = combineLatest([this.loginService.currentUserId$(), this.group$]).pipe(
    map(([uid, group]) => !!group && !!uid && uid === group.ownerId),
  );

  public vm$: Observable<GroupView> = combineLatest([this.group$, this.boards$, this.isOwner$, this.retroService.listMyGroups$]).pipe(
    map(([group, boards, isOwner, allGroups]) => this.buildView(group ?? null, boards, isOwner, allGroups)),
  );

  // Owner-Menue (Seitenleiste): erscheint nur fuer den Owner, sobald die Gruppe geladen ist. Fuer
  // Nicht-Owner/Mitglieder bleibt das Menu leer -- keine Verwaltungs- oder Teilen-Aktionen.
  private menuSubscription: Subscription = combineLatest([this.group$, this.isOwner$]).subscribe(([group, isOwner]) => {
    if (group && isOwner) {
      this.buildOwnerMenu();
    } else {
      this.menuService.resetCustomActions();
    }
  });

  // Breadcrumb "Retrospektive > <Gruppenname>" + currentGroupName-Puffer, sobald die Gruppe geladen ist.
  private breadcrumbSubscription: Subscription = this.group$.subscribe(group => {
    this.currentGroupName = group?.name ?? '';
    const breadcrumb = [{route: '/retrospective', name: 'Retrospektive'}];
    if (group) {
      breadcrumb.push({route: '/retrospective/group/' + this.groupId, name: group.name});
    }
    this.headerService.setBreadcrumb(breadcrumb);
  });

  public ngOnDestroy(): void {
    this.menuSubscription.unsubscribe();
    this.breadcrumbSubscription.unsubscribe();
    this.menuService.resetCustomActions();
  }

  private buildOwnerMenu(): void {
    this.menuService.resetCustomActions();
    this.menuService.addCustomAction('Neues Board anlegen', () => this.newBoard());
    this.menuService.addCustomAction('Gruppen-Link kopieren', () => this.copyGroupLink());
    this.menuService.addCustomAction('Gruppe umbenennen', () => this.startRename());
  }

  private buildView(group: RetroGroupId | null, boards: RetroBoardId[], isOwner: boolean, allGroups: RetroGroupId[]): GroupView {
    const sorted = [...boards].sort((a, b) => GroupComponent.createdMillis(b) - GroupComponent.createdMillis(a));
    const active = sorted.filter(b => !b.archived);
    const archived = sorted.filter(b => b.archived);
    return {
      group,
      isOwner,
      currentBoard: active[0] ?? null,
      otherActiveBoards: active.slice(1),
      archivedBoards: archived,
      allGroups,
    };
  }

  // Normalisiert created/modified (Firestore-Timestamp, Date oder String) zu Millis -- 1:1 wie board-list.
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

  // Ziel-Gruppen fuer das Verschieben eines Boards (alle Gruppen des Owners ausser der aktuellen).
  public otherGroups(vm: GroupView): RetroGroupId[] {
    return vm.allGroups.filter(g => g.id !== this.groupId);
  }

  public newBoard(): void {
    void this.router.navigateByUrl('/retrospective/group/' + this.groupId + '/new');
  }

  public async copyGroupLink(): Promise<void> {
    const link = window.location.origin + '/retrospective/group/' + this.groupId;
    await navigator.clipboard.writeText(link);
    this.linkCopied = true;
    setTimeout(() => this.linkCopied = false, 2000);
  }

  public toggleArchivedSection(): void {
    this.archivedExpanded = !this.archivedExpanded;
  }

  public startRename(): void {
    this.editingNameValue = this.currentGroupName;
    this.editingName = true;
  }

  public async saveRename(): Promise<void> {
    const name = this.editingNameValue.trim();
    if (!name) {
      return;
    }
    await this.retroService.renameGroup(this.groupId, name);
    this.editingName = false;
  }

  public cancelRename(): void {
    this.editingName = false;
    this.editingNameValue = '';
  }

  // Ticket 05: Owner verschiebt ein Board aus dieser Gruppe in eine andere bzw. loest es heraus.
  // Wert '__remove__' = herausloesen (groupId entfernen), sonst die Ziel-groupId. Der Select-Wert wird
  // sofort auf den Platzhalter zurueckgesetzt; das Board verschwindet ohnehin reaktiv aus dieser Seite.
  public async moveBoard(boardId: string, event: Event): Promise<void> {
    const select = event.target as HTMLSelectElement;
    const value = select.value;
    select.value = '';
    if (value === '__remove__') {
      await this.retroService.assignBoardToGroup(boardId, null);
    } else if (value) {
      await this.retroService.assignBoardToGroup(boardId, value);
    }
  }
}

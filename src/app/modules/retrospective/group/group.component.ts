import {Component, inject, OnDestroy} from '@angular/core';
import {CommonModule} from '@angular/common';
import {FormsModule} from '@angular/forms';
import {ActivatedRoute, Router, RouterLink} from '@angular/router';
import {combineLatest, Observable, of, Subscription} from 'rxjs';
import {map, shareReplay, switchMap} from 'rxjs/operators';
import {FaIconComponent} from '@fortawesome/angular-fontawesome';
import {faChevronDown} from '@fortawesome/free-solid-svg-icons/faChevronDown';
import {faChevronUp} from '@fortawesome/free-solid-svg-icons/faChevronUp';
import {faCheck} from '@fortawesome/free-solid-svg-icons/faCheck';
import {faTimes} from '@fortawesome/free-solid-svg-icons/faTimes';
import {faTrash} from '@fortawesome/free-solid-svg-icons/faTrash';

import {RetroService} from '../retro.service';
import {LoginService} from '../../login/login.service';
import {UserService} from '../../login/user.service';
import {HeaderService} from '../../../shared/header/header.service';
import {MenuService} from '../../../shared/menu/menu.service';
import {RetroBoardId, RetroGroupId} from '../models/retro';
import {canManageBoards} from '../retro-permissions';
import {cardTransition, fadeTranslateInstant} from '../../../animation';
import {IconButtonComponent} from '../../../shared/ui/icon-button.component';
import {ButtonComponent} from '../../../shared/ui/button.component';

interface GroupView {
  group: RetroGroupId | null;
  isOwner: boolean;
  // Vertreter-Feature: Board-Manager der Gruppe = Owner ODER Vertreter (canManageBoards). Steuert u.a.
  // "Neues Board anlegen" im Menu sowie den Hinweistext bei einer leeren Gruppe (siehe Template).
  canManage: boolean;
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
  imports: [CommonModule, FormsModule, RouterLink, FaIconComponent, IconButtonComponent, ButtonComponent],
  templateUrl: './group.component.html',
  styleUrls: ['./group.component.less'],
  animations: [fadeTranslateInstant, cardTransition],
})
export class GroupComponent implements OnDestroy {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private retroService = inject(RetroService);
  private loginService = inject(LoginService);
  private userService = inject(UserService);
  private headerService = inject(HeaderService);
  private menuService = inject(MenuService);

  public groupId = this.route.snapshot.paramMap.get('groupId') ?? '';

  public faChevronDown = faChevronDown;
  public faChevronUp = faChevronUp;
  public faCheck = faCheck;
  public faTimes = faTimes;
  public faTrash = faTrash;

  public archivedExpanded = false;

  // Inline-Umbenennung des Gruppennamens (nur Owner), analog zum Board-Rename in board-list.
  public editingName = false;
  public editingNameValue = '';
  // Aktueller Gruppenname, ausserhalb von vm$ vorgehalten -- die Menu-Aktion "Gruppe umbenennen" hat
  // sonst keinen Snapshot zur Hand (siehe startRename()).
  private currentGroupName = '';

  // Kurzes visuelles Feedback nach "Gruppen-Link kopieren" (Menu-Aktion, kein direktes Feedback im Menu).
  public linkCopied = false;

  // Ticket 03: Owner erzeugt einen einmaligen Freigabe-Code fuer Vertreter (Abschnitt nur fuer den
  // Owner sichtbar, siehe Template). invites ist bewusst nicht auflistbar (Rules) -- daher ist nur der
  // GERADE erzeugte Code hier im Session-Zustand bekannt (fuer Anzeige + moegliches Widerrufen), keine
  // persistente Pending-Liste aelterer Codes (siehe MVP-Entscheid im Ticket).
  public inviteCode: string | null = null;
  public inviteLink: string | null = null;
  public inviteExpiresLabel: string | null = null;
  public inviteCreating = false;
  public inviteLinkCopied = false;

  private group$ = this.retroService.getGroup$(this.groupId).pipe(shareReplay({bufferSize: 1, refCount: true}));
  private boards$ = this.retroService.listBoardsByGroup$(this.groupId).pipe(shareReplay({bufferSize: 1, refCount: true}));
  // Mitarbeiter-Liste (Owner-Abschnitt): pro deputy-uid wird das User-Doc gelesen, um die E-Mail statt
  // der rohen uid anzuzeigen (Fallback: uid, solange noch keine E-Mail gespeichert ist).
  public deputyInfos$: Observable<{uid: string; label: string}[]> = this.group$.pipe(
    switchMap(group => {
      const uids = group?.deputies ?? [];
      if (uids.length === 0) {
        return of([] as {uid: string; label: string}[]);
      }
      return combineLatest(uids.map(uid =>
        this.userService.getUser$(uid).pipe(map(u => ({uid, label: u?.email || uid})))));
    }),
  );
  // Owner nur fuer den eingeloggten Ersteller (reale uid == group.ownerId). currentUserId$ (NICHT
  // authStateAllowAnonymous$) liefert fuer anonyme Link-Mitglieder undefined -> nie Owner.
  private isOwner$ = combineLatest([this.loginService.currentUserId$(), this.group$]).pipe(
    map(([uid, group]) => !!group && !!uid && uid === group.ownerId),
  );
  // Vertreter-Feature: Board-Manager der Gruppe = Owner ODER Vertreter (canManageBoards, einzige
  // Wahrheitsquelle in retro-permissions.ts). Steuert "Neues Board anlegen" im Menu sowie den
  // Hinweistext bei einer leeren Gruppe.
  private isManager$ = combineLatest([this.loginService.currentUserId$(), this.group$]).pipe(
    map(([uid, group]) => canManageBoards(group, uid)),
  );

  public vm$: Observable<GroupView> = combineLatest([this.group$, this.boards$, this.isOwner$, this.isManager$, this.retroService.listMyGroups$]).pipe(
    map(([group, boards, isOwner, isManager, allGroups]) => this.buildView(group ?? null, boards, isOwner, isManager, allGroups)),
  );

  // Menue (Seitenleiste): erscheint fuer jeden Board-Manager (Owner ODER Vertreter), sobald die Gruppe
  // geladen ist. "Neues Board anlegen" gilt fuer beide Rollen; "Gruppen-Link kopieren" und "Gruppe
  // umbenennen" bleiben Owner-only (= "die Gruppe bearbeiten", siehe buildMenu()). Fuer Link-Mitglieder
  // (kein Manager) bleibt das Menu leer.
  private menuSubscription: Subscription = combineLatest([this.group$, this.isOwner$, this.isManager$]).subscribe(([group, isOwner, isManager]) => {
    if (group && isManager) {
      this.buildMenu(isOwner);
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

  // Vertreter-Feature: "Neues Board anlegen" gilt fuer jeden Board-Manager (Owner ODER Vertreter);
  // "Gruppen-Link kopieren" und "Gruppe umbenennen" bleiben Owner-only (= "die Gruppe bearbeiten").
  private buildMenu(isOwner: boolean): void {
    this.menuService.resetCustomActions();
    this.menuService.addCustomAction('Neues Board anlegen', () => this.newBoard());
    if (isOwner) {
      this.menuService.addCustomAction('Gruppen-Link kopieren', () => this.copyGroupLink());
      this.menuService.addCustomAction('Gruppe umbenennen', () => this.startRename());
    }
  }

  private buildView(group: RetroGroupId | null, boards: RetroBoardId[], isOwner: boolean, isManager: boolean, allGroups: RetroGroupId[]): GroupView {
    const sorted = [...boards].sort((a, b) => GroupComponent.createdMillis(b) - GroupComponent.createdMillis(a));
    const active = sorted.filter(b => !b.archived);
    const archived = sorted.filter(b => b.archived);
    return {
      group,
      isOwner,
      canManage: isManager,
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

  // Ticket 03: erzeugt einen einmaligen Freigabe-Code (3 Tage gueltig, siehe RetroService.createInvite())
  // und haelt ihn + den kopierbaren Link + die lesbare Ablauf-Anzeige im Session-Zustand vor. Die
  // Gueltigkeit wird hier rein fuer die Anzeige gespiegelt -- massgeblich ist expiresAt im invites-Doc.
  public async createInvite(): Promise<void> {
    if (this.inviteCreating) {
      return;
    }
    this.inviteCreating = true;
    try {
      const code = await this.retroService.createInvite(this.groupId);
      this.inviteCode = code;
      this.inviteLink = window.location.origin + '/retrospective/join/' + code;
      const expiresAt = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000);
      this.inviteExpiresLabel = expiresAt.toLocaleDateString();
    } finally {
      this.inviteCreating = false;
    }
  }

  public async copyInviteLink(): Promise<void> {
    if (!this.inviteLink) {
      return;
    }
    await navigator.clipboard.writeText(this.inviteLink);
    this.inviteLinkCopied = true;
    setTimeout(() => this.inviteLinkCopied = false, 2000);
  }

  // Widerruft nur den GERADE erzeugten (in der Session bekannten) Code -- invites ist bewusst nicht
  // auflistbar (Rules), daher keine Pending-Liste aelterer Codes (siehe Ticket-Entscheid).
  public async revokeInvite(): Promise<void> {
    if (!this.inviteCode) {
      return;
    }
    await this.retroService.revokeInvite(this.inviteCode);
    this.inviteCode = null;
    this.inviteLink = null;
    this.inviteExpiresLabel = null;
  }

  // Entfernt einen Vertreter -- verliert sofort die Rechte (Board-Manager-Predikate lesen live aus
  // group.deputies). Von ihm angelegte Boards bleiben in der Gruppe (siehe Map).
  public async removeDeputy(uid: string): Promise<void> {
    await this.retroService.removeDeputy(this.groupId, uid);
  }
}

import {Component, inject, OnInit} from '@angular/core';
import {CommonModule} from '@angular/common';
import {FormsModule} from '@angular/forms';
import {ActivatedRoute, Router} from '@angular/router';
import {firstValueFrom} from 'rxjs';

import {HeaderService} from '../../../shared/header/header.service';
import {RetroService} from '../retro.service';
import {RetroBoardId} from '../models/retro';
import {fade, fadeTranslate, fadeTranslateInstant} from '../../../animation';
import {ButtonComponent} from '../../../shared/ui/button.component';

interface RetroColumnDraft {
  name: string;
  color: string;
}

@Component({
  selector: 'app-retro-create',
  standalone: true,
  imports: [CommonModule, FormsModule, ButtonComponent],
  templateUrl: './create.component.html',
  styleUrls: ['./create.component.less'],
  animations: [fadeTranslateInstant, fade, fadeTranslate],
})
export class CreateComponent implements OnInit {
  private headerService = inject(HeaderService);
  private retroService = inject(RetroService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  // Gruppen-Feature: ist der 'groupId'-Param gesetzt (Route group/:groupId/new), legen wir das Board
  // INNERHALB der Gruppe an -- mit uebernommenen Einstellungen des letzten Boards (siehe initFromGroup)
  // und direkter Navigation ins neue Board (kein Share-Link-Schritt; die Gruppe ist bereits geteilt).
  // null = normaler /new-Flow (Einzel-Board mit Share-Link-Schritt wie bisher).
  public groupId = this.route.snapshot.paramMap.get('groupId');

  private readonly defaultColumns: RetroColumnDraft[] = [
    {name: 'Gut gelaufen', color: '#4caf50'},
    {name: 'Verbessern', color: '#f44336'},
    {name: 'Aktionen', color: '#2196f3'},
    {name: 'Sonstiges', color: '#9e9e9e'},
  ];

  public title = '';
  public columnCount = this.defaultColumns.length;
  public columns: RetroColumnDraft[] = this.defaultColumns.map(c => ({...c}));

  public creating = false;
  public boardId: string | null = null;
  public shareLink: string | null = null;
  public copied = false;

  ngOnInit(): void {
    if (this.groupId) {
      void this.initFromGroup(this.groupId);
    } else {
      this.headerService.setBreadcrumb([{route: '/retrospective', name: 'Retrospektive'}, {route: '/retrospective/new', name: 'Neues Board'}]);
    }
  }

  // Uebernimmt beim Anlegen innerhalb einer Gruppe die Einstellungen des NEUESTEN Boards der Gruppe:
  // Spalten (Namen/Farben/Reihenfolge) verbatim + automatisch hochgezaehlter Titel (siehe nextTitle()).
  // Gibt es noch kein Board in der Gruppe, bleibt es beim leeren Standard-Formular.
  private async initFromGroup(groupId: string): Promise<void> {
    const group = await firstValueFrom(this.retroService.getGroup$(groupId));
    this.headerService.setBreadcrumb([
      {route: '/retrospective', name: 'Retrospektive'},
      {route: '/retrospective/group/' + groupId, name: group?.name ?? 'Gruppe'},
      {route: '/retrospective/group/' + groupId + '/new', name: 'Neues Board'},
    ]);
    const boards = await firstValueFrom(this.retroService.listBoardsByGroup$(groupId));
    const latest = CreateComponent.newest(boards);
    if (!latest) {
      return;
    }
    this.columns = [...latest.columns]
      .sort((a, b) => a.order - b.order)
      .map(c => ({name: c.name, color: c.color}));
    this.columnCount = this.columns.length;
    this.title = CreateComponent.nextTitle(latest.title);
  }

  private static newest(boards: RetroBoardId[]): RetroBoardId | null {
    if (!boards.length) {
      return null;
    }
    return [...boards].sort((a, b) => CreateComponent.createdMillis(b) - CreateComponent.createdMillis(a))[0];
  }

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

  // Schlaegt den Titel des naechsten Sprint-Boards vor: die LETZTE Zahl im Titel wird um 1 erhoeht
  // ("Sprint 5" -> "Sprint 6", "Sprint 12 Retro" -> "Sprint 13 Retro"). Enthaelt der Titel keine Zahl,
  // wird " 2" angehaengt ("Retro" -> "Retro 2"). Reine, statische Funktion (direkt testbar).
  public static nextTitle(prev: string): string {
    const match = prev.match(/^(.*?)(\d+)(\D*)$/);
    if (match) {
      const [, head, num, tail] = match;
      return head + (parseInt(num, 10) + 1) + tail;
    }
    const trimmed = prev.trimEnd();
    return trimmed ? trimmed + ' 2' : prev;
  }

  public incrementColumns(): void {
    this.setColumnCount(this.columnCount + 1);
  }

  public decrementColumns(): void {
    this.setColumnCount(this.columnCount - 1);
  }

  public setColumnCount(count: number): void {
    const newCount = Math.max(1, Math.floor(count) || 1);
    this.columnCount = newCount;

    if (this.columns.length < newCount) {
      for (let i = this.columns.length; i < newCount; i++) {
        const fallback = this.defaultColumns[i] ?? {name: 'Spalte ' + (i + 1), color: '#9e9e9e'};
        this.columns.push({...fallback});
      }
    } else if (this.columns.length > newCount) {
      this.columns.length = newCount;
    }
  }

  public async createBoard(): Promise<void> {
    if (!this.title || this.creating) {
      return;
    }

    this.creating = true;
    try {
      const newId = await this.retroService.createBoard(this.title, this.columns, this.groupId ?? undefined);
      if (this.groupId) {
        // In einer Gruppe angelegt: direkt ins neue Board (kein Share-Link-Schritt -- die Gruppe ist
        // bereits geteilt, das neue Board ist damit automatisch das "aktuelle" der Gruppe).
        await this.router.navigateByUrl('/retrospective/' + newId);
        return;
      }
      this.boardId = newId;
      this.shareLink = window.location.origin + '/retrospective/' + this.boardId;
    } finally {
      this.creating = false;
    }
  }

  public async copyLink(): Promise<void> {
    if (!this.shareLink) {
      return;
    }
    await navigator.clipboard.writeText(this.shareLink);
    this.copied = true;
    setTimeout(() => this.copied = false, 2000);
  }

  public openBoard(): void {
    if (!this.boardId) {
      return;
    }
    this.router.navigateByUrl('/retrospective/' + this.boardId);
  }
}

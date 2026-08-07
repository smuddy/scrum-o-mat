import {Component, inject, OnInit} from '@angular/core';
import {CommonModule} from '@angular/common';
import {FormsModule} from '@angular/forms';
import {Router} from '@angular/router';

import {HeaderService} from '../../../shared/header/header.service';
import {RetroService} from '../retro.service';
import {fade, fadeTranslate, fadeTranslateInstant} from '../../../animation';

interface RetroColumnDraft {
  name: string;
  color: string;
}

@Component({
  selector: 'app-retro-create',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './create.component.html',
  styleUrls: ['./create.component.less'],
  animations: [fadeTranslateInstant, fade, fadeTranslate],
})
export class CreateComponent implements OnInit {
  private headerService = inject(HeaderService);
  private retroService = inject(RetroService);
  private router = inject(Router);

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
    this.headerService.setBreadcrumb([{route: '/retrospective', name: 'Retrospektive'}, {route: '/retrospective/new', name: 'Neues Board'}]);
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
      this.boardId = await this.retroService.createBoard(this.title, this.columns);
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

import {Component, inject, Input, OnDestroy, OnInit} from '@angular/core';
import {FormsModule} from '@angular/forms';
import {FaIconComponent} from '@fortawesome/angular-fontawesome';
import {faPlay} from '@fortawesome/free-solid-svg-icons/faPlay';
import {faPause} from '@fortawesome/free-solid-svg-icons/faPause';
import {faRotateLeft} from '@fortawesome/free-solid-svg-icons/faRotateLeft';
import {Subscription} from 'rxjs';

import {RetroService} from '../../retro.service';
import {RetroBoardId} from '../../models/retro';

export type TimerControlState = 'idle' | 'running' | 'paused';

// Owner-Control (Ticket 19, Variante b; erweitert um Ticket 14 -- Pause/Fortsetzen/Zuruecksetzen):
// rendert je nach Timer-Zustand entweder das Minuten-Eingabefeld + Start (idle) oder Pause/Zuruecksetzen
// (running) bzw. Fortsetzen/Zuruecksetzen (paused) direkt als Zeile im Seitenleisten-Menu (siehe
// MenuService.addCustomComponent / board.component.ts#buildOwnerMenu). Self-contained: haelt eine
// eigene Subscription auf das live Board (RetroService.getBoard$), aus der der Zustand abgeleitet wird
// -- unabhaengig von der (separaten) Countdown-Anzeige in BoardComponent.
@Component({
  selector: 'app-timer-control',
  standalone: true,
  imports: [FormsModule, FaIconComponent],
  templateUrl: './timer-control.component.html',
  styleUrls: ['./timer-control.component.less'],
})
export class TimerControlComponent implements OnInit, OnDestroy {
  @Input() boardId!: string;

  private retroService = inject(RetroService);

  public minutes = 5;

  public faPlay = faPlay;
  public faPause = faPause;
  public faRotateLeft = faRotateLeft;

  // Aus dem live Board abgeleiteter Anzeigezustand, siehe deriveState(). idle = kein Timer aktiv,
  // running = Timer laeuft (timerEndsAt in der Zukunft), paused = timerPausedRemainingMs gesetzt.
  public state: TimerControlState = 'idle';

  // Letzter bekannter Board-Stand, u.a. fuer die Restzeit-Berechnung bei pauseTimer() (siehe unten).
  private board: RetroBoardId | undefined;
  private boardSubscription: Subscription | undefined;

  // boardId ist ein @Input (gesetzt vom MenuService/NgComponentOutlet ueber addCustomComponent) und
  // steht bei Feld-Initialisierern im Konstruktor noch nicht zur Verfuegung -- die Subscription wird
  // deshalb erst in ngOnInit aufgebaut (zu diesem Zeitpunkt ist das Input bereits gesetzt).
  public ngOnInit(): void {
    this.boardSubscription = this.retroService.getBoard$(this.boardId).subscribe(board => {
      this.board = board;
      this.state = TimerControlComponent.deriveState(board);
    });
  }

  public ngOnDestroy(): void {
    this.boardSubscription?.unsubscribe();
  }

  // Startet/ueberschreibt den Timer mit "jetzt + minutes". Ungueltige/leere Eingaben (<= 0, NaN)
  // fallen auf 5 Minuten zurueck, damit der Button niemals mit einer leeren Dauer scheitert. Ein Start
  // hebt eine evtl. bestehende Pause auf (siehe RetroService.setTimer()).
  public async startTimer(): Promise<void> {
    const minutes = Number(this.minutes) > 0 ? Number(this.minutes) : 5;
    await this.retroService.setTimer(this.boardId, new Date(Date.now() + minutes * 60000));
  }

  // Pausiert den laufenden Timer: die aktuelle Restzeit wird direkt aus board.timerEndsAt (robust
  // ueber toDate() normalisiert) neu berechnet -- nicht aus einem evtl. veralteten zwischengespeicherten
  // Wert -- und als eingefrorene Restzeit nach Firestore geschrieben (timerEndsAt -> null).
  public async pauseTimer(): Promise<void> {
    if (!this.board || this.board.timerEndsAt == null) {
      return;
    }
    const remainingMs = Math.max(0, TimerControlComponent.toDate(this.board.timerEndsAt).getTime() - Date.now());
    await this.retroService.pauseTimer(this.boardId, remainingMs);
  }

  // Setzt den pausierten Timer mit der eingefrorenen Restzeit fort (neuer Endzeitpunkt = jetzt + Rest).
  public async resumeTimer(): Promise<void> {
    const remainingMs = this.board?.timerPausedRemainingMs ?? 0;
    await this.retroService.resumeTimer(this.boardId, remainingMs);
  }

  // Setzt den Timer vollstaendig zurueck (laufend oder pausiert -> kein Timer mehr fuer alle).
  public async resetTimer(): Promise<void> {
    await this.retroService.resetTimer(this.boardId);
  }

  // Leitet den Anzeigezustand aus einem Board-Snapshot ab: paused hat Vorrang vor running (sobald
  // timerPausedRemainingMs gesetzt ist, ist timerEndsAt ohnehin null -- siehe RetroService.pauseTimer()).
  // running gilt nur, solange die aus timerEndsAt berechnete Restzeit tatsaechlich noch > 0 ist.
  private static deriveState(board: RetroBoardId | undefined): TimerControlState {
    if (!board) {
      return 'idle';
    }
    if (board.timerPausedRemainingMs != null) {
      return 'paused';
    }
    if (board.timerEndsAt != null) {
      const remainingMs = TimerControlComponent.toDate(board.timerEndsAt).getTime() - Date.now();
      if (remainingMs > 0) {
        return 'running';
      }
    }
    return 'idle';
  }

  // Normalisiert timerEndsAt zu einem JS-Date: Firestore liefert i.d.R. einen Timestamp mit toDate(),
  // lokale/Test-Werte sind meist schon ein Date. new Date(value) als Fallback deckt ausserdem
  // ISO-Strings/Millis ab. Bewusst dupliziert (analog zu BoardComponent.toDate()), damit diese
  // Component self-contained bleibt.
  private static toDate(value: any): Date {
    if (value && typeof value.toDate === 'function') {
      return value.toDate();
    }
    return new Date(value);
  }
}

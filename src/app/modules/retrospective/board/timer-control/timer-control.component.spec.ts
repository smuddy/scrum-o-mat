import {describe, it, expect, beforeEach, afterEach, vi} from 'vitest';
import {ComponentFixture, TestBed} from '@angular/core/testing';
import {NO_ERRORS_SCHEMA} from '@angular/core';
import {of, Subject} from 'rxjs';

import {TimerControlComponent} from './timer-control.component';
import {RetroService} from '../../retro.service';
import {RetroBoardId} from '../../models/retro';

describe('TimerControlComponent', () => {
  let component: TimerControlComponent;
  let fixture: ComponentFixture<TimerControlComponent>;
  let retroService: any;

  const idleBoard: RetroBoardId = {
    id: 'board1',
    ownerId: 'owner1',
    title: 'Sprint Retro',
    columns: [],
    hidden: false,
    timerEndsAt: null,
    timerPausedRemainingMs: null,
    created: new Date(),
    modified: new Date(),
  };

  // Erzeugt eine frische Component-Instanz gegen einen bestimmten Board-Stand -- notwendig, weil
  // die Board-Subscription bereits in ngOnInit (also beim ersten detectChanges) aufgebaut wird und
  // ein nachtraegliches Umbiegen von getBoard$() auf einer bereits laufenden Instanz nicht mehr
  // ankaeme (of(...) emittiert nur einmal und ist danach completed).
  function createComponentWithBoard(board: Partial<RetroBoardId>): void {
    retroService.getBoard$.mockReturnValue(of({...idleBoard, ...board}));
    fixture = TestBed.createComponent(TimerControlComponent);
    component = fixture.componentInstance;
    component.boardId = 'board1';
    fixture.detectChanges();
  }

  beforeEach(async () => {
    retroService = {
      getBoard$: vi.fn().mockReturnValue(of(idleBoard)),
      setTimer: vi.fn().mockResolvedValue(undefined),
      pauseTimer: vi.fn().mockResolvedValue(undefined),
      resumeTimer: vi.fn().mockResolvedValue(undefined),
      resetTimer: vi.fn().mockResolvedValue(undefined),
    };

    await TestBed.configureTestingModule({
      imports: [TimerControlComponent],
      schemas: [NO_ERRORS_SCHEMA],
      providers: [
        {provide: RetroService, useValue: retroService},
      ],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(TimerControlComponent);
    component = fixture.componentInstance;
    component.boardId = 'board1';
    fixture.detectChanges();
  });

  afterEach(() => {
    fixture.destroy();
    vi.useRealTimers();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('defaults to 5 minutes', () => {
    expect(component.minutes).toBe(5);
  });

  it('subscribes to the live board via getBoard$ using the bound boardId', () => {
    expect(retroService.getBoard$).toHaveBeenCalledWith('board1');
  });

  it('unsubscribes from the board on destroy (no leaked subscription)', () => {
    // Firestore-Streams sind langlebig (kein complete). of(...) hingegen completed sofort und schliesst
    // die Subscription bereits selbst -- fuer einen aussagekraeftigen Leak-Test daher eine
    // nicht-completende Quelle (Subject), sodass die Subscription bis zum ngOnDestroy offen bleibt.
    const board$ = new Subject<RetroBoardId>();
    retroService.getBoard$.mockReturnValue(board$.asObservable());
    const localFixture = TestBed.createComponent(TimerControlComponent);
    localFixture.componentInstance.boardId = 'board1';
    localFixture.detectChanges();

    const subscription = (localFixture.componentInstance as any).boardSubscription;
    expect(subscription.closed).toBe(false);

    localFixture.destroy();

    expect(subscription.closed).toBe(true);
  });

  it('renders a "Timer" label and an "m" (minutes) suffix next to the input while idle', () => {
    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';

    expect(text).toContain('Timer');
    expect(text).toContain('m');
  });

  describe('state derivation (idle/running/paused)', () => {
    it('is "idle" when there is no active or paused timer', () => {
      expect(component.state).toBe('idle');
    });

    it('is "running" when timerEndsAt lies in the future', () => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date('2026-08-06T10:00:00.000Z'));
      createComponentWithBoard({timerEndsAt: new Date('2026-08-06T10:05:00.000Z'), timerPausedRemainingMs: null});

      expect(component.state).toBe('running');
    });

    it('is "idle" once timerEndsAt has already passed (expired timer, no explicit reset yet)', () => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date('2026-08-06T10:00:00.000Z'));
      createComponentWithBoard({timerEndsAt: new Date('2026-08-06T09:59:00.000Z'), timerPausedRemainingMs: null});

      expect(component.state).toBe('idle');
    });

    it('is "paused" when timerPausedRemainingMs is set, taking precedence over timerEndsAt', () => {
      createComponentWithBoard({timerEndsAt: null, timerPausedRemainingMs: 42000});

      expect(component.state).toBe('paused');
    });
  });

  describe('startTimer', () => {
    it('starts a timer for the configured number of minutes', async () => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date('2026-08-06T10:00:00.000Z'));
      component.minutes = 5;

      await component.startTimer();

      expect(retroService.setTimer).toHaveBeenCalledWith('board1', new Date('2026-08-06T10:05:00.000Z'));
    });

    it('falls back to 5 minutes when the configured duration is invalid (<= 0)', async () => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date('2026-08-06T10:00:00.000Z'));
      component.minutes = 0;

      await component.startTimer();

      expect(retroService.setTimer).toHaveBeenCalledWith('board1', new Date('2026-08-06T10:05:00.000Z'));
    });

    it('falls back to 5 minutes when the configured duration is NaN', async () => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date('2026-08-06T10:00:00.000Z'));
      component.minutes = NaN;

      await component.startTimer();

      expect(retroService.setTimer).toHaveBeenCalledWith('board1', new Date('2026-08-06T10:05:00.000Z'));
    });
  });

  describe('pauseTimer', () => {
    it('freezes the current remaining time (recomputed from timerEndsAt) and delegates to retroService.pauseTimer', async () => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date('2026-08-06T10:00:00.000Z'));
      createComponentWithBoard({timerEndsAt: new Date('2026-08-06T10:05:00.000Z'), timerPausedRemainingMs: null});

      await component.pauseTimer();

      expect(retroService.pauseTimer).toHaveBeenCalledWith('board1', 5 * 60000);
    });

    it('does nothing when there is no active timer (timerEndsAt is null)', async () => {
      await component.pauseTimer();

      expect(retroService.pauseTimer).not.toHaveBeenCalled();
    });
  });

  describe('resumeTimer', () => {
    it('resumes using the frozen timerPausedRemainingMs and delegates to retroService.resumeTimer', async () => {
      createComponentWithBoard({timerEndsAt: null, timerPausedRemainingMs: 42000});

      await component.resumeTimer();

      expect(retroService.resumeTimer).toHaveBeenCalledWith('board1', 42000);
    });

    it('resumes with 0ms when there is no frozen remaining time (defensive fallback)', async () => {
      await component.resumeTimer();

      expect(retroService.resumeTimer).toHaveBeenCalledWith('board1', 0);
    });
  });

  describe('resetTimer', () => {
    it('resets/clears the timer (running or paused) via retroService.resetTimer', async () => {
      await component.resetTimer();

      expect(retroService.resetTimer).toHaveBeenCalledWith('board1');
    });
  });
});

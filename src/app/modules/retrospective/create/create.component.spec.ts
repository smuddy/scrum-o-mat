import {describe, it, expect, beforeEach, afterEach, vi} from 'vitest';
import {ComponentFixture, TestBed} from '@angular/core/testing';
import {NO_ERRORS_SCHEMA} from '@angular/core';
import {NoopAnimationsModule} from '@angular/platform-browser/animations';
import {ActivatedRoute, provideRouter, Router} from '@angular/router';
import {of} from 'rxjs';

import {CreateComponent} from './create.component';
import {RetroService} from '../retro.service';
import {HeaderService} from '../../../shared/header/header.service';
import {RetroBoardId, RetroGroupId} from '../models/retro';

describe('CreateComponent', () => {

  describe('nextTitle (Titel-Hochzaehlung)', () => {
    it('erhoeht die Zahl am Ende', () => {
      expect(CreateComponent.nextTitle('Sprint 5')).toBe('Sprint 6');
    });

    it('erhoeht die letzte Zahl auch mit Text danach', () => {
      expect(CreateComponent.nextTitle('Sprint 12 Retro')).toBe('Sprint 13 Retro');
    });

    it('haengt " 2" an, wenn keine Zahl vorhanden ist', () => {
      expect(CreateComponent.nextTitle('Retro')).toBe('Retro 2');
    });

    it('behandelt mehrstellige Zahlen korrekt', () => {
      expect(CreateComponent.nextTitle('Sprint 99')).toBe('Sprint 100');
    });
  });

  describe('Anlege-Flow', () => {
    let component: CreateComponent;
    let fixture: ComponentFixture<CreateComponent>;
    let retroService: any;

    const group: RetroGroupId = {id: 'g1', ownerId: 'me', name: 'Team Alpha', created: new Date('2026-01-01'), modified: new Date('2026-01-01')};
    const latestBoard: RetroBoardId = {
      id: 'b1', ownerId: 'me', title: 'Sprint 3', hidden: false, timerEndsAt: null,
      created: new Date('2026-02-02'), modified: new Date('2026-02-02'), groupId: 'g1',
      columns: [
        {id: 'c1', name: 'Lief gut', color: '#111111', order: 0},
        {id: 'c2', name: 'Verbessern', color: '#222222', order: 1},
      ],
    };

    async function setup(groupId: string | null): Promise<Router> {
      retroService = {
        getGroup$: vi.fn().mockReturnValue(of(group)),
        listBoardsByGroup$: vi.fn().mockReturnValue(of([latestBoard])),
        createBoard: vi.fn().mockResolvedValue('new-id'),
      };
      const headerService = {setBreadcrumb: vi.fn()};

      await TestBed.configureTestingModule({
        imports: [CreateComponent, NoopAnimationsModule],
        providers: [
          {provide: RetroService, useValue: retroService},
          {provide: HeaderService, useValue: headerService},
          provideRouter([]),
          // ActivatedRoute NACH provideRouter, sonst gewinnt dessen (leerer) Root-Route-Provider.
          {provide: ActivatedRoute, useValue: {snapshot: {paramMap: {get: (k: string) => (k === 'groupId' ? groupId : null)}}}},
        ],
        schemas: [NO_ERRORS_SCHEMA],
      }).compileComponents();

      fixture = TestBed.createComponent(CreateComponent);
      component = fixture.componentInstance;
      const router = TestBed.inject(Router);
      vi.spyOn(router, 'navigateByUrl').mockResolvedValue(true);
      fixture.detectChanges();
      await fixture.whenStable();
      return router;
    }

    afterEach(() => {
      TestBed.resetTestingModule();
    });

    it('Gruppen-Modus: uebernimmt Spalten und schlaegt den hochgezaehlten Titel vor', async () => {
      await setup('g1');

      expect(component.title).toBe('Sprint 4');
      expect(component.columns).toEqual([
        {name: 'Lief gut', color: '#111111'},
        {name: 'Verbessern', color: '#222222'},
      ]);
    });

    it('Gruppen-Modus: legt mit groupId an und navigiert direkt ins neue Board', async () => {
      const router = await setup('g1');

      await component.createBoard();

      expect(retroService.createBoard).toHaveBeenCalledWith('Sprint 4', component.columns, 'g1');
      expect(router.navigateByUrl).toHaveBeenCalledWith('/retrospective/new-id');
      expect(component.shareLink).toBeNull();
    });

    it('Normal-Modus: legt ohne groupId an und zeigt den Share-Link (keine Navigation)', async () => {
      const router = await setup(null);
      component.title = 'Einzel-Board';

      await component.createBoard();

      expect(retroService.createBoard).toHaveBeenCalledWith('Einzel-Board', component.columns, undefined);
      expect(component.shareLink).toContain('/retrospective/new-id');
      expect(router.navigateByUrl).not.toHaveBeenCalled();
    });
  });
});

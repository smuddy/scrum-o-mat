import {describe, it, expect, beforeEach, vi} from 'vitest';

vi.mock('@angular/fire/firestore', () => {
  const g = globalThis as any;
  if (!g.__fireFirestoreMock) {
    g.__fireFirestoreMock = {
      Firestore: class Firestore {},
      collection: vi.fn(), doc: vi.fn(), query: vi.fn(), where: vi.fn(), orderBy: vi.fn(), limit: vi.fn(),
      collectionData: vi.fn(), docData: vi.fn(),
      addDoc: vi.fn(), setDoc: vi.fn(), updateDoc: vi.fn(), deleteDoc: vi.fn(),
      Timestamp: {fromDate: (d: any) => ({toDate: () => d}), now: () => ({toDate: () => new Date()})},
    };
  }
  return g.__fireFirestoreMock;
});
vi.mock('@angular/fire/auth', () => {
  const g = globalThis as any;
  if (!g.__fireAuthMock) {
    g.__fireAuthMock = {
      Auth: class Auth {},
      authState: vi.fn(), signInAnonymously: vi.fn(),
      signInWithEmailAndPassword: vi.fn(), createUserWithEmailAndPassword: vi.fn(),
      signOut: vi.fn(), user: vi.fn(),
    };
  }
  return g.__fireAuthMock;
});
import {ComponentFixture, TestBed} from '@angular/core/testing';
import {NO_ERRORS_SCHEMA} from '@angular/core';
import {NoopAnimationsModule} from '@angular/platform-browser/animations';
import {Router} from '@angular/router';
import {of} from 'rxjs';

import {QrcodeComponent} from './qrcode.component';
import {PlanningService} from '../../../planning.service';
import {environment} from '../../../../../../environments/environment';

describe('QrcodeComponent', () => {
  let component: QrcodeComponent;
  let fixture: ComponentFixture<QrcodeComponent>;
  let planningService: any;
  let router: any;

  beforeEach(async () => {
    planningService = {getPlanning: vi.fn()};
    router = {
      navigateByUrl: vi.fn().mockResolvedValue(true),
      createUrlTree: vi.fn().mockReturnValue({} as any),
    };

    await TestBed.configureTestingModule({
      imports: [QrcodeComponent, NoopAnimationsModule],
      providers: [
        {provide: PlanningService, useValue: planningService},
        {provide: Router, useValue: router},
      ],
      schemas: [NO_ERRORS_SCHEMA],
    })
      .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(QrcodeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('shows the scanner on init', () => {
    expect(component.showScanner).toBe(true);
  });

  it('extracts the planning id from the scanned url, shows the subject and eventually navigates back', async () => {
    const planningId = 'test-id';
    planningService.getPlanning.mockReturnValue(of({subject: 'my-subject'} as any));

    component.scanSuccessHandler(environment.url + planningId);

    expect(planningService.getPlanning).toHaveBeenCalledWith(planningId);
    expect(component.subject).toBe('my-subject');
    expect(component.showScanner).toBe(false);
    expect(component.showText).toBe(true);

    await new Promise(resolve => setTimeout(resolve, 4100));
    expect(component.showText).toBe(false);

    await new Promise(resolve => setTimeout(resolve, 1000));
    expect(router.createUrlTree).toHaveBeenCalledWith(['/planning/'], {queryParams: {session: planningId}});
    expect(router.navigateByUrl).toHaveBeenCalled();
  }, 15000);

  it('ignores the scan result when the planning has no subject', () => {
    planningService.getPlanning.mockReturnValue(of({subject: undefined} as any));

    component.scanSuccessHandler(environment.url + 'test-id');

    expect(component.showScanner).toBe(true);
    expect(component.showText).toBeFalsy();
  });

  it('ignores the scan result when no planning is found', () => {
    planningService.getPlanning.mockReturnValue(of(undefined));

    component.scanSuccessHandler(environment.url + 'test-id');

    expect(component.showScanner).toBe(true);
    expect(component.showText).toBeFalsy();
  });

  it('ignores the scan result once the scanner has already been closed', () => {
    component.showScanner = false;
    planningService.getPlanning.mockReturnValue(of({subject: 'my-subject'} as any));

    component.scanSuccessHandler(environment.url + 'test-id');

    expect(component.subject).toBeUndefined();
    expect(component.showText).toBeFalsy();
  });

});

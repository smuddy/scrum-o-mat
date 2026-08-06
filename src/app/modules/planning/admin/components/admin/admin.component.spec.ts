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
import {Router} from '@angular/router';
import {of} from 'rxjs';

import {AdminComponent} from './admin.component';
import {AdminService} from '../admin.service';

describe('AdminComponent', () => {
  let component: AdminComponent;
  let fixture: ComponentFixture<AdminComponent>;
  let adminService: any;
  let router: any;
  // The template renders planning.modified.seconds, so the mock needs a Timestamp-like field.
  const planningsData = [{id: 'p1', subject: 'Sprint 1', modified: {seconds: 1700000000, nanoseconds: 0}}];

  beforeEach(async () => {
    adminService = {
      plannings: of(planningsData as any),
      deletePlanning: vi.fn().mockResolvedValue(undefined),
    };
    router = {
      navigateByUrl: vi.fn().mockResolvedValue(true),
      createUrlTree: vi.fn().mockReturnValue({} as any),
    };

    await TestBed.configureTestingModule({
      imports: [AdminComponent],
      providers: [
        {provide: AdminService, useValue: adminService},
        {provide: Router, useValue: router},
      ],
      schemas: [NO_ERRORS_SCHEMA],
    })
      .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(AdminComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('loads plannings from the admin service on init', () => {
    expect(component.plannings).toEqual(planningsData as any);
  });

  it('navigates to the master view of the given planning', async () => {
    await component.goto('p1');

    expect(router.navigateByUrl).toHaveBeenCalledWith('/planning/p1/master');
  });

  it('deletes a planning via the admin service', async () => {
    await component.delete('p1');

    expect(adminService.deletePlanning).toHaveBeenCalledWith('p1');
  });

});

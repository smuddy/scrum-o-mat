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
import {of} from 'rxjs';

import {UsersComponent} from './users.component';
import {AdminService} from '../admin.service';

describe('UsersComponent', () => {
  let component: UsersComponent;
  let fixture: ComponentFixture<UsersComponent>;
  let adminService: any;

  beforeEach(async () => {
    adminService = {
      getDevelopers: vi.fn().mockReturnValue(of([])),
      deleteUser: vi.fn().mockResolvedValue(undefined),
    };

    await TestBed.configureTestingModule({
      imports: [UsersComponent],
      providers: [
        {provide: AdminService, useValue: adminService},
      ],
      schemas: [NO_ERRORS_SCHEMA],
    })
      .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(UsersComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    fixture.detectChanges();
    expect(component).toBeTruthy();
  });

  it('loads developers for the given planning id on init', () => {
    const developers = [{id: 'd1', name: 'Alice'} as any];
    adminService.getDevelopers.mockReturnValue(of(developers));
    component.planningId = 'p1';

    fixture.detectChanges();

    expect(adminService.getDevelopers).toHaveBeenCalledWith('p1');
    expect(component.users).toEqual(developers);
  });

  it('does not load developers when no planning id is set', () => {
    fixture.detectChanges();

    expect(adminService.getDevelopers).not.toHaveBeenCalled();
  });

  it('deletes a user via the admin service', async () => {
    component.planningId = 'p1';
    fixture.detectChanges();

    await component.delete('d1');

    expect(adminService.deleteUser).toHaveBeenCalledWith('p1', 'd1');
  });

});

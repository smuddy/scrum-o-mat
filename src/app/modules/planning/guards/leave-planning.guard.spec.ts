import { TestBed } from '@angular/core/testing';

import { LeavePlanningGuard } from './leave-planning.guard';

describe('LeavePlanningGuard', () => {
  let guard: LeavePlanningGuard;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    guard = TestBed.inject(LeavePlanningGuard);
  });

  it('should be created', () => {
    expect(guard).toBeTruthy();
  });
});

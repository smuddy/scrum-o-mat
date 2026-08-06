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

  it('always allows deactivation', () => {
    const result = guard.canDeactivate(null, null, null);
    expect(result).toBe(true);
  });
});

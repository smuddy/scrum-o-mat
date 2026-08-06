import {describe, it, expect} from 'vitest';
import {TestBed} from '@angular/core/testing';
import {CanDeactivateFn} from '@angular/router';

import {leavePlanningGuard} from './leave-planning.guard';

describe('leavePlanningGuard', () => {
  const executeGuard: CanDeactivateFn<unknown> = (...guardParameters) =>
    TestBed.runInInjectionContext(() => leavePlanningGuard(...guardParameters));

  it('is defined', () => {
    expect(leavePlanningGuard).toBeTruthy();
  });

  it('always allows deactivation', () => {
    const result = executeGuard(null, null as any, null as any, null as any);
    expect(result).toBe(true);
  });
});

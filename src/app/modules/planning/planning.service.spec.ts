import {TestBed} from '@angular/core/testing';

import {PlanningService} from './planning.service';

describe('EstimateService', () => {
  beforeEach(() => TestBed.configureTestingModule({}));

  it('should be created', () => {
    const service: PlanningService = TestBed.get(PlanningService);
    expect(service).toBeTruthy();
  });
});

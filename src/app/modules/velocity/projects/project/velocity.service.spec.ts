import {TestBed} from '@angular/core/testing';

import {VelocityService} from './velocity.service';

describe('VelocityService', () => {
  let service: VelocityService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(VelocityService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});

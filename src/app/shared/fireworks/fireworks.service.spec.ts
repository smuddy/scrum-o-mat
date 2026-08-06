import {describe, it, expect, beforeEach, afterEach} from 'vitest';
import {TestBed} from '@angular/core/testing';

import {FireworksService} from './fireworks.service';

describe('FireworksService', () => {
  let service: FireworksService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(FireworksService);
  });

  afterEach(() => {
    service.stop();
    document.querySelectorAll('.particle').forEach(el => el.remove());
  });

  it('is created', () => {
    expect(service).toBeTruthy();
  });

  it('does not render particles before start', () => {
    service.configure(3, [200, 1500]);

    expect(document.querySelectorAll('.particle').length).toBe(0);
  });

  it('creates particles on the first explosion and removes them on stop', () => {
    service.configure(3, [200, 1500]);
    service.start();

    // start() loest die erste Explosion synchron aus.
    expect(document.querySelectorAll('.particle').length).toBe(3);

    service.stop();

    expect(document.querySelectorAll('.particle').length).toBe(0);
  });

  it('creates no particles when configured with zero intensity', () => {
    service.configure(0, [200, 1500]);
    service.start();

    expect(document.querySelectorAll('.particle').length).toBe(0);
  });

  it('is idempotent across repeated start calls', () => {
    service.configure(2, [200, 1500]);
    service.start();
    service.start();

    // Der zweite start()-Aufruf darf keine weitere Explosion ausloesen.
    expect(document.querySelectorAll('.particle').length).toBe(2);
  });
});

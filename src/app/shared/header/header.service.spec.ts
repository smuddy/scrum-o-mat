import {describe, it, expect, beforeEach} from 'vitest';
import {TestBed} from '@angular/core/testing';

import {HeaderService} from './header.service';

describe('HeaderService', () => {
  let service: HeaderService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(HeaderService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('starts not in fullscreen and with an empty breadcrumb', () => {
    let fullscreen: boolean;
    let breadcrumb: { name: string, route: string }[];
    service.fullscreen$.subscribe(_ => fullscreen = _);
    service.breadcrumb$.subscribe(_ => breadcrumb = _);

    expect(fullscreen).toBe(false);
    expect(breadcrumb).toEqual([]);
  });

  it('emits the new fullscreen state', () => {
    let fullscreen: boolean;
    service.fullscreen$.subscribe(_ => fullscreen = _);

    service.setFullscreen(true);

    expect(fullscreen).toBe(true);
  });

  it('emits the new breadcrumb', () => {
    let breadcrumb: { name: string, route: string }[];
    service.breadcrumb$.subscribe(_ => breadcrumb = _);
    const crumb = [{route: '/login', name: 'Anmelden'}];

    service.setBreadcrumb(crumb);

    expect(breadcrumb).toEqual(crumb);
  });

});

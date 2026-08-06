import {ComponentFixture, fakeAsync, TestBed, tick} from '@angular/core/testing';
import {NO_ERRORS_SCHEMA} from '@angular/core';
import {CommonModule} from '@angular/common';
import {NoopAnimationsModule} from '@angular/platform-browser/animations';
import {Router} from '@angular/router';
import {of} from 'rxjs';

import {QrcodeComponent} from './qrcode.component';
import {PlanningService} from '../../../planning.service';
import {environment} from '../../../../../../environments/environment';

describe('QrcodeComponent', () => {
  let component: QrcodeComponent;
  let fixture: ComponentFixture<QrcodeComponent>;
  let planningService: jasmine.SpyObj<PlanningService>;
  let router: jasmine.SpyObj<Router>;

  beforeEach(async () => {
    planningService = jasmine.createSpyObj('PlanningService', ['getPlanning']);
    router = jasmine.createSpyObj('Router', ['navigateByUrl', 'createUrlTree']);
    router.navigateByUrl.and.resolveTo(true);
    router.createUrlTree.and.returnValue({} as any);

    await TestBed.configureTestingModule({
      declarations: [QrcodeComponent],
      imports: [CommonModule, NoopAnimationsModule],
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
    expect(component.showScanner).toBeTrue();
  });

  it('extracts the planning id from the scanned url, shows the subject and eventually navigates back', fakeAsync(() => {
    const planningId = 'test-id';
    planningService.getPlanning.and.returnValue(of({subject: 'my-subject'} as any));

    component.scanSuccessHandler(environment.url + planningId);

    expect(planningService.getPlanning).toHaveBeenCalledWith(planningId);
    expect(component.subject).toBe('my-subject');
    expect(component.showScanner).toBeFalse();
    expect(component.showText).toBeTrue();

    tick(4000);
    expect(component.showText).toBeFalse();

    tick(1000);
    expect(router.createUrlTree).toHaveBeenCalledWith(['/planning/'], {queryParams: {session: planningId}});
    expect(router.navigateByUrl).toHaveBeenCalled();
  }));

  it('ignores the scan result when the planning has no subject', () => {
    planningService.getPlanning.and.returnValue(of({subject: undefined} as any));

    component.scanSuccessHandler(environment.url + 'test-id');

    expect(component.showScanner).toBeTrue();
    expect(component.showText).toBeFalsy();
  });

  it('ignores the scan result when no planning is found', () => {
    planningService.getPlanning.and.returnValue(of(undefined));

    component.scanSuccessHandler(environment.url + 'test-id');

    expect(component.showScanner).toBeTrue();
    expect(component.showText).toBeFalsy();
  });

  it('ignores the scan result once the scanner has already been closed', () => {
    component.showScanner = false;
    planningService.getPlanning.and.returnValue(of({subject: 'my-subject'} as any));

    component.scanSuccessHandler(environment.url + 'test-id');

    expect(component.subject).toBeUndefined();
    expect(component.showText).toBeFalsy();
  });

});

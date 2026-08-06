import {ComponentFixture, TestBed} from '@angular/core/testing';
import {CommonModule} from '@angular/common';
import {NO_ERRORS_SCHEMA} from '@angular/core';
import {NoopAnimationsModule} from '@angular/platform-browser/animations';
import {Router} from '@angular/router';
import {of} from 'rxjs';

import {HeaderComponent} from './header.component';
import {HeaderService} from './header.service';

describe('HeaderComponent', () => {
  let component: HeaderComponent;
  let fixture: ComponentFixture<HeaderComponent>;
  let headerService: any;
  let router: jasmine.SpyObj<Router>;

  beforeEach(async () => {
    headerService = {
      breadcrumb$: of([{name: 'Foo', route: '/foo'}]),
      fullscreen$: of(false),
      setBreadcrumb: jasmine.createSpy(),
      setFullscreen: jasmine.createSpy(),
    };
    router = jasmine.createSpyObj('Router', ['navigateByUrl']);
    router.navigateByUrl.and.resolveTo(true);

    await TestBed.configureTestingModule({
      declarations: [HeaderComponent],
      imports: [CommonModule, NoopAnimationsModule],
      providers: [
        {provide: HeaderService, useValue: headerService},
        {provide: Router, useValue: router},
      ],
      schemas: [NO_ERRORS_SCHEMA],
    })
      .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(HeaderComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('exposes the fullscreen state from HeaderService', () => {
    let fullscreen: boolean;
    component.fullscreen$.subscribe(_ => fullscreen = _);

    expect(fullscreen).toBeFalse();
  });

  it('exposes the breadcrumb from HeaderService', () => {
    let breadcrumb: { name: string, route: string }[];
    component.breadcrumb$.subscribe(_ => breadcrumb = _);

    expect(breadcrumb).toEqual([{name: 'Foo', route: '/foo'}]);
  });

  it('tracks breadcrumb entries by their route name', () => {
    expect(component.trackBy(0, {name: 'Foo', route: '/foo'})).toBe('Foo');
  });
});

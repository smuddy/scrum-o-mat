import {describe, it, expect, beforeEach, vi} from 'vitest';
import {ComponentFixture, TestBed} from '@angular/core/testing';
import {NoopAnimationsModule} from '@angular/platform-browser/animations';
import {provideRouter} from '@angular/router';

import {InitComponent} from './init.component';
import {HeaderService} from '../../shared/header/header.service';

describe('InitComponent', () => {
  let component: InitComponent;
  let fixture: ComponentFixture<InitComponent>;
  let headerServiceMock: {setBreadcrumb: ReturnType<typeof vi.fn>};

  beforeEach(async () => {
    headerServiceMock = {
      setBreadcrumb: vi.fn(),
    };

    await TestBed.configureTestingModule({
      imports: [InitComponent, NoopAnimationsModule],
      providers: [
        provideRouter([]),
        {provide: HeaderService, useValue: headerServiceMock},
      ],
    })
      .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(InitComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('sets an empty breadcrumb on init', () => {
    expect(headerServiceMock.setBreadcrumb).toHaveBeenCalledWith([]);
  });

});

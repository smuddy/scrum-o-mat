import {ComponentFixture, TestBed} from '@angular/core/testing';
import {NO_ERRORS_SCHEMA} from '@angular/core';
import {NoopAnimationsModule} from '@angular/platform-browser/animations';

import {InitComponent} from './init.component';
import {HeaderService} from '../../shared/header/header.service';

describe('InitComponent', () => {
  let component: InitComponent;
  let fixture: ComponentFixture<InitComponent>;
  let headerServiceMock: any;

  beforeEach(async () => {
    headerServiceMock = {
      setBreadcrumb: jasmine.createSpy(),
    };

    await TestBed.configureTestingModule({
      declarations: [InitComponent],
      imports: [NoopAnimationsModule],
      providers: [
        {provide: HeaderService, useValue: headerServiceMock},
      ],
      schemas: [NO_ERRORS_SCHEMA],
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

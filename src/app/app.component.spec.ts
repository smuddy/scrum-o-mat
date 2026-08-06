import {ComponentFixture, TestBed} from '@angular/core/testing';
import {NO_ERRORS_SCHEMA} from '@angular/core';
import {of} from 'rxjs';

import {AppComponent} from './app.component';
import {MenuService} from './shared/menu/menu.service';
import {HeaderService} from './shared/header/header.service';

describe('AppComponent', () => {
  let component: AppComponent;
  let fixture: ComponentFixture<AppComponent>;
  let menuServiceMock: any;
  let headerServiceMock: any;

  beforeEach(async () => {
    menuServiceMock = {
      menuOpen$: of(false),
      toggleMenu: jasmine.createSpy(),
      closeMenu: jasmine.createSpy(),
    };
    headerServiceMock = {
      fullscreen$: of(false),
    };

    await TestBed.configureTestingModule({
      declarations: [AppComponent],
      providers: [
        {provide: MenuService, useValue: menuServiceMock},
        {provide: HeaderService, useValue: headerServiceMock},
      ],
      schemas: [NO_ERRORS_SCHEMA],
    })
      .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(AppComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('sets menuOpen from the menuOpen$ subscription', () => {
    expect(component.menuOpen).toBe(false);
  });

  it('calls menuService.toggleMenu on onClickMenuButton', () => {
    component.onClickMenuButton();

    expect(menuServiceMock.toggleMenu).toHaveBeenCalled();
  });

  it('calls menuService.closeMenu on onClickOutlet', () => {
    component.onClickOutlet();

    expect(menuServiceMock.closeMenu).toHaveBeenCalled();
  });

});

import {ComponentFixture, TestBed} from '@angular/core/testing';
import {NO_ERRORS_SCHEMA} from '@angular/core';
import {Router} from '@angular/router';
import {of} from 'rxjs';

import {AdminComponent} from './admin.component';
import {AdminService} from '../admin.service';

describe('AdminComponent', () => {
  let component: AdminComponent;
  let fixture: ComponentFixture<AdminComponent>;
  let adminService: any;
  let router: jasmine.SpyObj<Router>;
  // The template renders planning.modified.seconds, so the mock needs a Timestamp-like field.
  const planningsData = [{id: 'p1', subject: 'Sprint 1', modified: {seconds: 1700000000, nanoseconds: 0}}];

  beforeEach(async () => {
    adminService = {
      plannings: of(planningsData as any),
      deletePlanning: jasmine.createSpy('deletePlanning').and.resolveTo(),
    };
    router = jasmine.createSpyObj('Router', ['navigateByUrl', 'createUrlTree']);
    router.navigateByUrl.and.resolveTo(true);
    router.createUrlTree.and.returnValue({} as any);

    await TestBed.configureTestingModule({
      declarations: [AdminComponent],
      providers: [
        {provide: AdminService, useValue: adminService},
        {provide: Router, useValue: router},
      ],
      schemas: [NO_ERRORS_SCHEMA],
    })
      .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(AdminComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('loads plannings from the admin service on init', () => {
    expect(component.plannings).toEqual(planningsData as any);
  });

  it('navigates to the master view of the given planning', async () => {
    await component.goto('p1');

    expect(router.navigateByUrl).toHaveBeenCalledWith('/planning/p1/master');
  });

  it('deletes a planning via the admin service', async () => {
    await component.delete('p1');

    expect(adminService.deletePlanning).toHaveBeenCalledWith('p1');
  });

});

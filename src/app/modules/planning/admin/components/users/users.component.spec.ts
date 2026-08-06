import {ComponentFixture, TestBed} from '@angular/core/testing';
import {NO_ERRORS_SCHEMA} from '@angular/core';
import {of} from 'rxjs';

import {UsersComponent} from './users.component';
import {AdminService} from '../admin.service';

describe('UsersComponent', () => {
  let component: UsersComponent;
  let fixture: ComponentFixture<UsersComponent>;
  let adminService: any;

  beforeEach(async () => {
    adminService = {
      getDevelopers: jasmine.createSpy('getDevelopers').and.returnValue(of([])),
      deleteUser: jasmine.createSpy('deleteUser').and.resolveTo(),
    };

    await TestBed.configureTestingModule({
      declarations: [UsersComponent],
      providers: [
        {provide: AdminService, useValue: adminService},
      ],
      schemas: [NO_ERRORS_SCHEMA],
    })
      .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(UsersComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    fixture.detectChanges();
    expect(component).toBeTruthy();
  });

  it('loads developers for the given planning id on init', () => {
    const developers = [{id: 'd1', name: 'Alice'} as any];
    adminService.getDevelopers.and.returnValue(of(developers));
    component.planningId = 'p1';

    fixture.detectChanges();

    expect(adminService.getDevelopers).toHaveBeenCalledWith('p1');
    expect(component.users).toEqual(developers);
  });

  it('does not load developers when no planning id is set', () => {
    fixture.detectChanges();

    expect(adminService.getDevelopers).not.toHaveBeenCalled();
  });

  it('deletes a user via the admin service', async () => {
    component.planningId = 'p1';
    fixture.detectChanges();

    await component.delete('d1');

    expect(adminService.deleteUser).toHaveBeenCalledWith('p1', 'd1');
  });

});

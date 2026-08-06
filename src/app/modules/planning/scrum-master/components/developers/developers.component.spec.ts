import {ComponentFixture, TestBed} from '@angular/core/testing';
import {NO_ERRORS_SCHEMA} from '@angular/core';
import {NoopAnimationsModule} from '@angular/platform-browser/animations';
import {ActivatedRoute, Router} from '@angular/router';
import {OrderModule} from 'ngx-order-pipe';
import {of} from 'rxjs';

import {DevelopersComponent} from './developers.component';
import {AdminService} from '../../../admin/components/admin.service';
import {PlanningService} from '../../../planning.service';
import {StoryPoints} from '../../../models/storyPoints';
import {DeveloperId} from '../../../models/delevoper';

describe('DevelopersComponent', () => {
  let component: DevelopersComponent;
  let fixture: ComponentFixture<DevelopersComponent>;
  let adminService: jasmine.SpyObj<AdminService>;

  function createComponent(): void {
    fixture = TestBed.createComponent(DevelopersComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }

  beforeEach(async () => {
    adminService = jasmine.createSpyObj('AdminService', ['getDevelopers', 'deleteUser']);
    adminService.getDevelopers.and.returnValue(of([]));
    adminService.deleteUser.and.resolveTo();

    const planningService = jasmine.createSpyObj('PlanningService', ['getDevelopers']);
    const router = jasmine.createSpyObj('Router', ['navigateByUrl', 'createUrlTree']);
    router.navigateByUrl.and.resolveTo(true);
    router.createUrlTree.and.returnValue({} as any);

    await TestBed.configureTestingModule({
      declarations: [DevelopersComponent],
      imports: [NoopAnimationsModule, OrderModule],
      providers: [
        {provide: ActivatedRoute, useValue: {params: of({planningId: 'p1'})} as any},
        {provide: PlanningService, useValue: planningService},
        {provide: Router, useValue: router},
        {provide: AdminService, useValue: adminService},
      ],
      schemas: [NO_ERRORS_SCHEMA],
    })
      .compileComponents();
  });

  it('should create', () => {
    createComponent();
    expect(component).toBeTruthy();
  });

  it('loads developers from the admin service when a planning id is present', () => {
    const developers: DeveloperId[] = [{id: 'd1', name: 'A', storyPoints: null}];
    adminService.getDevelopers.and.returnValue(of(developers));

    createComponent();

    expect(adminService.getDevelopers).toHaveBeenCalledWith('p1');
    expect(component.developers).toBe(developers);
  });

  it('delegates deleting a developer to the admin service', async () => {
    createComponent();

    await component.delete('d1');

    expect(adminService.deleteUser).toHaveBeenCalledWith('p1', 'd1');
  });

  it('renders story points using the shared formatter', () => {
    createComponent();

    expect(component.renderStoryPoints(StoryPoints.s5)).toBe('5');
    expect(component.renderStoryPoints(StoryPoints.coffee)).toBe('☕️');
  });

  it('reports readiness before results are shown based on having chosen story points', () => {
    createComponent();
    component.showResults = false;

    expect(component.devIsReady(StoryPoints.s5)).toBeTrue();
    expect(component.devIsReady(null)).toBeFalse();
  });

  it('reports readiness once results are shown, excluding the unsure choice', () => {
    createComponent();
    component.showResults = true;

    expect(component.devIsReady(StoryPoints.unsure)).toBeFalse();
    expect(component.devIsReady(StoryPoints.s5)).toBeTrue();
  });

  it('tracks developers by id', () => {
    createComponent();
    const developer = {id: 'd7', name: 'X', storyPoints: null} as DeveloperId;

    expect(component.trackById(0, developer)).toBe('d7');
  });

});

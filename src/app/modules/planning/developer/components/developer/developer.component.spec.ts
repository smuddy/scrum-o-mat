import {ComponentFixture, TestBed} from '@angular/core/testing';
import {NO_ERRORS_SCHEMA} from '@angular/core';
import {NoopAnimationsModule} from '@angular/platform-browser/animations';
import {ActivatedRoute, Router} from '@angular/router';
import {of} from 'rxjs';

import {DeveloperComponent} from './developer.component';
import {PlanningService} from '../../../planning.service';
import {AdminService} from '../../../admin/components/admin.service';
import {MenuService} from '../../../../../shared/menu/menu.service';
import {HeaderService} from '../../../../../shared/header/header.service';
import {StoryPoints} from '../../../models/storyPoints';

declare var fireworks;

describe('DeveloperComponent', () => {
  let component: DeveloperComponent;
  let fixture: ComponentFixture<DeveloperComponent>;
  let planningService: jasmine.SpyObj<PlanningService>;
  let adminService: jasmine.SpyObj<AdminService>;
  let menuService: jasmine.SpyObj<MenuService>;
  let headerService: jasmine.SpyObj<HeaderService>;
  let router: jasmine.SpyObj<Router>;

  beforeEach(async () => {
    (window as any).fireworks = {_particlesPerExplosion: 0, _interval: []};

    planningService = jasmine.createSpyObj('PlanningService', ['getPlanning', 'getDeveloper', 'updateStoryPoints', 'deleteUser']);
    planningService.getPlanning.and.returnValue(of(null));
    planningService.getDeveloper.and.returnValue(of({name: 'Ada', storyPoints: 1} as any));
    planningService.updateStoryPoints.and.resolveTo();
    planningService.deleteUser.and.resolveTo();

    adminService = jasmine.createSpyObj('AdminService', ['getDevelopers']);
    adminService.getDevelopers.and.returnValue(of([]));

    menuService = jasmine.createSpyObj('MenuService', ['addCustomAction', 'resetCustomActions']);
    headerService = jasmine.createSpyObj('HeaderService', ['setBreadcrumb', 'setFullscreen']);

    router = jasmine.createSpyObj('Router', ['navigateByUrl', 'createUrlTree']);
    router.navigateByUrl.and.resolveTo(true);
    router.createUrlTree.and.returnValue({} as any);

    await TestBed.configureTestingModule({
      declarations: [DeveloperComponent],
      imports: [NoopAnimationsModule],
      providers: [
        {provide: ActivatedRoute, useValue: {params: of({planningId: 'p1', userId: 'u1'})} as any},
        {provide: PlanningService, useValue: planningService},
        {provide: AdminService, useValue: adminService},
        {provide: MenuService, useValue: menuService},
        {provide: HeaderService, useValue: headerService},
        {provide: Router, useValue: router},
      ],
      schemas: [NO_ERRORS_SCHEMA],
    })
      .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(DeveloperComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('sets the breadcrumb and enables fullscreen on init', () => {
    expect(headerService.setBreadcrumb).toHaveBeenCalledWith([{route: '/planning', name: 'Scrum Poker'}]);
    expect(headerService.setFullscreen).toHaveBeenCalledWith(true);
  });

  it('navigates away when there is no active planning', () => {
    expect(router.createUrlTree).toHaveBeenCalledWith(['/'], {queryParams: {session: 'p1'}});
    expect(router.navigateByUrl).toHaveBeenCalled();
  });

  it('renders story points as text', () => {
    expect(component.renderStoryPoints(StoryPoints.s5)).toBe('5');
  });

  it('delegates card selection to planningService.updateStoryPoints', async () => {
    await component.onCardSelected(StoryPoints.s5);

    expect(planningService.updateStoryPoints).toHaveBeenCalledWith('p1', 'u1', StoryPoints.s5);
  });

  it('calculates the width percentage based on maxPoints', () => {
    component.maxPoints = 4;

    expect(component.getWidthPercentage(2)).toBe(30);
  });

  it('logs out by deleting the user and navigating to the planning overview', async () => {
    await component.logout();

    expect(planningService.deleteUser).toHaveBeenCalledWith('p1', 'u1');
    expect(router.createUrlTree).toHaveBeenCalledWith(['/planning/'], {queryParams: {session: 'p1'}});
    expect(router.navigateByUrl).toHaveBeenCalled();
  });

});

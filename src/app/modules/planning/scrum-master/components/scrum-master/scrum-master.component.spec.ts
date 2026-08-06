import {ComponentFixture, TestBed} from '@angular/core/testing';
import {NO_ERRORS_SCHEMA} from '@angular/core';
import {NoopAnimationsModule} from '@angular/platform-browser/animations';
import {ActivatedRoute, Router} from '@angular/router';
import {of, Subject} from 'rxjs';

import {ScrumMasterComponent} from './scrum-master.component';
import {PlanningService} from '../../../planning.service';
import {MenuService} from '../../../../../shared/menu/menu.service';
import {HeaderService} from '../../../../../shared/header/header.service';
import {environment} from '../../../../../../environments/environment';
import {Planning} from '../../../models/planning';
import {DeveloperId} from '../../../models/delevoper';
import {StoryPoints} from '../../../models/storyPoints';

describe('ScrumMasterComponent', () => {
  let component: ScrumMasterComponent;
  let fixture: ComponentFixture<ScrumMasterComponent>;
  let planningService: jasmine.SpyObj<PlanningService>;
  let router: jasmine.SpyObj<Router>;
  let menuService: jasmine.SpyObj<MenuService>;
  let headerService: jasmine.SpyObj<HeaderService>;
  let menuOpenSubject: Subject<boolean>;

  function createComponent(): void {
    fixture = TestBed.createComponent(ScrumMasterComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }

  beforeEach(async () => {
    (window as any).fireworks = {};

    planningService = jasmine.createSpyObj('PlanningService', [
      'getDevelopers', 'getPlanning', 'resetEstimate', 'setEstimateResult', 'deletePlanning',
    ]);
    planningService.getDevelopers.and.returnValue(of([]));
    planningService.getPlanning.and.returnValue(of(undefined));
    planningService.resetEstimate.and.resolveTo();
    planningService.setEstimateResult.and.resolveTo();
    planningService.deletePlanning.and.resolveTo();

    router = jasmine.createSpyObj('Router', ['navigateByUrl', 'createUrlTree']);
    router.navigateByUrl.and.resolveTo(true);
    router.createUrlTree.and.returnValue({} as any);

    menuOpenSubject = new Subject<boolean>();
    menuService = jasmine.createSpyObj('MenuService', ['addCustomAction', 'resetCustomActions']);
    (menuService as any).menuOpen$ = menuOpenSubject.asObservable();

    headerService = jasmine.createSpyObj('HeaderService', ['setBreadcrumb', 'setFullscreen']);

    await TestBed.configureTestingModule({
      declarations: [ScrumMasterComponent],
      imports: [NoopAnimationsModule],
      providers: [
        {provide: ActivatedRoute, useValue: {params: of({planningId: 'p1'})} as any},
        {provide: PlanningService, useValue: planningService},
        {provide: Router, useValue: router},
        {provide: MenuService, useValue: menuService},
        {provide: HeaderService, useValue: headerService},
      ],
      schemas: [NO_ERRORS_SCHEMA],
    })
      .compileComponents();
  });

  it('should create', () => {
    createComponent();
    expect(component).toBeTruthy();
  });

  it('sets the breadcrumb and loads developers and planning on init', () => {
    const developers: DeveloperId[] = [{id: 'd1', name: 'Dev', storyPoints: null}];
    const planning: Planning = {
      issue: null, modified: new Date(), subject: 'Sprint 1', count: 2, userId: 'u1',
      estimateRequested: false, estimateSucceeded: true, storyPoints: StoryPoints.s5,
    };
    planningService.getDevelopers.and.returnValue(of(developers));
    planningService.getPlanning.and.returnValue(of(planning));

    createComponent();

    expect(headerService.setBreadcrumb).toHaveBeenCalledWith([{route: '/planning', name: 'Scrum Poker'}]);
    expect(component.developers).toBe(developers);
    expect(component.planning).toBe(planning);
    expect(component.count).toBe(2);
    expect(menuService.addCustomAction).toHaveBeenCalledWith('Session beenden', jasmine.any(Function));
  });

  it('navigates away when the loaded planning has no subject', () => {
    planningService.getPlanning.and.returnValue(of({} as Planning));

    createComponent();

    expect(router.navigateByUrl).toHaveBeenCalledWith('/planning');
    expect(component.planning).toBeUndefined();
  });

  it('enables fullscreen mode when the planning has an issue', () => {
    const planning: Planning = {
      issue: 'ISSUE-1', modified: new Date(), subject: 'Sprint 1', count: 1, userId: 'u1',
      estimateRequested: false, estimateSucceeded: false, storyPoints: StoryPoints.s5,
    };
    planningService.getPlanning.and.returnValue(of(planning));

    createComponent();

    expect(headerService.setFullscreen).toHaveBeenCalledWith(true);
  });

  it('derives the estimate status flags from the current planning', () => {
    createComponent();
    component.planning = {
      issue: null, modified: new Date(), subject: 'Sprint 1', count: 1, userId: 'u1',
      estimateRequested: false, estimateSucceeded: true, storyPoints: StoryPoints.s5,
    };

    expect(component.estimateSucceeded()).toBeTrue();
    expect(component.coffeeBreak()).toBeFalse();
    expect(component.estimateFailed()).toBeFalse();
    expect(component.estimateRequested()).toBeFalse();

    component.planning.storyPoints = StoryPoints.coffee;
    expect(component.estimateSucceeded()).toBeFalse();
    expect(component.coffeeBreak()).toBeTrue();

    component.planning.estimateSucceeded = false;
    component.planning.storyPoints = StoryPoints.s5;
    expect(component.estimateFailed()).toBeTrue();

    component.planning.estimateRequested = true;
    expect(component.estimateRequested()).toBeTrue();
  });

  it('requests a new estimate for the next round', async () => {
    createComponent();
    component.planning = {count: 3} as Planning;

    await component.requestEstimate();

    expect(planningService.resetEstimate).toHaveBeenCalledWith('p1', 4);
  });

  it('resumes after a coffee break with the current round', async () => {
    createComponent();
    component.planning = {count: 3} as Planning;

    await component.resumeAfterCoffeeBreak();

    expect(planningService.resetEstimate).toHaveBeenCalledWith('p1', 3);
  });

  it('navigates away and deletes the planning on logout', async () => {
    createComponent();

    await component.logout();

    expect(router.navigateByUrl).toHaveBeenCalledWith('/planning');
    expect(planningService.deletePlanning).toHaveBeenCalledWith('p1');
  });

  it('builds the shareable link from the planning id', () => {
    createComponent();

    expect(component.link()).toBe(environment.url + 'p1');
  });

  it('copies the given link to the clipboard', () => {
    createComponent();
    const writeTextSpy = spyOn(navigator.clipboard, 'writeText');

    component.copyLink('http://link');

    expect(writeTextSpy).toHaveBeenCalledWith('http://link');
  });

  it('ignores developer updates when no estimate is requested', async () => {
    createComponent();
    component.planning = {estimateRequested: false} as Planning;

    await component['developersChanged']([{id: 'd1', name: 'A', storyPoints: StoryPoints.s5} as DeveloperId]);

    expect(planningService.setEstimateResult).not.toHaveBeenCalled();
  });

  it('sets a successful estimate result once every developer agreed', async () => {
    createComponent();
    component.planning = {estimateRequested: true} as Planning;
    const developers = [
      {id: 'd1', name: 'A', storyPoints: StoryPoints.s5} as DeveloperId,
      {id: 'd2', name: 'B', storyPoints: StoryPoints.s5} as DeveloperId,
    ];

    await component['developersChanged'](developers);

    expect(planningService.setEstimateResult).toHaveBeenCalledWith('p1', true, StoryPoints.s5);
  });

  it('sets a failed estimate result when developers disagree', async () => {
    createComponent();
    component.planning = {estimateRequested: true} as Planning;
    const developers = [
      {id: 'd1', name: 'A', storyPoints: StoryPoints.s5} as DeveloperId,
      {id: 'd2', name: 'B', storyPoints: StoryPoints.s8} as DeveloperId,
    ];

    await component['developersChanged'](developers);

    expect(planningService.setEstimateResult).toHaveBeenCalledWith('p1', false, StoryPoints.s5);
  });

  it('waits for every developer to choose before setting a result', async () => {
    createComponent();
    component.planning = {estimateRequested: true} as Planning;
    const developers = [
      {id: 'd1', name: 'A', storyPoints: StoryPoints.s5} as DeveloperId,
      {id: 'd2', name: 'B', storyPoints: null} as DeveloperId,
    ];

    await component['developersChanged'](developers);

    expect(planningService.setEstimateResult).not.toHaveBeenCalled();
  });

  it('sets a coffee-break result as soon as one developer chooses coffee', async () => {
    createComponent();
    component.planning = {estimateRequested: true} as Planning;
    const developers = [
      {id: 'd1', name: 'A', storyPoints: StoryPoints.coffee} as DeveloperId,
      {id: 'd2', name: 'B', storyPoints: null} as DeveloperId,
    ];

    await component['developersChanged'](developers);

    expect(planningService.setEstimateResult).toHaveBeenCalledWith('p1', true, StoryPoints.coffee);
  });

  it('hides the qr code once the menu is opened', () => {
    createComponent();
    expect(component.showQrCode).toBeTrue();

    menuOpenSubject.next(true);

    expect(component.showQrCode).toBeFalse();
  });

  it('resets the custom menu actions and disables fullscreen on destroy', () => {
    createComponent();

    component.ngOnDestroy();

    expect(menuService.resetCustomActions).toHaveBeenCalled();
    expect(headerService.setFullscreen).toHaveBeenCalledWith(false);
  });

});

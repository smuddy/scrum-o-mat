import {ComponentFixture, TestBed} from '@angular/core/testing';
import {NO_ERRORS_SCHEMA} from '@angular/core';
import {CommonModule} from '@angular/common';
import {NoopAnimationsModule} from '@angular/platform-browser/animations';
import {ActivatedRoute, Router} from '@angular/router';
import {OrderModule} from 'ngx-order-pipe';
import {of} from 'rxjs';

import {GuestComponent} from './guest.component';
import {PlanningService} from '../planning.service';
import {AdminService} from '../admin/components/admin.service';
import {HeaderService} from '../../../shared/header/header.service';
import {StoryPoints} from '../models/storyPoints';
import {DeveloperId} from '../models/delevoper';

describe('GuestComponent', () => {
  let component: GuestComponent;
  let fixture: ComponentFixture<GuestComponent>;
  let planningService: jasmine.SpyObj<PlanningService>;
  let adminService: jasmine.SpyObj<AdminService>;
  let headerService: jasmine.SpyObj<HeaderService>;
  let router: jasmine.SpyObj<Router>;

  beforeEach(async () => {
    planningService = jasmine.createSpyObj('PlanningService', ['getPlanning']);
    adminService = jasmine.createSpyObj('AdminService', ['getDevelopers']);
    headerService = jasmine.createSpyObj('HeaderService', ['setFullscreen', 'setBreadcrumb']);
    router = jasmine.createSpyObj('Router', ['navigateByUrl', 'createUrlTree']);
    router.navigateByUrl.and.resolveTo(true);
    router.createUrlTree.and.returnValue({} as any);
    planningService.getPlanning.and.returnValue(of(undefined));
    adminService.getDevelopers.and.returnValue(of([]));

    await TestBed.configureTestingModule({
      declarations: [GuestComponent],
      imports: [CommonModule, NoopAnimationsModule, OrderModule],
      providers: [
        {provide: ActivatedRoute, useValue: {params: of({planningId: 'planning-1'}), queryParams: of({})} as any},
        {provide: PlanningService, useValue: planningService},
        {provide: Router, useValue: router},
        {provide: AdminService, useValue: adminService},
        {provide: HeaderService, useValue: headerService},
      ],
      schemas: [NO_ERRORS_SCHEMA],
    })
      .compileComponents();
  });

  beforeEach(() => {
    (window as any).fireworks = {};
    fixture = TestBed.createComponent(GuestComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => {
    delete (window as any).fireworks;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('sets the fullscreen header and the breadcrumb on init', () => {
    expect(headerService.setFullscreen).toHaveBeenCalledWith(true);
    expect(headerService.setBreadcrumb).toHaveBeenCalledWith([{route: '/planning', name: 'Scrum Poker'}]);
  });

  it('redirects to the start page when no planning is found for the session', () => {
    expect(router.createUrlTree).toHaveBeenCalledWith(['/'], {queryParams: {session: 'planning-1'}});
    expect(router.navigateByUrl).toHaveBeenCalled();
  });

  it('applies planning data and configures the fireworks intensity', () => {
    const planning = {
      count: 1,
      issue: 'issue-1',
      subject: 'subject-1',
      estimateRequested: false,
      estimateSucceeded: true,
      storyPoints: StoryPoints.s5,
    } as any;
    planningService.getPlanning.and.returnValue(of(planning));

    fixture = TestBed.createComponent(GuestComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();

    expect(component.count).toBe(1);
    expect(component.subject).toBe('subject-1');
    expect(component.estimateSucceeded).toBeTrue();
    expect(component.coffeeBreak).toBeFalse();
    expect((window as any).fireworks._particlesPerExplosion).toBe(50);
    expect((window as any).fireworks._interval).toEqual([200, 1500]);
  });

  it('marks a coffee break and disables fireworks when the coffee card was chosen', () => {
    const planning = {
      count: 1,
      issue: 'issue-1',
      subject: 'subject-1',
      estimateRequested: false,
      estimateSucceeded: true,
      storyPoints: StoryPoints.coffee,
    } as any;
    planningService.getPlanning.and.returnValue(of(planning));

    fixture = TestBed.createComponent(GuestComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();

    expect(component.coffeeBreak).toBeTrue();
    expect((window as any).fireworks._particlesPerExplosion).toBe(0);
  });

  it('aggregates the selected story points and the chosen percentage once every developer has estimated', () => {
    const developers: DeveloperId[] = [
      {id: '1', name: 'Alice', storyPoints: StoryPoints.s3},
      {id: '2', name: 'Bob', storyPoints: StoryPoints.s3},
      {id: '3', name: 'Carol', storyPoints: StoryPoints.s5},
    ];
    adminService.getDevelopers.and.returnValue(of(developers));

    fixture = TestBed.createComponent(GuestComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();

    expect(component.chosenPercent).toBe(100);
    expect(component.maxPoints).toBe(2);
    expect(component.selectedStoryPoints).toEqual([
      {storyPoint: StoryPoints.s3, count: 2},
      {storyPoint: StoryPoints.s5, count: 1},
    ]);
  });

  it('skips the aggregation while a developer has not estimated yet', () => {
    const developers: DeveloperId[] = [
      {id: '1', name: 'Alice', storyPoints: StoryPoints.s3},
      {id: '2', name: 'Bob', storyPoints: null},
    ];
    adminService.getDevelopers.and.returnValue(of(developers));

    fixture = TestBed.createComponent(GuestComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();

    expect(component.chosenPercent).toBe(50);
    expect(component.selectedStoryPoints).toEqual([]);
    expect(component.maxPoints).toBe(1);
  });

  it('renders the label for a given story point', () => {
    expect(component.renderStoryPoints(StoryPoints.s5)).toBe('5');
  });

  it('computes the bar width percentage based on the highest vote count', () => {
    component.maxPoints = 4;

    expect(component.getWidthPercentage(2)).toBe(30);
  });

  it('turns off the fullscreen header on destroy', () => {
    component.ngOnDestroy();

    expect(headerService.setFullscreen).toHaveBeenCalledWith(false);
  });

});

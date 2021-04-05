import {Injectable} from '@angular/core';
import {Sprint, Staff, Velocity} from './models/velocity';
import {BehaviorSubject, Observable} from 'rxjs';
import {map} from 'rxjs/operators';
import produce from 'immer';
import {simpleMovingAverage} from './moving-average-helper';


@Injectable({
  providedIn: 'root'
})
export class VelocityService {

  private velocity$ = new BehaviorSubject<Velocity>({sprints: []});

  constructor() {
    const lc = localStorage.getItem('velocity');
    if (!lc) {
      return;
    }
    const velo = JSON.parse(lc);
    if (!velo) {
      return;
    }
    this.save(velo);
  }

  private static calcVelocityFromHistory(velocityHistory: number[]): number {
    if (velocityHistory.length === 0) {
      return 1;
    }
    const historyToConsider = Math.min(velocityHistory.length, 5);
    const average = simpleMovingAverage(velocityHistory, historyToConsider);
    return average[average.length - 1];
  }

  public getVelocity$ = (): Observable<Velocity> => this.velocity$;
  public getSprint$ = (id: number): Observable<Sprint> => this.velocity$.pipe(map(_ => _.sprints.find(s => s.sprintNumber === id)));

  public addSprint(): void {
    const newVelocity = produce(this.velocity$.getValue(), velocity => {
      const initialSprint: Sprint = {
        sprintNumber: this.getDefaultSprintNumber(velocity),
        fromDate: this.getDefaultFromDate(velocity),
        toDate: this.getDefaultToDate(velocity),
        velocityAchieved: 0,
        velocityPlaned: this.getDefaultVelocity(velocity),
        pointsAchieved: 0,
        pointsPlaned: 0,
        availableStaff: this.getDefaultAvailableDevelopers(velocity)
      };
      velocity.sprints.push(initialSprint);
    });
    this.save(newVelocity);
  }

  public updateFromDate = (id: number, date: Date) => this.updateSprintValue(id, s => s.fromDate = date);

  public updateToDate = (id: number, date: Date) => this.updateSprintValue(id, s => s.toDate = date);

  public updatePointsAchieved = (id: number, points: number) => this.updateSprintValue(id, s => s.pointsAchieved = points);

  public updateStaffName = (id: number, name: string, newName: string) => this.updateStaff(id, name, s => s.name = newName);

  public updateStaffDays = (id: number, name: string, newDays: number) => this.updateStaff(id, name, s => s.days = newDays);

  public updateStaffPercent = (id: number, name: string, newPercent: number) => this.updateStaff(id, name, s => s.percent = newPercent);

  public addStaff(id: number) {
    this.updateSprintValue(id, s => {
      s.availableStaff.push({name: '', days: 10, percent: 100});
    });
  }

  private save(velocity: Velocity) {
    const calculatedVelocity = this.calculate(velocity);
    this.velocity$.next(calculatedVelocity);
    localStorage.setItem('velocity', JSON.stringify(calculatedVelocity));
  }

  private getDefaultAvailableDevelopers(velocity: Velocity) {
    if (velocity.sprints.length === 0) {
      return [];
    }

    const lastSprintDevelopers = this.getLastSprint(velocity).availableStaff;
    return [...lastSprintDevelopers.map(old => ({...old}))];
  }

  private getDefaultFromDate(velocity: Velocity): Date {
    return this.getLastSprint(velocity)?.toDate || new Date();
  }

  private getDefaultToDate(velocity: Velocity): Date {
    const numWeeks = 2;
    const to = new Date(this.getDefaultFromDate(velocity).valueOf());
    to.setDate(to.getDate() + numWeeks * 7);

    return to;
  }

  private getDefaultSprintNumber = (velocity: Velocity): number => this.getLastSprint(velocity)?.sprintNumber + 1 || 1;

  private getLastSprint = (velocity: Velocity) => velocity.sprints.length === 0 ? null : velocity.sprints[velocity.sprints.length - 1];

  private getDefaultVelocity = (velocity: Velocity): number => velocity.sprints.length === 0 ? 1 : 0;

  private updateStaff(id: number, name: string, manipulate: (staff: Staff) => void) {
    this.updateSprintValue(id, s => {
      const staff = s.availableStaff.find(_ => _.name === name);
      if (staff) {
        manipulate(staff);
      }
    });
  }

  private updateSprintValue(id: number, manipulate: (sprint: Sprint) => void) {
    const newVelocity = produce(this.velocity$.getValue(), velocity => {
      const sprint = velocity.sprints.find(_ => _.sprintNumber === id);
      if (sprint) {
        manipulate(sprint);
      }
    });
    this.save(newVelocity);
  }

  private calculate(oldVelocity: Velocity): Velocity {
    return produce(oldVelocity, velocity => {
      const velocityHistory: number[] = [];
      velocity.sprints.forEach(sprint => {
        const staffCount = sprint.availableStaff.reduce((count, staff) => count + staff.days * staff.percent / 100, 0);
        sprint.velocityAchieved = staffCount ? sprint.pointsAchieved / staffCount : 0;
        sprint.velocityPlaned = VelocityService.calcVelocityFromHistory(velocityHistory);

        sprint.pointsPlaned = sprint.velocityPlaned * staffCount;


        velocityHistory.push(sprint.velocityAchieved);
      });


    });
  }
}

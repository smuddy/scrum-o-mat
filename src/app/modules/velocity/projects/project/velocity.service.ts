import {Injectable} from '@angular/core';
import {Project, Sprint, Staff} from '../../models/project';
import {Observable} from 'rxjs';
import {map} from 'rxjs/operators';
import produce from 'immer';
import {simpleMovingAverage} from '../../moving-average-helper';
import {ProjectService} from '../project.service';
import firebase from 'firebase/app';
import {ID} from '../../../../helpers/id';
import Timestamp = firebase.firestore.Timestamp;

@Injectable({
  providedIn: 'root'
})
export class VelocityService {

  constructor(
    private projectService: ProjectService
  ) {
  }

  private static calcVelocityFromHistory(initialVelocity: number, velocityHistory: number[], isForecast: boolean, lastCalculatedVelocity: number): number {
    if (velocityHistory.length === 0) {
      return initialVelocity ?? 1;
    }
    if (isForecast) {
      return lastCalculatedVelocity;
    }

    const historyToConsider = Math.min(velocityHistory.length, 5);
    const average = simpleMovingAverage(velocityHistory, historyToConsider);
    return average[average.length - 1];
  }


  public getSprint$ = (projectId: string, sprintId: string): Observable<Sprint & { projectName: string }> => this.projectService.getProject(projectId)
    .pipe(map(_ => ({..._.sprints.find(s => s.id === sprintId), projectName: _.name})));

  public async addSprint(projectId: string, project: Project): Promise<void> {
    const newVelocity = produce(project, velocity => {
      const initialSprint: Sprint = {
        id: ID(),
        sprintNumber: this.getDefaultSprintNumber(velocity),
        fromDate: this.getDefaultFromDate(velocity),
        toDate: this.getDefaultToDate(velocity),
        velocityAchieved: 0,
        velocityPlaned: this.getDefaultVelocity(velocity),
        pointsAchieved: 0,
        pointsPlaned: 0,
        isForecast: false,
        availableStaff: this.getDefaultAvailableDevelopers(velocity)
      };
      velocity.sprints.push(initialSprint);
    });
    await this.update(projectId, newVelocity);
  }

  public async removeSprint(projectId: string, project: Project, sprintId: string): Promise<void> {
    const newVelocity = produce(project, velocity => {
      velocity.sprints = velocity.sprints.filter(_ => _.id !== sprintId);
    });
    await this.update(projectId, newVelocity);
  }

  public updateFromDate = async (projectId: string, project: Project, sprintId: number, date: Date) => this.updateSprintValue(projectId, project, sprintId, s => s.fromDate = Timestamp.fromDate(date));

  public updateToDate = async (projectId: string, project: Project, sprintId: number, date: Date) => this.updateSprintValue(projectId, project, sprintId, s => s.toDate = Timestamp.fromDate(date));

  public updatePointsAchieved = async (projectId: string, project: Project, sprintId: number, points: number) => this.updateSprintValue(projectId, project, sprintId, s => s.pointsAchieved = points);

  public updateStaffName = async (projectId: string, project: Project, sprintId: number, name: string, newName: string) => this.updateStaff(projectId, project, sprintId, name, s => s.name = newName);

  public updateStaffDays = async (projectId: string, project: Project, sprintId: number, name: string, newDays: number) => this.updateStaff(projectId, project, sprintId, name, s => s.days = newDays);

  public updateStaffPercent = async (projectId: string, project: Project, sprintId: number, name: string, newPercent: number) => this.updateStaff(projectId, project, sprintId, name, s => s.percent = newPercent);

  public updateInitialVelocity = async (projectId: string, project: Project, initialVelocity: number) => {
    const update = produce(project, p => {
      p.initialVelocity = initialVelocity;
    });
    await this.update(projectId, update);
  };

  public async addStaff(projectId: string, project: Project, sprintId: number) {
    await this.updateSprintValue(projectId, project, sprintId, s => {
      s.availableStaff.push({id: ID(), name: '', days: 10, percent: 100});
    });
  }

  public async removeStaff(projectId: string, project: Project, sprintId: number, staffId: string) {
    await this.updateSprintValue(projectId, project, sprintId, s => {
      s.availableStaff = s.availableStaff.filter(_ => _.id !== staffId);
    });
  }

  private async update(projectId: string, project: Project) {
    const calculatedVelocity = this.calculate(project);
    await this.projectService.updateProject(projectId, calculatedVelocity);
  }

  private getDefaultAvailableDevelopers(velocity: Project) {
    if (velocity.sprints.length === 0) {
      return [];
    }

    const lastSprintDevelopers = this.getLastSprint(velocity).availableStaff;
    return [...lastSprintDevelopers.map(old => ({...old}))];
  }

  private getDefaultFromDate(velocity: Project): Timestamp {
    return this.getLastSprint(velocity)?.toDate || Timestamp.fromDate(new Date());
  }

  private getDefaultToDate(velocity: Project): Timestamp {
    const numWeeks = 2;
    const to = new Date(this.getDefaultFromDate(velocity).toDate());
    to.setDate(to.getDate() + numWeeks * 7);

    return Timestamp.fromDate(to);
  }

  private getDefaultSprintNumber = (velocity: Project): number => this.getLastSprint(velocity)?.sprintNumber + 1 || 1;

  private getLastSprint = (velocity: Project) => velocity.sprints.length === 0 ? null : velocity.sprints[velocity.sprints.length - 1];

  private getDefaultVelocity = (velocity: Project): number => velocity.sprints.length === 0 ? 1 : 0;

  private async updateStaff(projectId: string, project: Project, sprintId: number, name: string, manipulate: (staff: Staff) => void) {
    await this.updateSprintValue(projectId, project, sprintId, s => {
      const staff = s.availableStaff.find(_ => _.name === name);
      if (staff) {
        manipulate(staff);
      }
    });
  }

  private async updateSprintValue(projectId: string, project: Project, sprintId: number, manipulate: (sprint: Sprint) => void) {
    const newVelocity = produce(project, velocity => {
      const sprint = velocity.sprints.find(_ => _.sprintNumber === sprintId);
      if (sprint) {
        manipulate(sprint);
      }
    });
    await this.update(projectId, newVelocity);
  }

  private calculate(oldVelocity: Project): Project {
    const initialVelocity = oldVelocity.initialVelocity ?? 1;
    const velocityHistory: number[] = [initialVelocity, initialVelocity, initialVelocity, initialVelocity, initialVelocity];
    return produce(oldVelocity, velocity => {
      let previousSprint: Sprint = null;
      let lastCalculatedVelocity = initialVelocity;
      velocity.sprints.forEach(sprint => {
        const staffCount = sprint.availableStaff.reduce((count, staff) => count + staff.days * staff.percent / 100, 0);
        sprint.velocityAchieved = staffCount ? sprint.pointsAchieved / staffCount : 0;

        const isForecast = previousSprint !== null && previousSprint.pointsAchieved === 0;
        sprint.isForecast = isForecast;
        sprint.velocityPlaned = VelocityService.calcVelocityFromHistory(initialVelocity, velocityHistory, isForecast, lastCalculatedVelocity);
        if (!!sprint.velocityPlaned) {
          lastCalculatedVelocity = sprint.velocityPlaned;
        }

        sprint.pointsPlaned = sprint.velocityPlaned * staffCount;

        previousSprint = sprint;
        velocityHistory.push(sprint.velocityAchieved);
      });


    });
  }
}

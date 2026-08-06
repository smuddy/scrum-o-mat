import {Timestamp} from '@angular/fire/firestore';

export interface Staff {
  id: string;
  name: string;
  days: number;
  percent: number;
}

export interface Sprint {
  id: string;
  sprintNumber: number;
  sprintName: string;
  fromDate: Timestamp;
  toDate: Timestamp;
  pointsPlaned: number;
  pointsAchieved: number;
  velocityPlaned: number;
  velocityAchieved: number;
  availableStaff: Staff[];
  isForecast: boolean;
}

export interface Project {
  name: string;
  sprints: Sprint[];
  initialVelocity: number;

  coReaders: string[];
  coWriters: string[];
}

export interface ProjectId extends Project {
  id: string;
}

export interface ProjectOwner extends Project {
  owner: string;
}

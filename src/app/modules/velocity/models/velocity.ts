export interface Staff {
  name: string;
  days: number;
  percent: number;
}

export interface Sprint {
  sprintNumber: number;
  fromDate: Date;
  toDate: Date;
  pointsPlaned: number;
  pointsAchieved: number;
  velocityPlaned: number;
  velocityAchieved: number;
  availableStaff: Staff[];
}

export interface Velocity {
  sprints: Sprint[];
}

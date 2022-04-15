import {PlanningEstimatePartial} from './planningEstimatePartial';

export interface Planning extends PlanningEstimatePartial {
  issue: string;
  modified: any;
  subject: string;
  count: number;
  userId: string;
}

export interface PlanningId extends Planning {
  id: string;
}

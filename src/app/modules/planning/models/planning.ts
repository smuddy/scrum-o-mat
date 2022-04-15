import {PlanningEstimatePartial} from './planningEstimatePartial';

export interface Planning extends PlanningEstimatePartial {
  issue: string;
  modified: any;
  subject: string;
  count: number;
}

export interface PlanningId extends Planning {
  id: string;
}

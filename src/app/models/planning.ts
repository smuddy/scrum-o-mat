import {PlanningEstimatePartial} from './planningEstimatePartial';

export interface Planning extends PlanningEstimatePartial {
  issue: string;
  modified: any;
  subject: string;
}

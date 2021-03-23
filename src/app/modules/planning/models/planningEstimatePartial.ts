import {Storypoints} from './storypoints';

export interface PlanningEstimatePartial {
  estimateRequested: boolean;
  estimateSucceeded: boolean;
  storypoints: Storypoints;
}

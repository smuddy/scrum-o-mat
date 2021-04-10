import {StoryPoints} from './storyPoints';

export interface PlanningEstimatePartial {
  estimateRequested: boolean;
  estimateSucceeded: boolean;
  storyPoints: StoryPoints;
}

import {StoryPointsPartial} from './storyPointsPartial';

export interface Developer extends StoryPointsPartial {
  name: string;
}

export interface DeveloperId extends Developer {
  id: string;
}

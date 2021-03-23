import {StorypointsPartial} from './storypointsPartial';

export interface Developer extends StorypointsPartial {
  name: string;
}

export interface DeveloperId extends Developer {
  id: string;
}

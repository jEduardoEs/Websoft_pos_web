import { DomainEvent } from './DomainEvent';

export interface ProjectFinished extends DomainEvent {
  type: 'ProjectFinished';
  payload: {
    projectId: number;
  };
}

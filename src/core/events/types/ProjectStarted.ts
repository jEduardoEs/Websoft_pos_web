import { DomainEvent } from './DomainEvent';

export interface ProjectStarted extends DomainEvent {
  type: 'ProjectStarted';
  payload: {
    projectId: number;
  };
}

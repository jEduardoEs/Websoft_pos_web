import { DomainEvent } from './DomainEvent';

export interface ProjectCreated extends DomainEvent {
  type: 'ProjectCreated';
  payload: {
    projectId: number;
    saleId: number;
  };
}

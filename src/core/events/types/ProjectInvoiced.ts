import { DomainEvent } from './DomainEvent';

export interface ProjectInvoiced extends DomainEvent {
  type: 'ProjectInvoiced';
  payload: {
    projectId: number;
    saleId?: number;
  };
}

import { DomainEvent } from './DomainEvent';

export interface QuotationCreated extends DomainEvent {
  type: 'QuotationCreated';
  payload: {
    quotationId: number;
  };
}

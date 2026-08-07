import { DomainEvent } from './DomainEvent';

export interface QuotationApproved extends DomainEvent {
  type: 'QuotationApproved';
  payload: {
    quotationId: number;
  };
}

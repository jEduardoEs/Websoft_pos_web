import { DomainEvent } from './DomainEvent';

export interface SaleCreated extends DomainEvent {
  type: 'SaleCreated';
  payload: {
    saleId: number;
    quotationId?: number;
  };
}

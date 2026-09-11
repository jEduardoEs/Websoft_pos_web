import { DomainEvent } from './DomainEvent';

export interface SaleCompleted extends DomainEvent {
  type: 'SaleCompleted';
  payload: {
    saleId: number;
  };
}

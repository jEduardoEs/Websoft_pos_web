export interface DomainEvent<T = any> {
  type: string;
  payload: T;
  timestamp: Date | string;
  eventId?: string;
  eventType?: string;
  correlationId?: string;
  aggregateId?: string;
  aggregateType?: string;
  version?: string;
}

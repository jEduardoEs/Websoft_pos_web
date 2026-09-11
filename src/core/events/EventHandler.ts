import { IDomainEvent } from './DomainEvent'

export interface IEventHandler<T extends IDomainEvent = IDomainEvent> {
  handle(event: T): Promise<void> | void
}

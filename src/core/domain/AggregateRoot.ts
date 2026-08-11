import { DomainEvent } from '../events/types/DomainEvent';

export abstract class AggregateRoot<ID = string | number> {
  protected readonly _id: ID;
  private readonly _uncommittedEvents: DomainEvent[] = [];

  constructor(id: ID) {
    this._id = id;
  }

  get id(): ID {
    return this._id;
  }

  protected addDomainEvent(event: DomainEvent): void {
    this._uncommittedEvents.push(event);
  }

  public getUncommittedEvents(): DomainEvent[] {
    return [...this._uncommittedEvents];
  }

  public clearUncommittedEvents(): void {
    this._uncommittedEvents.length = 0;
  }
}

export interface IDomainEvent<T = unknown> {
  readonly eventName: string
  readonly occurredOn: Date
  readonly payload: T
}

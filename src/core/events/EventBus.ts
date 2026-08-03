import { IDomainEvent } from './DomainEvent'
import { IEventHandler } from './EventHandler'

export class EventBus {
  private static instance: EventBus
  private handlers = new Map<string, IEventHandler[]>()

  private constructor() {}

  public static getInstance(): EventBus {
    if (!EventBus.instance) {
      EventBus.instance = new EventBus()
    }
    return EventBus.instance
  }

  public subscribe<T extends IDomainEvent>(eventName: string, handler: IEventHandler<T>): void {
    const list = this.handlers.get(eventName) || []
    list.push(handler as IEventHandler)
    this.handlers.set(eventName, list)
  }

  public async publish<T extends IDomainEvent>(event: T): Promise<void> {
    const list = this.handlers.get(event.eventName) || []
    for (const handler of list) {
      try {
        await handler.handle(event)
      } catch (err) {
        console.error(`[EventBus] Error procesando evento ${event.eventName}:`, err)
      }
    }
  }
}

export const eventBus = EventBus.getInstance()

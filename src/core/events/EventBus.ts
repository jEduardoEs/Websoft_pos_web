import { DomainEvent } from './types/DomainEvent';
import { IEventHandler } from './EventHandler';

export type EventHandlerType<E extends DomainEvent = DomainEvent> =
  | ((event: E) => Promise<void> | void)
  | IEventHandler<any>;

type HandlerMap = Map<string, Set<EventHandlerType<any>>>;

export class EventBus {
  private handlers: HandlerMap = new Map();
  private maxRetries = 3;

  async publish<E extends DomainEvent>(event: E): Promise<void> {
    const handlers = this.handlers.get(event.type);
    if (!handlers || handlers.size === 0) return;
    const promises = Array.from(handlers).map(async (handler) => {
      let attempts = 0;
      while (attempts < this.maxRetries) {
        try {
          if (typeof handler === 'function') {
            await Promise.resolve(handler(event));
          } else if (handler && typeof handler.handle === 'function') {
            await Promise.resolve(handler.handle(event));
          }
          return;
        } catch (err) {
          attempts++;
          console.error(`[EventBus] Handler error for ${event.type} (attempt ${attempts}):`, err);
          if (attempts >= this.maxRetries) {
            console.error(`[EventBus] Giving up on handler for ${event.type}`);
          }
        }
      }
    });
    await Promise.allSettled(promises);
    console.info('[EventBus] Published', event.type, event);
  }

  subscribe<E extends DomainEvent>(eventName: E['type'], handler: EventHandlerType<E>): void {
    if (!this.handlers.has(eventName)) {
      this.handlers.set(eventName, new Set());
    }
    this.handlers.get(eventName)!.add(handler);
    console.info(`[EventBus] Subscribed to ${eventName}`);
  }

  unsubscribe<E extends DomainEvent>(eventName: E['type'], handler: EventHandlerType<E>): void {
    const set = this.handlers.get(eventName);
    if (set) {
      set.delete(handler);
      console.info(`[EventBus] Unsubscribed from ${eventName}`);
    }
  }
}

export const eventBus = new EventBus();

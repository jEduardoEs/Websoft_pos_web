import { DomainEvent } from './types/DomainEvent';
import { IEventHandler } from './EventHandler';
import { DeadLetterQueue } from './DeadLetterQueue';

export type EventHandlerType<E extends DomainEvent = DomainEvent> =
  | ((event: E) => Promise<void> | void)
  | IEventHandler<any>;

type HandlerMap = Map<string, Set<EventHandlerType<any>>>;

export class EventBus {
  private handlers: HandlerMap = new Map();
  private maxRetries = 3;
  private processedEvents: Set<string> = new Set();
  private maxProcessedHistory = 5000;

  async publish<E extends DomainEvent>(event: E): Promise<void> {
    // Fill in default domain event fields if missing
    if (!(event as any).eventId) {
      (event as any).eventId = `evt-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    }
    if (!(event as any).correlationId) {
      (event as any).correlationId = `corr-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    }
    if (!(event as any).version) {
      (event as any).version = 'v1';
    }

    const eventKey = `${event.type}:${(event as any).eventId}`;
    if (this.processedEvents.has(eventKey)) {
      console.info(`[EventBus] Ignorando evento duplicado para idempotencia: ${eventKey}`);
      return;
    }
    this.processedEvents.add(eventKey);
    if (this.processedEvents.size > this.maxProcessedHistory) {
      const first = Array.from(this.processedEvents)[0];
      if (first) this.processedEvents.delete(first);
    }

    const eventName = event.type || (event as any).eventType;
    const handlers = this.handlers.get(eventName);
    if (!handlers || handlers.size === 0) return;

    const promises = Array.from(handlers).map(async (handler) => {
      let attempts = 0;
      let lastErr: any = null;
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
          lastErr = err;
          console.error(`[EventBus] Error en handler para ${eventName} (intento ${attempts}):`, err);
          if (attempts >= this.maxRetries) {
            console.error(`[EventBus] Evento ${eventName} enviado a DLQ tras 3 reintentos.`);
            DeadLetterQueue.getInstance().pushFailedEvent(event, lastErr, attempts);
          }
        }
      }
    });

    await Promise.allSettled(promises);
    console.info('[EventBus] Publicado correctamente:', eventName, (event as any).eventId);
  }

  subscribe<E extends DomainEvent>(eventName: E['type'], handler: EventHandlerType<E>): void {
    if (!this.handlers.has(eventName)) {
      this.handlers.set(eventName, new Set());
    }
    this.handlers.get(eventName)!.add(handler);
    console.info(`[EventBus] Suscrito a ${eventName}`);
  }

  unsubscribe<E extends DomainEvent>(eventName: E['type'], handler: EventHandlerType<E>): void {
    const set = this.handlers.get(eventName);
    if (set) {
      set.delete(handler);
      console.info(`[EventBus] Desuscrito de ${eventName}`);
    }
  }
}

export const eventBus = new EventBus();

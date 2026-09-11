import { DomainEvent } from './types/DomainEvent';

export interface FailedEventRecord {
  id: string;
  event: DomainEvent;
  error: string;
  failedAt: string;
  retryCount: number;
}

export class DeadLetterQueue {
  private static instance: DeadLetterQueue;
  private readonly failedEvents: FailedEventRecord[] = [];

  private constructor() {}

  public static getInstance(): DeadLetterQueue {
    if (!DeadLetterQueue.instance) {
      DeadLetterQueue.instance = new DeadLetterQueue();
    }
    return DeadLetterQueue.instance;
  }

  public pushFailedEvent(event: DomainEvent, error: any, retryCount: number = 3): void {
    const record: FailedEventRecord = {
      id: `dlq-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      event,
      error: error?.message || String(error),
      failedAt: new Date().toISOString(),
      retryCount,
    };
    this.failedEvents.push(record);
    const eventName = event.type || event.eventType || 'UnknownEvent';
    console.error(`[DLQ] Evento fallido registrado en DLQ: ${eventName} (${event.eventId || 'no-id'})`, record.error);
  }

  public getFailedEvents(): FailedEventRecord[] {
    return [...this.failedEvents];
  }

  public clearFailedEvents(): void {
    this.failedEvents.length = 0;
  }
}

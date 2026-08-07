import { eventBus } from '@/core/events/EventBus';
import { saleCreatedListener } from './listeners/SaleCreatedListener';
import { saleCompletedListener } from './listeners/SaleCompletedListener';

export function registerProyectosListeners() {
  eventBus.subscribe('SaleCreated', saleCreatedListener);
  eventBus.subscribe('SaleCompleted', saleCompletedListener);
  console.info('[Proyectos] Event listeners registered');
}

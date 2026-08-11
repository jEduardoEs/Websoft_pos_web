import { eventBus } from '@/core/events/EventBus';
import { saleCreatedListener } from './listeners/SaleCreatedListener';
import { saleCompletedListener } from './listeners/SaleCompletedListener';
import { registerProjectDeliveredListener } from './listeners/ProjectDeliveredListener';

export function registerProyectosListeners() {
  eventBus.subscribe('SaleCreated', saleCreatedListener);
  eventBus.subscribe('VentaCreada', saleCreatedListener);
  eventBus.subscribe('SaleCompleted', saleCompletedListener);
  registerProjectDeliveredListener();
  console.info('[Proyectos] Event listeners registered');
}

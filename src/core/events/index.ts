import { registerCotizacionesListeners } from '@/modules/cotizaciones/registerEventListeners';
import { registerVentasListeners } from '@/modules/ventas/registerEventListeners';
import { registerProyectosListeners } from '@/modules/proyectos/registerEventListeners';
import { registerAuditoriaListeners } from '@/modules/auditoria/registerEventListeners';
import { registerInventoryEventListeners } from '@/core/inventory/InventoryEventListener';
import { registerWarrantyClaimApprovedListener } from '@/modules/garantias/listeners/WarrantyClaimApprovedListener';
import { eventBus } from './EventBus';
import { DomainNotificationManager } from '../notifications/DomainNotificationManager';
import { AppCache } from '../cache/AppCache';

export function initializeEventBus() {
  registerCotizacionesListeners();
  registerVentasListeners();
  registerProyectosListeners();
  registerAuditoriaListeners();
  registerInventoryEventListeners();
  registerWarrantyClaimApprovedListener();

  const domainNotificationManager = DomainNotificationManager.getInstance();
  const domainEventTypes = [
    'SaleCreated', 'VentaCreada', 'QuoteApproved', 'CotizacionAprobada',
    'ProjectDelivered', 'WarrantyStarted', 'WarrantyClaimApproved',
    'CajaShiftOpened', 'CajaShiftClosed', 'QuoteCancelled'
  ];
  domainEventTypes.forEach(evt => {
    eventBus.subscribe(evt, (e) => {
      domainNotificationManager.handleDomainEvent(e);
      AppCache.clear();
    });
  });
}

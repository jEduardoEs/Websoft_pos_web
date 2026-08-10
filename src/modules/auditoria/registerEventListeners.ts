import { eventBus } from '@/core/events/EventBus';
import { auditListener } from './listeners/AuditListener';

export function registerAuditoriaListeners() {
  // Subscribe to the specific events we care about auditing, or we could add a wildcard
  const events = [
    'CotizacionCreada', 'CotizacionAprobada', 'VentaCreada', 'VentaCancelada',
    'ProyectoCreado', 'ProyectoCancelado', 'FacturaEmitida', 'FacturaAnulada',
    'PagoRegistrado', 'ComisionReservada', 'ComisionDevengada',
    'QuotationCreated', 'QuotationApproved', 'SaleCreated', 
    'SaleCompleted', 'ProjectCreated', 'ProjectStarted', 
    'ProjectInvoiced', 'ProjectFinished'
  ];
  events.forEach(eventName => eventBus.subscribe(eventName, auditListener));
  console.info('[Auditoria] Event listeners registered');
}

import { eventBus } from '@/core/events/EventBus';
import { auditListener } from './listeners/AuditListener';

export function registerAuditoriaListeners() {
  const events = [
    'CotizacionCreada', 'CotizacionAprobada', 'VentaCreada', 'VentaCancelada',
    'ProyectoCreado', 'ProyectoCancelado', 'FacturaEmitida', 'FacturaAnulada',
    'PagoRegistrado', 'ComisionReservada', 'ComisionDevengada',
    'QuotationCreated', 'QuotationApproved', 'SaleCreated', 
    'SaleCompleted', 'ProjectCreated', 'ProjectStarted', 
    'ProjectInvoiced', 'ProjectFinished',
    'ProjectDelivered', 'ProjectClosed', 'QuoteApproved', 'QuoteCancelled',
    'QuoteDepositRegistered', 'WarrantyStarted', 'WarrantyClaimRegistered',
    'WarrantyClaimApproved', 'CommissionGenerated', 'CommissionPaid',
    'CajaShiftOpened', 'CajaCapitalInjected', 'CajaCapitalWithdrawn', 'CajaShiftClosed'
  ];
  events.forEach(eventName => eventBus.subscribe(eventName, auditListener));
  console.info('[Auditoria] Domain Event listeners registered for full audit trail.');
}

import { eventBus } from '@/core/events/EventBus';
import { quotationApprovedListener } from '@/modules/ventas/listeners/QuotationApprovedListener';

export function registerCotizacionesListeners() {
  eventBus.subscribe('QuotationApproved', quotationApprovedListener);
  eventBus.subscribe('CotizacionAprobada', quotationApprovedListener);
  console.info('[Cotizaciones] Event listeners registered');
}

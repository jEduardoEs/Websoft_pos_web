import { eventBus } from '@/core/events/EventBus';
import { quotationApprovedListener } from './listeners/QuotationApprovedListener';
import { projectInvoicedListener } from './listeners/ProjectInvoicedListener';

export function registerVentasListeners() {
  eventBus.subscribe('QuotationApproved', quotationApprovedListener);
  eventBus.subscribe('ProjectInvoiced', projectInvoicedListener);
  console.info('[Ventas] Event listeners registered');
}

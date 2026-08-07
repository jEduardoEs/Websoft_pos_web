import { eventBus } from '@/core/events/EventBus';
import { auditListener } from './listeners/AuditListener';

export function registerAuditoriaListeners() {
  // Subscribe to the specific events we care about auditing, or we could add a wildcard
  const events = [
    'QuotationCreated', 'QuotationApproved', 'SaleCreated', 
    'SaleCompleted', 'ProjectCreated', 'ProjectStarted', 
    'ProjectInvoiced', 'ProjectFinished'
  ];
  events.forEach(eventName => eventBus.subscribe(eventName, auditListener));
  console.info('[Auditoria] Event listeners registered');
}

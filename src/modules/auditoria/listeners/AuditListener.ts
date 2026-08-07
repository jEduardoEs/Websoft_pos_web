import { DomainEvent } from '@/core/events/types/DomainEvent';
import { prisma } from '@/lib/prisma';

export const auditListener = async (event: DomainEvent): Promise<void> => {
  // A generic listener to log everything to audit_log table
  try {
    const detailString = JSON.stringify(event.payload);
    await prisma.auditLog.create({
      data: {
        usuarioId: 1, // System user ID
        usuarioNombre: 'System EventBus',
        accion: event.type,
        tabla: 'event_bus',
        registroId: '0',
        detalle: `Event: ${event.type}. Payload: ${detailString}`,
      },
    });
    console.info(`[AuditListener] Audited event ${event.type}`);
  } catch (error) {
    console.error(`[AuditListener] Failed to log event ${event.type}:`, error);
  }
};

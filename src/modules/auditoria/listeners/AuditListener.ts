import { DomainEvent } from '@/core/events/types/DomainEvent';
import { TotalAuditService } from '../services/TotalAuditService';

export const auditListener = async (event: DomainEvent): Promise<void> => {
  try {
    const payload = event.payload || {};
    const typeStr = event.type || 'UNKNOWN';

    let modulo = 'general';
    if (typeStr.toLowerCase().includes('cotizacion')) modulo = 'cotizaciones';
    else if (typeStr.toLowerCase().includes('venta') || typeStr.toLowerCase().includes('sale')) modulo = 'ventas';
    else if (typeStr.toLowerCase().includes('proyecto') || typeStr.toLowerCase().includes('project')) modulo = 'proyectos';
    else if (typeStr.toLowerCase().includes('factura') || typeStr.toLowerCase().includes('invoice')) modulo = 'facturacion';
    else if (typeStr.toLowerCase().includes('comision')) modulo = 'comisiones';
    else if (typeStr.toLowerCase().includes('pago')) modulo = 'caja';

    const registroId = payload.cotizacionId || payload.ventaId || payload.proyectoId || payload.saleId || payload.projectId || payload.numero || '0';
    const usuarioNombre = payload.usuarioNombre || payload.userName || 'System EventBus';
    const estadoAnterior = payload.estadoAnterior || null;
    const estadoNuevo = payload.estadoNuevo || payload.estado || null;

    await TotalAuditService.log({
      usuarioId: payload.usuarioId || 1,
      usuarioNombre,
      fecha: event.timestamp instanceof Date ? event.timestamp : new Date(event.timestamp || Date.now()),
      ip: payload.ip || '127.0.0.1',
      equipo: payload.equipo || 'Server EventBus',
      estadoAnterior,
      estadoNuevo,
      modulo,
      accion: typeStr,
      registroId,
      valoresModificados: payload,
      detalle: `Evento de dominio procesado: ${typeStr}`,
    });

    console.info(`[AuditListener] Audited event ${typeStr}`);
  } catch (error) {
    console.error(`[AuditListener] Failed to log event ${event.type}:`, error);
  }
};

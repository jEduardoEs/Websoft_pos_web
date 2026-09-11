import { DomainEvent } from '../events/types/DomainEvent';
import { toast } from 'sonner';

export type NotificationLevel = 'SUCCESS' | 'INFO' | 'WARNING' | 'ERROR' | 'CRITICAL';

export interface DomainNotification {
  id: string;
  level: NotificationLevel;
  title: string;
  message: string;
  actionLabel?: string;
  actionUrl?: string;
  timestamp: string;
  correlationId: string;
}

export class DomainNotificationManager {
  private static instance: DomainNotificationManager;
  private readonly notificationHistory: DomainNotification[] = [];
  private readonly maxHistory = 100;

  private constructor() {}

  public static getInstance(): DomainNotificationManager {
    if (!DomainNotificationManager.instance) {
      DomainNotificationManager.instance = new DomainNotificationManager();
    }
    return DomainNotificationManager.instance;
  }

  public handleDomainEvent(event: DomainEvent): void {
    const payload = event.payload || {};
    const eventType = event.type || event.eventType || '';
    const correlationId = event.correlationId || `corr-${Date.now()}`;

    let notification: DomainNotification | null = null;

    switch (eventType) {
      case 'SaleCreated':
      case 'VentaCreada':
        notification = {
          id: `notif-${Date.now()}`,
          level: 'SUCCESS',
          title: 'Venta Registrada',
          message: `Venta ${payload.numero || payload.saleId || ''} procesada correctamente. Comprobante generado.`,
          timestamp: new Date().toISOString(),
          correlationId,
        };
        break;

      case 'QuoteApproved':
      case 'CotizacionAprobada':
        notification = {
          id: `notif-${Date.now()}`,
          level: 'SUCCESS',
          title: 'Cotización Aprobada',
          message: `Cotización ${payload.numero || payload.quoteId || ''} aprobada. Proyecto inicializado correctamente.`,
          actionLabel: 'Ver Proyecto',
          actionUrl: '/proyectos',
          timestamp: new Date().toISOString(),
          correlationId,
        };
        break;

      case 'ProjectDelivered':
        notification = {
          id: `notif-${Date.now()}`,
          level: 'SUCCESS',
          title: 'Proyecto Entregado',
          message: `Proyecto ${payload.numero || payload.projectId || ''} entregado al cliente. Certificado de garantía y comisiones activados.`,
          timestamp: new Date().toISOString(),
          correlationId,
        };
        break;

      case 'WarrantyStarted':
        notification = {
          id: `notif-${Date.now()}`,
          level: 'INFO',
          title: 'Garantía Emitida',
          message: `Certificado de garantía ${payload.numero || ''} emitido para ${payload.clienteNombre || 'cliente'}.`,
          timestamp: new Date().toISOString(),
          correlationId,
        };
        break;

      case 'WarrantyClaimApproved':
        notification = {
          id: `notif-${Date.now()}`,
          level: 'INFO',
          title: 'Reclamo Autorizado',
          message: `Reclamo de garantía ${payload.numeroGarantia || ''} aprobado. Orden de servicio técnico generada.`,
          timestamp: new Date().toISOString(),
          correlationId,
        };
        break;

      case 'CajaShiftOpened':
        notification = {
          id: `notif-${Date.now()}`,
          level: 'SUCCESS',
          title: 'Turno de Caja Abierto',
          message: `Turno de caja abierto correctamente con fondo inicial de Q ${Number(payload.fondoInicial || 0).toFixed(2)}.`,
          timestamp: new Date().toISOString(),
          correlationId,
        };
        break;

      case 'CajaShiftClosed':
        notification = {
          id: `notif-${Date.now()}`,
          level: payload.cuadreCorrecto ? 'SUCCESS' : 'WARNING',
          title: 'Turno de Caja Cerrado',
          message: `Turno de caja cerrado. Efectivo contado: Q ${Number(payload.efectivoContado || 0).toFixed(2)}. ${payload.cuadreCorrecto ? 'Cuadre perfecto.' : 'Se registró diferencia.'}`,
          timestamp: new Date().toISOString(),
          correlationId,
        };
        break;

      case 'QuoteCancelled':
        notification = {
          id: `notif-${Date.now()}`,
          level: 'WARNING',
          title: 'Cotización Cancelada',
          message: `Cotización ${payload.numero || ''} cancelada. Anticipo retenido según política de negocio (BR-002).`,
          timestamp: new Date().toISOString(),
          correlationId,
        };
        break;

      default:
        break;
    }

    if (notification) {
      this.notificationHistory.push(notification);
      if (this.notificationHistory.length > this.maxHistory) {
        this.notificationHistory.shift();
      }

      // Dispatch to UI Toast if running in browser client
      if (typeof window !== 'undefined') {
        if (notification.level === 'SUCCESS') {
          toast.success(notification.message);
        } else if (notification.level === 'WARNING') {
          toast.warning(notification.message);
        } else if (notification.level === 'ERROR' || notification.level === 'CRITICAL') {
          toast.error(notification.message);
        } else {
          toast.info(notification.message);
        }
      }
    }
  }

  public getNotificationHistory(): DomainNotification[] {
    return [...this.notificationHistory];
  }
}

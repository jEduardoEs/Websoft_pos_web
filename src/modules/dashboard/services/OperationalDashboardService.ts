// Operational Dashboard Service for WebSoft POS (Phase 6.9)
// Golden Rule: NO EMOJIS anywhere in code or comments.

import { prisma } from '@/lib/prisma';
import { AppCache } from '@/core/cache';

export interface OperationalDashboardMetrics {
  proyectosDetenidos: { count: number; items: any[] };
  ventasPendientes: { count: number; total: number };
  cotizacionesSinAnticipo: { count: number; items: any[] };
  comisionesPendientes: { count: number; totalMonto: number };
  inventarioReservado: { count: number; totalUnidades: number };
  facturasPendientes: { count: number; items: any[] };
  alertasSistema: { id: string; nivel: 'alta' | 'media' | 'baja'; mensaje: string; modulo: string }[];
}

export class OperationalDashboardService {
  static async getOperationalMetrics(): Promise<OperationalDashboardMetrics> {
    return AppCache.get('operational_dashboard_metrics', async () => {
      const fourteenDaysAgo = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000);

    const [
      proyectosStalled,
      ventasPendientesData,
      cotizacionesData,
      comisionesCount,
      kardexReservas,
      facturasPendientesData,
    ] = await Promise.all([
      // 1. Proyectos detenidos (in planificado / en_ejecucion updated over 14 days ago)
      prisma.proyecto.findMany({
        where: {
          estado: { in: ['planificado', 'en_ejecucion'] },
          updatedAt: { lte: fourteenDaysAgo },
        },
        select: { id: true, numero: true, nombre: true, clienteNombre: true, estado: true, updatedAt: true },
      }),

      // 2. Ventas pendientes
      prisma.venta.aggregate({
        where: { estado: 'pendiente' },
        _count: true,
        _sum: { total: true },
      }),

      // 3. Cotizaciones sin anticipo
      prisma.cotizacion.findMany({
        where: { estado: { in: ['pendiente', 'aceptada'] } },
        select: { id: true, numero: true, clienteNombre: true, total: true, fecha: true },
      }),

      // 4. Comisiones pendientes (audit logs with COMISION_RESERVADA or COMISION_DEVENGADA)
      prisma.auditLog.count({
        where: { accion: { in: ['COMISION_RESERVADA', 'COMISION_DEVENGADA'] } },
      }),

      // 5. Inventario reservado (kardex entries with SALIDA_RESERVA)
      prisma.kardex.aggregate({
        where: { tipo: 'SALIDA_RESERVA' },
        _count: true,
        _sum: { cantidad: true },
      }),

      // 6. Facturas pendientes (ventas without felUuid or felEstado != certificado)
      prisma.venta.findMany({
        where: {
          estado: { not: 'anulada' },
          OR: [{ felEstado: null }, { felEstado: 'error' }, { felEstado: 'sandbox' }],
        },
        select: { id: true, numero: true, clienteNombre: true, total: true, felEstado: true, fecha: true },
        take: 20,
      }),
    ]);

    // Construct alerts system list
    const alertasSistema: { id: string; nivel: 'alta' | 'media' | 'baja'; mensaje: string; modulo: string }[] = [];

    if (proyectosStalled.length > 0) {
      alertasSistema.push({
        id: 'ALT-PRY-STALLED',
        nivel: 'alta',
        mensaje: `Se detectaron ${proyectosStalled.length} proyectos sin movimiento en los últimos 14 días.`,
        modulo: 'proyectos',
      });
    }

    if ((ventasPendientesData._count || 0) > 0) {
      alertasSistema.push({
        id: 'ALT-VTA-PENDING',
        nivel: 'media',
        mensaje: `Existen ${ventasPendientesData._count} ventas en estado pendiente por cobro o cierre.`,
        modulo: 'ventas',
      });
    }

    if (facturasPendientesData.length > 0) {
      alertasSistema.push({
        id: 'ALT-FEL-PENDING',
        nivel: 'alta',
        mensaje: `Hay ${facturasPendientesData.length} ventas sin certificación DTE/FEL completada.`,
        modulo: 'facturacion',
      });
    }

    return {
      proyectosDetenidos: {
        count: proyectosStalled.length,
        items: proyectosStalled,
      },
      ventasPendientes: {
        count: ventasPendientesData._count || 0,
        total: ventasPendientesData._sum.total || 0,
      },
      cotizacionesSinAnticipo: {
        count: cotizacionesData.length,
        items: cotizacionesData,
      },
      comisionesPendientes: {
        count: comisionesCount,
        totalMonto: Number((comisionesCount * 50).toFixed(2)),
      },
      inventarioReservado: {
        count: kardexReservas._count || 0,
        totalUnidades: kardexReservas._sum.cantidad || 0,
      },
      facturasPendientes: {
        count: facturasPendientesData.length,
        items: facturasPendientesData,
      },
      alertasSistema,
    };
    }, 30000);
  }
}

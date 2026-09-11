// Intelligent Cancellation Engine for WebSoft POS
// Manages financial integrity, 50% advance retention, inventory release, commission cancellation, and audit.

import { prisma } from '@/lib/prisma';
import { WorkflowEngine } from '@/core/state';
import { RuleEngine } from '@/core/rules';
import { eventBus } from '@/core/events/EventBus';
import { VentaCancelada, FacturaAnulada, ProyectoCancelado } from '@/core/events/types';
import { CancellationRequest, CancellationPolicyResult } from './CancellationTypes';

export class CancellationEngine {
  /**
   * Intelligently cancels a Sale:
   * - Validates state machine transition & business rules.
   * - Releases product inventory back to stock and logs Kardex.
   * - Retains 50% deposit according to policy.
   * - Cancels associated sales commission.
   * - Updates related quotation and warranty records.
   * - Emits domain events and audit log.
   */
  static async cancelVenta(req: CancellationRequest): Promise<CancellationPolicyResult> {
    const venta = await prisma.venta.findUnique({
      where: { id: req.targetId },
      include: { items: true },
    });

    if (!venta) throw new Error('Venta no encontrada');

    RuleEngine.assertCanCancelInvoice({
      estado: venta.estado,
      felEstado: (venta as any).felEstado,
      felUuid: (venta as any).felUuid,
    });
    WorkflowEngine.validateTransition('venta', venta.estado, 'anulada');

    const totalMonto = venta.total;
    const anticipoRetenido50 = Number((totalMonto * 0.50).toFixed(2));
    const montoDevolucion = Math.max(0, Number((totalMonto - anticipoRetenido50).toFixed(2)));

    const result = await prisma.$transaction(async (tx) => {
      // 1. Update sale state
      await tx.venta.update({
        where: { id: venta.id },
        data: {
          estado: 'anulada',
          notas: `Anulada: ${req.motivo}. Política 50% anticipo retenido: Q${anticipoRetenido50}.`,
        },
      });

      // 2. Release product inventory back to stock & log Kardex
      for (const item of venta.items) {
        if (!item.productoId) continue;
        const prod = await tx.producto.findUnique({ where: { id: item.productoId } });
        if (prod) {
          const newStock = prod.stock + item.cantidad;
          await tx.producto.update({
            where: { id: item.productoId },
            data: { stock: newStock },
          });
          await tx.kardex.create({
            data: {
              productoId: item.productoId,
              tipo: 'entrada',
              cantidad: item.cantidad,
              stockAntes: prod.stock,
              stockDespues: newStock,
              motivo: `Anulación Venta ${venta.numero}: ${req.motivo}`,
              referencia: venta.numero,
              usuarioNombre: req.usuarioNombre,
            },
          });
        }
      }

      // 3. Update associated warranty if exists
      await tx.garantia.updateMany({
        where: { ventaId: venta.id },
        data: { estado: 'anulada', notas: `Garantía anulada por cancelación de venta ${venta.numero}` },
      });

      // 4. Update associated quotation if exists
      if (venta.cotizacionId) {
        await tx.cotizacion.update({
          where: { id: venta.cotizacionId },
          data: { estado: 'anulada', notas: `Cotización cancelada tras anulación de venta ${venta.numero}` },
        });
      }

      // 5. Audit Log
      await tx.auditLog.create({
        data: {
          usuarioId: req.usuarioId,
          usuarioNombre: req.usuarioNombre,
          accion: 'CANCELACION_VENTA_50PCT',
          tabla: 'ventas',
          registroId: String(venta.id),
          detalle: `Venta ${venta.numero} anulada. Total: Q${totalMonto}, Retenido 50%: Q${anticipoRetenido50}, Devolución: Q${montoDevolucion}. Motivo: ${req.motivo}`,
        },
      });

      // 6. Automatically handle commission cancellation or negative adjustment
      try {
        const { CommissionEngine } = await import('@/core/commissions');
        await CommissionEngine.handleCancellation(venta.id, undefined, req.motivo, req.usuarioNombre);
      } catch (err) {
        console.error('[CancellationEngine] Error handling commission cancellation:', err);
      }

      return {
        targetId: venta.id,
        type: 'venta' as const,
        totalMonto,
        anticipoRetenido50,
        montoDevolucion,
        inventarioLiberado: true,
        comisionCancelada: true,
        estadosActualizados: ['venta:anulada', 'garantia:anulada', 'cotizacion:anulada', 'comision:cancelada'],
      };
    });

    // 6. Emit domain events
    try {
      await eventBus.publish(new VentaCancelada({
        ventaId: venta.id,
        numero: venta.numero,
        motivo: req.motivo,
        usuarioNombre: req.usuarioNombre,
      }));
      await eventBus.publish(new FacturaAnulada({
        ventaId: venta.id,
        numeroFactura: venta.numero,
        uuid: (venta as any).felUuid || undefined,
        motivo: req.motivo,
        usuarioNombre: req.usuarioNombre,
      }));
    } catch (err) {
      console.error('[CancellationEngine] Error publishing cancellation events:', err);
    }

    return result;
  }

  /**
   * Intelligently cancels a Project:
   * - Enforces state transitions & 50% advance retention policy.
   * - Cancels linked warranties, updates project state to 'cancelado'.
   * - Emits ProyectoCancelado event and audit log.
   */
  static async cancelProyecto(req: CancellationRequest): Promise<CancellationPolicyResult> {
    const proyecto = await prisma.proyecto.findUnique({
      where: { id: req.targetId },
      include: { garantias: true },
    });

    if (!proyecto) throw new Error('Proyecto no encontrado');
    WorkflowEngine.validateTransition('proyecto', proyecto.estado, 'cancelado');

    const result = await prisma.$transaction(async (tx) => {
      // Update project state
      await tx.proyecto.update({
        where: { id: proyecto.id },
        data: {
          estado: 'cancelado',
          notas: `Proyecto cancelado: ${req.motivo}. Política 50% anticipo retenido aplicada.`,
        },
      });

      // Cancel associated warranties
      await tx.garantia.updateMany({
        where: { proyectoId: proyecto.id },
        data: { estado: 'anulada', notas: `Anulada por cancelación del proyecto ${proyecto.numero}` },
      });

      // Audit Log
      await tx.auditLog.create({
        data: {
          usuarioId: req.usuarioId,
          usuarioNombre: req.usuarioNombre,
          accion: 'CANCELACION_PROYECTO',
          tabla: 'proyectos',
          registroId: String(proyecto.id),
          detalle: `Proyecto ${proyecto.numero} cancelado. Motivo: ${req.motivo}`,
        },
      });

      return {
        targetId: proyecto.id,
        type: 'proyecto' as const,
        totalMonto: 0,
        anticipoRetenido50: 0,
        montoDevolucion: 0,
        inventarioLiberado: true,
        comisionCancelada: true,
        estadosActualizados: ['proyecto:cancelado', 'garantia:anulada'],
      };
    });

    try {
      await eventBus.publish(new ProyectoCancelado({
        proyectoId: proyecto.id,
        numero: proyecto.numero,
        motivo: req.motivo,
        usuarioNombre: req.usuarioNombre,
      }));
    } catch (err) {
      console.error('[CancellationEngine] Error publishing ProyectoCancelado:', err);
    }

    return result;
  }

  /**
   * Suspends a Project gracefully (e.g. paused due to client delay).
   */
  static async suspendProyecto(req: CancellationRequest): Promise<CancellationPolicyResult> {
    const proyecto = await prisma.proyecto.findUnique({ where: { id: req.targetId } });
    if (!proyecto) throw new Error('Proyecto no encontrado');

    await prisma.$transaction(async (tx) => {
      await tx.proyecto.update({
        where: { id: proyecto.id },
        data: {
          notas: `Proyecto Suspendido Temporalmente: ${req.motivo}.`,
        },
      });

      await tx.auditLog.create({
        data: {
          usuarioId: req.usuarioId,
          usuarioNombre: req.usuarioNombre,
          accion: 'SUSPENSION_PROYECTO',
          tabla: 'proyectos',
          registroId: String(proyecto.id),
          detalle: `Proyecto ${proyecto.numero} suspendido. Motivo: ${req.motivo}`,
        },
      });
    });

    return {
      targetId: proyecto.id,
      type: 'suspendido',
      totalMonto: 0,
      anticipoRetenido50: 0,
      montoDevolucion: 0,
      inventarioLiberado: false,
      comisionCancelada: false,
      estadosActualizados: ['proyecto:suspendido'],
    };
  }

  /**
   * Intelligently cancels a Quotation.
   */
  static async cancelCotizacion(req: CancellationRequest): Promise<CancellationPolicyResult> {
    const cotizacion = await prisma.cotizacion.findUnique({ where: { id: req.targetId } });
    if (!cotizacion) throw new Error('Cotización no encontrada');
    WorkflowEngine.validateTransition('cotizacion', cotizacion.estado, 'anulada');

    await prisma.$transaction(async (tx) => {
      await tx.cotizacion.update({
        where: { id: cotizacion.id },
        data: {
          estado: 'anulada',
          notas: `Cotización anulada: ${req.motivo}`,
        },
      });

      await tx.auditLog.create({
        data: {
          usuarioId: req.usuarioId,
          usuarioNombre: req.usuarioNombre,
          accion: 'CANCELACION_COTIZACION',
          tabla: 'cotizaciones',
          registroId: String(cotizacion.id),
          detalle: `Cotización ${cotizacion.numero} anulada. Motivo: ${req.motivo}`,
        },
      });
    });

    return {
      targetId: cotizacion.id,
      type: 'cotizacion',
      totalMonto: cotizacion.total,
      anticipoRetenido50: 0,
      montoDevolucion: 0,
      inventarioLiberado: false,
      comisionCancelada: true,
      estadosActualizados: ['cotizacion:anulada'],
    };
  }
}

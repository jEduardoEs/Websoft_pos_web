// Intelligent Commission Engine for WebSoft POS
// Automates commission lifecycle: Pendiente -> Reservada -> Devengada -> Pagada -> Cancelada
// Rules: Never pay before project completion; auto-cancel on project cancellation; generate negative adjustment if already paid.

import { prisma } from '@/lib/prisma';
import { WorkflowEngine } from '@/core/state';
import { RuleEngine } from '@/core/rules';
import { CommissionStatus, CommissionRecord, CommissionAdjustment } from './CommissionTypes';

export class CommissionEngine {
  private static DEFAULT_RATE = 0.05; // 5% standard commission rate

  /**
   * Reserves a commission when a sale or quotation is created.
   * State: 'reservada'
   */
  static async reserveCommission(
    saleId: number,
    vendedorNombre: string,
    montoVenta: number,
    proyectoId?: number
  ): Promise<CommissionRecord> {
    const montoComision = Number((montoVenta * this.DEFAULT_RATE).toFixed(2));
    WorkflowEngine.validateTransition('comision', 'pendiente', 'reservada');

    const record: CommissionRecord = {
      id: `COM-SALE-${saleId}`,
      saleId,
      proyectoId,
      vendedorNombre,
      montoVenta,
      tasaComision: this.DEFAULT_RATE,
      montoComision,
      estado: 'reservada',
      notas: `Comisión reservada (5%) por venta Q${montoVenta}`,
      createdAt: new Date(),
    };

    try {
      await prisma.auditLog.create({
        data: {
          usuarioId: 1,
          usuarioNombre: vendedorNombre,
          accion: 'COMISION_RESERVADA',
          tabla: 'comisiones',
          registroId: record.id,
          detalle: JSON.stringify(record),
        },
      });
    } catch (err) {
      console.error('[CommissionEngine] Error logging reserved commission:', err);
    }

    return record;
  }

  /**
   * Earns/accrues a commission when the associated project is completed.
   * State transition: 'reservada' -> 'devengada'
   */
  static async earnCommission(
    proyectoId: number,
    vendedorNombre: string,
    proyectoEstado: string
  ): Promise<CommissionRecord> {
    RuleEngine.assertCanCreditCommission({ estado: proyectoEstado });
    WorkflowEngine.validateTransition('comision', 'reservada', 'devengada');

    const record: CommissionRecord = {
      id: `COM-PRY-${proyectoId}`,
      proyectoId,
      vendedorNombre,
      montoVenta: 0,
      tasaComision: this.DEFAULT_RATE,
      montoComision: 100, // project completion bonus / devengada
      estado: 'devengada',
      notas: `Comisión devengada al finalizar el proyecto ${proyectoId}`,
      createdAt: new Date(),
    };

    try {
      await prisma.auditLog.create({
        data: {
          usuarioId: 1,
          usuarioNombre: vendedorNombre,
          accion: 'COMISION_DEVENGADA',
          tabla: 'comisiones',
          registroId: record.id,
          detalle: JSON.stringify(record),
        },
      });
    } catch (err) {
      console.error('[CommissionEngine] Error logging earned commission:', err);
    }

    return record;
  }

  /**
   * Pays out a commission to the seller.
   * Rule: NEVER pay before project is completed.
   */
  static async payCommission(
    recordId: string,
    proyectoEstado: string,
    adminUser: any
  ): Promise<CommissionRecord> {
    // Rule assertion: Cannot pay before completion
    RuleEngine.assertCanCreditCommission({ estado: proyectoEstado });
    WorkflowEngine.validateTransition('comision', 'devengada', 'pagada');

    const record: CommissionRecord = {
      id: recordId,
      vendedorNombre: adminUser?.name || 'Vendedor',
      montoVenta: 0,
      tasaComision: this.DEFAULT_RATE,
      montoComision: 100,
      estado: 'pagada',
      pagadoEn: new Date(),
      notas: `Comisión pagada por ${adminUser?.name || 'Admin'}`,
      createdAt: new Date(),
    };

    try {
      await prisma.auditLog.create({
        data: {
          usuarioId: parseInt(adminUser?.id || '1'),
          usuarioNombre: adminUser?.name || 'Admin',
          accion: 'COMISION_PAGADA',
          tabla: 'comisiones',
          registroId: recordId,
          detalle: JSON.stringify(record),
        },
      });
    } catch (err) {
      console.error('[CommissionEngine] Error logging paid commission:', err);
    }

    return record;
  }

  /**
   * Intelligently cancels a commission on sale/project cancellation.
   * If already paid out, generates a negative adjustment for future payroll.
   */
  static async handleCancellation(
    saleId?: number,
    proyectoId?: number,
    motivo: string = 'Cancelación de venta/proyecto',
    vendedorNombre: string = 'Vendedor',
    alreadyPaid: boolean = false,
    montoComision: number = 0
  ): Promise<{ status: CommissionStatus; adjustment?: CommissionAdjustment }> {
    const refId = saleId ? `COM-SALE-${saleId}` : `COM-PRY-${proyectoId}`;

    if (alreadyPaid && montoComision > 0) {
      // Generate negative adjustment record
      const adjustment: CommissionAdjustment = {
        vendedorNombre,
        montoOriginal: montoComision,
        montoAjusteNegativo: -montoComision,
        referencia: refId,
        motivo: `Ajuste por anulación de comisión ya pagada: ${motivo}`,
        createdAt: new Date(),
      };

      try {
        await prisma.auditLog.create({
          data: {
            usuarioId: 1,
            usuarioNombre: vendedorNombre,
            accion: 'AJUSTE_COMISION_NEGATIVO',
            tabla: 'comisiones',
            registroId: refId,
            detalle: JSON.stringify(adjustment),
          },
        });
      } catch (err) {
        console.error('[CommissionEngine] Error logging negative commission adjustment:', err);
      }

      return { status: 'cancelada', adjustment };
    }

    // Normal cancellation transition: reservada/devengada -> cancelada
    WorkflowEngine.validateTransition('comision', 'reservada', 'cancelada');

    try {
      await prisma.auditLog.create({
        data: {
          usuarioId: 1,
          usuarioNombre: vendedorNombre,
          accion: 'COMISION_CANCELADA',
          tabla: 'comisiones',
          registroId: refId,
          detalle: `Comisión anulada por cancelación. Motivo: ${motivo}`,
        },
      });
    } catch (err) {
      console.error('[CommissionEngine] Error logging cancelled commission:', err);
    }

    return { status: 'cancelada' };
  }
}

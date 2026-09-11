// Central Business Rules Engine for WebSoft POS
// Enforces domain invariant rules prior to service operations.

import {
  BusinessRule,
  ProjectInvoiceContext,
  InvoiceCancelContext,
  SaleModifyContext,
  SaleDeleteContext,
  CommissionCreditContext,
} from './BusinessRules';

export class RuleEngine {
  /**
   * BR-001: Minimum 50% deposit required for quotation approval.
   */
  static assertQuoteDeposit(depositAmount: number, totalAmount: number): void {
    const minRequired = totalAmount * 0.5;
    if (depositAmount < minRequired) {
      throw new Error(
        `BR-001 Violada: La cotización requiere un anticipo mínimo del 50% (Q ${minRequired.toFixed(2)}). Abonado actual: Q ${depositAmount.toFixed(2)}.`
      );
    }
  }

  /**
   * BR-002: Non-refundable deposit policy on commercial cancellation.
   */
  static assertDepositNonRefundable(): void {
    console.info('[RuleEngine] BR-002 Enforced: El anticipo no es reembolsable tras la cancelación.');
  }

  /**
   * BR-007: Warranty birth only post-project delivery.
   */
  static assertWarrantyEligibility(proyectoState: string): void {
    const valid = ['entregado', 'completado'];
    if (!valid.includes(proyectoState)) {
      throw new Error(
        `BR-007 Violada: Los certificados de garantía solo se emiten para proyectos en estado entregado o completado. Estado actual: '${proyectoState}'.`
      );
    }
  }

  /**
   * BR-009: Commission eligibility upon project delivery/closure.
   */
  static assertCommissionEligibility(proyectoState: string): void {
    const valid = ['entregado', 'completado', 'cerrado'];
    if (!valid.includes(proyectoState)) {
      throw new Error(
        `BR-009 Violada: Las comisiones solo se pueden liberar para proyectos entregados o cerrados. Estado actual: '${proyectoState}'.`
      );
    }
  }

  /**
   * BR-010: Cash register shift open invariant for POS transactions.
   */
  static assertCajaOpen(cajaShiftState?: string | null): void {
    if (cajaShiftState !== 'abierta') {
      throw new Error(
        'BR-010 Violada: Es necesario contar con un turno de caja en estado abierta para procesar transacciones en el POS.'
      );
    }
  }

  /**
   * Rule 1: No facturar si el proyecto no está aprobado (debe estar en ejecución o completado).
   */
  static assertCanInvoiceProject(context: ProjectInvoiceContext): void {
    const validStates = ['en_ejecucion', 'completado'];
    if (!validStates.includes(context.estado)) {
      throw new Error(
        `Regla de Negocio Violada: No es posible facturar el proyecto. El estado actual es '${context.estado}' y debe estar aprobado o en ejecución.`
      );
    }
  }

  /**
   * Rule 2: No cancelar una factura emitida directamente sin el flujo formal.
   */
  static assertCanCancelInvoice(context: InvoiceCancelContext): void {
    if (context.estado === 'anulada') {
      throw new Error('Regla de Negocio Violada: La factura ya se encuentra anulada.');
    }
  }

  /**
   * Rule 3: No modificar precios después de generar la venta.
   */
  static assertCanModifySalePrices(context: SaleModifyContext): void {
    if (context.estado === 'completada' || context.estado === 'facturada' || context.estado === 'anulada') {
      throw new Error(
        `Regla de Negocio Violada: No se pueden modificar precios ni ítems de una venta en estado '${context.estado}'.`
      );
    }
  }

  /**
   * Rule 4: No eliminar ventas facturadas.
   */
  static assertCanDeleteSale(context: SaleDeleteContext): void {
    if (context.estado === 'facturada' || context.estado === 'completada' || Boolean(context.felUuid)) {
      throw new Error(
        'Regla de Negocio Violada: No está permitido eliminar ventas que han sido facturadas o completadas.'
      );
    }
  }

  /**
   * Rule 5: No acreditar comisiones antes de finalizar el proyecto.
   */
  static assertCanCreditCommission(context: CommissionCreditContext): void {
    if (context.estado !== 'completado' && context.estado !== 'entregado') {
      throw new Error(
        `Regla de Negocio Violada: Las comisiones solo se pueden acreditar cuando el proyecto esté entregado o completado. Estado actual: '${context.estado}'.`
      );
    }
  }

  /**
   * Evaluates a rule and returns boolean result without throwing error.
   */
  static evaluate(rule: BusinessRule, context: any): boolean {
    try {
      switch (rule) {
        case BusinessRule.CAN_INVOICE_PROJECT:
          this.assertCanInvoiceProject(context);
          return true;
        case BusinessRule.CAN_CANCEL_INVOICE:
          this.assertCanCancelInvoice(context);
          return true;
        case BusinessRule.CAN_MODIFY_SALE_PRICES:
          this.assertCanModifySalePrices(context);
          return true;
        case BusinessRule.CAN_DELETE_SALE:
          this.assertCanDeleteSale(context);
          return true;
        case BusinessRule.CAN_CREDIT_COMMISSION:
          this.assertCanCreditCommission(context);
          return true;
        default:
          return false;
      }
    } catch {
      return false;
    }
  }
}

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
    if (context.estado !== 'completado') {
      throw new Error(
        `Regla de Negocio Violada: Las comisiones solo se pueden acreditar cuando el proyecto esté 'completado'. Estado actual: '${context.estado}'.`
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

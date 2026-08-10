// Centralized Business Rules for WebSoft POS
// Golden Rule: NO EMOJIS anywhere in code or comments.

export enum BusinessRule {
  CAN_INVOICE_PROJECT = 'CAN_INVOICE_PROJECT',
  CAN_CANCEL_INVOICE = 'CAN_CANCEL_INVOICE',
  CAN_MODIFY_SALE_PRICES = 'CAN_MODIFY_SALE_PRICES',
  CAN_DELETE_SALE = 'CAN_DELETE_SALE',
  CAN_CREDIT_COMMISSION = 'CAN_CREDIT_COMMISSION',
}

export interface ProjectInvoiceContext {
  estado: string;
  id?: number;
}

export interface InvoiceCancelContext {
  estado: string;
  felEstado?: string | null;
  felUuid?: string | null;
}

export interface SaleModifyContext {
  estado: string;
}

export interface SaleDeleteContext {
  estado: string;
  felUuid?: string | null;
}

export interface CommissionCreditContext {
  estado: string;
}

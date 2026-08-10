// Centralized Commission Types for WebSoft POS
// Golden Rule: NO EMOJIS anywhere in code or comments.

export type CommissionStatus = 'pendiente' | 'reservada' | 'devengada' | 'pagada' | 'cancelada';

export interface CommissionRecord {
  id: string;
  saleId?: number;
  proyectoId?: number;
  vendedorNombre: string;
  montoVenta: number;
  tasaComision: number; // default 5% (0.05)
  montoComision: number;
  estado: CommissionStatus;
  pagadoEn?: Date;
  notas?: string;
  createdAt: Date;
}

export interface CommissionAdjustment {
  vendedorNombre: string;
  montoOriginal: number;
  montoAjusteNegativo: number;
  referencia: string;
  motivo: string;
  createdAt: Date;
}

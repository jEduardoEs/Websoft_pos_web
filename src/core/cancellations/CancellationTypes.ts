// Intelligent Cancellation System Types for WebSoft POS
// Golden Rule: NO EMOJIS anywhere in code or comments.

export type CancellationType = 'cotizacion' | 'venta' | 'proyecto' | 'factura' | 'suspendido';

export interface CancellationRequest {
  targetId: number;
  type: CancellationType;
  motivo: string;
  usuarioId: number;
  usuarioNombre: string;
  retenerAnticipo50?: boolean;
}

export interface CancellationPolicyResult {
  targetId: number;
  type: CancellationType;
  totalMonto: number;
  anticipoRetenido50: number;
  montoDevolucion: number;
  inventarioLiberado: boolean;
  comisionCancelada: boolean;
  estadosActualizados: string[];
}

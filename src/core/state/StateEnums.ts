// Centralized Enums for WebSoft POS State Machine
// Golden Rule: NO EMOJIS anywhere in code or comments.

export enum CotizacionState {
  PENDIENTE = 'pendiente',
  ACEPTADA = 'aceptada',
  RECHAZADA = 'rechazada',
  FACTURADA = 'facturada',
  ANULADA = 'anulada',
}

export enum VentaState {
  COMPLETADA = 'completada',
  PENDIENTE = 'pendiente',
  ANULADA = 'anulada',
}

export enum ProyectoState {
  PLANIFICADO = 'planificado',
  EN_EJECUCION = 'en_ejecucion',
  COMPLETADO = 'completado',
  CANCELADO = 'cancelado',
}

export enum FacturacionState {
  GENERADA = 'generada',
  EMITIDA = 'emitida',
  CERTIFICADO = 'certificado',
  SANDBOX = 'sandbox',
  ANULADA = 'anulada',
  ERROR = 'error',
}

export enum ComisionState {
  PENDIENTE = 'pendiente',
  CALCULADA = 'calculada',
  APROBADA = 'aprobada',
  PAGADA = 'pagada',
  ANULADA = 'anulada',
}

export type StateDomain = 'cotizacion' | 'venta' | 'proyecto' | 'facturacion' | 'comision';

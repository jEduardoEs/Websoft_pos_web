import { DomainEvent } from './DomainEvent';

export interface PagoRegistradoPayload {
  pagoId?: number;
  ventaId?: number;
  proyectoId?: number;
  monto: number;
  metodoPago: string;
  clienteNombre?: string;
  usuarioNombre?: string;
}

export class PagoRegistrado implements DomainEvent {
  type = 'PagoRegistrado';
  timestamp = new Date();

  constructor(public payload: PagoRegistradoPayload) {}
}

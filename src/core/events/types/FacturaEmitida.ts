import { DomainEvent } from './DomainEvent';

export interface FacturaEmitidaPayload {
  ventaId?: number;
  proyectoId?: number;
  numeroFactura: string;
  uuid?: string;
  clienteNombre: string;
  total: number;
  usuarioNombre?: string;
}

export class FacturaEmitida implements DomainEvent {
  type = 'FacturaEmitida';
  timestamp = new Date();

  constructor(public payload: FacturaEmitidaPayload) {}
}

import { DomainEvent } from './DomainEvent';

export interface ComisionReservadaPayload {
  comisionId?: number;
  ventaId?: number;
  vendedorNombre?: string;
  monto: number;
}

export class ComisionReservada implements DomainEvent {
  type = 'ComisionReservada';
  timestamp = new Date();

  constructor(public payload: ComisionReservadaPayload) {}
}

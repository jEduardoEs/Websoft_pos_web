import { DomainEvent } from './DomainEvent';

export interface ComisionDevengadaPayload {
  comisionId?: number;
  ventaId?: number;
  proyectoId?: number;
  vendedorNombre?: string;
  monto: number;
}

export class ComisionDevengada implements DomainEvent {
  type = 'ComisionDevengada';
  timestamp = new Date();

  constructor(public payload: ComisionDevengadaPayload) {}
}

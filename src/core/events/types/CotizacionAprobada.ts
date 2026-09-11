import { DomainEvent } from './DomainEvent';

export interface CotizacionAprobadaPayload {
  cotizacionId: number;
  numero: string;
  clienteNombre: string;
  total: number;
  usuarioNombre?: string;
}

export class CotizacionAprobada implements DomainEvent {
  type = 'CotizacionAprobada';
  timestamp = new Date();

  constructor(public payload: CotizacionAprobadaPayload) {}
}

import { DomainEvent } from './DomainEvent';

export interface CotizacionCreadaPayload {
  cotizacionId: number;
  numero: string;
  clienteNombre: string;
  total: number;
  usuarioNombre?: string;
}

export class CotizacionCreada implements DomainEvent {
  type = 'CotizacionCreada';
  timestamp = new Date();

  constructor(public payload: CotizacionCreadaPayload) {}
}

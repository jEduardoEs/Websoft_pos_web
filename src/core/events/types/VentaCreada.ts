import { DomainEvent } from './DomainEvent';

export interface VentaCreadaPayload {
  ventaId: number;
  numero: string;
  clienteNombre: string;
  total: number;
  cotizacionId?: number | null;
  usuarioNombre?: string;
}

export class VentaCreada implements DomainEvent {
  type = 'VentaCreada';
  timestamp = new Date();

  constructor(public payload: VentaCreadaPayload) {}
}

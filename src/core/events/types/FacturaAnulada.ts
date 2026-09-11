import { DomainEvent } from './DomainEvent';

export interface FacturaAnuladaPayload {
  ventaId?: number;
  numeroFactura: string;
  uuid?: string;
  motivo?: string;
  usuarioNombre?: string;
}

export class FacturaAnulada implements DomainEvent {
  type = 'FacturaAnulada';
  timestamp = new Date();

  constructor(public payload: FacturaAnuladaPayload) {}
}

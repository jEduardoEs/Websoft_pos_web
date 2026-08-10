import { DomainEvent } from './DomainEvent';

export interface VentaCanceladaPayload {
  ventaId: number;
  numero: string;
  motivo?: string;
  usuarioNombre?: string;
}

export class VentaCancelada implements DomainEvent {
  type = 'VentaCancelada';
  timestamp = new Date();

  constructor(public payload: VentaCanceladaPayload) {}
}

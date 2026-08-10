import { DomainEvent } from './DomainEvent';

export interface ProyectoCanceladoPayload {
  proyectoId: number;
  numero: string;
  motivo?: string;
  usuarioNombre?: string;
}

export class ProyectoCancelado implements DomainEvent {
  type = 'ProyectoCancelado';
  timestamp = new Date();

  constructor(public payload: ProyectoCanceladoPayload) {}
}

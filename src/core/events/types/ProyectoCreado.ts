import { DomainEvent } from './DomainEvent';

export interface ProyectoCreadoPayload {
  proyectoId: number;
  numero: string;
  nombre: string;
  clienteNombre: string;
  cotizacionId?: number | null;
  usuarioNombre?: string;
}

export class ProyectoCreado implements DomainEvent {
  type = 'ProyectoCreado';
  timestamp = new Date();

  constructor(public payload: ProyectoCreadoPayload) {}
}

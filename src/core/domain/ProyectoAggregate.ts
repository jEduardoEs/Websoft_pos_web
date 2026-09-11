import { AggregateRoot } from './AggregateRoot';
import { Money } from './ValueObjects';
import { eventBus } from '../events/EventBus';

export interface Milestone {
  id: number;
  nombre: string;
  monto: Money;
  completado: boolean;
  facturado: boolean;
}

export type ProyectoEstado = 'pendiente' | 'en_proceso' | 'entregado' | 'cerrado' | 'cancelado';

export class ProyectoAggregate extends AggregateRoot<number> {
  private _numero: string;
  private _clienteId: number;
  private _clienteNombre: string;
  private _ventaId: number;
  private _estado: ProyectoEstado;
  private _total: Money;
  private _hitos: Milestone[] = [];

  constructor(
    id: number,
    numero: string,
    clienteId: number,
    clienteNombre: string,
    ventaId: number,
    total: Money,
    estado: ProyectoEstado = 'pendiente'
  ) {
    super(id);
    this._numero = numero;
    this._clienteId = clienteId;
    this._clienteNombre = clienteNombre;
    this._ventaId = ventaId;
    this._total = total;
    this._estado = estado;
  }

  get numero(): string { return this._numero; }
  get clienteId(): number { return this._clienteId; }
  get clienteNombre(): string { return this._clienteNombre; }
  get ventaId(): number { return this._ventaId; }
  get estado(): ProyectoEstado { return this._estado; }
  get total(): Money { return this._total; }
  get hitos(): Milestone[] { return [...this._hitos]; }

  public setHitos(hitos: Milestone[]): void {
    this._hitos = [...hitos];
  }

  public static initiateFromSale(data: {
    id: number;
    numero: string;
    clienteId: number;
    clienteNombre: string;
    ventaId: number;
    total: number;
  }): ProyectoAggregate {
    const totalMoney = new Money(data.total);
    const aggregate = new ProyectoAggregate(
      data.id,
      data.numero,
      data.clienteId,
      data.clienteNombre,
      data.ventaId,
      totalMoney,
      'en_proceso'
    );

    // Initial milestone creation (50% anticipo, 50% entrega)
    const m1: Milestone = {
      id: 1,
      nombre: 'Hito 1: Entrega e Instalacion Equipos',
      monto: totalMoney.multiply(0.5),
      completado: true,
      facturado: false,
    };
    const m2: Milestone = {
      id: 2,
      nombre: 'Hito 2: Recepcion Final del Proyecto',
      monto: totalMoney.multiply(0.5),
      completado: false,
      facturado: false,
    };
    aggregate.setHitos([m1, m2]);

    const event = {
      type: 'ProjectCreated',
      payload: {
        projectId: aggregate.id,
        numero: aggregate.numero,
        clienteId: aggregate.clienteId,
        clienteNombre: aggregate.clienteNombre,
        ventaId: aggregate.ventaId,
        total: aggregate.total.amount,
        hitos: aggregate.hitos.map(h => ({ id: h.id, nombre: h.nombre, monto: h.monto.amount })),
      },
      timestamp: new Date(),
    };

    aggregate.addDomainEvent(event);
    return aggregate;
  }

  public deliverProject(diasGarantia: number = 365): void {
    if (this._estado === 'entregado' || this._estado === 'cerrado') {
      throw new Error(`El proyecto ${this._numero} ya se encuentra entregado o cerrado.`);
    }

    this._estado = 'entregado';

    const event = {
      type: 'ProjectDelivered',
      payload: {
        projectId: this._id,
        numero: this._numero,
        clienteId: this._clienteId,
        clienteNombre: this._clienteNombre,
        fechaEntrega: new Date().toISOString(),
        diasGarantia,
      },
      timestamp: new Date(),
    };

    this.addDomainEvent(event);
  }

  public closeProject(): void {
    if (this._estado !== 'entregado') {
      throw new Error(`El proyecto ${this._numero} debe estar en estado entregado antes de cerrarse.`);
    }

    this._estado = 'cerrado';

    const event = {
      type: 'ProjectClosed',
      payload: {
        projectId: this._id,
        numero: this._numero,
        clienteId: this._clienteId,
        fechaCierre: new Date().toISOString(),
      },
      timestamp: new Date(),
    };

    this.addDomainEvent(event);
  }

  public async dispatchEvents(): Promise<void> {
    const events = this.getUncommittedEvents();
    this.clearUncommittedEvents();
    for (const evt of events) {
      await eventBus.publish(evt);
    }
  }
}

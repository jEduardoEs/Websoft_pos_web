import { AggregateRoot } from './AggregateRoot';
import { eventBus } from '../events/EventBus';

export type EstadoGarantia = 'vigente' | 'vencida' | 'reclamada' | 'anulada';

export class GarantiaAggregate extends AggregateRoot<number> {
  private _numero: string;
  private _proyectoId: number;
  private _clienteNombre: string;
  private _productoNombre: string;
  private _estado: EstadoGarantia;
  private _fechaVencimiento: Date;

  constructor(
    id: number,
    numero: string,
    proyectoId: number,
    clienteNombre: string,
    productoNombre: string,
    fechaVencimiento: Date,
    estado: EstadoGarantia = 'vigente'
  ) {
    super(id);
    this._numero = numero;
    this._proyectoId = proyectoId;
    this._clienteNombre = clienteNombre;
    this._productoNombre = productoNombre;
    this._fechaVencimiento = fechaVencimiento;
    this._estado = estado;
  }

  get numero(): string { return this._numero; }
  get proyectoId(): number { return this._proyectoId; }
  get clienteNombre(): string { return this._clienteNombre; }
  get productoNombre(): string { return this._productoNombre; }
  get estado(): EstadoGarantia { return this._estado; }
  get fechaVencimiento(): Date { return this._fechaVencimiento; }

  public static createOnProjectDelivery(data: {
    id: number;
    numero: string;
    proyectoId: number;
    clienteNombre: string;
    productoNombre: string;
    diasGarantia: number;
  }): GarantiaAggregate {
    const fVenc = new Date(Date.now() + (data.diasGarantia || 365) * 86400000);
    const aggregate = new GarantiaAggregate(
      data.id,
      data.numero,
      data.proyectoId,
      data.clienteNombre,
      data.productoNombre,
      fVenc,
      'vigente'
    );

    const event = {
      type: 'WarrantyStarted',
      payload: {
        garantiaId: aggregate.id,
        numero: aggregate.numero,
        proyectoId: aggregate.proyectoId,
        clienteNombre: aggregate.clienteNombre,
        productoNombre: aggregate.productoNombre,
        fechaVencimiento: fVenc.toISOString(),
      },
      timestamp: new Date(),
    };

    aggregate.addDomainEvent(event);
    return aggregate;
  }

  public registerClaim(motivo: string, descripcionFalla: string): void {
    if (this._estado === 'anulada') {
      throw new Error(`No se puede registrar reclamo sobre una garantía anulada.`);
    }

    this._estado = 'reclamada';

    const event = {
      type: 'WarrantyClaimRegistered',
      payload: {
        garantiaId: this._id,
        numeroGarantia: this._numero,
        motivo,
        descripcionFalla,
        fecha: new Date().toISOString(),
      },
      timestamp: new Date(),
    };

    this.addDomainEvent(event);
  }

  public resolveClaim(decision: 'reparar' | 'reemplazar' | 'rechazar', resolucion: string): void {
    const event = {
      type: 'WarrantyClaimApproved',
      payload: {
        garantiaId: this._id,
        numeroGarantia: this._numero,
        decision,
        resolucion,
        crearOrdenTrabajo: decision === 'reparar',
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

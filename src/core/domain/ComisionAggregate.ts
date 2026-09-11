import { AggregateRoot } from './AggregateRoot';
import { Money, Percentage } from './ValueObjects';
import { eventBus } from '../events/EventBus';

export type EstadoComision = 'pendiente' | 'aprobada' | 'pagada' | 'cancelada';

export class ComisionAggregate extends AggregateRoot<number> {
  private _proyectoId: number;
  private _asesorId: number;
  private _asesorNombre: string;
  private _monto: Money;
  private _estado: EstadoComision;

  constructor(
    id: number,
    proyectoId: number,
    asesorId: number,
    asesorNombre: string,
    monto: Money,
    estado: EstadoComision = 'pendiente'
  ) {
    super(id);
    this._proyectoId = proyectoId;
    this._asesorId = asesorId;
    this._asesorNombre = asesorNombre;
    this._monto = monto;
    this._estado = estado;
  }

  get proyectoId(): number { return this._proyectoId; }
  get asesorId(): number { return this._asesorId; }
  get asesorNombre(): string { return this._asesorNombre; }
  get monto(): Money { return this._monto; }
  get estado(): EstadoComision { return this._estado; }

  public static evaluateOnProjectDelivery(data: {
    id: number;
    proyectoId: number;
    asesorId: number;
    asesorNombre: string;
    totalProyecto: number;
    porcentajeComision?: number;
  }): ComisionAggregate {
    const totalMoney = new Money(data.totalProyecto);
    const pct = new Percentage(data.porcentajeComision || 5); // BR-009: 5% standard commission
    const montoComision = pct.applyTo(totalMoney);

    const aggregate = new ComisionAggregate(
      data.id,
      data.proyectoId,
      data.asesorId,
      data.asesorNombre,
      montoComision,
      'aprobada'
    );

    const event = {
      type: 'CommissionGenerated',
      payload: {
        comisionId: aggregate.id,
        proyectoId: aggregate.proyectoId,
        asesorId: aggregate.asesorId,
        asesorNombre: aggregate.asesorNombre,
        monto: aggregate.monto.amount,
      },
      timestamp: new Date(),
    };

    aggregate.addDomainEvent(event);
    return aggregate;
  }

  public payCommission(metodoPago: string = 'transferencia'): void {
    if (this._estado === 'pagada') {
      throw new Error(`La comisión ya ha sido pagada previamente.`);
    }

    this._estado = 'pagada';

    const event = {
      type: 'CommissionPaid',
      payload: {
        comisionId: this._id,
        proyectoId: this._proyectoId,
        asesorId: this._asesorId,
        asesorNombre: this._asesorNombre,
        monto: this._monto.amount,
        metodoPago,
        fechaPago: new Date().toISOString(),
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

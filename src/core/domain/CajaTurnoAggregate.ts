import { AggregateRoot } from './AggregateRoot';
import { Money } from './ValueObjects';
import { eventBus } from '../events/EventBus';

export interface MovimientoCajaData {
  tipo: 'inyeccion' | 'retiro' | 'venta';
  monto: number;
  motivo: string;
  fecha: string;
}

export type EstadoCajaTurno = 'abierta' | 'cerrada';

export class CajaTurnoAggregate extends AggregateRoot<number> {
  private _usuarioId: number;
  private _usuarioNombre: string;
  private _estado: EstadoCajaTurno;
  private _fondoInicial: Money;
  private _movimientos: MovimientoCajaData[] = [];

  constructor(
    id: number,
    usuarioId: number,
    usuarioNombre: string,
    fondoInicial: Money,
    estado: EstadoCajaTurno = 'abierta'
  ) {
    super(id);
    this._usuarioId = usuarioId;
    this._usuarioNombre = usuarioNombre;
    this._fondoInicial = fondoInicial;
    this._estado = estado;
  }

  get usuarioId(): number { return this._usuarioId; }
  get usuarioNombre(): string { return this._usuarioNombre; }
  get estado(): EstadoCajaTurno { return this._estado; }
  get fondoInicial(): Money { return this._fondoInicial; }
  get movimientos(): MovimientoCajaData[] { return [...this._movimientos]; }

  public static openShift(data: {
    id: number;
    usuarioId: number;
    usuarioNombre: string;
    fondoInicial: number;
  }): CajaTurnoAggregate {
    const fondoMoney = new Money(data.fondoInicial);
    const aggregate = new CajaTurnoAggregate(
      data.id,
      data.usuarioId,
      data.usuarioNombre,
      fondoMoney,
      'abierta'
    );

    const event = {
      type: 'CajaShiftOpened',
      payload: {
        turnoId: aggregate.id,
        usuarioId: aggregate.usuarioId,
        usuarioNombre: aggregate.usuarioNombre,
        fondoInicial: aggregate.fondoInicial.amount,
        fechaApertura: new Date().toISOString(),
      },
      timestamp: new Date(),
    };

    aggregate.addDomainEvent(event);
    return aggregate;
  }

  public injectCapital(monto: number, motivo: string): void {
    if (this._estado !== 'abierta') {
      throw new Error('No se pueden registrar inyecciones en una caja cerrada.');
    }

    const mov: MovimientoCajaData = {
      tipo: 'inyeccion',
      monto,
      motivo,
      fecha: new Date().toISOString(),
    };
    this._movimientos.push(mov);

    const event = {
      type: 'CajaCapitalInjected',
      payload: {
        turnoId: this._id,
        usuarioNombre: this._usuarioNombre,
        monto,
        motivo,
      },
      timestamp: new Date(),
    };

    this.addDomainEvent(event);
  }

  public withdrawCapital(monto: number, motivo: string): void {
    if (this._estado !== 'abierta') {
      throw new Error('No se pueden registrar retiros en una caja cerrada.');
    }

    const mov: MovimientoCajaData = {
      tipo: 'retiro',
      monto,
      motivo,
      fecha: new Date().toISOString(),
    };
    this._movimientos.push(mov);

    const event = {
      type: 'CajaCapitalWithdrawn',
      payload: {
        turnoId: this._id,
        usuarioNombre: this._usuarioNombre,
        monto,
        motivo,
      },
      timestamp: new Date(),
    };

    this.addDomainEvent(event);
  }

  public closeShift(efectivoContado: number, debeHaber: number): void {
    if (this._estado !== 'abierta') {
      throw new Error('El turno de caja ya se encuentra cerrado.');
    }

    this._estado = 'cerrada';
    const diferencia = efectivoContado - debeHaber;

    const event = {
      type: 'CajaShiftClosed',
      payload: {
        turnoId: this._id,
        usuarioNombre: this._usuarioNombre,
        efectivoContado,
        debeHaber,
        diferencia,
        cuadreCorrecto: Math.abs(diferencia) < 0.01,
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

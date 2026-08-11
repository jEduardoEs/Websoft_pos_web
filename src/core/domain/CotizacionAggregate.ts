import { AggregateRoot } from './AggregateRoot';
import { Money, Percentage } from './ValueObjects';
import { eventBus } from '../events/EventBus';

export type CotizacionEstado = 'borrador' | 'enviada' | 'aprobada' | 'rechazada' | 'cancelada';

export class CotizacionAggregate extends AggregateRoot<number> {
  private _numero: string;
  private _clienteId: number;
  private _clienteNombre: string;
  private _estado: CotizacionEstado;
  private _subtotal: Money;
  private _anticipoRequerido: Money;
  private _anticipoPagado: Money;

  constructor(
    id: number,
    numero: string,
    clienteId: number,
    clienteNombre: string,
    subtotal: Money,
    anticipoPagado: Money = new Money(0),
    estado: CotizacionEstado = 'borrador'
  ) {
    super(id);
    this._numero = numero;
    this._clienteId = clienteId;
    this._clienteNombre = clienteNombre;
    this._subtotal = subtotal;
    this._anticipoRequerido = new Percentage(50).applyTo(subtotal); // BR-001: 50% deposit
    this._anticipoPagado = anticipoPagado;
    this._estado = estado;
  }

  get numero(): string { return this._numero; }
  get clienteId(): number { return this._clienteId; }
  get clienteNombre(): string { return this._clienteNombre; }
  get estado(): CotizacionEstado { return this._estado; }
  get subtotal(): Money { return this._subtotal; }
  get anticipoRequerido(): Money { return this._anticipoRequerido; }
  get anticipoPagado(): Money { return this._anticipoPagado; }

  public registerDeposit(monto: Money): void {
    if (this._estado === 'cancelada' || this._estado === 'rechazada') {
      throw new Error(`No se pueden registrar anticipos en una cotización ${this._estado}.`);
    }

    this._anticipoPagado = this._anticipoPagado.add(monto);

    const event = {
      type: 'QuoteDepositRegistered',
      payload: {
        quoteId: this._id,
        numero: this._numero,
        clienteId: this._clienteId,
        montoDepositado: monto.amount,
        totalAnticipo: this._anticipoPagado.amount,
        requerido: this._anticipoRequerido.amount,
      },
      timestamp: new Date(),
    };

    this.addDomainEvent(event);
  }

  public validateDeposit(): boolean {
    return this._anticipoPagado.amount >= this._anticipoRequerido.amount;
  }

  public approve(): void {
    if (!this.validateDeposit()) {
      throw new Error(`BR-001: La cotización ${this._numero} requiere un anticipo mínimo del 50% (Q ${this._anticipoRequerido.amount.toFixed(2)}) para ser aprobada.`);
    }

    this._estado = 'aprobada';

    const event = {
      type: 'QuoteApproved',
      payload: {
        quoteId: this._id,
        numero: this._numero,
        clienteId: this._clienteId,
        clienteNombre: this._clienteNombre,
        total: this._subtotal.amount,
        anticipoPagado: this._anticipoPagado.amount,
      },
      timestamp: new Date(),
    };

    this.addDomainEvent(event);
  }

  public cancel(motivo?: string): void {
    // BR-002: Anticipos no se devuelven si el cliente cancela
    this._estado = 'cancelada';

    const event = {
      type: 'QuoteCancelled',
      payload: {
        quoteId: this._id,
        numero: this._numero,
        clienteId: this._clienteId,
        anticipoRetenido: this._anticipoPagado.amount, // BR-002 non-refundable
        motivo: motivo || 'Cancelado por el cliente',
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

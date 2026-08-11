import { AggregateRoot } from './AggregateRoot';
import { Money, NitNumber } from './ValueObjects';
import { eventBus } from '../events/EventBus';

export interface VentaItemInput {
  productoId: number | null;
  codigo: string;
  nombre: string;
  cantidad: number;
  precioUnitario: number;
  descuento?: number;
  subtotal: number;
}

export class VentaAggregate extends AggregateRoot<number> {
  private _numero: string;
  private _clienteNombre: string;
  private _clienteNit: NitNumber;
  private _total: Money;
  private _metodoPago: string;
  private _cotizacionId?: number;

  constructor(
    id: number,
    numero: string,
    clienteNombre: string,
    clienteNit: string,
    total: Money,
    metodoPago: string = 'efectivo',
    cotizacionId?: number
  ) {
    super(id);
    this._numero = numero;
    this._clienteNombre = clienteNombre;
    this._clienteNit = new NitNumber(clienteNit);
    this._total = total;
    this._metodoPago = metodoPago;
    this._cotizacionId = cotizacionId;
  }

  get numero(): string { return this._numero; }
  get clienteNombre(): string { return this._clienteNombre; }
  get clienteNit(): string { return this._clienteNit.value; }
  get total(): Money { return this._total; }
  get metodoPago(): string { return this._metodoPago; }
  get cotizacionId(): number | undefined { return this._cotizacionId; }

  public static createFromPos(data: {
    id: number;
    numero: string;
    clienteNombre: string;
    clienteNit: string;
    total: number;
    metodoPago: string;
    items: VentaItemInput[];
    cotizacionId?: number;
  }): VentaAggregate {
    if (!data.items || data.items.length === 0) {
      throw new Error('No se puede crear una venta sin ítems en el carrito');
    }

    const aggregate = new VentaAggregate(
      data.id,
      data.numero,
      data.clienteNombre,
      data.clienteNit,
      new Money(data.total),
      data.metodoPago,
      data.cotizacionId
    );

    const event = {
      type: 'SaleCreated',
      payload: {
        saleId: aggregate.id,
        numero: aggregate.numero,
        clienteNombre: aggregate.clienteNombre,
        clienteNit: aggregate.clienteNit,
        total: aggregate.total.amount,
        metodoPago: aggregate.metodoPago,
        cotizacionId: aggregate.cotizacionId,
        items: data.items,
      },
      timestamp: new Date(),
    };

    aggregate.addDomainEvent(event);
    return aggregate;
  }

  public async dispatchEvents(): Promise<void> {
    const events = this.getUncommittedEvents();
    this.clearUncommittedEvents();
    for (const evt of events) {
      await eventBus.publish(evt);
    }
  }
}

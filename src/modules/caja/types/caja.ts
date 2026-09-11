import { Prisma } from '@prisma/client';

export type AperturaCaja = Prisma.AperturaCajaGetPayload<{}>;
export type MovimientoCaja = Prisma.MovimientoCajaGetPayload<{}>;
export type CierreCaja = Prisma.CierreGetPayload<{}>;

export interface CajaResumen {
  activa: AperturaCaja | null;
  movimientos: MovimientoCaja[];
  ventasEfectivo: number;
  ventasTarjeta: number;
  ventasTransferencia: number;
  totalVentas: number;
  numVentas: number;
  totalInyecciones: number;
  totalRetiros: number;
  debeHaber: number;
}

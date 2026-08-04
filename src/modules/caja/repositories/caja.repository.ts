import { prisma } from '@/lib/prisma';
import { AperturaCaja, MovimientoCaja, CierreCaja } from '../types/caja';
import { AbrirCajaDto, CerrarCajaDto, MovimientoCajaDto } from '../dto/caja.dto';

export class CajaRepository {
  async getAperturaActiva(): Promise<AperturaCaja | null> {
    return prisma.aperturaCaja.findFirst({
      where: { estado: 'abierta' },
      orderBy: { id: 'desc' }
    });
  }

  async createApertura(data: AbrirCajaDto, usuarioId: number, usuarioNombre: string): Promise<AperturaCaja> {
    return prisma.aperturaCaja.create({
      data: {
        fondoInicial: data.fondoInicial,
        notas: data.notas,
        usuarioId,
        usuarioNombre
      }
    });
  }

  async getVentasDesde(fecha: Date) {
    return prisma.venta.findMany({
      where: {
        fecha: { gte: fecha },
        estado: 'completada'
      }
    });
  }

  async getMovimientosPorApertura(aperturaId: number): Promise<MovimientoCaja[]> {
    return prisma.movimientoCaja.findMany({
      where: { aperturaId },
      orderBy: { fecha: 'desc' }
    });
  }

  async createMovimiento(data: MovimientoCajaDto, aperturaId: number, usuarioId: number, usuarioNombre: string): Promise<MovimientoCaja> {
    return prisma.movimientoCaja.create({
      data: {
        tipo: data.tipo,
        monto: data.monto,
        motivo: data.motivo || '',
        aperturaId,
        usuarioId,
        usuarioNombre
      }
    });
  }

  async createCierre(
    aperturaId: number,
    fechaInicio: Date,
    ventasResumen: {
      totalVentas: number;
      totalEfectivo: number;
      totalTarjeta: number;
      totalTransferencia: number;
      granTotal: number;
    },
    notas: string,
    usuarioId: number,
    usuarioNombre: string
  ): Promise<CierreCaja> {
    const [cierre] = await prisma.$transaction([
      prisma.cierre.create({
        data: {
          fechaInicio,
          fechaFin: new Date(),
          totalVentas: ventasResumen.totalVentas,
          totalEfectivo: ventasResumen.totalEfectivo,
          totalTarjeta: ventasResumen.totalTarjeta,
          totalTransferencia: ventasResumen.totalTransferencia,
          granTotal: ventasResumen.granTotal,
          usuarioId,
          usuarioNombre,
          notas
        }
      }),
      prisma.aperturaCaja.update({
        where: { id: aperturaId },
        data: { estado: 'cerrada' }
      })
    ]);
    return cierre;
  }
}

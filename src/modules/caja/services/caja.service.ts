import { CajaRepository } from '../repositories/caja.repository';
import { AbrirCajaDto, CerrarCajaDto, MovimientoCajaDto } from '../dto/caja.dto';
import { CajaResumen } from '../types/caja';

export class CajaService {
  private repository: CajaRepository;

  constructor() {
    this.repository = new CajaRepository();
  }

  async getResumen(): Promise<CajaResumen> {
    const activa = await this.repository.getAperturaActiva();

    let movimientos: any[] = [];
    let ventasEfectivo = 0;
    let ventasTarjeta = 0;
    let ventasTransferencia = 0;
    let numVentas = 0;
    let totalVentas = 0;

    if (activa) {
      const ventas = await this.repository.getVentasDesde(activa.fecha);
      numVentas = ventas.length;
      ventasEfectivo = ventas.filter((v: any) => v.metodoPago === 'efectivo').reduce((s, v) => s + v.total, 0);
      ventasTarjeta = ventas.filter((v: any) => v.metodoPago === 'tarjeta').reduce((s, v) => s + v.total, 0);
      ventasTransferencia = ventas.filter((v: any) => v.metodoPago === 'transferencia').reduce((s, v) => s + v.total, 0);
      totalVentas = ventas.reduce((s, v) => s + v.total, 0);

      movimientos = await this.repository.getMovimientosPorApertura(activa.id);
    }

    const totalInyecciones = movimientos.filter(m => m.tipo === 'inyeccion').reduce((s, m) => s + m.monto, 0);
    const totalRetiros = movimientos.filter(m => m.tipo === 'retiro').reduce((s, m) => s + m.monto, 0);

    const debeHaber = (activa?.fondoInicial || 0) + ventasEfectivo + totalInyecciones - totalRetiros;

    return {
      activa,
      movimientos,
      ventasEfectivo,
      ventasTarjeta,
      ventasTransferencia,
      numVentas,
      totalVentas,
      totalInyecciones,
      totalRetiros,
      debeHaber
    };
  }

  async abrirCaja(data: AbrirCajaDto, usuarioId: number, usuarioNombre: string) {
    const activa = await this.repository.getAperturaActiva();
    if (activa) {
      throw new Error('Ya hay una caja abierta');
    }
    return this.repository.createApertura(data, usuarioId, usuarioNombre);
  }

  async registrarMovimiento(data: MovimientoCajaDto, usuarioId: number, usuarioNombre: string) {
    const activa = await this.repository.getAperturaActiva();
    if (!activa) {
      throw new Error('No hay caja abierta');
    }
    return this.repository.createMovimiento(data, activa.id, usuarioId, usuarioNombre);
  }

  async cerrarCaja(data: CerrarCajaDto, usuarioId: number, usuarioNombre: string) {
    const resumen = await this.getResumen();
    const activa = resumen.activa;
    
    if (!activa) {
      throw new Error('No hay caja abierta');
    }

    const contado = data.efectivoContado;
    const diferencia = contado - resumen.debeHaber;

    const notas = `Fondo: Q${activa.fondoInicial} | Inyecciones: Q${resumen.totalInyecciones} | Retiros: Q${resumen.totalRetiros} | Debe haber: Q${resumen.debeHaber.toFixed(2)} | Contado: Q${contado.toFixed(2)} | Diferencia: Q${diferencia.toFixed(2)} | ${data.notas || ''}`;

    const ventasResumen = {
      totalVentas: resumen.numVentas,
      totalEfectivo: resumen.ventasEfectivo,
      totalTarjeta: resumen.ventasTarjeta,
      totalTransferencia: resumen.ventasTransferencia,
      granTotal: resumen.totalVentas,
    };

    const cierre = await this.repository.createCierre(
      activa.id,
      activa.fecha,
      ventasResumen,
      notas,
      usuarioId,
      usuarioNombre
    );

    return {
      cierre,
      debeHaber: resumen.debeHaber,
      contado,
      diferencia,
      totalVentas: resumen.totalVentas
    };
  }
}

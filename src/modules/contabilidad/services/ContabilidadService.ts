import { prisma } from '@/lib/prisma';
import { calculateGravable, calculateIVA } from '@/shared/money';
import {
  AsientoContableDTO, AsientoContableSchema,
  CuentaContableDTO, CuentaContableSchema, PeriodoContableDTO, PeriodoContableSchema
} from '../types/contabilidad';
import { z } from 'zod';

export class ContabilidadService {

  // ==========================================
  // CUENTAS CONTABLES
  // ==========================================

  static async getCuentas() {
    return prisma.cuentaContable.findMany({
      orderBy: { codigo: 'asc' },
    });
  }

  static async createCuenta(data: CuentaContableDTO) {
    const valid = CuentaContableSchema.parse(data);
    const exist = await prisma.cuentaContable.findUnique({ where: { codigo: valid.codigo } });
    if (exist) throw new Error('El código de cuenta ya existe');

    return prisma.cuentaContable.create({
      data: {
        codigo: valid.codigo,
        nombre: valid.nombre,
        tipo: valid.tipo,
        naturaleza: valid.naturaleza,
        nivel: valid.nivel,
        cuentaPadreId: valid.cuentaPadreId,
        activa: valid.activa,
      },
    });
  }

  static async toggleCuentaStatus(id: number, activa: boolean) {
    return prisma.cuentaContable.update({
      where: { id },
      data: { activa },
    });
  }

  static async deleteCuenta(id: number) {
    const partidas = await prisma.partidaContable.count({ where: { cuentaId: id } });
    if (partidas > 0) throw new Error('No se puede eliminar la cuenta porque tiene partidas asociadas');
    return prisma.cuentaContable.delete({ where: { id } });
  }

  // ==========================================
  // ASIENTOS CONTABLES
  // ==========================================

  static async getAsientos(fi?: string, ff?: string, tipo?: string) {
    const where: any = {};
    if (fi && ff) where.fecha = { gte: new Date(fi), lte: new Date(ff + 'T23:59:59') };
    if (tipo) where.tipo = tipo;

    const asientos = await prisma.asientoContable.findMany({
      where,
      include: { partidas: { include: { cuenta: true } } },
      orderBy: { fecha: 'desc' },
      take: 200,
    });

    const totalDebe = asientos.flatMap(a => a.partidas).reduce((s, p) => s + p.debe, 0);
    const totalHaber = asientos.flatMap(a => a.partidas).reduce((s, p) => s + p.haber, 0);

    return { asientos, totalDebe, totalHaber, cuadrado: Math.abs(totalDebe - totalHaber) < 0.01 };
  }

  static async getAsiento(id: number) {
    const asiento = await prisma.asientoContable.findUnique({
      where: { id },
      include: { partidas: { include: { cuenta: true } }, periodo: true },
    });
    if (!asiento) throw new Error('Asiento no encontrado');
    return asiento;
  }

  static async createAsiento(data: AsientoContableDTO) {
    const valid = AsientoContableSchema.parse(data);
    const totalDebe = valid.partidas.reduce((s, p) => s + p.debe, 0);
    const totalHaber = valid.partidas.reduce((s, p) => s + p.haber, 0);
    if (Math.abs(totalDebe - totalHaber) > 0.01) {
      throw new Error(`Asiento no cuadra. Debe: Q${totalDebe.toFixed(2)} | Haber: Q${totalHaber.toFixed(2)}`);
    }

    const now = valid.fecha ? new Date(valid.fecha) : new Date();

    return prisma.$transaction(async (tx) => {
      const periodo = await tx.periodoContable.findFirst({
        where: { estado: 'abierto', fechaInicio: { lte: now }, fechaFin: { gte: now } }
      });

      const count = await tx.asientoContable.count();
      const numero = valid.numero || `ASI-${String(count + 1).padStart(6, '0')}`;

      return tx.asientoContable.create({
        data: {
          numero,
          concepto: valid.concepto,
          tipo: valid.tipo || 'manual',
          fecha: now,
          referenciaNum: valid.referenciaNum,
          referenciaTipo: valid.referenciaTipo,
          periodoId: valid.periodoId || periodo?.id,
          usuarioNombre: valid.usuarioNombre,
          partidas: {
            create: valid.partidas.map(p => ({
              cuentaId: Number(p.cuentaId),
              debe: p.debe,
              haber: p.haber,
              descripcion: p.descripcion,
            }))
          }
        },
        include: { partidas: { include: { cuenta: true } } }
      });
    });
  }

  static async updateAsiento(id: number, data: Partial<AsientoContableDTO>) {
    return prisma.$transaction(async (tx) => {
      const asiento = await tx.asientoContable.findUnique({ where: { id }, include: { periodo: true } });
      if (!asiento) throw new Error('Asiento no encontrado');
      if (asiento.periodo?.estado === 'cerrado') throw new Error('El periodo está cerrado');
      if (asiento.tipo !== 'manual' && asiento.tipo !== 'ajuste') throw new Error('Solo se pueden editar asientos manuales o de ajuste');

      if (data.partidas) {
        const validPartidas = z.array(AsientoContableSchema.shape.partidas.element).parse(data.partidas);
        const td = validPartidas.reduce((s, p) => s + p.debe, 0);
        const th = validPartidas.reduce((s, p) => s + p.haber, 0);
        if (Math.abs(td - th) > 0.01) throw new Error(`Asiento no cuadra. Debe: Q${td.toFixed(2)} | Haber: Q${th.toFixed(2)}`);

        await tx.partidaContable.deleteMany({ where: { asientoId: id } });
        await tx.partidaContable.createMany({
          data: validPartidas.map(p => ({
            asientoId: id,
            cuentaId: Number(p.cuentaId),
            debe: p.debe,
            haber: p.haber,
            descripcion: p.descripcion,
          }))
        });
      }

      return tx.asientoContable.update({
        where: { id },
        data: {
          concepto: data.concepto || asiento.concepto,
          fecha: data.fecha ? new Date(data.fecha) : asiento.fecha,
        },
        include: { partidas: { include: { cuenta: true } } }
      });
    });
  }

  static async deleteAsiento(id: number, isAdmin: boolean) {
    if (!isAdmin) throw new Error('No autorizado');
    const asiento = await prisma.asientoContable.findUnique({ where: { id }, include: { periodo: true } });
    if (!asiento) throw new Error('No encontrado');
    if (asiento.periodo?.estado === 'cerrado') throw new Error('El periodo está cerrado. Reabre el periodo para modificar asientos.');
    if (asiento.tipo !== 'manual' && asiento.tipo !== 'ajuste') throw new Error('Solo se pueden eliminar asientos manuales o de ajuste');
    return prisma.asientoContable.delete({ where: { id } });
  }

  // ==========================================
  // PERIODOS CONTABLES
  // ==========================================

  static async getPeriodos() {
    return prisma.periodoContable.findMany({ orderBy: { fechaInicio: 'desc' } });
  }

  static async createPeriodo(data: PeriodoContableDTO) {
    const valid = PeriodoContableSchema.parse(data);
    return prisma.periodoContable.create({
      data: {
        nombre: valid.nombre,
        fechaInicio: new Date(valid.fechaInicio),
        fechaFin: new Date(valid.fechaFin),
        estado: valid.estado,
      }
    });
  }

  static async togglePeriodoEstado(id: number, userName: string) {
    const p = await prisma.periodoContable.findUnique({ where: { id } });
    if (!p) throw new Error('Periodo no encontrado');
    const nuevoEstado = p.estado === 'abierto' ? 'cerrado' : 'abierto';
    return prisma.periodoContable.update({
      where: { id },
      data: {
        estado: nuevoEstado,
        cerradoPor: nuevoEstado === 'cerrado' ? userName : null,
        cerradoAt: nuevoEstado === 'cerrado' ? new Date() : null,
      }
    });
  }

  // ==========================================
  // REPORTES / ESTADOS
  // ==========================================

  static async getMayor(fi: string, ff: string, cuentaId?: number) {
    const where: any = { asiento: { fecha: { gte: new Date(fi), lte: new Date(ff + 'T23:59:59') } } };
    if (cuentaId) where.cuentaId = cuentaId;

    const partidas = await prisma.partidaContable.findMany({
      where,
      include: { cuenta: true, asiento: true },
      orderBy: { asiento: { fecha: 'asc' } },
    });

    const agrupado: Record<number, { id: number; codigo: string; nombre: string; partidas: any[]; totalDebe: number; totalHaber: number; saldo: number; naturaleza: string }> = {};

    for (const p of partidas) {
      if (!agrupado[p.cuentaId]) {
        agrupado[p.cuentaId] = {
          id: p.cuenta.id, codigo: p.cuenta.codigo, nombre: p.cuenta.nombre,
          naturaleza: p.cuenta.naturaleza, partidas: [], totalDebe: 0, totalHaber: 0, saldo: 0,
        };
      }
      agrupado[p.cuentaId].partidas.push(p);
      agrupado[p.cuentaId].totalDebe += p.debe;
      agrupado[p.cuentaId].totalHaber += p.haber;

      if (p.cuenta.naturaleza === 'deudora') {
        agrupado[p.cuentaId].saldo += (p.debe - p.haber);
      } else {
        agrupado[p.cuentaId].saldo += (p.haber - p.debe);
      }
    }

    return Object.values(agrupado).sort((a, b) => a.codigo.localeCompare(b.codigo));
  }

  static async getIva(fi: string, ff: string) {
    const fechaIni = new Date(fi);
    const fechaFin = new Date(ff + 'T23:59:59');

    const ventas = await prisma.venta.findMany({
      where: { fecha: { gte: fechaIni, lte: fechaFin }, estado: 'completada' },
      select: { total: true }
    });

    const totalVentas = ventas.reduce((s, v) => s + v.total, 0);
    const baseVentas = calculateGravable(totalVentas, 0.05);
    const ivaDebito = calculateIVA(totalVentas, 0.05);

    const compras = await prisma.compra.findMany({
      where: { fecha: { gte: fechaIni, lte: fechaFin } },
      select: { total: true }
    });

    const totalCompras = compras.reduce((s, c) => s + c.total, 0);
    const baseCompras = calculateGravable(totalCompras, 0.05);
    const ivaCredito = calculateIVA(totalCompras, 0.05);

    const ivaLiquido = ivaDebito - ivaCredito;

    return {
      periodo: { fi, ff },
      ventas: { count: ventas.length, total: totalVentas, base: baseVentas, iva: ivaDebito },
      compras: { count: compras.length, total: totalCompras, base: baseCompras, iva: ivaCredito },
      liquidacion: { ivaDebito, ivaCredito, ivaLiquido, aPagar: Math.max(0, ivaLiquido), saldoFavor: Math.max(0, -ivaLiquido) }
    };
  }

  static async getEstados(tipo: 'pyg' | 'balance', fi: string, ff: string) {
    const start = new Date(fi);
    const end = new Date(ff + 'T23:59:59');

    if (tipo === 'pyg') {
      const ventas = await prisma.venta.aggregate({ where: { fecha: { gte: start, lte: end }, estado: 'completada' }, _sum: { total: true }, _count: true });
      const ingresos = calculateGravable(ventas._sum.total || 0, 0.05); // sin IVA

      const ventaItems = await prisma.ventaItem.findMany({
        where: { venta: { fecha: { gte: start, lte: end }, estado: 'completada' } },
        include: { producto: { select: { costo: true } } },
      });

      const costoVentasReal = ventaItems.reduce((sum, item) => {
        const itemCost = item.producto?.costo || 0;
        return sum + (itemCost * item.cantidad);
      }, 0);

      const costoVentas = costoVentasReal > 0 ? costoVentasReal : (ingresos * 0.65);

      const gastoAsientos = await prisma.partidaContable.aggregate({
        where: { cuenta: { tipo: 'gasto' }, asiento: { fecha: { gte: start, lte: end } } },
        _sum: { debe: true }
      });
      const totalGastos = gastoAsientos._sum.debe || 0;

      const utilidadBruta = ingresos - costoVentas;
      const utilidadOperativa = utilidadBruta - totalGastos;
      const isr = Math.max(0, utilidadOperativa * 0.05);
      const utilidadNeta = utilidadOperativa - isr;

      return {
        tipo: 'pyg', periodo: { fi, ff },
        ingresos: { ventas: ingresos, count: ventas._count },
        costos: { costoVentas },
        utilidadBruta,
        gastos: { total: totalGastos },
        utilidadOperativa,
        impuestos: { isr },
        utilidadNeta,
        margen: ingresos > 0 ? Math.round((utilidadNeta / ingresos) * 100) : 0,
      };
    } else {
      const partidas = await prisma.partidaContable.groupBy({
        by: ['cuentaId'],
        where: { asiento: { fecha: { lte: end } } },
        _sum: { debe: true, haber: true }
      });

      const cuentas = await prisma.cuentaContable.findMany({ where: { activa: true } });
      const cuentasMap = Object.fromEntries(cuentas.map(c => [c.id, c]));

      const saldos = partidas.map(p => {
        const cuenta = cuentasMap[p.cuentaId];
        if (!cuenta) return null;
        const debe = p._sum.debe || 0;
        const haber = p._sum.haber || 0;
        const saldo = cuenta.naturaleza === 'deudora' ? debe - haber : haber - debe;
        return { cuenta, saldo };
      }).filter(Boolean);

      const activos = saldos.filter(s => s!.cuenta.tipo === 'activo' && s!.saldo > 0);
      const pasivos = saldos.filter(s => s!.cuenta.tipo === 'pasivo' && s!.saldo > 0);
      const capital = saldos.filter(s => s!.cuenta.tipo === 'capital' && s!.saldo > 0);

      const totalActivos = activos.reduce((s, a) => s + a!.saldo, 0);
      const totalPasivos = pasivos.reduce((s, a) => s + a!.saldo, 0);
      const totalCapital = capital.reduce((s, a) => s + a!.saldo, 0);

      const inventario = await prisma.producto.aggregate({ _sum: { costo: true }, where: { activo: true } });
      const valorInventario = (inventario._sum.costo || 0);

      return {
        tipo: 'balance', periodo: { fi, ff },
        activos, pasivos, capital,
        totales: { activos: totalActivos + valorInventario, pasivos: totalPasivos, capital: totalCapital },
        valorInventario, cuadra: Math.abs((totalActivos + valorInventario) - (totalPasivos + totalCapital)) < 1
      };
    }
  }

  // ==========================================
  // SETUP (Inicializacion de cuentas)
  // ==========================================

  static async runSetup(userName: string) {
    const exist = await prisma.cuentaContable.count();
    if (exist > 0) throw new Error('El plan de cuentas ya fue inicializado');

    const cuentasBasicas = [
      // ACTIVOS
      { codigo: '1000', nombre: 'ACTIVOS', tipo: 'activo', naturaleza: 'deudora', nivel: 1 },
      { codigo: '1100', nombre: 'Activos Corrientes', tipo: 'activo', naturaleza: 'deudora', nivel: 2 },
      { codigo: '1101', nombre: 'Caja', tipo: 'activo', naturaleza: 'deudora', nivel: 3 },
      { codigo: '1102', nombre: 'Bancos', tipo: 'activo', naturaleza: 'deudora', nivel: 3 },
      { codigo: '1103', nombre: 'Cuentas por Cobrar', tipo: 'activo', naturaleza: 'deudora', nivel: 3 },
      { codigo: '1104', nombre: 'Inventario', tipo: 'activo', naturaleza: 'deudora', nivel: 3 },
      { codigo: '1105', nombre: 'IVA por Cobrar', tipo: 'activo', naturaleza: 'deudora', nivel: 3 },
      { codigo: '1200', nombre: 'Activos No Corrientes', tipo: 'activo', naturaleza: 'deudora', nivel: 2 },
      { codigo: '1201', nombre: 'Mobiliario y Equipo', tipo: 'activo', naturaleza: 'deudora', nivel: 3 },
      { codigo: '1202', nombre: 'Vehículos', tipo: 'activo', naturaleza: 'deudora', nivel: 3 },
      { codigo: '1203', nombre: 'Depreciación Acumulada', tipo: 'activo', naturaleza: 'acreedora', nivel: 3 },

      // PASIVOS
      { codigo: '2000', nombre: 'PASIVOS', tipo: 'pasivo', naturaleza: 'acreedora', nivel: 1 },
      { codigo: '2100', nombre: 'Pasivos Corrientes', tipo: 'pasivo', naturaleza: 'acreedora', nivel: 2 },
      { codigo: '2101', nombre: 'Cuentas por Pagar', tipo: 'pasivo', naturaleza: 'acreedora', nivel: 3 },
      { codigo: '2102', nombre: 'Proveedores', tipo: 'pasivo', naturaleza: 'acreedora', nivel: 3 },
      { codigo: '2103', nombre: 'IVA por Pagar', tipo: 'pasivo', naturaleza: 'acreedora', nivel: 3 },
      { codigo: '2104', nombre: 'Impuestos por Pagar', tipo: 'pasivo', naturaleza: 'acreedora', nivel: 3 },
      { codigo: '2105', nombre: 'Sueldos por Pagar', tipo: 'pasivo', naturaleza: 'acreedora', nivel: 3 },
      { codigo: '2200', nombre: 'Pasivos No Corrientes', tipo: 'pasivo', naturaleza: 'acreedora', nivel: 2 },
      { codigo: '2201', nombre: 'Préstamos Bancarios', tipo: 'pasivo', naturaleza: 'acreedora', nivel: 3 },

      // CAPITAL
      { codigo: '3000', nombre: 'CAPITAL', tipo: 'capital', naturaleza: 'acreedora', nivel: 1 },
      { codigo: '3101', nombre: 'Capital Social', tipo: 'capital', naturaleza: 'acreedora', nivel: 3 },
      { codigo: '3102', nombre: 'Utilidades Retenidas', tipo: 'capital', naturaleza: 'acreedora', nivel: 3 },
      { codigo: '3103', nombre: 'Utilidad del Ejercicio', tipo: 'capital', naturaleza: 'acreedora', nivel: 3 },

      // INGRESOS
      { codigo: '4000', nombre: 'INGRESOS', tipo: 'ingreso', naturaleza: 'acreedora', nivel: 1 },
      { codigo: '4100', nombre: 'Ingresos Operativos', tipo: 'ingreso', naturaleza: 'acreedora', nivel: 2 },
      { codigo: '4101', nombre: 'Ventas', tipo: 'ingreso', naturaleza: 'acreedora', nivel: 3 },
      { codigo: '4102', nombre: 'Servicios Prestados', tipo: 'ingreso', naturaleza: 'acreedora', nivel: 3 },
      { codigo: '4200', nombre: 'Otros Ingresos', tipo: 'ingreso', naturaleza: 'acreedora', nivel: 2 },

      // COSTOS
      { codigo: '5000', nombre: 'COSTOS', tipo: 'costo', naturaleza: 'deudora', nivel: 1 },
      { codigo: '5100', nombre: 'Costo de Ventas', tipo: 'costo', naturaleza: 'deudora', nivel: 2 },
      { codigo: '5101', nombre: 'Costo de Mercadería', tipo: 'costo', naturaleza: 'deudora', nivel: 3 },

      // GASTOS
      { codigo: '6000', nombre: 'GASTOS OPERATIVOS', tipo: 'gasto', naturaleza: 'deudora', nivel: 1 },
      { codigo: '6100', nombre: 'Gastos de Administración', tipo: 'gasto', naturaleza: 'deudora', nivel: 2 },
      { codigo: '6101', nombre: 'Sueldos y Salarios', tipo: 'gasto', naturaleza: 'deudora', nivel: 3 },
      { codigo: '6102', nombre: 'Alquileres', tipo: 'gasto', naturaleza: 'deudora', nivel: 3 },
      { codigo: '6103', nombre: 'Servicios Básicos (Luz, Agua, Tel)', tipo: 'gasto', naturaleza: 'deudora', nivel: 3 },
      { codigo: '6104', nombre: 'Papelería y Útiles', tipo: 'gasto', naturaleza: 'deudora', nivel: 3 },
      { codigo: '6500', nombre: 'Gastos de Venta', tipo: 'gasto', naturaleza: 'deudora', nivel: 2 },
      { codigo: '6600', nombre: 'Gastos de Publicidad', tipo: 'gasto', naturaleza: 'deudora', nivel: 2 },
      { codigo: '6700', nombre: 'Gastos Financieros', tipo: 'gasto', naturaleza: 'deudora', nivel: 2 },
      { codigo: '6900', nombre: 'Otros Gastos', tipo: 'gasto', naturaleza: 'deudora', nivel: 2 },
    ];

    await prisma.cuentaContable.createMany({ data: cuentasBasicas });

    // Periodo inicial
    const y = new Date().getFullYear();
    await prisma.periodoContable.create({
      data: {
        nombre: `Periodo ${y}`,
        fechaInicio: new Date(`${y}-01-01`),
        fechaFin: new Date(`${y}-12-31`),
        estado: 'abierto'
      }
    });

    return { msg: 'Plan de cuentas guatemalteco instalado (38 cuentas) y periodo creado' };
  }
}

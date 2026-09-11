import { prisma } from '@/lib/prisma';

export class CuentasBackendService {
  private static async crearAsiento(
    concepto: string,
    tipo: string,
    referenciaNum: string,
    partidas: { codigo: string; debe: number; haber: number; desc: string }[],
    usuarioNombre: string
  ) {
    try {
      const cuentas = await prisma.cuentaContable.findMany({
        where: { codigo: { in: partidas.map(p => p.codigo) } }
      });
      const codigoMap = Object.fromEntries(cuentas.map((c: any) => [c.codigo, c.id]));
      
      await prisma.$transaction(async (tx) => {
        const count = await tx.asientoContable.count();
        await tx.asientoContable.create({
          data: {
            numero: `ASI-${String(count + 1).padStart(6, '0')}`,
            concepto,
            tipo,
            referenciaNum,
            usuarioNombre,
            partidas: {
              create: partidas.map((p: any) => ({
                cuentaId: codigoMap[p.codigo] || 0,
                debe: p.debe,
                haber: p.haber,
                descripcion: p.desc
              }))
            },
          },
        });
      });
    } catch {
      // sin catálogo contable, no falla
    }
  }

  // --- Cuentas por Pagar ---
  
  static async getCuentasPagar(estado?: string) {
    const cuentas = await prisma.cuentaPagar.findMany({
      where: estado ? { estado } : {},
      orderBy: { fechaVencimiento: 'asc' },
      take: 100,
    });
    const resumen = await prisma.cuentaPagar.aggregate({ _sum: { monto: true, montoPagado: true } });
    
    return { cuentas, resumen };
  }

  static async crearCuentaPagar(data: any, user: any) {
    const { proveedorNombre, compraNumero, concepto, monto, fechaVencimiento, notas } = data;
    if (!proveedorNombre || !monto || !fechaVencimiento) throw new Error('Datos incompletos');
    
    const cuenta = await prisma.$transaction(async (tx) => {
      const count = await tx.cuentaPagar.count();
      const numero = `CP-${String(count + 1).padStart(6, '0')}`;
      
      return tx.cuentaPagar.create({
        data: {
          numero, proveedorNombre, compraNumero, concepto, monto: +monto,
          fechaVencimiento: new Date(fechaVencimiento), notas, usuarioNombre: user.name
        },
      });
    });

    await this.crearAsiento(`C×P ${cuenta.numero} — ${proveedorNombre}`, 'pago', cuenta.numero, [
      { codigo: '1120', debe: +monto, haber: 0, desc: `Compra — ${concepto}` },
      { codigo: '2101', debe: 0, haber: +monto, desc: `Deuda ${proveedorNombre}` }
    ], user.name);

    return cuenta;
  }

  static async pagarCuentaPagar(id: number, montoPago: number, notas: string, user: any) {
    const cuenta = await prisma.cuentaPagar.findUnique({ where: { id } });
    if (!cuenta) throw new Error('No encontrada');
    
    const nuevoPagado = cuenta.montoPagado + Number(montoPago);
    const updated = await prisma.cuentaPagar.update({
      where: { id },
      data: {
        montoPagado: nuevoPagado,
        estado: nuevoPagado >= cuenta.monto ? 'pagado' : 'parcial',
        notas: notas || cuenta.notas
      },
    });

    await this.crearAsiento(`Pago ${cuenta.numero} — ${cuenta.proveedorNombre}`, 'pago', cuenta.numero, [
      { codigo: '2101', debe: Number(montoPago), haber: 0, desc: `Rebaje C×P ${cuenta.numero}` },
      { codigo: '1101', debe: 0, haber: Number(montoPago), desc: `Pago a ${cuenta.proveedorNombre}` }
    ], user.name);

    return updated;
  }

  // --- Cuentas por Cobrar ---
  
  static async getCuentasCobrar(estado?: string) {
    const cuentas = await prisma.cuentaCobrar.findMany({
      where: estado ? { estado } : {},
      orderBy: { fechaVencimiento: 'asc' },
      take: 100,
    });
    const resumen = await prisma.cuentaCobrar.aggregate({ _sum: { monto: true, montoPagado: true } });
    
    return { cuentas, resumen };
  }

  static async crearCuentaCobrar(data: any, user: any) {
    const { clienteNombre, clienteNit, clienteTelefono, ventaNumero, concepto, monto, fechaVencimiento, notas } = data;
    if (!clienteNombre || !monto || !fechaVencimiento) throw new Error('Datos incompletos');
    
    const cuenta = await prisma.$transaction(async (tx) => {
      const count = await tx.cuentaCobrar.count();
      const numero = `CC-${String(count + 1).padStart(6, '0')}`;
      
      return tx.cuentaCobrar.create({
        data: {
          numero, clienteNombre, clienteNit, clienteTelefono, ventaNumero, concepto, monto: +monto,
          fechaVencimiento: new Date(fechaVencimiento), notas, usuarioNombre: user.name
        },
      });
    });

    await this.crearAsiento(`C×C ${cuenta.numero} — ${clienteNombre}`, 'cobro', cuenta.numero, [
      { codigo: '1110', debe: +monto, haber: 0, desc: `${concepto} — ${clienteNombre}` },
      { codigo: '4100', debe: 0, haber: +monto, desc: `Ingreso ${cuenta.numero}` }
    ], user.name);

    return cuenta;
  }

  static async cobrarCuentaCobrar(id: number, montoPago: number, notas: string, user: any) {
    const cuenta = await prisma.cuentaCobrar.findUnique({ where: { id } });
    if (!cuenta) throw new Error('No encontrada');
    
    const nuevoPagado = cuenta.montoPagado + Number(montoPago);
    const updated = await prisma.cuentaCobrar.update({
      where: { id },
      data: {
        montoPagado: nuevoPagado,
        estado: nuevoPagado >= cuenta.monto ? 'pagado' : 'parcial',
        notas: notas || cuenta.notas
      },
    });

    await this.crearAsiento(`Cobro ${cuenta.numero} — ${cuenta.clienteNombre}`, 'cobro', cuenta.numero, [
      { codigo: '1101', debe: Number(montoPago), haber: 0, desc: `Cobro — ${cuenta.clienteNombre}` },
      { codigo: '1110', debe: 0, haber: Number(montoPago), desc: `Rebaje C×C ${cuenta.numero}` }
    ], user.name);

    return updated;
  }
}

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  try {
    const session = await auth()
    if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

    const { searchParams } = new URL(req.url)
    const fi = searchParams.get('fi') || new Date(new Date().getFullYear(), 0, 1).toISOString().slice(0, 10)
    const ff = searchParams.get('ff') || new Date().toISOString().slice(0, 10)
    const tipo = searchParams.get('tipo') || 'pyg'

    const fechaIni = new Date(fi)
    const fechaFin = new Date(ff + 'T23:59:59')

    if (tipo === 'pyg') {
      // Income statement from real data
      const ventas = await prisma.venta.aggregate({ where: { fecha: { gte: fechaIni, lte: fechaFin }, estado: { not: 'cancelada' } }, _sum: { total: true }, _count: true })
      const compras = await prisma.compra.aggregate({ where: { fecha: { gte: fechaIni, lte: fechaFin } }, _sum: { total: true } })
      const ingresos = (ventas._sum.total || 0) / 1.05 // sin IVA

      // Cost of goods - approximate from purchase cost ratio
      const totalProductos = await prisma.producto.aggregate({ _sum: { costo: true, precio: true } })
      const margenPct = totalProductos._sum.precio && totalProductos._sum.costo
        ? 1 - (totalProductos._sum.costo / totalProductos._sum.precio) : 0.35
      const costoVentas = ingresos * (1 - margenPct)

      // Asientos-based expenses
      const gastoAsientos = await prisma.partidaContable.aggregate({
        where: { cuenta: { tipo: 'gasto' }, asiento: { fecha: { gte: fechaIni, lte: fechaFin } } },
        _sum: { debe: true }
      })
      const totalGastos = gastoAsientos._sum.debe || 0

      const utilidadBruta = ingresos - costoVentas
      const utilidadOperativa = utilidadBruta - totalGastos
      const isr = Math.max(0, utilidadOperativa * 0.05)
      const utilidadNeta = utilidadOperativa - isr

      return NextResponse.json({
        tipo: 'pyg', periodo: { fi, ff },
        ingresos: { ventas: ingresos, count: ventas._count },
        costos: { costoVentas },
        utilidadBruta,
        gastos: { total: totalGastos },
        utilidadOperativa,
        impuestos: { isr },
        utilidadNeta,
        margen: ingresos > 0 ? Math.round((utilidadNeta / ingresos) * 100) : 0,
      })
    }

    if (tipo === 'balance') {
      // Balance sheet from partidas
      const partidas = await prisma.partidaContable.groupBy({
        by: ['cuentaId'],
        where: { asiento: { fecha: { lte: fechaFin } } },
        _sum: { debe: true, haber: true }
      })

      const cuentas = await prisma.cuentaContable.findMany({ where: { activa: true } })
      const cuentasMap = Object.fromEntries(cuentas.map(c => [c.id, c]))

      const saldos = partidas.map(p => {
        const cuenta = cuentasMap[p.cuentaId]
        if (!cuenta) return null
        const debe = p._sum.debe || 0
        const haber = p._sum.haber || 0
        const saldo = cuenta.naturaleza === 'deudora' ? debe - haber : haber - debe
        return { cuenta, saldo }
      }).filter(Boolean)

      const activos = saldos.filter(s => s!.cuenta.tipo === 'activo' && s!.saldo > 0)
      const pasivos = saldos.filter(s => s!.cuenta.tipo === 'pasivo' && s!.saldo > 0)
      const capital = saldos.filter(s => s!.cuenta.tipo === 'capital' && s!.saldo > 0)

      const totalActivos = activos.reduce((s, a) => s + a!.saldo, 0)
      const totalPasivos = pasivos.reduce((s, a) => s + a!.saldo, 0)
      const totalCapital = capital.reduce((s, a) => s + a!.saldo, 0)

      // Add inventory value to activos
      const inventario = await prisma.producto.aggregate({ _sum: { costo: true }, where: { activo: true } })
      const valorInventario = (inventario._sum.costo || 0)

      return NextResponse.json({
        tipo: 'balance', periodo: { fi, ff },
        activos, pasivos, capital,
        totales: { activos: totalActivos + valorInventario, pasivos: totalPasivos, capital: totalCapital },
        valorInventario, cuadra: Math.abs((totalActivos + valorInventario) - (totalPasivos + totalCapital)) < 1
      })
    }

    return NextResponse.json({ error: 'Tipo inválido' }, { status: 400 })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message }, { status: 500 })
  }
}

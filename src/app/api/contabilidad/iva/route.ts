import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  try {
    const session = await auth()
    if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

    const { searchParams } = new URL(req.url)
    const fi = searchParams.get('fi') || new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().slice(0, 10)
    const ff = searchParams.get('ff') || new Date().toISOString().slice(0, 10)

    const fechaIni = new Date(fi)
    const fechaFin = new Date(ff + 'T23:59:59')

    // IVA débito from ventas
    const ventas = await prisma.venta.findMany({
      where: { fecha: { gte: fechaIni, lte: fechaFin }, estado: { not: 'cancelada' } },
      select: { total: true, subtotal: true, descuento: true }
    })

    const totalVentas = ventas.reduce((s, v) => s + v.total, 0)
    const baseVentas = totalVentas / 1.05
    const ivaDebito = totalVentas - baseVentas

    // IVA crédito from compras
    const compras = await prisma.compra.findMany({
      where: { fecha: { gte: fechaIni, lte: fechaFin } },
      select: { total: true }
    })

    const totalCompras = compras.reduce((s, c) => s + c.total, 0)
    const baseCompras = totalCompras / 1.05
    const ivaCredito = totalCompras - baseCompras

    const ivaLiquido = ivaDebito - ivaCredito

    return NextResponse.json({
      periodo: { fi, ff },
      ventas: { count: ventas.length, total: totalVentas, base: baseVentas, iva: ivaDebito },
      compras: { count: compras.length, total: totalCompras, base: baseCompras, iva: ivaCredito },
      liquidacion: { ivaDebito, ivaCredito, ivaLiquido, aPagar: Math.max(0, ivaLiquido), saldoFavor: Math.max(0, -ivaLiquido) }
    })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message }, { status: 500 })
  }
}

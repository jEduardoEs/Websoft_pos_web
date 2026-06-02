import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  try {
    const session = await auth()
    if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    const { searchParams } = new URL(req.url)
    const fi = searchParams.get('fi')
    const ff = searchParams.get('ff')
    const cuentaId = searchParams.get('cuentaId')

    const where: any = {}
    if (fi && ff) where.asiento = { fecha: { gte: new Date(fi), lte: new Date(ff + 'T23:59:59') } }
    if (cuentaId) where.cuentaId = Number(cuentaId)

    const partidas = await prisma.partidaContable.findMany({
      where,
      include: { cuenta: true, asiento: { select: { numero: true, fecha: true, concepto: true, tipo: true } } },
      orderBy: { asiento: { fecha: 'asc' } },
    })

    const byCuenta: Record<number, any> = {}
    for (const p of partidas) {
      const cid = p.cuentaId
      if (!byCuenta[cid]) byCuenta[cid] = { cuenta: p.cuenta, movimientos: [], totalDebe: 0, totalHaber: 0 }
      byCuenta[cid].movimientos.push(p)
      byCuenta[cid].totalDebe += p.debe
      byCuenta[cid].totalHaber += p.haber
    }

    const cuentas = Object.values(byCuenta).map((c: any) => ({
      ...c,
      saldo: c.cuenta.naturaleza === 'deudora' ? c.totalDebe - c.totalHaber : c.totalHaber - c.totalDebe
    })).sort((a: any, b: any) => a.cuenta.codigo.localeCompare(b.cuenta.codigo))

    return NextResponse.json({ cuentas })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message }, { status: 500 })
  }
}

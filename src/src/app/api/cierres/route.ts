import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'

export const dynamic = 'force-dynamic'

export async function GET()  {
  try {

    const session = await auth()
    if (!session || session.user.role !== 'admin') return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    return NextResponse.json(await prisma.cierre.findMany({ orderBy: { id: 'desc' }, take: 50 }))

  } catch (e: any) {
    console.error('cierres/route.ts error:', e?.message)
    return NextResponse.json({ error: e?.message || 'Error interno' }, { status: 500 })
  }
}
export async function POST(req: NextRequest)  {
  try {

    const session = await auth()
    if (!session || session.user.role !== 'admin') return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    const { fechaInicio, fechaFin, notas } = await req.json()
    const start = fechaInicio ? new Date(fechaInicio) : new Date(new Date().setHours(0,0,0,0))
    const end = fechaFin ? new Date(fechaFin) : new Date()
    if (fechaFin) end.setHours(23,59,59,999)

    const ventas = await prisma.venta.findMany({ where: { fecha: { gte: start, lte: end }, estado: 'completada' } })
    const byMethod = (m: string) => ventas.filter(v => v.metodoPago === m).reduce((s, v) => s + v.total, 0)

    const c = await prisma.cierre.create({
      data: {
        fechaInicio: start, fechaFin: end,
        totalVentas: ventas.length,
        totalEfectivo: byMethod('efectivo'), totalTarjeta: byMethod('tarjeta'), totalTransferencia: byMethod('transferencia'),
        granTotal: ventas.reduce((s, v) => s + v.total, 0),
        usuarioId: parseInt(session.user.id), usuarioNombre: session.user.name, notas,
      },
    })
    return NextResponse.json({ ok: true, cierre: c })

  } catch (e: any) {
    console.error('cierres/route.ts error:', e?.message)
    return NextResponse.json({ error: e?.message || 'Error interno' }, { status: 500 })
  }
}
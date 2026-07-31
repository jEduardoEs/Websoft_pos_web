import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest)  {
  try {

    const session = await auth()
    if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

    const { searchParams } = new URL(req.url)
    const anio = parseInt(searchParams.get('anio') || String(new Date().getFullYear()))

    // Get presupuestos for the year
    const presupuestos = await prisma.presupuesto.findMany({ where: { anio }, orderBy: { mes: 'asc' } })

    // Get actual sales per month
    const startOfYear = new Date(anio, 0, 1)
    const endOfYear = new Date(anio, 11, 31, 23, 59, 59)
    const ventas = await prisma.venta.findMany({
      where: { fecha: { gte: startOfYear, lte: endOfYear }, estado: 'completada' },
      select: { fecha: true, total: true },
    })

    // Build month-by-month data
    const meses = Array.from({ length: 12 }, (_, i) => {
      const mes = i + 1
      const pres = presupuestos.find(p => p.mes === mes)
      const ventasMes = ventas.filter(v => new Date(v.fecha).getMonth() + 1 === mes)
      const real = ventasMes.reduce((s, v) => s + v.total, 0)
      const meta = pres?.meta || 0
      return {
        mes, mesNombre: new Date(anio, i, 1).toLocaleString('es-GT', { month: 'long' }),
        meta, real, diferencia: real - meta,
        cumplimiento: meta > 0 ? Math.round((real / meta) * 100) : 0,
        numVentas: ventasMes.length,
      }
    })

    const totalMeta = meses.reduce((s, m) => s + m.meta, 0)
    const totalReal = meses.reduce((s, m) => s + m.real, 0)

    return NextResponse.json({ anio, meses, totalMeta, totalReal, diferencia: totalReal - totalMeta })

  } catch (e: any) {
    console.error('presupuesto/route.ts error:', e?.message)
    return NextResponse.json({ error: e?.message || 'Error interno' }, { status: 500 })
  }
}
export async function POST(req: NextRequest)  {
  try {

    const session = await auth()
    if (!session || session.user.role !== 'admin') return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

    const { anio, mes, meta, notas } = await req.json()
    if (!anio || !mes || meta === undefined) return NextResponse.json({ error: 'Datos incompletos' }, { status: 400 })

    const p = await prisma.presupuesto.upsert({
      where: { anio_mes: { anio: Number(anio), mes: Number(mes) } },
      update: { meta: +meta, notas },
      create: { anio: Number(anio), mes: Number(mes), meta: +meta, notas },
    })
    return NextResponse.json({ ok: true, presupuesto: p })

  } catch (e: any) {
    console.error('presupuesto/route.ts error:', e?.message)
    return NextResponse.json({ error: e?.message || 'Error interno' }, { status: 500 })
  }
}
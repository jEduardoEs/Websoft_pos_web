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
    const tipo = searchParams.get('tipo')
    const where: any = {}
    if (fi && ff) where.fecha = { gte: new Date(fi), lte: new Date(ff + 'T23:59:59') }
    if (tipo) where.tipo = tipo

    const asientos = await prisma.asientoContable.findMany({
      where,
      include: { partidas: { include: { cuenta: true } } },
      orderBy: { fecha: 'desc' },
      take: 200,
    })

    // Summary
    const totalDebe = asientos.flatMap(a => a.partidas).reduce((s, p) => s + p.debe, 0)
    const totalHaber = asientos.flatMap(a => a.partidas).reduce((s, p) => s + p.haber, 0)

    return NextResponse.json({ asientos, totalDebe, totalHaber, cuadrado: Math.abs(totalDebe - totalHaber) < 0.01 })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth()
    if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    const body = await req.json()
    const { concepto, tipo, fecha, partidas, referenciaNum, referenciaTipo } = body

    if (!partidas || partidas.length < 2) return NextResponse.json({ error: 'Mínimo 2 partidas' }, { status: 400 })

    const totalDebe = partidas.reduce((s: number, p: any) => s + (+p.debe || 0), 0)
    const totalHaber = partidas.reduce((s: number, p: any) => s + (+p.haber || 0), 0)
    if (Math.abs(totalDebe - totalHaber) > 0.01) return NextResponse.json({ error: `Asiento no cuadra. Debe: Q${totalDebe.toFixed(2)} | Haber: Q${totalHaber.toFixed(2)}` }, { status: 400 })

    const count = await prisma.asientoContable.count()
    const numero = `ASI-${String(count + 1).padStart(6, '0')}`

    // Find active period
    const now = fecha ? new Date(fecha) : new Date()
    const periodo = await prisma.periodoContable.findFirst({
      where: { estado: 'abierto', fechaInicio: { lte: now }, fechaFin: { gte: now } }
    })

    const asiento = await prisma.asientoContable.create({
      data: {
        numero, concepto, tipo: tipo || 'manual',
        fecha: now, referenciaNum, referenciaTipo,
        periodoId: periodo?.id,
        usuarioNombre: session.user.name,
        partidas: {
          create: partidas.map((p: any) => ({
            cuentaId: Number(p.cuentaId),
            debe: +(p.debe || 0),
            haber: +(p.haber || 0),
            descripcion: p.descripcion || null,
          }))
        }
      },
      include: { partidas: { include: { cuenta: true } } }
    })

    return NextResponse.json({ ok: true, asiento })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message }, { status: 500 })
  }
}

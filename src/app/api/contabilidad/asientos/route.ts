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

export async function DELETE(req: NextRequest) {
  try {
    const session = await auth()
    if (!session || session.user.role !== 'admin') return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    const { searchParams } = new URL(req.url)
    const id = Number(searchParams.get('id'))
    if (!id) return NextResponse.json({ error: 'ID requerido' }, { status: 400 })
    const asiento = await prisma.asientoContable.findUnique({ where: { id }, include: { periodo: true } })
    if (!asiento) return NextResponse.json({ error: 'No encontrado' }, { status: 404 })
    if (asiento.periodo?.estado === 'cerrado') return NextResponse.json({ error: 'El periodo está cerrado. Reabre el periodo para modificar asientos.' }, { status: 400 })
    if (asiento.tipo !== 'manual' && asiento.tipo !== 'ajuste') return NextResponse.json({ error: 'Solo se pueden eliminar asientos manuales o de ajuste' }, { status: 400 })
    await prisma.asientoContable.delete({ where: { id } })
    return NextResponse.json({ ok: true })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const session = await auth()
    if (!session || session.user.role !== 'admin') return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    const body = await req.json()
    const { id, concepto, fecha, partidas } = body
    if (!id) return NextResponse.json({ error: 'ID requerido' }, { status: 400 })
    const asiento = await prisma.asientoContable.findUnique({ where: { id: Number(id) }, include: { periodo: true } })
    if (!asiento) return NextResponse.json({ error: 'No encontrado' }, { status: 404 })
    if (asiento.periodo?.estado === 'cerrado') return NextResponse.json({ error: 'El periodo está cerrado' }, { status: 400 })
    if (asiento.tipo !== 'manual' && asiento.tipo !== 'ajuste') return NextResponse.json({ error: 'Solo se pueden editar asientos manuales o de ajuste' }, { status: 400 })
    if (partidas) {
      const td = partidas.reduce((s: number, p: any) => s + (+p.debe || 0), 0)
      const th = partidas.reduce((s: number, p: any) => s + (+p.haber || 0), 0)
      if (Math.abs(td - th) > 0.01) return NextResponse.json({ error: `Asiento no cuadra. Debe: Q${td.toFixed(2)} | Haber: Q${th.toFixed(2)}` }, { status: 400 })
    }
    const updated = await prisma.$transaction(async (tx) => {
      if (partidas) {
        await tx.partidaContable.deleteMany({ where: { asientoId: Number(id) } })
        await tx.partidaContable.createMany({
          data: partidas.map((p: any) => ({
            asientoId: Number(id),
            cuentaId: Number(p.cuentaId),
            debe: +(p.debe || 0),
            haber: +(p.haber || 0),
            descripcion: p.descripcion || null,
          }))
        })
      }
      return tx.asientoContable.update({
        where: { id: Number(id) },
        data: { concepto: concepto || asiento.concepto, fecha: fecha ? new Date(fecha) : asiento.fecha },
        include: { partidas: { include: { cuenta: true } } }
      })
    })
    return NextResponse.json({ ok: true, asiento: updated })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message }, { status: 500 })
  }
}

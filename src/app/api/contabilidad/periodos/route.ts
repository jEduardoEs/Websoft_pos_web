import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const session = await auth()
    if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    const periodos = await prisma.periodoContable.findMany({ orderBy: { fechaInicio: 'desc' } })
    return NextResponse.json(periodos)
  } catch (e: any) {
    return NextResponse.json({ error: e?.message }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth()
    if (!session || session.user.role !== 'admin') return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    const { nombre, fechaInicio, fechaFin } = await req.json()
    const periodo = await prisma.periodoContable.create({ data: { nombre, fechaInicio: new Date(fechaInicio), fechaFin: new Date(fechaFin) } })
    return NextResponse.json({ ok: true, periodo })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const session = await auth()
    if (!session || session.user.role !== 'admin') return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    const { id, accion } = await req.json()
    const data: any = {}
    if (accion === 'cerrar') { data.estado = 'cerrado'; data.cerradoPor = session.user.name; data.cerradoAt = new Date() }
    else if (accion === 'reabrir') { data.estado = 'abierto'; data.cerradoPor = null; data.cerradoAt = null }
    const periodo = await prisma.periodoContable.update({ where: { id: Number(id) }, data })
    return NextResponse.json({ ok: true, periodo })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message }, { status: 500 })
  }
}

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const session = await auth()
    if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    const activos = await prisma.activoFijo.findMany({ orderBy: { createdAt: 'desc' } })
    const resumen = { total: activos.length, valorBruto: activos.reduce((s, a) => s + a.costoOriginal, 0), depreciacionAcum: activos.reduce((s, a) => s + a.depreciacionAcum, 0), valorNeto: activos.reduce((s, a) => s + a.valorNeto, 0), depreciacionMensual: activos.filter(a => a.estado === 'activo').reduce((s, a) => s + a.depreciacionMensual, 0) }
    return NextResponse.json({ activos, resumen })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth()
    if (!session || session.user.role !== 'admin') return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    const body = await req.json()
    const { nombre, descripcion, fechaAdquisicion, costoOriginal, vidaUtilAnios, valorResidual } = body
    if (!nombre || !costoOriginal || !vidaUtilAnios) return NextResponse.json({ error: 'Campos requeridos' }, { status: 400 })
    const count = await prisma.activoFijo.count()
    const codigo = `AF-${String(count + 1).padStart(4, '0')}`
    const costo = +costoOriginal
    const residual = +(valorResidual || 0)
    const anios = +vidaUtilAnios
    const depMensual = (costo - residual) / (anios * 12)
    const activo = await prisma.activoFijo.create({ data: { codigo, nombre, descripcion, fechaAdquisicion: new Date(fechaAdquisicion), costoOriginal: costo, vidaUtilAnios: anios, valorResidual: residual, depreciacionMensual: depMensual, valorNeto: costo } })
    return NextResponse.json({ ok: true, activo })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message }, { status: 500 })
  }
}

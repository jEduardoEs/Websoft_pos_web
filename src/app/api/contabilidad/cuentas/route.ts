import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const session = await auth()
    if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    const cuentas = await prisma.cuentaContable.findMany({ where: { activa: true }, orderBy: { codigo: 'asc' } })
    return NextResponse.json(cuentas)
  } catch (e: any) {
    return NextResponse.json({ error: e?.message }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth()
    if (!session || session.user.role !== 'admin') return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    const body = await req.json()
    const { codigo, nombre, tipo, naturaleza, nivel } = body
    if (!codigo || !nombre || !tipo) return NextResponse.json({ error: 'Campos requeridos' }, { status: 400 })
    const cuenta = await prisma.cuentaContable.create({ data: { codigo, nombre, tipo, naturaleza: naturaleza || 'deudora', nivel: nivel || 3 } })
    return NextResponse.json({ ok: true, cuenta })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const session = await auth()
    if (!session || session.user.role !== 'admin') return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    const { searchParams } = new URL(req.url)
    const id = Number(searchParams.get('id'))
    const body = await req.json()
    const cuenta = await prisma.cuentaContable.update({ where: { id }, data: { activa: body.activa } })
    return NextResponse.json({ ok: true, cuenta })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message }, { status: 500 })
  }
}

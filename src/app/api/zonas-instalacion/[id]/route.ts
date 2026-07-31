import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'

export const dynamic = 'force-dynamic'

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  const body = await req.json()
  const data: any = {}
  if (body.nombre !== undefined)       data.nombre = body.nombre
  if (body.departamento !== undefined) data.departamento = body.departamento
  if (body.tarifa !== undefined)       data.tarifa = +body.tarifa || 0
  if (body.notas !== undefined)        data.notas = body.notas
  if (body.activa !== undefined)       data.activa = !!body.activa
  if (body.orden !== undefined)        data.orden = +body.orden

  const zona = await prisma.zonaInstalacion.update({ where: { id: Number(params.id) }, data })
  return NextResponse.json({ ok: true, zona })
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  await prisma.zonaInstalacion.delete({ where: { id: Number(params.id) } })
  return NextResponse.json({ ok: true })
}

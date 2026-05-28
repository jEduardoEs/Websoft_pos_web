import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  const c = await prisma.cotizacion.findUnique({ where: { id: Number(params.id) }, include: { items: true } })
  if (!c) return NextResponse.json({ error: 'No encontrado' }, { status: 404 })
  return NextResponse.json(c)
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  const { estado } = await req.json()
  await prisma.cotizacion.update({ where: { id: Number(params.id) }, data: { estado } })
  return NextResponse.json({ ok: true })
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth()
  if (!session || session.user.role !== 'admin') return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  await prisma.cotizacion.delete({ where: { id: Number(params.id) } })
  return NextResponse.json({ ok: true })
}

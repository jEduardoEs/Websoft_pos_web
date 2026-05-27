import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'

export async function GET() {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  const activa = await prisma.aperturaCaja.findFirst({ where: { estado: 'abierta' }, orderBy: { id: 'desc' } })
  return NextResponse.json({ activa })
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  const { accion, fondo, notas } = await req.json()

  if (accion === 'abrir') {
    const activa = await prisma.aperturaCaja.findFirst({ where: { estado: 'abierta' } })
    if (activa) return NextResponse.json({ error: 'Ya hay una caja abierta' }, { status: 400 })
    await prisma.aperturaCaja.create({ data: { fondoInicial: +fondo || 0, usuarioId: parseInt(session.user.id), usuarioNombre: session.user.name, notas } })
    return NextResponse.json({ ok: true })
  }

  if (accion === 'cerrar') {
    const activa = await prisma.aperturaCaja.findFirst({ where: { estado: 'abierta' }, orderBy: { id: 'desc' } })
    if (!activa) return NextResponse.json({ error: 'No hay caja abierta' }, { status: 400 })
    await prisma.aperturaCaja.update({ where: { id: activa.id }, data: { estado: 'cerrada', notas: notas || 'Cierre manual' } })
    return NextResponse.json({ ok: true })
  }

  return NextResponse.json({ error: 'Acción inválida' }, { status: 400 })
}

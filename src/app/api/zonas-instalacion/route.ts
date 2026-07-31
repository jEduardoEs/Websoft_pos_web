import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  const { searchParams } = new URL(req.url)
  const soloActivas = searchParams.get('activas') === 'true'
  const zonas = await prisma.zonaInstalacion.findMany({
    where: soloActivas ? { activa: true } : {},
    orderBy: [{ orden: 'asc' }, { nombre: 'asc' }],
  })
  return NextResponse.json({ zonas })
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  const body = await req.json()
  const { nombre, departamento, tarifa, notas } = body
  if (!nombre || !departamento) return NextResponse.json({ error: 'Nombre y departamento son requeridos' }, { status: 400 })

  const maxOrden = await prisma.zonaInstalacion.aggregate({ _max: { orden: true } })
  const zona = await prisma.zonaInstalacion.create({
    data: {
      nombre, departamento,
      tarifa: +tarifa || 0,
      notas: notas || null,
      orden: (maxOrden._max.orden || 0) + 1,
    },
  })
  return NextResponse.json({ ok: true, zona })
}

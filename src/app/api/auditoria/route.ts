import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session || session.user.role !== 'admin') {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  const { searchParams } = new URL(req.url)
  const tabla = searchParams.get('tabla') || undefined
  const accion = searchParams.get('accion') || undefined
  const usuarioId = searchParams.get('usuario_id')
  const desde = searchParams.get('desde')
  const hasta = searchParams.get('hasta')
  const limit = parseInt(searchParams.get('limit') || '100')

  const where: any = {}
  if (tabla) where.tabla = tabla
  if (accion) where.accion = accion
  if (usuarioId) where.usuarioId = parseInt(usuarioId)
  if (desde || hasta) {
    where.fecha = {}
    if (desde) where.fecha.gte = new Date(desde)
    if (hasta) where.fecha.lte = new Date(hasta + 'T23:59:59')
  }

  try {
    const logs = await prisma.auditLog.findMany({
      where,
      orderBy: { fecha: 'desc' },
      take: Math.min(limit, 500),
    })

    const tablas = await prisma.auditLog.findMany({
      select: { tabla: true },
      distinct: ['tabla'],
    })

    return NextResponse.json({
      logs,
      tablas: tablas.map((t: any) => t.tabla).filter(Boolean),
    })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Error interno' }, { status: 500 })
  }
}

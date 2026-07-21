import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'

export const dynamic = 'force-dynamic'

function addMonths(date: Date, months: number): Date {
  const d = new Date(date)
  d.setMonth(d.getMonth() + months)
  return d
}

export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  const { searchParams } = new URL(req.url)
  const filtro = searchParams.get('filtro') || 'todos'
  const hoy = new Date()
  const en15dias = new Date(); en15dias.setDate(hoy.getDate() + 15)

  const todos = await prisma.mantenimiento.findMany({ orderBy: { createdAt: 'desc' } })

  // Pendientes próximos = mantenimientos no realizados con fecha en los próximos 15 días
  const proximos = todos.filter(m => {
    const fechas = [
      !m.mant1Realizado && m.mant1Fecha,
      !m.mant2Realizado && m.mant2Fecha,
      !m.mant3Realizado && m.mant3Fecha,
    ].filter(Boolean) as Date[]
    return fechas.some(f => new Date(f) <= en15dias && new Date(f) >= hoy)
  })

  const vencidos = todos.filter(m => {
    const fechas = [
      !m.mant1Realizado && m.mant1Fecha,
      !m.mant2Realizado && m.mant2Fecha,
      !m.mant3Realizado && m.mant3Fecha,
    ].filter(Boolean) as Date[]
    return fechas.some(f => new Date(f) < hoy)
  })

  return NextResponse.json({ todos, proximos, vencidos })
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  const body = await req.json()
  const { clienteNombre, clienteTelefono, clienteDireccion, descripcion, fechaInstalacion, notas, ventaNumero } = body
  if (!clienteNombre || !descripcion || !fechaInstalacion) return NextResponse.json({ error: 'Datos incompletos' }, { status: 400 })

  const fechaInst = new Date(fechaInstalacion)
  const numero = `MAN-${String((await prisma.mantenimiento.count()) + 1).padStart(6, '0')}`

  const m = await prisma.mantenimiento.create({
    data: {
      numero, clienteNombre, clienteTelefono, clienteDireccion, descripcion,
      fechaInstalacion: fechaInst,
      mant1Fecha: addMonths(fechaInst, 4),
      mant2Fecha: addMonths(fechaInst, 8),
      mant3Fecha: addMonths(fechaInst, 12),
      notas, ventaNumero,
    },
  })
  return NextResponse.json({ ok: true, mantenimiento: m })
}

export async function PATCH(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  const body = await req.json()
  const { id, mant, notas, ...rest } = body

  const data: any = { ...rest }
  if (mant === 1) { data.mant1Realizado = true; data.mant1Notas = notas }
  if (mant === 2) { data.mant2Realizado = true; data.mant2Notas = notas }
  if (mant === 3) { data.mant3Realizado = true; data.mant3Notas = notas }

  const m = await prisma.mantenimiento.findUnique({ where: { id: Number(id) } })
  if (!m) return NextResponse.json({ error: 'No encontrado' }, { status: 404 })
  const updated = await prisma.mantenimiento.update({ where: { id: Number(id) }, data })
  return NextResponse.json({ ok: true, mantenimiento: updated })
}

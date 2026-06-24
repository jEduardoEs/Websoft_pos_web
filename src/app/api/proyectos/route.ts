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
  const estado = searchParams.get('estado') || ''
  const buscar = searchParams.get('buscar') || ''
  const hoy = new Date()
  const en15dias = new Date(); en15dias.setDate(hoy.getDate() + 15)

  const where: any = {}
  if (estado) where.estado = estado
  if (buscar) where.OR = [
    { nombre: { contains: buscar, mode: 'insensitive' } },
    { clienteNombre: { contains: buscar, mode: 'insensitive' } },
    { numero: { contains: buscar, mode: 'insensitive' } },
  ]

  const proyectos = await prisma.proyecto.findMany({
    where,
    include: { mantenimientos: { orderBy: { numero: 'asc' } } },
    orderBy: { createdAt: 'desc' },
  })

  // Calcular alertas
  const proximos = proyectos.filter((p: any) =>
    p.mantenimientos.some((m: any) =>
      !m.realizado && m.fechaProgramada >= hoy && m.fechaProgramada <= en15dias
    )
  )
  const vencidos = proyectos.filter((p: any) =>
    p.mantenimientos.some((m: any) => !m.realizado && m.fechaProgramada < hoy)
  )

  return NextResponse.json({ proyectos, proximos: proximos.length, vencidos: vencidos.length })
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const body = await req.json()
  const {
    nombre, clienteNombre, clienteTelefono, clienteDireccion, clienteNit,
    contactoNombre, descripcion, alcance, cotizacionId, cotizacionNumero,
    fechaInicio, fechaFin, notas,
  } = body

  if (!nombre || !clienteNombre || !descripcion) {
    return NextResponse.json({ error: 'Nombre, cliente y descripción son requeridos' }, { status: 400 })
  }

  // Verificar que no exista ya un proyecto para esa cotización
  if (cotizacionId) {
    const existe = await prisma.proyecto.findUnique({ where: { cotizacionId: Number(cotizacionId) } })
    if (existe) return NextResponse.json({ error: 'Ya existe un proyecto para esta cotización', proyecto: existe }, { status: 409 })
  }

  const count = await prisma.proyecto.count()
  const numero = `PRY-${String(count + 1).padStart(6, '0')}`
  const inicio = fechaInicio ? new Date(fechaInicio) : new Date()

  const proyecto = await prisma.proyecto.create({
    data: {
      numero, nombre, clienteNombre, clienteTelefono, clienteDireccion,
      clienteNit, contactoNombre, descripcion, alcance,
      cotizacionId: cotizacionId ? Number(cotizacionId) : null,
      cotizacionNumero, fechaInicio: inicio,
      fechaFin: fechaFin ? new Date(fechaFin) : null,
      notas, usuarioNombre: session.user.name,
      mantenimientos: {
        create: [1, 2, 3].map(n => ({
          numero: n,
          fechaProgramada: addMonths(inicio, n * 4),
        })),
      },
    },
    include: { mantenimientos: true },
  })

  try {
    await prisma.auditLog.create({ data: { usuarioId: parseInt(session.user.id), usuarioNombre: session.user.name, accion: 'CREATE', tabla: 'proyectos', registroId: String(proyecto.id), detalle: `Proyecto ${numero} creado` } })
  } catch {}

  return NextResponse.json({ ok: true, proyecto })
}

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'

export async function GET(req: NextRequest) 
  try {

    const session = await auth()
    if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

    const { searchParams } = new URL(req.url)
    const estado = searchParams.get('estado') || ''
    const buscar = searchParams.get('buscar') || ''

    const where: any = {}
    if (estado) where.estado = estado
    if (buscar) where.OR = [
      { numero: { contains: buscar, mode: 'insensitive' } },
      { clienteNombre: { contains: buscar, mode: 'insensitive' } },
      { tipoEquipo: { contains: buscar, mode: 'insensitive' } },
      { marca: { contains: buscar, mode: 'insensitive' } },
    ]

    const ordenes = await prisma.ordenTrabajo.findMany({
      where, orderBy: { id: 'desc' }, take: 100,
      include: { repuestos: true, historial: { orderBy: { fecha: 'desc' }, take: 5 } },
    })
    return NextResponse.json(ordenes)
  }

  } catch (e: any) {
    console.error('ordenes/route.ts error:', e?.message)
    return NextResponse.json({ error: e?.message || 'Error interno' }, { status: 500 })
  }
}
export async function POST(req: NextRequest) 
  try {

    const session = await auth()
    if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

    const body = await req.json()
    const {
      clienteNombre, clienteTelefono, clienteNit,
      tipoEquipo, marca, modelo, serie, accesorios,
      descripcionFalla, observaciones, prioridad,
      fechaPromesa, tecnicoNombre, repuestos,
      costoReparacion, costoRepuestos, notas,
    } = body

    if (!clienteNombre || !tipoEquipo || !descripcionFalla) {
      return NextResponse.json({ error: 'Cliente, equipo y falla son requeridos' }, { status: 400 })
    }

    // Generate number
    const count = await prisma.ordenTrabajo.count()
    const numero = `OT-${String(count + 1).padStart(6, '0')}`

    const total = (+costoReparacion || 0) + (+costoRepuestos || 0)

    const orden = await prisma.ordenTrabajo.create({
      data: {
        numero, clienteNombre, clienteTelefono, clienteNit,
        tipoEquipo, marca, modelo, serie, accesorios,
        descripcionFalla, observaciones, prioridad: prioridad || 'normal',
        fechaPromesa: fechaPromesa ? new Date(fechaPromesa) : null,
        tecnicoNombre, costoReparacion: +costoReparacion || 0,
        costoRepuestos: +costoRepuestos || 0, total, notas,
        usuarioId: parseInt(session.user.id), usuarioNombre: session.user.name,
        repuestos: repuestos?.length > 0 ? {
          create: repuestos.map((r: any) => ({
            nombre: r.nombre, cantidad: +r.cantidad,
            precioUnit: +r.precioUnit, subtotal: +r.cantidad * +r.precioUnit,
          }))
        } : undefined,
        historial: {
          create: { estadoNuevo: 'recibido', comentario: 'Orden creada', usuarioNombre: session.user.name }
        },
      },
      include: { repuestos: true, historial: true },
    })

    return NextResponse.json({ ok: true, orden })
  }

  } catch (e: any) {
    console.error('ordenes/route.ts error:', e?.message)
    return NextResponse.json({ error: e?.message || 'Error interno' }, { status: 500 })
  }
}
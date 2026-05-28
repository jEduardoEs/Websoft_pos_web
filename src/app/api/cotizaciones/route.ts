import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'

export async function GET() {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  const cotizaciones = await prisma.cotizacion.findMany({
    orderBy: { id: 'desc' },
    take: 100,
    include: { items: true },
  })
  return NextResponse.json(cotizaciones)
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const body = await req.json()
  const { clienteNombre, clienteDireccion, clienteTelefono, clienteNit, atencion, formaPago, descripcion, notas, items, subtotal, descuento, total, validezDias } = body

  if (!clienteNombre) return NextResponse.json({ error: 'Nombre de cliente requerido' }, { status: 400 })
  if (!items || items.length === 0) return NextResponse.json({ error: 'Agrega al menos un item' }, { status: 400 })

  // Get next number
  const count = await prisma.cotizacion.count()
  const numero = `COT-${String(count + 1).padStart(6, '0')}`

  const cotizacion = await prisma.cotizacion.create({
    data: {
      numero,
      clienteNombre,
      clienteDireccion,
      clienteTelefono,
      clienteNit,
      atencion,
      formaPago,
      descripcion,
      notas,
      subtotal: +subtotal || 0,
      descuento: +descuento || 0,
      total: +total || 0,
      validezDias: +validezDias || 15,
      usuarioId: parseInt(session.user.id),
      usuarioNombre: session.user.name,
      items: {
        create: items.map((item: any) => ({
          codigo: item.codigo || '',
          descripcion: item.descripcion,
          cantidad: +item.cantidad,
          precioUnitario: +item.precioUnitario,
          subtotal: +item.cantidad * +item.precioUnitario,
          descuento: +item.descuento || 0,
          totalItem: +item.totalItem,
        })),
      },
    },
    include: { items: true },
  })

  return NextResponse.json({ ok: true, cotizacion })
}

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'

export async function GET() {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  try {
    const cotizaciones = await prisma.cotizacion.findMany({
      orderBy: { id: 'desc' },
      take: 100,
      include: { items: true },
    })
    return NextResponse.json(cotizaciones)
  } catch (e: any) {
    console.error('GET cotizaciones error:', e)
    // If table doesn't exist yet, return empty array
    if (e?.code === 'P2021' || e?.message?.includes('does not exist')) {
      return NextResponse.json([])
    }
    return NextResponse.json({ error: 'Error al obtener cotizaciones' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  try {
    const body = await req.json()
    const {
      clienteNombre, clienteDireccion, clienteTelefono, clienteNit,
      atencion, formaPago, descripcion, notas, items,
      subtotal, descuento, total, validezDias,
    } = body

    if (!clienteNombre?.trim()) {
      return NextResponse.json({ error: 'Nombre de cliente requerido' }, { status: 400 })
    }
    if (!items || items.length === 0) {
      return NextResponse.json({ error: 'Agrega al menos un item' }, { status: 400 })
    }

    // Safe numero generation — use config table like ventas
    const cfg = await prisma.config.findUnique({ where: { clave: 'numero_siguiente_cotizacion' } })
    const num = parseInt(cfg?.valor || '1')
    const numero = `COT-${String(num).padStart(6, '0')}`

    const cotizacion = await prisma.$transaction(async (tx) => {
      const c = await tx.cotizacion.create({
        data: {
          numero,
          clienteNombre: clienteNombre.trim(),
          clienteDireccion: clienteDireccion || null,
          clienteTelefono: clienteTelefono || null,
          clienteNit: clienteNit || 'CF',
          atencion: atencion || null,
          formaPago: formaPago || null,
          descripcion: descripcion || null,
          notas: notas || null,
          subtotal: +subtotal || 0,
          descuento: +descuento || 0,
          total: +total || 0,
          validezDias: +validezDias || 15,
          usuarioId: parseInt(session.user.id),
          usuarioNombre: session.user.name,
          items: {
            create: items.map((item: any) => ({
              codigo: item.codigo || '',
              descripcion: item.descripcion || '',
              cantidad: +item.cantidad || 1,
              precioUnitario: +item.precioUnitario || 0,
              subtotal: +item.subtotal || 0,
              descuento: +item.descuento || 0,
              totalItem: +item.totalItem || 0,
            })),
          },
        },
        include: { items: true },
      })

      // Update numero counter
      await tx.config.upsert({
        where: { clave: 'numero_siguiente_cotizacion' },
        update: { valor: String(num + 1) },
        create: { clave: 'numero_siguiente_cotizacion', valor: String(num + 1) },
      })

      return c
    })

    return NextResponse.json({ ok: true, cotizacion })
  } catch (e: any) {
    console.error('POST cotizacion error:', e)
    // Table doesn't exist — needs prisma db push
    if (e?.code === 'P2021' || e?.message?.includes('does not exist')) {
      return NextResponse.json({
        error: 'La tabla de cotizaciones no existe. Ejecuta: npx prisma db push',
      }, { status: 500 })
    }
    return NextResponse.json({
      error: e?.message || 'Error interno del servidor',
    }, { status: 500 })
  }
}

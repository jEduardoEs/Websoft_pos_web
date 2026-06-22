import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { emitirFEL } from '@/lib/fel'
import { enviarFacturaPorCorreo } from '@/lib/email-factura'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const fechaIni = searchParams.get('fecha_ini')
  const fechaFin = searchParams.get('fecha_fin')
  const estado = searchParams.get('estado') || ''
  const buscar = searchParams.get('buscar') || ''

  const where: any = {}
  if (estado) {
    where.estado = estado  // filtro explícito (ej: 'anulada' para ver anuladas)
  } else {
    where.estado = { not: 'anulada' }  // por defecto excluir anuladas en listados
  }
  if (buscar) where.OR = [
    { clienteNombre: { contains: buscar, mode: 'insensitive' } },
    { clienteNit: { contains: buscar, mode: 'insensitive' } },
    { numero: { contains: buscar, mode: 'insensitive' } },
  ]
  if (fechaIni || fechaFin) {
    where.fecha = {}
    if (fechaIni) where.fecha.gte = new Date(fechaIni)
    if (fechaFin) {
      const end = new Date(fechaFin)
      end.setHours(23, 59, 59, 999)
      where.fecha.lte = end
    }
  }

  const ventas = await prisma.venta.findMany({
    where, orderBy: { fecha: 'desc' }, take: 200,
    include: { items: true },
  })
  return NextResponse.json(ventas)
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const body = await req.json()
  const {
    clienteNombre, clienteNit, clienteCorreo,
    items, subtotal, descuento, impuesto, total,
    metodoPago, montoRecibido, cambio, notas, cotizacionId,
  } = body

  if (!items || items.length === 0) return NextResponse.json({ error: 'Sin items' }, { status: 400 })

  // Get next number
  const cfg = await prisma.config.findUnique({ where: { clave: 'numero_siguiente' } })
  const num = parseInt(cfg?.valor || '1')
  const numero = `FAC-${String(num).padStart(6, '0')}`

  // Verify stock — solo para items de inventario (productoId no nulo)
  for (const item of items) {
    if (!item.productoId) continue
    const prod = await prisma.producto.findUnique({ where: { id: item.productoId } })
    if (!prod || prod.stock < item.cantidad) {
      return NextResponse.json({ error: `Stock insuficiente: ${item.nombre}` }, { status: 400 })
    }
  }

  // Create venta with items
  const venta = await prisma.$transaction(async (tx) => {
    const v = await tx.venta.create({
      data: {
        numero, fecha: new Date(),
        clienteNombre: clienteNombre || 'Consumidor Final',
        clienteNit: clienteNit || 'CF',
        subtotal: +subtotal, descuento: +descuento, impuesto: +impuesto,
        total: +total, metodoPago, montoRecibido: +montoRecibido, cambio: +cambio,
        notas, usuarioId: parseInt(session.user.id), usuarioNombre: session.user.name,
        items: {
          create: items.map((item: any) => ({
            productoId: item.productoId, codigo: item.codigo || '',
            nombre: item.nombre, cantidad: +item.cantidad,
            precioUnitario: +item.precioUnitario, descuento: +item.descuento || 0,
            subtotal: +item.subtotal,
          })),
        },
      },
      include: { items: true },
    })

    // Update stock & kardex — solo items de inventario
    for (const item of items) {
      if (!item.productoId) continue
      const prod = await tx.producto.findUnique({ where: { id: item.productoId } })
      if (prod) {
        const newStock = prod.stock - item.cantidad
        await tx.producto.update({ where: { id: item.productoId }, data: { stock: newStock } })
        await tx.kardex.create({
          data: {
            productoId: item.productoId, tipo: 'salida', cantidad: item.cantidad,
            stockAntes: prod.stock, stockDespues: newStock,
            motivo: `Venta ${numero}`, referencia: numero,
            usuarioId: parseInt(session.user.id), usuarioNombre: session.user.name,
          },
        })
      }
    }

    // Marcar cotización como facturada si viene de una
    if (cotizacionId) {
      try {
        await tx.cotizacion.update({ where: { id: parseInt(cotizacionId) }, data: { estado: 'facturada' } })
      } catch { /* cotizacion puede no existir, no es crítico */ }
    }

    // Update numero siguiente
    await tx.config.update({ where: { clave: 'numero_siguiente' }, data: { valor: String(num + 1) } })

    // Audit
    await tx.auditLog.create({
      data: {
        usuarioId: parseInt(session.user.id), usuarioNombre: session.user.name,
        accion: 'CREATE', tabla: 'ventas', registroId: String(v.id),
        detalle: `Venta ${numero} por ${total}`,
      },
    })

    return v
  })

  let felResult = null
  const felActivo = await prisma.config.findUnique({ where: { clave: 'fel_activo' } })

  if (felActivo?.valor === 'true') {
    try {
      felResult = await emitirFEL({
        numeroInterno: numero,
        nitReceptor:   clienteNit || 'CF',
        nombreReceptor: clienteNombre || 'Consumidor Final',
        correoReceptor: clienteCorreo || '',
        items: items.map((it: any) => ({
          cantidad:       +it.cantidad,
          descripcion:    it.nombre,
          precioUnitario: +it.precioUnitario,
          descuento:      +it.descuento || 0,
          subtotal:       +it.subtotal,
          codigoProducto: it.codigo,
        })),
        subtotal: +subtotal,
        descuento: +descuento,
        impuesto: +impuesto,
        total: +total,
        metodoPago,
      })

      // Guardar datos FEL en la venta si la respuesta fue exitosa
      if (felResult.ok) {
        await prisma.venta.update({
          where: { id: venta.id },
          data: {
            felUuid:             felResult.uuid,
            felSerie:            felResult.serie,
            felNumero:           felResult.numero,
            felCertificacion:    felResult.fechaCertificacion,
            felXml:              felResult.xmlCertificado,
            felEstado:           felResult.sandbox ? 'sandbox' : 'certificado',
          } as any, // Los campos FEL requieren migración de schema (ver abajo)
        }).catch(() => {
          // Si los campos FEL no existen aún en el schema, ignorar error silencioso
          console.warn('[FEL] Campos FEL no encontrados en schema. Ejecutar: npx prisma@5.22.0 db push')
        })
      }
    } catch (err) {
      console.error('[FEL] Error al emitir DTE:', err)
      felResult = { ok: false, error: 'Error interno FEL' }
    }
  }

  let emailResult = null
  const emailActivo = await prisma.config.findUnique({ where: { clave: 'email_factura_activo' } })

  if (emailActivo?.valor === 'true' && clienteCorreo && clienteCorreo.includes('@')) {
    // Obtener config de empresa
    const cfgEmpresa = await prisma.config.findMany({
      where: { clave: { in: ['empresa_nombre', 'empresa_nit', 'empresa_telefono', 'empresa_direccion'] } }
    })
    const cfgMap = Object.fromEntries(cfgEmpresa.map(c => [c.clave, c.valor]))

    try {
      emailResult = await enviarFacturaPorCorreo({
        uuid:               felResult?.uuid,
        serie:              felResult?.serie,
        numero:             felResult?.numero,
        fechaCertificacion: felResult?.fechaCertificacion,
        sandbox:            felResult?.sandbox,
        numeroInterno:      numero,
        fecha:              venta.fecha,
        clienteNombre:      clienteNombre || 'Consumidor Final',
        clienteNit:         clienteNit || 'CF',
        clienteCorreo,
        items: items.map((it: any) => ({
          codigo:         it.codigo,
          nombre:         it.nombre,
          cantidad:       +it.cantidad,
          precioUnitario: +it.precioUnitario,
          descuento:      +it.descuento || 0,
          subtotal:       +it.subtotal,
        })),
        subtotal: +subtotal,
        descuento: +descuento,
        impuesto:  +impuesto,
        total:     +total,
        metodoPago,
      })
    } catch (err) {
      console.error('[EMAIL] Error al enviar factura:', err)
      emailResult = { ok: false, error: 'Error al enviar correo' }
    }
  }

  return NextResponse.json({
    ok: true,
    venta,
    fel: felResult,
    email: emailResult,
  })
}

export async function DELETE(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const id = searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'ID requerido' }, { status: 400 })

  const venta = await prisma.venta.findUnique({ where: { id: parseInt(id) } })
  if (!venta) return NextResponse.json({ error: 'Venta no encontrada' }, { status: 404 })

  await prisma.venta.update({
    where: { id: parseInt(id) },
    data: { estado: 'anulada' },
  })

  return NextResponse.json({ ok: true })
}

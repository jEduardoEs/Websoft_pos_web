import { auth } from '@/lib/auth'
import { emitirFEL } from '@/lib/fel'
import { enviarFacturaPorCorreo } from '@/lib/email-factura'
import { ventasRepository } from './ventas.repository'

const getQueryDateRange = (fechaIni?: string | null, fechaFin?: string | null) => {
  const where: any = {}
  if (fechaIni || fechaFin) {
    where.fecha = {}
    if (fechaIni) where.fecha.gte = new Date(fechaIni)
    if (fechaFin) {
      const end = new Date(fechaFin)
      end.setHours(23, 59, 59, 999)
      where.fecha.lte = end
    }
  }
  return where
}

const buildSearchFilter = (buscar: string) => {
  if (!buscar) return undefined
  return {
    OR: [
      { clienteNombre: { contains: buscar, mode: 'insensitive' } },
      { clienteNit: { contains: buscar, mode: 'insensitive' } },
      { numero: { contains: buscar, mode: 'insensitive' } },
    ],
  }
}

export const ventasService = {
  async requireSession() {
    const session = await auth()
    if (!session) throw new Error('No autorizado')
    return session
  },

  async validateStock(items: any[]) {
    for (const item of items) {
      if (!item.productoId) continue
      const prod = await ventasRepository.findProductoById(item.productoId)
      if (!prod || prod.stock < item.cantidad) {
        throw new Error(`Stock insuficiente: ${item.nombre}`)
      }
    }
  },

  async listVentas(params: { fechaIni?: string | null; fechaFin?: string | null; estado?: string; buscar?: string }) {
    const { fechaIni, fechaFin, estado, buscar } = params
    const where: any = { ...getQueryDateRange(fechaIni, fechaFin) }

    if (estado) {
      where.estado = estado
    } else {
      where.estado = { not: 'anulada' }
    }

    const searchFilter = buildSearchFilter(buscar || '')
    if (searchFilter) where.OR = searchFilter.OR

    return ventasRepository.findVentas(where)
  },

  async createVenta(body: any, session: any) {
    const {
      clienteNombre, clienteNit, clienteCorreo,
      items, subtotal, descuento, impuesto, total,
      metodoPago, montoRecibido, cambio, notas, cotizacionId,
    } = body

    if (!items || items.length === 0) throw new Error('Sin items')

    await this.validateStock(items)

    const cfg = await ventasRepository.findConfigByClave('numero_siguiente')
    const num = parseInt(cfg?.valor || '1')
    const numero = `FAC-${String(num).padStart(6, '0')}`

    const venta = await ventasRepository.transaction(async (tx) => {
      const v = await ventasRepository.createVenta({
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
      }, tx)

      await this.updateStockAndRecords(items, numero, session, tx)

      if (cotizacionId) {
        try {
          await ventasRepository.updateCotizacionEstado(parseInt(cotizacionId), 'facturada', tx)
        } catch {
          // cotizacion puede no existir, no es crítico
        }
      }

      if (clienteNit && clienteNit !== 'CF') {
        try {
          await ventasRepository.updateClientesProspecto(clienteNit, clienteNombre || '', tx)
        } catch {
          // no crítico
        }
      }

      await ventasRepository.updateConfigValor('numero_siguiente', String(num + 1), tx)
      await ventasRepository.createAuditLog({
        usuarioId: parseInt(session.user.id), usuarioNombre: session.user.name,
        accion: 'CREATE', tabla: 'ventas', registroId: String(v.id),
        detalle: `Venta ${numero} por ${total}`,
      }, tx)

      return v
    })

    const felResult = await this.emitFEL({
      numero, clienteNit, clienteNombre, clienteCorreo, items,
      subtotal, descuento, impuesto, total, metodoPago,
    }, venta)

    const emailResult = await this.sendFacturaEmail({
      clienteCorreo, clienteNombre, clienteNit, items,
      subtotal, descuento, impuesto, total, metodoPago,
      venta, felResult,
    })

    return { venta, felResult, emailResult }
  },

  async updateStockAndRecords(items: any[], numero: string, session: any, db: any) {
    for (const item of items) {
      if (!item.productoId) continue
      const prod = await ventasRepository.findProductoById(item.productoId, db)
      if (!prod) continue
      const newStock = prod.stock - item.cantidad
      await ventasRepository.updateProductoStock(item.productoId, newStock, db)
      await ventasRepository.createKardex({
        productoId: item.productoId, tipo: 'salida', cantidad: item.cantidad,
        stockAntes: prod.stock, stockDespues: newStock,
        motivo: `Venta ${numero}`, referencia: numero,
        usuarioId: parseInt(session.user.id), usuarioNombre: session.user.name,
      }, db)
    }
  },

  async emitFEL(payload: any, venta: any) {
    const felActivo = await ventasRepository.findConfigByClave('fel_activo')
    if (felActivo?.valor !== 'true') return null

    try {
      const felResult = await emitirFEL({
        numeroInterno: payload.numero,
        nitReceptor: payload.clienteNit || 'CF',
        nombreReceptor: payload.clienteNombre || 'Consumidor Final',
        correoReceptor: payload.clienteCorreo || '',
        items: payload.items.map((it: any) => ({
          cantidad: +it.cantidad,
          descripcion: it.nombre,
          precioUnitario: +it.precioUnitario,
          descuento: +it.descuento || 0,
          subtotal: +it.subtotal,
          codigoProducto: it.codigo,
        })),
        subtotal: +payload.subtotal,
        descuento: +payload.descuento,
        impuesto: +payload.impuesto,
        total: +payload.total,
        metodoPago: payload.metodoPago,
      })

      if (felResult.ok) {
        await ventasRepository.updateVentaFelFields(venta.id, {
          felUuid: felResult.uuid,
          felSerie: felResult.serie,
          felNumero: felResult.numero,
          felCertificacion: felResult.fechaCertificacion,
          felPdfUrl: felResult.pdfUrl,
          felEstado: felResult.sandbox ? 'sandbox' : 'certificado',
        })
      }

      return felResult
    } catch (err) {
      console.error('[FEL] Error al emitir DTE:', err)
      return { ok: false, error: 'Error interno FEL' }
    }
  },

  async sendFacturaEmail(payload: any) {
    if (!payload.clienteCorreo || !payload.clienteCorreo.includes('@')) return null

    const emailActivo = await ventasRepository.findConfigByClave('email_factura_activo')
    if (emailActivo?.valor !== 'true') return null

    const cfgEmpresa = await ventasRepository.findConfigByClave('empresa_nombre')
    const cfgNit = await ventasRepository.findConfigByClave('empresa_nit')
    const cfgTelefono = await ventasRepository.findConfigByClave('empresa_telefono')
    const cfgDireccion = await ventasRepository.findConfigByClave('empresa_direccion')

    const cfgMap = {
      empresa_nombre: cfgEmpresa?.valor,
      empresa_nit: cfgNit?.valor,
      empresa_telefono: cfgTelefono?.valor,
      empresa_direccion: cfgDireccion?.valor,
    }

    try {
      return await enviarFacturaPorCorreo({
        uuid: payload.felResult?.uuid,
        serie: payload.felResult?.serie,
        numero: payload.felResult?.numero,
        fechaCertificacion: payload.felResult?.fechaCertificacion,
        pdfUrl: payload.felResult?.pdfUrl,
        sandbox: payload.felResult?.sandbox,
        numeroInterno: payload.numero,
        fecha: payload.venta.fecha,
        clienteNombre: payload.clienteNombre || 'Consumidor Final',
        clienteNit: payload.clienteNit || 'CF',
        clienteCorreo: payload.clienteCorreo,
        items: payload.items.map((it: any) => ({
          codigo: it.codigo,
          nombre: it.nombre,
          cantidad: +it.cantidad,
          precioUnitario: +it.precioUnitario,
          descuento: +it.descuento || 0,
          subtotal: +it.subtotal,
        })),
        subtotal: +payload.subtotal,
        descuento: +payload.descuento,
        impuesto: +payload.impuesto,
        total: +payload.total,
        metodoPago: payload.metodoPago,
      })
    } catch (err) {
      console.error('[EMAIL] Error al enviar factura:', err)
      return { ok: false, error: 'Error al enviar correo' }
    }
  },

  async deleteVenta(id: number) {
    const venta = await ventasRepository.findVentaById(id)
    if (!venta) throw new Error('Venta no encontrada')
    return ventasRepository.annularVenta(id)
  },
}

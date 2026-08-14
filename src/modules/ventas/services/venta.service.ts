import { prisma } from '@/lib/prisma';
import { emitirFEL, FELResponse } from '@/lib/fel';
import { enviarFacturaPorCorreo, EmailResult } from '@/lib/email-factura';
import { CreateVentaDto } from '../dto/create-venta.dto';
import { Venta } from '../types/venta';

// Helper functions for calculations (IVA 5% and profit 30%)
const IVA_RATE = 0.05;
const PROFIT_RATE = 0.30;
function calculateIVA(subtotal: number): number {
  return Number((subtotal * IVA_RATE).toFixed(2));
}
function calculateProfit(subtotal: number): number {
  return Number((subtotal * PROFIT_RATE).toFixed(2));
}

export class VentaService {
  static async findAll(params: {
    fechaIni?: string | null;
    fechaFin?: string | null;
    estado?: string | null;
    buscar?: string | null;
  }) {
    const { fechaIni, fechaFin, estado, buscar } = params;

    const where: any = {};
    if (estado && estado.trim() !== '') {
      where.estado = estado;
    }

    if (buscar && buscar.trim() !== '') {
      const q = buscar.trim();
      where.OR = [
        { clienteNombre: { contains: q, mode: 'insensitive' } },
        { clienteNit: { contains: q, mode: 'insensitive' } },
        { numero: { contains: q, mode: 'insensitive' } },
      ];
    }

    if (fechaIni || fechaFin) {
      where.fecha = {};
      if (fechaIni && fechaIni.trim() !== '') {
        const start = new Date(`${fechaIni}T00:00:00`);
        where.fecha.gte = isNaN(start.getTime()) ? new Date(fechaIni) : start;
      }
      if (fechaFin && fechaFin.trim() !== '') {
        const end = new Date(`${fechaFin}T23:59:59.999`);
        where.fecha.lte = isNaN(end.getTime()) ? new Date(fechaFin) : end;
      }
    }

    const ventas = await prisma.venta.findMany({
      where,
      orderBy: { fecha: 'desc' },
      take: 200,
      include: { items: true },
    });

    return ventas as unknown as Venta[];
  }

  static async create(dto: CreateVentaDto, userId: string, userName: string) {
    if (!dto.items || dto.items.length === 0) {
      throw new Error('Sin items');
    }

    if (dto.cotizacionId) {
      const ventaPrevia = await prisma.venta.findFirst({
        where: { cotizacionId: dto.cotizacionId }
      });
      if (ventaPrevia) {
        throw new Error(`La cotización ya fue facturada previamente en el sistema con el comprobante ${ventaPrevia.numero}`);
      }
    }

    let numeroVenta = '';

    const venta = await prisma.$transaction(async (tx) => {
      const cfg = await tx.config.findUnique({ where: { clave: 'numero_siguiente' } });
      const num = parseInt(cfg?.valor || '1');
      numeroVenta = `FAC-${String(num).padStart(6, '0')}`;

      // Fetch products inside transaction to guarantee real-time stock and prices
      const productIds = dto.items.map(it => it.productoId).filter(Boolean) as number[];
      const productCodigos = dto.items.map(it => it.codigo).filter(Boolean) as string[];

      const dbProducts = await tx.producto.findMany({
        where: {
          OR: [
            ...(productIds.length > 0 ? [{ id: { in: productIds } }] : []),
            ...(productCodigos.length > 0 ? [{ codigo: { in: productCodigos, mode: 'insensitive' as const } }] : []),
          ],
          activo: true,
        },
      });

      const prodMapById = new Map<number, typeof dbProducts[0]>();
      const prodMapByCodigo = new Map<string, typeof dbProducts[0]>();
      dbProducts.forEach(p => {
        prodMapById.set(p.id, p);
        if (p.codigo) prodMapByCodigo.set(p.codigo.trim().toUpperCase(), p);
      });

      // Verify stock and build items using authoritative catalog data
      const processedItems = dto.items.map(item => {
        let dbProd = item.productoId ? prodMapById.get(item.productoId) : undefined;
        if (!dbProd && item.codigo) {
          dbProd = prodMapByCodigo.get(item.codigo.trim().toUpperCase());
        }

        if (dbProd) {
          if (dbProd.stock < item.cantidad) {
            throw new Error(`Stock insuficiente para '${dbProd.nombre}'. Disponible: ${dbProd.stock} unidades, Solicitado: ${item.cantidad} unidades`);
          }
        }

        const cost = dbProd ? dbProd.costo : (item.costo ?? 0);
        // Use catalog price if available, fallback to DTO price for custom unlisted items
        const catalogPrice = dbProd && dbProd.precio > 0 ? dbProd.precio : item.precioUnitario;
        const itemDiscount = item.descuento || 0;
        const netUnitPrice = Math.max(0, catalogPrice - itemDiscount);
        const itemSubtotal = Number((netUnitPrice * item.cantidad).toFixed(2));
        const iva = calculateIVA(itemSubtotal);
        const ganancia = Number((itemSubtotal - (cost * item.cantidad)).toFixed(2));

        return {
          productoId: dbProd ? dbProd.id : (item.productoId || null),
          codigo: item.codigo || dbProd?.codigo || '',
          nombre: item.nombre || dbProd?.nombre || 'Producto',
          cantidad: item.cantidad,
          precioUnitario: catalogPrice,
          descuento: itemDiscount,
          subtotal: itemSubtotal,
          costo: cost,
          margin: item.margin ?? PROFIT_RATE,
          iva: iva,
          ganancia: ganancia,
          dbProd: dbProd,
        };
      });

      const saleSubtotal = processedItems.reduce((sum, i) => sum + i.subtotal, 0);
      const saleIVA = processedItems.reduce((sum, i) => sum + (i.iva ?? 0), 0);
      const saleTotal = Number((saleSubtotal + saleIVA - (dto.descuento || 0)).toFixed(2));

      const v = await tx.venta.create({
        data: {
          numero: numeroVenta,
          fecha: new Date(),
          clienteNombre: dto.clienteNombre || 'Consumidor Final',
          clienteNit: dto.clienteNit || 'CF',
          subtotal: saleSubtotal,
          descuento: dto.descuento || 0,
          impuesto: saleIVA,
          total: saleTotal,
          metodoPago: dto.metodoPago,
          montoRecibido: dto.montoRecibido,
          cambio: dto.cambio,
          cotizacionId: dto.cotizacionId ? Number(dto.cotizacionId) : null,
          notas: dto.cotizacionId ? `${dto.notas || ''} [Cotización COT-${dto.cotizacionId}]`.trim() : dto.notas,
          usuarioId: parseInt(userId),
          usuarioNombre: userName,
          items: {
            create: processedItems.map(i => ({
              productoId: i.productoId,
              codigo: i.codigo,
              nombre: i.nombre,
              cantidad: i.cantidad,
              precioUnitario: i.precioUnitario,
              descuento: i.descuento,
              subtotal: i.subtotal,
            })),
          },
        },
        include: { items: true },
      });

      // Update stock atomically & log kardex
      for (const item of processedItems) {
        if (!item.productoId || !item.dbProd) continue;
        const stockAntes = item.dbProd.stock;
        const newStock = stockAntes - item.cantidad;

        await tx.producto.update({
          where: { id: item.productoId },
          data: { stock: { decrement: item.cantidad } },
        });

        await tx.kardex.create({
          data: {
            productoId: item.productoId,
            tipo: 'salida',
            cantidad: item.cantidad,
            stockAntes,
            stockDespues: newStock,
            motivo: `Venta ${numeroVenta}`,
            referencia: numeroVenta,
            usuarioId: parseInt(userId),
            usuarioNombre: userName,
          },
        });
      }

      // Increment usage counter on discount coupon if used
      if (dto.descuento && dto.descuento > 0 && dto.notas) {
        const couponMatch = dto.notas.match(/CÓDIGO:\s*([A-Z0-9_-]+)/i);
        if (couponMatch && couponMatch[1]) {
          await tx.descuento.updateMany({
            where: { codigo: { equals: couponMatch[1].trim(), mode: 'insensitive' } },
            data: { usosActuales: { increment: 1 } },
          });
        }
      }

      // Automatically register CuentaCobrar for credit sales
      if (dto.metodoPago === 'credito') {
        const maxCc = await tx.cuentaCobrar.findFirst({ orderBy: { id: 'desc' }, select: { id: true } });
        const nextCcId = (maxCc?.id || 0) + 1;
        const numCc = `CC-${String(nextCcId).padStart(6, '0')}`;
        const fechaVenc = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

        await tx.cuentaCobrar.create({
          data: {
            numero: numCc,
            fecha: new Date(),
            fechaVencimiento: fechaVenc,
            clienteNombre: dto.clienteNombre || 'Consumidor Final',
            clienteNit: dto.clienteNit || 'CF',
            ventaNumero: numeroVenta,
            concepto: `Venta a crédito ${numeroVenta}`,
            monto: saleTotal,
            montoPagado: 0,
            estado: 'pendiente',
            usuarioNombre: userName,
          },
        });
      }

      // Marcar cotización como facturada
      if (dto.cotizacionId) {
        try {
          await tx.cotizacion.update({ where: { id: dto.cotizacionId }, data: { estado: 'facturada' } });
        } catch (err) {
          console.error('[VentaService] Error actualizando estado de cotizacion:', err);
        }
      }

      // Auto-upgrade cliente: prospecto -> cliente
      if (dto.clienteNit && dto.clienteNit !== 'CF') {
        try {
          await (tx as any).cliente.updateMany({
            where: {
              OR: [
                { nit: dto.clienteNit },
                { nombre: { contains: dto.clienteNombre || '', mode: 'insensitive' } },
              ],
              tipo: 'prospecto',
            },
            data: { tipo: 'cliente' },
          });
        } catch { /* si no existe el campo o tabla, no es critico */ }
      }

      // Update numero siguiente
      await tx.config.update({ where: { clave: 'numero_siguiente' }, data: { valor: String(num + 1) } });

      // Audit
      await tx.auditLog.create({
        data: {
          usuarioId: parseInt(userId),
          usuarioNombre: userName,
          accion: 'CREATE',
          tabla: 'ventas',
          registroId: String(v.id),
          detalle: `Venta ${numeroVenta} por ${dto.total}`,
        },
      });

      // Auto-create project if sale contains an installation item
      const hasInstalacion = processedItems.some(i => 
        (i.nombre && i.nombre.toLowerCase().includes('instalac')) || 
        (i.dbProd?.categoria && i.dbProd.categoria.toLowerCase().includes('servicio'))
      );

      if (hasInstalacion || dto.cotizacionId) {
        try {
          const { ProyectoService } = await import('@/modules/proyectos/services/proyecto.service');
          await ProyectoService.createFromSale(v.id);
        } catch (err) {
          console.error('[VentaService] Error auto-creating project from sale with installation:', err);
        }
      }

      // Añadir campos calculados al objeto de respuesta (sin persistir)
      const itemsConCalculos = v.items.map((it, idx) => {
        const original = dto.items[idx];
        const iva = calculateIVA(it.subtotal);
        const ganancia = calculateProfit(it.subtotal);
        return { ...it, iva, ganancia };
      });
      // Devolver venta con items enriquecidos
      return { ...v, items: itemsConCalculos };

    }, {
      maxWait: 10000,
      timeout: 30000,
    });

    // POST-Transaction side effects (FEL & Email)
    let felResult: FELResponse | null = null;
    let emailResult: EmailResult | null = null;

    try {
      const configs = await prisma.config.findMany({
        where: { clave: { in: ['fel_activo', 'email_factura_activo'] } }
      });
      const configMap = Object.fromEntries(configs.map(c => [c.clave, c.valor]));

      if (configMap['fel_activo'] === 'true') {
        felResult = await emitirFEL({
          numeroInterno: numeroVenta,
          nitReceptor: dto.clienteNit || 'CF',
          nombreReceptor: dto.clienteNombre || 'Consumidor Final',
          correoReceptor: dto.clienteCorreo || '',
          items: dto.items.map(it => ({
            cantidad: it.cantidad,
            descripcion: it.nombre,
            precioUnitario: it.precioUnitario,
            descuento: it.descuento || 0,
            subtotal: it.subtotal,
            codigoProducto: it.codigo || undefined,
          })),
          subtotal: dto.subtotal,
          descuento: dto.descuento,
          impuesto: dto.impuesto,
          total: dto.total,
          metodoPago: dto.metodoPago,
        });

        if (felResult.ok) {
          await prisma.venta.update({
            where: { id: venta.id },
            data: {
              felUuid: felResult.uuid,
              felSerie: felResult.serie,
              felNumero: felResult.numero,
              felCertificacion: felResult.fechaCertificacion,
              felPdfUrl: felResult.pdfUrl,
              felEstado: felResult.sandbox ? 'sandbox' : 'certificado',
            },
          });
        }
      }

      if (configMap['email_factura_activo'] === 'true' && dto.clienteCorreo && dto.clienteCorreo.includes('@')) {
        emailResult = await enviarFacturaPorCorreo({
          uuid: felResult?.uuid,
          serie: felResult?.serie,
          numero: felResult?.numero,
          fechaCertificacion: felResult?.fechaCertificacion,
          pdfUrl: felResult?.pdfUrl,
          sandbox: felResult?.sandbox,
          numeroInterno: numeroVenta,
          fecha: venta.fecha,
          clienteNombre: dto.clienteNombre || 'Consumidor Final',
          clienteNit: dto.clienteNit || 'CF',
          clienteCorreo: dto.clienteCorreo,
          items: dto.items.map(it => ({
            codigo: it.codigo || undefined,
            nombre: it.nombre,
            cantidad: it.cantidad,
            precioUnitario: it.precioUnitario,
            descuento: it.descuento || 0,
            subtotal: it.subtotal,
          })),
          subtotal: dto.subtotal,
          descuento: dto.descuento,
          impuesto: dto.impuesto,
          total: dto.total,
          metodoPago: dto.metodoPago,
        });
      }
    } catch (err) {
      console.error('[VentaService] Side-effects error:', err);
    }

    try {
      const { VentaAggregate } = await import('@/core/domain/VentaAggregate');
      const ventaAgg = VentaAggregate.createFromPos({
        id: venta.id,
        numero: venta.numero,
        clienteNombre: venta.clienteNombre,
        clienteNit: venta.clienteNit,
        total: venta.total,
        metodoPago: venta.metodoPago,
        items: dto.items.map(it => ({
          productoId: it.productoId || null,
          codigo: it.codigo || 'PRD',
          nombre: it.nombre,
          cantidad: it.cantidad,
          precioUnitario: it.precioUnitario,
          descuento: it.descuento || 0,
          subtotal: it.subtotal,
        })),
        cotizacionId: dto.cotizacionId ? Number(dto.cotizacionId) : undefined,
      });
      await ventaAgg.dispatchEvents();

      const { eventBus } = await import('@/core/events/EventBus');
      const { VentaCreada, PagoRegistrado, ComisionReservada, FacturaEmitida } = await import('@/core/events/types');

      await eventBus.publish(new VentaCreada({
        ventaId: venta.id,
        numero: venta.numero,
        clienteNombre: venta.clienteNombre,
        total: venta.total,
        cotizacionId: dto.cotizacionId,
        usuarioNombre: userName,
      }));

      await eventBus.publish(new PagoRegistrado({
        ventaId: venta.id,
        monto: venta.total,
        metodoPago: dto.metodoPago || 'efectivo',
        clienteNombre: venta.clienteNombre,
        usuarioNombre: userName,
      }));

      await eventBus.publish(new ComisionReservada({
        ventaId: venta.id,
        vendedorNombre: userName,
        monto: Number((venta.total * 0.05).toFixed(2)),
      }));

      if (felResult && (felResult as any).exito) {
        await eventBus.publish(new FacturaEmitida({
          ventaId: venta.id,
          numeroFactura: (felResult as any).numero || venta.numero,
          uuid: (felResult as any).uuid,
          clienteNombre: venta.clienteNombre,
          total: venta.total,
          usuarioNombre: userName,
        }));
      }
    } catch (err) {
      console.error('[VentaService] Error publishing domain events:', err);
    }

    return {
      venta,
      fel: felResult,
      email: emailResult,
    };
  }

  static async anular(id: number, motivo: string = 'Solicitud de cliente', userId: number = 1, userName: string = 'Sistema') {
    const { CancellationEngine } = await import('@/core/cancellations');
    const result = await CancellationEngine.cancelVenta({
      targetId: id,
      type: 'venta',
      motivo,
      usuarioId: userId,
      usuarioNombre: userName,
      retenerAnticipo50: true,
    });

    return result;
  }

  static async delete(id: number) {
    const venta = await prisma.venta.findUnique({ where: { id } });
    if (!venta) throw new Error('Venta no encontrada');

    const { RuleEngine } = await import('@/core/rules');
    RuleEngine.assertCanDeleteSale({ estado: venta.estado, felUuid: (venta as any).felUuid });

    await prisma.venta.delete({ where: { id } });
    return true;
  }
  static async createFromQuotation(quotationId: number) {
    const cotizacion = await prisma.cotizacion.findUnique({
      where: { id: quotationId },
      include: { items: true },
    });
    if (!cotizacion) throw new Error('Cotización no encontrada');
    
    // Call existing create method. In a real system, you might map the quotation to a CreateVentaDto first.
    // Assuming for now that the caller (listener) just needs to trigger the creation.
    // Note: since create expects userId and userName, we might need a system user here.
    const dto: CreateVentaDto = {
      cotizacionId: cotizacion.id,
      clienteNombre: cotizacion.clienteNombre,
      clienteNit: cotizacion.clienteNit,
      clienteCorreo: cotizacion.clienteCorreo,
      subtotal: cotizacion.subtotal,
      descuento: cotizacion.descuento,
      impuesto: cotizacion.impuesto,
      total: cotizacion.total,
      metodoPago: 'efectivo', // default
      montoRecibido: cotizacion.total,
      cambio: 0,
      notas: `Creado desde cotización ${cotizacion.numero}`,
      items: cotizacion.items.map(item => ({
        productoId: item.productoId,
        codigo: item.codigo,
        nombre: item.nombre,
        cantidad: item.cantidad,
        precioUnitario: item.precioUnitario,
        descuento: item.descuento,
        subtotal: item.subtotal,
      })),
    };
    
    // Using a system user for automated creation
    const ventaResult = await this.create(dto, '1', 'System');
    
    // Import dynamically or ensure eventBus is available to avoid circular dependencies
    const { eventBus } = require('@/core/events/EventBus');
    await eventBus.publish({
      type: 'SaleCreated',
      payload: {
        saleId: ventaResult.venta.id,
        quotationId: cotizacion.id,
      },
      timestamp: new Date(),
    });
    
    return ventaResult;
  }

  static async markInvoiced(saleId: number) {
    const venta = await prisma.venta.findUnique({ where: { id: saleId } });
    if (!venta) throw new Error('Venta no encontrada');
    
    await prisma.venta.update({
      where: { id: saleId },
      data: { estado: 'facturada' },
    });
    
    const { eventBus } = require('@/core/events/EventBus');
    await eventBus.publish({
      type: 'SaleCompleted',
      payload: { saleId },
      timestamp: new Date(),
    });
    
    return true;
  }
}

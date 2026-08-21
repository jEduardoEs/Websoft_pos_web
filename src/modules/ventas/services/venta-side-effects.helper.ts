import { prisma } from '@/lib/prisma';
import { emitirFEL, FELResponse } from '@/lib/fel';
import { enviarFacturaPorCorreo, EmailResult } from '@/lib/email-factura';
import { CreateVentaDto } from '../dto/create-venta.dto';

export async function processVentaSideEffects(
  venta: any,
  dto: CreateVentaDto,
  numeroVenta: string,
  userName: string
) {
  let felResult: FELResponse | null = null;
  let emailResult: EmailResult | null = null;

  // Auto-create project if sale contains an installation item or comes from a cotización
  const hasInstalacion = (dto.items || []).some(i => 
    (i.nombre && i.nombre.toLowerCase().includes('instalac')) || 
    (i.codigo && i.codigo.toLowerCase().includes('instalac'))
  );

  if (hasInstalacion || dto.cotizacionId) {
    try {
      const { ProyectoService } = await import('@/modules/proyectos/services/proyecto.service');
      await ProyectoService.createFromSale(venta.id);
    } catch (err) {
      console.error('[VentaService] Error auto-creating project from sale with installation:', err);
    }
  }

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

  return { felResult, emailResult };
}

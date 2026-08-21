import { prisma } from '@/lib/prisma';
import { enviarFacturaPorCorreo } from '@/lib/email-factura';
import { emitirFEL, FELResponse } from '@/lib/fel';
import { calculateGravable, calculateIVA } from '@/shared/money';

export async function facturarProyectoHelper(id: number, data: any, userId: number, userName: string) {
  const proyecto = await prisma.proyecto.findUnique({
    where: { id },
  });

  if (!proyecto) throw new Error('Proyecto no encontrado');

  const { RuleEngine } = await import('@/core/rules');
  RuleEngine.assertCanInvoiceProject({ estado: proyecto.estado, id: proyecto.id });

  const garantiaExistente = await prisma.garantia.findFirst({
    where: { proyectoId: id }
  });
  if (garantiaExistente || (proyecto.notas && proyecto.notas.includes('Facturado con Venta'))) {
    throw new Error('Este proyecto ya fue facturado en el sistema. No es posible emitir la factura nuevamente.');
  }

  let cotizacion: any = null;
  if (proyecto.cotizacionId) {
    cotizacion = await prisma.cotizacion.findUnique({
      where: { id: proyecto.cotizacionId },
      include: { items: true },
    });

    const ventaExistente = await prisma.venta.findFirst({
      where: {
        OR: [
          ...(cotizacion?.numero ? [{ notas: { contains: cotizacion.numero, mode: 'insensitive' as const } }] : []),
          { notas: { contains: `[Cotización COT-${proyecto.cotizacionId}]`, mode: 'insensitive' as const } }
        ]
      }
    });
    if (ventaExistente) {
      throw new Error(`La cotización vinculada al proyecto ya fue facturada con la venta ${ventaExistente.numero}.`);
    }
  }

  const clienteNombre = data.clienteNombre || proyecto.clienteNombre;
  const clienteNit = data.clienteNit || proyecto.clienteNit || 'CF';
  const clienteCorreo = data.clienteCorreo || '';
  const clienteTelefono = data.clienteTelefono || proyecto.clienteTelefono || '';
  const total = Number(data.total || data.montoTotal || 0);
  if (!total || total <= 0) throw new Error('El total a facturar debe ser mayor a 0');

  const diasGarantia = Number(data.diasGarantia || 365);

  const result = await prisma.$transaction(async (tx) => {
    const cfg = await tx.config.findUnique({ where: { clave: 'numero_siguiente' } });
    const num = parseInt(cfg?.valor || '1');
    const numeroVenta = `FAC-${String(num).padStart(6, '0')}`;

    await tx.config.upsert({
      where: { clave: 'numero_siguiente' },
      create: { clave: 'numero_siguiente', valor: String(num + 1) },
      update: { valor: String(num + 1) },
    });

    const impuesto = calculateIVA(total, 0.05);
    const subtotal = calculateGravable(total, 0.05);

    const itemsList = cotizacion?.items && cotizacion.items.length > 0
      ? cotizacion.items.map((it: any) => ({
          codigo: it.codigo || 'PRY-ITEM',
          nombre: it.descripcion,
          cantidad: it.cantidad,
          precioUnitario: it.precioUnitario,
          descuento: it.descuento || 0,
          subtotal: it.totalItem,
        }))
      : [
          {
            codigo: proyecto.numero,
            nombre: proyecto.nombre || proyecto.descripcion || 'Servicios y Trabajos del Proyecto',
            cantidad: 1,
            precioUnitario: subtotal,
            descuento: 0,
            subtotal: subtotal,
          },
        ];

    const venta = await tx.venta.create({
      data: {
        numero: numeroVenta,
        fecha: new Date(),
        clienteNombre,
        clienteNit,
        subtotal,
        descuento: 0,
        impuesto,
        total,
        metodoPago: data.metodoPago || 'efectivo',
        montoRecibido: total,
        cambio: 0,
        notas: `Facturado desde proyecto ${proyecto.numero}${proyecto.cotizacionNumero ? ` [Cotización ${proyecto.cotizacionNumero}]` : ''}`,
        usuarioId: isNaN(Number(userId)) || !userId ? 1 : Number(userId),
        usuarioNombre: userName,
        items: {
          create: itemsList.map(it => ({
            codigo: it.codigo,
            nombre: it.nombre,
            cantidad: it.cantidad,
            precioUnitario: it.precioUnitario,
            descuento: it.descuento,
            subtotal: it.subtotal,
          })),
        },
      },
      include: { items: true },
    });

    if (proyecto.cotizacionId) {
      try {
        await tx.cotizacion.update({
          where: { id: proyecto.cotizacionId },
          data: { estado: 'facturada' },
        });
      } catch (errCot) {
        console.error('[ProyectoFacturacionHelper] Error actualizando estado de cotización:', errCot);
      }
    }

    const updatedProyecto = await tx.proyecto.update({
      where: { id },
      data: {
        estado: 'completado',
        notas: proyecto.notas
          ? `${proyecto.notas} | Facturado con Venta ${numeroVenta}`
          : `Facturado con Venta ${numeroVenta}`,
      },
    });

    const countG = await tx.garantia.count();
    const numG = `GAR-${String(countG + 1).padStart(6, '0')}`;
    const now = new Date();
    const fVenc = new Date(now.getTime() + diasGarantia * 24 * 60 * 60 * 1000);

    const garantia = await tx.garantia.create({
      data: {
        numero: numG,
        clienteNombre,
        clienteTelefono,
        clienteNit,
        productoNombre: proyecto.nombre || proyecto.descripcion || 'Servicios / Equipos del Proyecto',
        productoSerie: data.productoSerie || data.serie || null,
        ventaNumero: numeroVenta,
        ventaId: venta.id,
        proyectoId: proyecto.id,
        diasGarantia,
        fechaVenta: now,
        fechaVencimiento: fVenc,
        estado: 'vigente',
        notas: `Garantía activada tras la emisión de factura ${numeroVenta} del proyecto ${proyecto.numero}`,
        usuarioNombre: userName,
      },
    });

    return { venta, garantia, updatedProyecto, itemsList };
  });

  let felResult: FELResponse | null = null;
  let emailSent = false;

  try {
    const configs = await prisma.config.findMany({
      where: { clave: { in: ['fel_activo', 'email_factura_activo'] } }
    });
    const configMap = Object.fromEntries(configs.map(c => [c.clave, c.valor]));

    if (configMap['fel_activo'] === 'true' || process.env.DTEVIA_API_KEY) {
      felResult = await emitirFEL({
        numeroInterno: result.venta.numero,
        nitReceptor: clienteNit,
        nombreReceptor: clienteNombre,
        correoReceptor: clienteCorreo,
        items: result.itemsList.map(it => ({
          cantidad: it.cantidad,
          descripcion: it.nombre,
          precioUnitario: it.precioUnitario,
          descuento: it.descuento || 0,
          subtotal: it.subtotal,
          codigoProducto: it.codigo,
        })),
        subtotal: result.venta.subtotal,
        descuento: 0,
        impuesto: result.venta.impuesto,
        total: result.venta.total,
        metodoPago: result.venta.metodoPago,
      });

      if (felResult && felResult.ok) {
        await prisma.venta.update({
          where: { id: result.venta.id },
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

    if (configMap['email_factura_activo'] === 'true' && clienteCorreo && clienteCorreo.includes('@')) {
      const mailRes = await enviarFacturaPorCorreo({
        uuid: felResult?.uuid,
        serie: felResult?.serie,
        numero: felResult?.numero,
        fechaCertificacion: felResult?.fechaCertificacion,
        pdfUrl: felResult?.pdfUrl,
        sandbox: felResult?.sandbox,
        numeroInterno: result.venta.numero,
        fecha: result.venta.fecha,
        clienteNombre,
        clienteNit,
        clienteCorreo,
        items: result.itemsList.map(it => ({
          codigo: it.codigo,
          nombre: it.nombre,
          cantidad: it.cantidad,
          precioUnitario: it.precioUnitario,
          descuento: it.descuento || 0,
          subtotal: it.subtotal,
        })),
        subtotal: result.venta.subtotal,
        descuento: 0,
        impuesto: result.venta.impuesto,
        total: result.venta.total,
        metodoPago: result.venta.metodoPago,
      });
      emailSent = Boolean(mailRes && mailRes.ok);
    }
  } catch (err) {
    console.error('[ProyectoService] Error processing FEL/email side-effects:', err);
  }

  try {
    const { eventBus } = await import('@/core/events/EventBus');
    const { FacturaEmitida, PagoRegistrado } = await import('@/core/events/types');

    await eventBus.publish(new FacturaEmitida({
      proyectoId: result.updatedProyecto.id,
      ventaId: result.venta.id,
      numeroFactura: felResult?.numero || result.venta.numero,
      uuid: felResult?.uuid,
      clienteNombre,
      total: result.venta.total,
      usuarioNombre: userName,
    }));

    await eventBus.publish(new PagoRegistrado({
      proyectoId: result.updatedProyecto.id,
      ventaId: result.venta.id,
      monto: result.venta.total,
      metodoPago: data.metodoPago || 'efectivo',
      clienteNombre,
      usuarioNombre: userName,
    }));
  } catch (err) {
    console.error('[ProyectoService] Error publishing facturarProyecto events:', err);
  }

  return {
    ok: true,
    venta: result.venta,
    garantia: result.garantia,
    proyecto: result.updatedProyecto,
    fel: felResult,
    emailSent,
  };
}

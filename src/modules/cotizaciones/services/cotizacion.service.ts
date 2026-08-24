import { prisma } from '@/lib/prisma';
import { calculateGravable, calculateIVA } from '@/shared/money';
import { CreateCotizacionDto } from '../dto/create-cotizacion.dto';

export class CotizacionService {
  /**
   * List all quotations, optionally filtered by status array
   */
  static async findAll(estados?: string[]) {
    const where = estados && estados.length > 0 ? { estado: { in: estados } } : {};
    return prisma.cotizacion.findMany({
      where,
      orderBy: { id: 'desc' },
      take: 100,
      include: {
        items: true,
      },
    });
  }

  /**
   * Find a specific quotation by ID
   */
  static async findById(id: number) {
    return prisma.cotizacion.findUnique({
      where: { id },
      include: { items: true },
    });
  }

  /**
   * Create a new quotation
   */
  static async create(data: CreateCotizacionDto, usuarioId: number, usuarioNombre: string) {
    // Validate inventory stock for quotation items
    if (data.items && data.items.length > 0) {
      const codigos = data.items.map(it => it.codigo).filter(Boolean) as string[];
      if (codigos.length > 0) {
        const prods = await prisma.producto.findMany({
          where: {
            codigo: { in: codigos, mode: 'insensitive' },
            activo: true,
          },
          select: { id: true, codigo: true, stock: true, nombre: true },
        });

        const prodMap = new Map<string, { stock: number; nombre: string }>();
        prods.forEach(p => {
          if (p.codigo) prodMap.set(p.codigo.trim().toUpperCase(), p);
        });

        for (const item of data.items) {
          if (!item.codigo) continue;
          const prod = prodMap.get(item.codigo.trim().toUpperCase());
          if (prod) {
            if (prod.stock < item.cantidad) {
              throw new Error(`Stock insuficiente para '${prod.nombre}' en inventario. Disponible: ${prod.stock} unidades, Cotizado: ${item.cantidad} unidades`);
            }
          }
        }
      }
    }

    const res = await prisma.$transaction(async (tx) => {
      // Get the next sequence number for the quotation using max ID
      const maxCot = await tx.cotizacion.findFirst({ orderBy: { id: 'desc' }, select: { id: true } });
      const nextId = (maxCot?.id || 0) + 1;
      const numero = `COT-${String(nextId).padStart(6, '0')}`;

      const itemsSubtotal = Number((data.items || []).reduce((acc, it) => acc + (it.subtotal || 0), 0).toFixed(2));
      const itemsDescuento = Number((data.items || []).reduce((acc, it) => acc + (it.descuento || 0), 0).toFixed(2));
      const itemsTotal = Number(Math.max(0, itemsSubtotal - itemsDescuento).toFixed(2));

      const calcSubtotal = typeof data.subtotal === 'number' && data.subtotal > 0 ? data.subtotal : itemsSubtotal;
      const calcDescuento = typeof data.descuento === 'number' ? data.descuento : itemsDescuento;
      const calcTotal = typeof data.total === 'number' && data.total > 0 ? data.total : itemsTotal;

      // Create the quotation
      const cotizacion = await tx.cotizacion.create({
        data: {
          numero,
          clienteNombre: data.clienteNombre.trim(),
          clienteDireccion: data.clienteDireccion || null,
          clienteTelefono: data.clienteTelefono || null,
          clienteNit: data.clienteNit || 'CF',
          atencion: data.atencion || null,
          formaPago: data.formaPago || null,
          descripcion: data.descripcion || null,
          notas: data.notas || null,
          subtotal: calcSubtotal,
          descuento: calcDescuento,
          total: calcTotal,
          validezDias: data.validezDias,
          tiempoInstalacion: data.tiempoInstalacion || null,
          usuarioId,
          usuarioNombre,
          items: {
            create: data.items.map((item) => ({
              codigo: item.codigo || '',
              descripcion: item.descripcion,
              cantidad: item.cantidad,
              precioUnitario: item.precioUnitario,
              subtotal: item.subtotal,
              descuento: item.descuento,
              totalItem: item.totalItem,
            })),
          },
        },
        include: { items: true },
      });

      // Increment sequence
      await tx.config.upsert({
        where: { clave: 'numero_siguiente_cotizacion' },
        update: { valor: String(nextId + 1) },
        create: { clave: 'numero_siguiente_cotizacion', valor: String(nextId + 1) },
      });

      // Auto-save client as prospect if valid
      if (data.clienteNombre && data.clienteNombre !== 'Consumidor Final') {
        const existente = await tx.cliente.findFirst({
          where: {
            OR: [
              data.clienteTelefono ? { telefono: data.clienteTelefono } : { nombre: data.clienteNombre },
              data.clienteNit && data.clienteNit !== 'CF' ? { nit: data.clienteNit } : { nombre: data.clienteNombre },
            ],
          },
        });
        
        if (!existente) {
          await tx.cliente.create({
            data: {
              nombre: data.clienteNombre.trim(),
              nit: data.clienteNit || 'CF',
              telefono: data.clienteTelefono || null,
              direccion: data.clienteDireccion || null,
              notas: `Prospecto desde cotización ${numero}`,
            },
          });
        }
      }

      return cotizacion;
    });

    try {
      const { eventBus } = await import('@/core/events/EventBus');
      const { CotizacionCreada } = await import('@/core/events/types/CotizacionCreada');
      await eventBus.publish(new CotizacionCreada({
        cotizacionId: res.id,
        numero: res.numero,
        clienteNombre: res.clienteNombre,
        total: res.total,
        usuarioNombre: usuarioNombre,
      }));
    } catch (err) {
      console.error('[CotizacionService] Error publishing CotizacionCreada:', err);
    }

    return res;
  }

  /**
   * Update quotation status with auto-project creation and protection
   */
  static async updateEstado(id: number, estado: string, user: any, pin?: string) {
    const cotizacionActual = await prisma.cotizacion.findUnique({ where: { id } });
    if (!cotizacionActual) throw new Error('Cotización no encontrada');

    const { WorkflowEngine } = await import('@/core/state');
    WorkflowEngine.validateTransition('cotizacion', cotizacionActual.estado, estado);

    const esReversion = cotizacionActual.estado === 'aceptada' || cotizacionActual.estado === 'rechazada';
    const estadosProtegidos = ['aceptada', 'rechazada', 'anulada'];
    if (estadosProtegidos.includes(estado) || esReversion) {
      if (user.role !== 'admin') {
        if (!pin) throw new Error('PIN_REQUIRED');
        const admin = await prisma.usuario.findFirst({ where: { rol: 'admin', activo: true } });
        if (!admin) throw new Error('No hay admin configurado');
        const bcrypt = await import('bcryptjs');
        if (!(await bcrypt.compare(pin, admin.password))) throw new Error('PIN_WRONG');
      }
    }

    // Integrate Domain Aggregate & Invariants (BR-001 & BR-002)
    if (estado === 'aceptada') {
      const { CotizacionAggregate } = await import('@/core/domain/CotizacionAggregate');
      const { Money } = await import('@/core/domain/ValueObjects');
      const anticipoPagado = Number((cotizacionActual as any).anticipoPagado || cotizacionActual.total * 0.5);
      const cotAggregate = new CotizacionAggregate(
        cotizacionActual.id,
        cotizacionActual.numero,
        cotizacionActual.clienteId || 1,
        cotizacionActual.clienteNombre,
        new Money(cotizacionActual.total),
        new Money(anticipoPagado),
        cotizacionActual.estado as any
      );
      cotAggregate.approve();
    }

    const notasActualizadas = estado === 'aceptada' 
      ? `Autorizada por: ${user.name} el ${new Date().toLocaleString('es-GT')}`
      : estado === 'pendiente' && cotizacionActual.estado === 'aceptada'
      ? `Revertida a pendiente por: ${user.name} el ${new Date().toLocaleString('es-GT')}`
      : cotizacionActual.notas;

    const updated = await prisma.cotizacion.update({
      where: { id },
      data: {
        estado,
        notas: notasActualizadas,
      },
      include: { items: true },
    });

    try {
      await prisma.auditLog.create({
        data: {
          usuarioId: parseInt(user.id),
          usuarioNombre: user.name,
          accion: `COTIZACION_${estado.toUpperCase()}`,
          tabla: 'cotizaciones',
          registroId: String(id),
          detalle: `Estado cambiado de ${cotizacionActual.estado} a: ${estado}`,
        },
      });
    } catch {}

    // Cotizaciones aceptadas se sincronizarán a Proyectos únicamente cuando sean facturadas
    if (estado === 'aceptada') {
      try {
        const { eventBus } = await import('@/core/events/EventBus');
        const { CotizacionAprobada } = await import('@/core/events/types/CotizacionAprobada');
        await eventBus.publish(new CotizacionAprobada({
          cotizacionId: updated.id,
          numero: updated.numero,
          clienteNombre: updated.clienteNombre,
          total: updated.total,
          usuarioNombre: user.name,
        }));
      } catch (err) {
        console.error('[CotizacionService] Error publishing CotizacionAprobada:', err);
      }
    }
    return updated;

  }

  static async updateFull(id: number, data: any, user: any) {
    // Validate inventory stock for quotation items
    if (Array.isArray(data.items) && data.items.length > 0) {
      const codigos = data.items.map((it: any) => it.codigo).filter(Boolean) as string[];
      if (codigos.length > 0) {
        const prods = await prisma.producto.findMany({
          where: {
            codigo: { in: codigos, mode: 'insensitive' },
            activo: true,
          },
          select: { id: true, codigo: true, stock: true, nombre: true },
        });

        const prodMap = new Map<string, { stock: number; nombre: string }>();
        prods.forEach(p => {
          if (p.codigo) prodMap.set(p.codigo.trim().toUpperCase(), p);
        });

        for (const item of data.items) {
          if (!item.codigo) continue;
          const prod = prodMap.get(item.codigo.trim().toUpperCase());
          if (prod) {
            if (prod.stock < item.cantidad) {
              throw new Error(`Stock insuficiente para '${prod.nombre}' en inventario. Disponible: ${prod.stock} unidades, Cotizado: ${item.cantidad} unidades`);
            }
          }
        }
      }
    }

    const updated = await prisma.$transaction(async (tx) => {
      await tx.cotizacionItem.deleteMany({ where: { cotizacionId: id } });
      return tx.cotizacion.update({
        where: { id },
        data: {
          clienteNombre: data.clienteNombre,
          clienteDireccion: data.clienteDireccion,
          clienteTelefono: data.clienteTelefono,
          clienteNit: data.clienteNit,
          atencion: data.atencion,
          formaPago: data.formaPago,
          descripcion: data.descripcion,
          notas: data.notas,
          tiempoInstalacion: data.tiempoInstalacion,
          subtotal: data.subtotal,
          descuento: data.descuento,
          total: data.total,
          validezDias: data.validezDias || 15,
          items: {
            create: (data.items || []).map((it: any) => ({
              codigo: it.codigo || '',
              descripcion: it.descripcion,
              cantidad: it.cantidad,
              precioUnitario: it.precioUnitario,
              subtotal: it.subtotal,
              descuento: it.descuento || 0,
              totalItem: it.totalItem,
            })),
          },
        },
        include: { items: true },
      });
    });

    try {
      await prisma.auditLog.create({
        data: {
          usuarioId: parseInt(user.id),
          usuarioNombre: user.name,
          accion: 'UPDATE',
          tabla: 'cotizaciones',
          registroId: String(id),
          detalle: 'Cotizacion editada',
        },
      });
    } catch {}

    return updated;
  }

  static async delete(id: number, user: any) {
    if (user.role !== 'admin') throw new Error('No autorizado');
    await prisma.cotizacion.delete({ where: { id } });
  }

  static async facturar(cotizacionId: number, data: any, user: any) {
    const cotizacion = await prisma.cotizacion.findUnique({
      where: { id: cotizacionId },
      include: { items: true },
    });
    if (!cotizacion) throw new Error('Cotización no encontrada');

    if (cotizacion.estado === 'facturada') {
      throw new Error(`La cotización ${cotizacion.numero} ya fue facturada previamente. No se permite facturación doble.`);
    }

    const ventaExistente = await prisma.venta.findFirst({
      where: {
        OR: [
          { notas: { contains: cotizacion.numero, mode: 'insensitive' } },
          { notas: { contains: `[Cotización COT-${cotizacion.id}]`, mode: 'insensitive' } }
        ]
      }
    });
    if (ventaExistente) {
      throw new Error(`La cotización ${cotizacion.numero} ya tiene la factura ${ventaExistente.numero} registrada.`);
    }

    const { WorkflowEngine, CotizacionState } = await import('@/core/state');
    WorkflowEngine.validateTransition('cotizacion', cotizacion.estado, CotizacionState.FACTURADA);

    // Validate stock for all items in inventory before billing
    for (const item of cotizacion.items) {
      if (!item.codigo && !item.descripcion) continue;
      const prod = await prisma.producto.findFirst({
        where: {
          OR: [
            ...(item.codigo ? [{ codigo: { equals: item.codigo, mode: 'insensitive' as const } }] : []),
            ...(item.descripcion ? [{ nombre: { equals: item.descripcion, mode: 'insensitive' as const } }] : []),
          ],
          activo: true,
        },
        select: { id: true, nombre: true, stock: true },
      });

      if (prod) {
        if (prod.stock < item.cantidad) {
          throw new Error(`Stock insuficiente para facturar '${prod.nombre}'. Disponible: ${prod.stock} unidades, Cotizado: ${item.cantidad} unidades`);
        }
      }
    }

    const parsedUserId = isNaN(parseInt(user?.id)) ? 1 : parseInt(user.id);

    const resVenta = await prisma.$transaction(async (tx) => {
      const cotTx = await tx.cotizacion.findUnique({ where: { id: cotizacionId } });
      if (cotTx && cotTx.estado === 'facturada') {
        throw new Error(`La cotización ${cotizacion.numero} ya fue facturada previamente.`);
      }

      const ventaPreviaTx = await tx.venta.findFirst({
        where: {
          OR: [
            { notas: { contains: cotizacion.numero, mode: 'insensitive' } },
            { notas: { contains: `[Cotización COT-${cotizacion.id}]`, mode: 'insensitive' } }
          ]
        }
      });
      if (ventaPreviaTx) {
        throw new Error(`La cotización ${cotizacion.numero} ya fue facturada en el comprobante ${ventaPreviaTx.numero}`);
      }

      const cfg = await tx.config.findUnique({ where: { clave: 'numero_siguiente' } });
      const num = parseInt(cfg?.valor || '1');
      const numero = `FAC-${String(num).padStart(6, '0')}`;

      const totalVenta = cotizacion.total;
      const grossSubtotal = cotizacion.subtotal || cotizacion.items.reduce((s, i) => s + (i.precioUnitario * i.cantidad), 0) || totalVenta;
      const ivaVenta = calculateIVA(totalVenta, 0.05);
      const montoRecibido = parseFloat(data.montoRecibido) || totalVenta;
      const cambio = Math.max(0, montoRecibido - totalVenta);

      const venta = await tx.venta.create({
        data: {
          numero,
          clienteNombre: data.clienteNombre || cotizacion.clienteNombre,
          clienteNit: data.clienteNit || cotizacion.clienteNit || 'CF',
          subtotal: grossSubtotal,
          descuento: cotizacion.descuento || 0,
          impuesto: ivaVenta,
          total: totalVenta,
          metodoPago: data.metodoPago || 'efectivo',
          montoRecibido,
          cambio,
          notas: `Facturado desde cotización ${cotizacion.numero} [Cotización COT-${cotizacion.id}]`,
          usuarioId: parsedUserId,
          usuarioNombre: user?.name || 'Sistema',
          items: {
            create: cotizacion.items.map((item: any) => ({
              nombre: item.descripcion,
              codigo: item.codigo || '',
              cantidad: item.cantidad,
              precioUnitario: item.precioUnitario,
              descuento: item.descuento || 0,
              subtotal: item.totalItem || (item.cantidad * item.precioUnitario - (item.descuento || 0)),
            })),
          },
        },
        include: { items: true },
      });

      for (const item of cotizacion.items) {
        if (!item.codigo) continue;
        const prod = await tx.producto.findFirst({
          where: {
            OR: [
              { codigo: item.codigo },
              { nombre: { equals: item.descripcion, mode: 'insensitive' } },
            ],
            activo: true,
          },
        });
        if (prod && prod.stock >= item.cantidad) {
          const updatedProd = await tx.producto.update({
            where: { id: prod.id },
            data: { stock: { decrement: item.cantidad } },
          });
          const stockDespues = updatedProd.stock;
          const stockAntes = stockDespues + item.cantidad;

          await tx.kardex.create({
            data: {
              productoId: prod.id, tipo: 'salida', cantidad: item.cantidad,
              stockAntes, stockDespues,
              motivo: `Venta ${numero} (desde cotización ${cotizacion.numero})`,
              referencia: numero,
              usuarioId: parsedUserId, usuarioNombre: user?.name || 'Sistema',
            },
          });
        }
      }

      await tx.cotizacion.update({
        where: { id: cotizacion.id },
        data: { estado: 'facturada' },
      });

      await tx.config.update({
        where: { clave: 'numero_siguiente' },
        data: { valor: String(num + 1) },
      });

      try {
        await tx.auditLog.create({
          data: {
            usuarioId: parsedUserId, usuarioNombre: user?.name || 'Sistema',
            accion: 'CREATE', tabla: 'ventas', registroId: String(venta.id),
            detalle: `Venta ${numero} creada desde cotización ${cotizacion.numero}`,
          }
        });
      } catch {}

      return venta;
    });

    try {
      const { ProyectoService } = await import('@/modules/proyectos/services/proyecto.service');
      await ProyectoService.createFromSale(resVenta.id);
    } catch (err) {
      console.error('[CotizacionService] Error auto-creating project from sale:', err);
    }

    return resVenta;
  }

  static async enviarCorreo(id: number, email: string) {
    const { enviarCotizacionPorCorreo } = await import('../utils/cotizacion-email.helper');
    return enviarCotizacionPorCorreo(id, email);
  }
}

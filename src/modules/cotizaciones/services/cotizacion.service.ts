import { prisma } from '@/lib/prisma';
import { CreateCotizacionDto } from '../dto/create-cotizacion.dto';
import { syncProyectoDesdeCotizacion } from '@/modules/proyectos/utils/proyecto-sync.helper';

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
      // Get the next sequence number for the quotation
      const cfg = await tx.config.findUnique({ where: { clave: 'numero_siguiente_cotizacion' } });
      const num = parseInt(cfg?.valor || '1');
      const numero = `COT-${String(num).padStart(6, '0')}`;

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
          subtotal: data.subtotal,
          descuento: data.descuento,
          total: data.total,
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
        update: { valor: String(num + 1) },
        create: { clave: 'numero_siguiente_cotizacion', valor: String(num + 1) },
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
    } else if (estado === 'pendiente' || estado === 'anulada' || estado === 'rechazada') {
      try {
        const { handleReversionProyectoDesdeCotizacion } = await import('@/modules/proyectos/utils/proyecto-sync.helper');
        await handleReversionProyectoDesdeCotizacion(prisma, id, estado, user.name);
      } catch (err) {
        console.error('[CotizacionService] Error syncing proyecto reversion:', err);
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

    return prisma.$transaction(async (tx) => {
      const cfg = await tx.config.findUnique({ where: { clave: 'numero_siguiente' } });
      const num = parseInt(cfg?.valor || '1');
      const numero = `FAC-${String(num).padStart(6, '0')}`;

      const total = cotizacion.total;
      const montoRecibido = parseFloat(data.montoRecibido) || total;
      const cambio = Math.max(0, montoRecibido - total);

      const venta = await tx.venta.create({
        data: {
          numero,
          clienteNombre: data.clienteNombre || cotizacion.clienteNombre,
          clienteNit: data.clienteNit || cotizacion.clienteNit || 'CF',
          subtotal: cotizacion.subtotal,
          descuento: cotizacion.descuento,
          impuesto: cotizacion.total - (cotizacion.subtotal - cotizacion.descuento),
          total: cotizacion.total,
          metodoPago: data.metodoPago || 'efectivo',
          montoRecibido,
          cambio,
          notas: `Facturado desde cotización ${cotizacion.numero} [Cotización COT-${cotizacion.id}]`,
          usuarioId: parseInt(user.id),
          usuarioNombre: user.name,
          items: {
            create: cotizacion.items.map((item: any) => ({
              nombre: item.descripcion,
              codigo: item.codigo || '',
              cantidad: item.cantidad,
              precioUnitario: item.precioUnitario,
              descuento: item.descuento,
              subtotal: item.totalItem,
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
          const newStock = prod.stock - item.cantidad;
          await tx.producto.update({ where: { id: prod.id }, data: { stock: newStock } });
          await tx.kardex.create({
            data: {
              productoId: prod.id, tipo: 'salida', cantidad: item.cantidad,
              stockAntes: prod.stock, stockDespues: newStock,
              motivo: `Venta ${numero} (desde cotización ${cotizacion.numero})`,
              referencia: numero,
              usuarioId: parseInt(user.id), usuarioNombre: user.name,
            },
          });
        }
      }

      await tx.cotizacion.update({
        where: { id: cotizacion.id },
        data: { estado: 'facturada' },
      });

      // Synchronize project to 'planificado' upon billing
      try {
        await syncProyectoDesdeCotizacion(tx, cotizacion.id, 'planificado', user.name, numero);
      } catch (err) {
        console.error('[CotizacionService.facturar] Error syncing proyecto:', err);
      }

      await tx.config.update({
        where: { clave: 'numero_siguiente' },
        data: { valor: String(num + 1) },
      });

      try {
        await tx.auditLog.create({
          data: {
            usuarioId: parseInt(user.id), usuarioNombre: user.name,
            accion: 'CREATE', tabla: 'ventas', registroId: String(venta.id),
            detalle: `Venta ${numero} creada desde cotización ${cotizacion.numero}`,
          }
        });
      } catch {}

      return venta;
    });
  }

  static async enviarCorreo(id: number, email: string) {
    const cot = await prisma.cotizacion.findUnique({
      where: { id },
      include: { items: true },
    });
    if (!cot) throw new Error('Cotización no encontrada');

    let apiKey = process.env.RESEND_API_KEY;
    let from = process.env.EMAIL_FROM || 'WebSoft Solutions <facturacion@websoftsolutions.com.gt>';
    try {
      const [keyRow, fromRow] = await Promise.all([
        prisma.config.findUnique({ where: { clave: 'resend_api_key' } }),
        prisma.config.findUnique({ where: { clave: 'email_from' } }),
      ]);
      if (keyRow?.valor) apiKey = keyRow.valor;
      if (fromRow?.valor) from = fromRow.valor;
    } catch {}

    if (!apiKey) throw new Error('RESEND_API_KEY no configurado');

    const rows = cot.items.map(it => `
      <tr>
        <td style="padding:8px 12px;font-size:11px;color:#1581E3;font-family:Courier New,monospace;border-bottom:1px solid #e3e1d8">${it.codigo || ''}</td>
        <td style="padding:8px 12px;font-size:12px;border-bottom:1px solid #e3e1d8">${it.descripcion}</td>
        <td style="padding:8px 12px;font-size:12px;text-align:center;border-bottom:1px solid #e3e1d8">${it.cantidad}</td>
        <td style="padding:8px 12px;font-size:12px;text-align:right;border-bottom:1px solid #e3e1d8">Q ${Number(it.precioUnitario).toFixed(2)}</td>
        <td style="padding:8px 12px;font-size:12px;font-weight:700;text-align:right;border-bottom:1px solid #e3e1d8">Q ${Number(it.totalItem).toFixed(2)}</td>
      </tr>`).join('');

    const html = `<!DOCTYPE html>
<html lang="es">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f4f3ef;font-family:Arial,Helvetica,sans-serif">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f3ef;padding:16px 0">
<tr><td align="center">
<table width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;background:#fff;border:1.5px solid #d8d6cd;border-radius:6px;overflow:hidden">

  <tr><td style="background:#fff;padding:20px 24px;border-bottom:2px solid #18181b">
    <table width="100%" cellpadding="0" cellspacing="0">
      <tr>
        <td style="vertical-align:middle">
          <div style="font-size:17px;font-weight:700;color:#18181b">WebSoft Solutions</div>
          <div style="font-size:10px;color:#8a887e;margin-top:2px">NIT: 115471413 · Guastatoya, El Progreso</div>
        </td>
        <td style="text-align:right;vertical-align:top">
          <div style="font-size:9px;font-weight:700;color:#8a887e;text-transform:uppercase;letter-spacing:1px">Cotización</div>
          <div style="font-size:20px;font-weight:700;color:#18181b;font-family:Courier New,monospace">${cot.numero}</div>
          <div style="font-size:10px;color:#52524d;margin-top:2px">${new Date(cot.createdAt).toLocaleDateString('es-GT')}</div>
        </td>
      </tr>
    </table>
  </td></tr>

  <tr><td style="padding:16px 24px;background:#f4f3ef;border-bottom:1px solid #d8d6cd">
    <div style="font-size:9px;font-weight:700;color:#8a887e;text-transform:uppercase;letter-spacing:1px;margin-bottom:6px">Cliente</div>
    <div style="font-size:14px;font-weight:700;color:#18181b">${cot.clienteNombre}</div>
    <div style="font-size:11px;color:#52524d;margin-top:2px">NIT: ${cot.clienteNit || 'CF'}</div>
  </td></tr>

  <tr><td style="padding:0">
    <table width="100%" cellpadding="0" cellspacing="0">
      <thead>
        <tr style="background:#18181b">
          <th style="padding:9px 12px;text-align:left;font-size:10px;font-weight:700;color:#fff">Código</th>
          <th style="padding:9px 12px;text-align:left;font-size:10px;font-weight:700;color:#fff">Descripción</th>
          <th style="padding:9px 12px;text-align:center;font-size:10px;font-weight:700;color:#fff">Cant.</th>
          <th style="padding:9px 12px;text-align:right;font-size:10px;font-weight:700;color:#fff">Precio</th>
          <th style="padding:9px 12px;text-align:right;font-size:10px;font-weight:700;color:#fff">Total</th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>
  </td></tr>

  <tr><td style="padding:16px 24px;text-align:right;border-top:2px solid #18181b">
    <table cellpadding="0" cellspacing="0" style="margin-left:auto">
      <tr><td style="padding:3px 12px 3px 0;font-size:11px;color:#8a887e;text-align:right">Subtotal:</td><td style="font-size:11px;font-family:Courier New,monospace;text-align:right;color:#18181b">Q ${cot.subtotal.toFixed(2)}</td></tr>
      ${cot.descuento > 0 ? `<tr><td style="padding:3px 12px 3px 0;font-size:11px;color:#b13a2e;text-align:right">Descuento:</td><td style="font-size:11px;font-family:Courier New,monospace;color:#b13a2e;text-align:right">-Q ${cot.descuento.toFixed(2)}</td></tr>` : ''}
      <tr><td colspan="2" style="padding:4px 0"><div style="border-top:1px solid #d8d6cd;margin:4px 0"></div></td></tr>
      <tr><td style="padding:3px 12px 3px 0;font-size:15px;font-weight:700;color:#18181b;text-align:right">TOTAL:</td><td style="font-size:18px;font-weight:700;color:#1581E3;font-family:Courier New,monospace;text-align:right">Q ${cot.total.toFixed(2)}</td></tr>
    </table>
  </td></tr>

  ${cot.notas ? `<tr><td style="padding:12px 24px;background:#f4f3ef;border-top:1px solid #d8d6cd;font-size:11px;color:#52524d">${cot.notas}</td></tr>` : ''}

  <tr><td style="padding:14px 24px;background:#18181b;text-align:center">
    <div style="font-size:11px;color:rgba(255,255,255,.7)">WebSoft Solutions · Tel: 3836-1044 | Cel: 3671-4377 · websoftsolutions.com.gt</div>
  </td></tr>

</table>
</td></tr>
</table>
</body></html>`;

    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from, to: email,
        subject: `Cotización ${cot.numero} — WebSoft Solutions`,
        html,
      }),
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.message || `HTTP ${res.status}`);
  }
}

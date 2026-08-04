import { prisma } from '@/lib/prisma';
import { emitirFEL, FELResponse } from '@/lib/fel';
import { enviarFacturaPorCorreo, EmailResult } from '@/lib/email-factura';
import { CreateVentaDto } from '../dto/create-venta.dto';
import { Venta } from '../types/venta';

export class VentaService {
  static async findAll(params: {
    fechaIni?: string | null;
    fechaFin?: string | null;
    estado?: string | null;
    buscar?: string | null;
  }) {
    const { fechaIni, fechaFin, estado, buscar } = params;

    const where: any = {};
    if (estado) {
      where.estado = estado;
    } else {
      where.estado = { not: 'anulada' };
    }

    if (buscar) {
      where.OR = [
        { clienteNombre: { contains: buscar, mode: 'insensitive' } },
        { clienteNit: { contains: buscar, mode: 'insensitive' } },
        { numero: { contains: buscar, mode: 'insensitive' } },
      ];
    }

    if (fechaIni || fechaFin) {
      where.fecha = {};
      if (fechaIni) where.fecha.gte = new Date(fechaIni);
      if (fechaFin) {
        const end = new Date(fechaFin);
        end.setHours(23, 59, 59, 999);
        where.fecha.lte = end;
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

    // Get next number outside of transaction to avoid blocking, though it could be inside.
    // It's safer to read and lock, but Prisma doesn't have explicit row locks easily. We do it in the TX.
    
    // Verify stock first
    for (const item of dto.items) {
      if (!item.productoId) continue;
      const prod = await prisma.producto.findUnique({ where: { id: item.productoId } });
      if (!prod || prod.stock < item.cantidad) {
        throw new Error(`Stock insuficiente: ${item.nombre}`);
      }
    }

    let numeroVenta = '';

    const venta = await prisma.$transaction(async (tx) => {
      const cfg = await tx.config.findUnique({ where: { clave: 'numero_siguiente' } });
      const num = parseInt(cfg?.valor || '1');
      numeroVenta = `FAC-${String(num).padStart(6, '0')}`;

      const v = await tx.venta.create({
        data: {
          numero: numeroVenta,
          fecha: new Date(),
          clienteNombre: dto.clienteNombre || 'Consumidor Final',
          clienteNit: dto.clienteNit || 'CF',
          subtotal: dto.subtotal,
          descuento: dto.descuento,
          impuesto: dto.impuesto,
          total: dto.total,
          metodoPago: dto.metodoPago,
          montoRecibido: dto.montoRecibido,
          cambio: dto.cambio,
          notas: dto.notas,
          usuarioId: parseInt(userId),
          usuarioNombre: userName,
          items: {
            create: dto.items.map(item => ({
              productoId: item.productoId,
              codigo: item.codigo || '',
              nombre: item.nombre,
              cantidad: item.cantidad,
              precioUnitario: item.precioUnitario,
              descuento: item.descuento || 0,
              subtotal: item.subtotal,
            })),
          },
        },
        include: { items: true },
      });

      // Update stock & kardex
      for (const item of dto.items) {
        if (!item.productoId) continue;
        const prod = await tx.producto.findUnique({ where: { id: item.productoId } });
        if (prod) {
          const newStock = prod.stock - item.cantidad;
          await tx.producto.update({ where: { id: item.productoId }, data: { stock: newStock } });
          await tx.kardex.create({
            data: {
              productoId: item.productoId,
              tipo: 'salida',
              cantidad: item.cantidad,
              stockAntes: prod.stock,
              stockDespues: newStock,
              motivo: `Venta ${numeroVenta}`,
              referencia: numeroVenta,
              usuarioId: parseInt(userId),
              usuarioNombre: userName,
            },
          });
        }
      }

      // Marcar cotización como facturada
      if (dto.cotizacionId) {
        try {
          await tx.cotizacion.update({ where: { id: dto.cotizacionId }, data: { estado: 'facturada' } });
        } catch { /* ignorar si no existe */ }
      }

      // Auto-upgrade cliente: prospecto -> cliente
      if (dto.clienteNit && dto.clienteNit !== 'CF') {
        try {
          // Necesita cast de "any" porque tipo no está en todo schema, pero se mantiene la lógica original
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

      return v;
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

    return {
      venta,
      fel: felResult,
      email: emailResult,
    };
  }

  static async anular(id: number) {
    const venta = await prisma.venta.findUnique({ where: { id } });
    if (!venta) throw new Error('Venta no encontrada');

    // Aquí idealmente se anularía en FEL si existe felUuid, pero
    // por ahora solo actualizamos DB como estaba en la v1
    await prisma.venta.update({
      where: { id },
      data: { estado: 'anulada' },
    });

    return true;
  }
}

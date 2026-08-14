import { prisma } from '@/lib/prisma';
import crypto from 'crypto';

export class TiendaBackendService {
  static async getPedidos(estado?: string) {
    const where: any = {};
    if (estado) where.estado = estado;

    return prisma.pedidoWeb.findMany({
      where,
      orderBy: { id: 'desc' },
      take: 100,
      include: { items: true },
    });
  }

  static async createPedido(data: any) {
    const {
      clienteNombre, clienteEmail, clienteTelefono,
      clienteNit, clienteDireccion, items, notas,
      stripeSessionId,
    } = data;

    if (!clienteNombre || !clienteEmail) {
      throw new Error('Nombre y email son requeridos');
    }
    if (!items || items.length === 0) {
      throw new Error('El carrito está vacío');
    }

    // Validate stock in batch
    const pIds = items.map((i: any) => Number(i.productoId)).filter(Boolean);
    if (pIds.length > 0) {
      const prods = await prisma.producto.findMany({
        where: { id: { in: pIds } },
        select: { id: true, stock: true, nombre: true },
      });
      const prodMap = new Map<number, typeof prods[0]>(prods.map(p => [p.id, p]));

      for (const item of items) {
        if (!item.productoId) continue;
        const prod = prodMap.get(Number(item.productoId));
        if (!prod) throw new Error('Producto no encontrado');
        if (prod.stock < item.cantidad) {
          throw new Error(`Sin stock suficiente para: ${prod.nombre} (disponible: ${prod.stock})`);
        }
      }
    }

    const subtotal = items.reduce((s: number, i: any) => s + (+i.precio * +i.cantidad), 0);
    const total = subtotal;

    const maxPedido = await prisma.pedidoWeb.findFirst({ orderBy: { id: 'desc' }, select: { id: true } });
    const nextId = (maxPedido?.id || 0) + 1;
    const numero = `PW-${String(nextId).padStart(6, '0')}`;

    return prisma.pedidoWeb.create({
      data: {
        numero,
        clienteNombre,
        clienteEmail,
        clienteTelefono: clienteTelefono || null,
        clienteNit: clienteNit || null,
        clienteDireccion: clienteDireccion || null,
        subtotal,
        total,
        stripeSessionId: stripeSessionId || null,
        estado: stripeSessionId ? 'pagado' : 'pendiente',
        notas: notas || null,
        items: {
          create: items.map((item: any) => ({
            productoId: item.productoId ? Number(item.productoId) : null,
            nombre: item.nombre,
            codigo: item.codigo || null,
            cantidad: +item.cantidad,
            precioUnitario: +item.precio,
            subtotal: +item.precio * +item.cantidad,
            imagenUrl: item.imagenUrl || null,
          })),
        },
      },
      include: { items: true },
    });
  }

  static async updatePedido(id: number, accion: string, user: any) {
    const pedido = await prisma.pedidoWeb.findUnique({
      where: { id },
      include: { items: true },
    });
    if (!pedido) throw new Error('No encontrado');

    if (accion === 'confirmar') {
      const cfg = await prisma.config.findUnique({ where: { clave: 'numero_siguiente' } });
      const num = parseInt(cfg?.valor || '1');
      const numero = `FAC-${String(num).padStart(6, '0')}`;

      return prisma.$transaction(async (tx) => {
        const venta = await tx.venta.create({
          data: {
            numero,
            clienteNombre: pedido.clienteNombre,
            clienteNit: pedido.clienteNit || 'CF',
            subtotal: pedido.subtotal,
            descuento: 0,
            impuesto: pedido.subtotal * 0.05,
            total: pedido.total,
            metodoPago: 'online',
            montoRecibido: pedido.total,
            cambio: 0,
            notas: `Pedido web ${pedido.numero}`,
            usuarioId: parseInt(user.id),
            usuarioNombre: user.name,
            items: {
              create: pedido.items.map(item => ({
                nombre: item.nombre,
                codigo: item.codigo || '',
                cantidad: item.cantidad,
                precioUnitario: item.precioUnitario,
                descuento: 0,
                subtotal: item.subtotal,
              })),
            },
          },
        });

        for (const item of pedido.items) {
          if (!item.productoId) continue;
          const prod = await tx.producto.findUnique({ where: { id: item.productoId } });
          if (!prod) continue;
          const newStock = Math.max(0, prod.stock - item.cantidad);
          await tx.producto.update({ where: { id: prod.id }, data: { stock: newStock } });
          await tx.kardex.create({
            data: {
              productoId: prod.id,
              tipo: 'salida',
              cantidad: item.cantidad,
              stockAntes: prod.stock,
              stockDespues: newStock,
              motivo: `Venta online ${pedido.numero}`,
              usuarioId: parseInt(user.id),
              usuarioNombre: user.name,
            },
          });
        }

        await tx.pedidoWeb.update({
          where: { id: pedido.id },
          data: {
            estado: 'confirmado',
            ventaId: venta.id,
            procesadoPor: user.name,
            fechaProcesado: new Date(),
          },
        });

        await tx.config.update({
          where: { clave: 'numero_siguiente' },
          data: { valor: String(num + 1) },
        });

        return venta;
      });
    }

    if (accion === 'cancelar') {
      await prisma.pedidoWeb.update({ where: { id: pedido.id }, data: { estado: 'cancelado' } });
      return null;
    }

    if (accion === 'enviado') {
      await prisma.pedidoWeb.update({ where: { id: pedido.id }, data: { estado: 'enviado' } });
      return null;
    }

    throw new Error('Acción inválida');
  }

  static async getProductos(categoria: string, buscar: string, soloDisponibles: boolean) {
    const where: any = { activo: true };
    if (soloDisponibles) where.stock = { gt: 0 };
    if (categoria) where.categoria = categoria;
    if (buscar) {
      where.OR = [
        { nombre: { contains: buscar, mode: 'insensitive' } },
        { descripcion: { contains: buscar, mode: 'insensitive' } },
        { codigo: { contains: buscar, mode: 'insensitive' } },
      ];
    }

    const productos = await prisma.producto.findMany({
      where,
      orderBy: { nombre: 'asc' },
      select: {
        id: true,
        codigo: true,
        nombre: true,
        descripcion: true,
        precio: true,
        stock: true,
        categoria: true,
        imagenUrl: true,
      },
    });

    const categorias = await prisma.producto.findMany({
      where: { activo: true },
      select: { categoria: true },
      distinct: ['categoria'],
    });

    return {
      productos,
      categorias: categorias.map(c => c.categoria).filter(Boolean),
    };
  }

  static async handleStripeWebhook(body: string, signature: string | null, webhookSecret: string | undefined) {
    if (!webhookSecret || !signature) {
      throw new Error('Signature missing or webhook secret not configured');
    }

    const parts = signature.split(',');
    const ts = parts.find((p: string) => p.startsWith('t='))?.split('=')[1];
    const v1 = parts.find((p: string) => p.startsWith('v1='))?.split('=')[1];

    if (!ts || !v1) {
      throw new Error('Signature invalid');
    }

    const signed = `${ts}.${body}`;
    const expected = crypto
      .createHmac('sha256', webhookSecret)
      .update(signed, 'utf8')
      .digest('hex');

    if (expected !== v1) {
      throw new Error('Signature invalid');
    }

    let event: any;
    try {
      event = JSON.parse(body);
    } catch {
      throw new Error('Invalid JSON');
    }

    if (event?.type === 'checkout.session.completed') {
      const session = event.data?.object;
      if (session?.id) {
        await prisma.pedidoWeb.updateMany({
          where: { stripeSessionId: session.id },
          data: { estado: 'pagado', stripePaymentId: session.payment_intent || null },
        });
      }
    }
  }
}

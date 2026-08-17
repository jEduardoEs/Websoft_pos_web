import { prisma } from '@/lib/prisma';
import { CreateCompraDto } from '../dto/create-compra.dto';
import { Compra } from '../types/compra';
import { calculateNewPricePreservingMargin } from '@/modules/productos/utils/producto-calc.helper';

export class CompraRepository {

  async findAll(limit = 100): Promise<Compra[]> {
    const compras = await prisma.compra.findMany({
      orderBy: { id: 'desc' },
      take: limit,
      include: {
        items: true,
        proveedor: { select: { nombre: true } },
      },
    });

    return compras.map(c => ({
      ...c,
      items: c.items.map(i => ({
        ...i,
        productoId: i.productoId || undefined,
      }))
    })) as unknown as Compra[];
  }

  async createCompraWithTransaction(dto: CreateCompraDto, userId: number, userName: string): Promise<Compra> {
    if (!dto.items || dto.items.length === 0) {
      throw new Error('Agrega al menos un producto a la compra');
    }

    const total = dto.items.reduce((sum, item) => sum + (Number(item.cantidad) * Number(item.precioUnitario)), 0);

    const compra = await prisma.$transaction(async (tx) => {
      const maxCompra = await tx.compra.findFirst({ orderBy: { id: 'desc' }, select: { id: true } });
      const nextId = (maxCompra?.id || 0) + 1;
      const numero = `CMP-${String(nextId).padStart(6, '0')}`;

      // 1. Create the purchase (Compra)
      const c = await tx.compra.create({
        data: {
          numero,
          proveedorId: dto.proveedorId || null,
          fecha: dto.fecha ? new Date(dto.fecha) : new Date(),
          total,
          numeroFactura: dto.numeroFactura || null,
          serieFactura: dto.serieFactura || null,
          facturaUrl: dto.facturaUrl || null,
          notas: dto.notas || null,
          usuarioId: userId,
          usuarioNombre: userName,
          items: {
            create: dto.items.map(item => ({
              productoId: item.productoId || null,
              nombre: item.nombre,
              cantidad: Number(item.cantidad),
              precioUnitario: Number(item.precioUnitario),
              subtotal: Number(item.cantidad) * Number(item.precioUnitario),
            })),
          },
        },
        include: { items: true },
      });

      // 2. Update stock, cost, sale price (preserving margin), and register in Kardex for each item
      for (const item of dto.items) {
        if (!item.productoId) continue;
        const qty = Number(item.cantidad);
        const unitCost = Number(item.precioUnitario);

        const currentProd = await tx.producto.findUnique({ where: { id: item.productoId }, select: { stock: true, costo: true, precio: true } });
        const oldStock = currentProd?.stock || 0;
        const oldCost = currentProd?.costo || 0;
        const oldPrice = currentProd?.precio || 0;

        const totalNewStock = oldStock + qty;
        const weightedCost = totalNewStock > 0 && unitCost > 0
          ? Number((((oldStock * oldCost) + (qty * unitCost)) / totalNewStock).toFixed(2))
          : unitCost;

        // Calculate new sale price preserving the user's established margin ratio
        const newPrice = calculateNewPricePreservingMargin(oldCost, oldPrice, weightedCost);

        const prod = await tx.producto.update({
          where: { id: item.productoId },
          data: {
            stock: { increment: qty },
            ...(unitCost > 0 ? { costo: weightedCost, precio: newPrice } : {}),
          },
        });

        const stockDespues = prod.stock;
        const stockAntes = stockDespues - qty;

        await tx.kardex.create({
          data: {
            productoId: item.productoId,
            tipo: 'entrada',
            cantidad: qty,
            stockAntes,
            stockDespues,
            motivo: `Compra ${numero}${dto.numeroFactura ? ` — Factura ${dto.serieFactura || ''}${dto.numeroFactura}` : ''}`,
            referencia: dto.numeroFactura || null,
            usuarioId: userId,
            usuarioNombre: userName,
          },
        });
      }

      // Automatically register CuentaPagar for credit purchases
      if (dto.notas && /credito|crédito|diferido/i.test(dto.notas)) {
        const maxCp = await tx.cuentaPagar.findFirst({ orderBy: { id: 'desc' }, select: { id: true } });
        const nextCpId = (maxCp?.id || 0) + 1;
        const numCp = `CP-${String(nextCpId).padStart(6, '0')}`;
        const fechaVenc = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

        await tx.cuentaPagar.create({
          data: {
            numero: numCp,
            fecha: new Date(),
            fechaVencimiento: fechaVenc,
            proveedorNombre: dto.proveedorId ? (c as any).proveedor?.nombre || 'Proveedor' : 'Proveedor General',
            proveedorId: dto.proveedorId || null,
            compraNumero: numero,
            concepto: `Compra a crédito ${numero}`,
            monto: total,
            montoPagado: 0,
            estado: 'pendiente',
            usuarioNombre: userName,
          },
        });
      }

      return c;
    }, { maxWait: 10000, timeout: 30000 });

    return compra as unknown as Compra;
  }
}

import { prisma } from '@/lib/prisma';
import { CreateCompraDto } from '../dto/create-compra.dto';
import { Compra } from '../types/compra';

export class CompraService {
  
  async getAll(limit = 100): Promise<Compra[]> {
    const compras = await prisma.compra.findMany({
      orderBy: { id: 'desc' },
      take: limit,
      include: {
        items: true,
        proveedor: { select: { nombre: true } },
      },
    });
    
    // Convert to strict Compra type
    return compras.map(c => ({
      ...c,
      items: c.items.map(i => ({
        ...i,
        productoId: i.productoId || undefined,
      }))
    })) as unknown as Compra[];
  }

  async create(dto: CreateCompraDto, userId: number, userName: string): Promise<Compra> {
    if (!dto.items || dto.items.length === 0) {
      throw new Error('Agrega al menos un producto a la compra');
    }

    const total = dto.items.reduce((sum, item) => sum + (Number(item.cantidad) * Number(item.precioUnitario)), 0);

    const compra = await prisma.$transaction(async (tx) => {
      const count = await tx.compra.count();
      const numero = `CMP-${String(count + 1).padStart(6, '0')}`;

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

      // 2. Update stock and register in Kardex for each item
      for (const item of dto.items) {
        if (!item.productoId) continue;
        
        const prod = await tx.producto.findUnique({ where: { id: item.productoId } });
        if (!prod) continue;
        
        const newStock = prod.stock + Number(item.cantidad);
        
        await tx.producto.update({
          where: { id: prod.id },
          data: { stock: newStock },
        });
        
        await tx.kardex.create({
          data: {
            productoId: prod.id,
            tipo: 'entrada',
            cantidad: Number(item.cantidad),
            stockAntes: prod.stock,
            stockDespues: newStock,
            motivo: `Compra ${numero}${dto.numeroFactura ? ` — Factura ${dto.serieFactura || ''}${dto.numeroFactura}` : ''}`,
            referencia: dto.numeroFactura || null,
            usuarioId: userId,
            usuarioNombre: userName,
          },
        });
      }

      return c;
    }, { maxWait: 10000, timeout: 30000 });

    return compra as unknown as Compra;
  }
}

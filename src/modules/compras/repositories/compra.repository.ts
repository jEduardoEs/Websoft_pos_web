import { prisma } from '@/lib/prisma';
import { CreateCompraDto } from '../dto/create-compra.dto';
import { Compra } from '../types/compra';

export class CompraRepository {

  async findAll(limit = 100): Promise<Compra[]> {
    const compras = await prisma.compra.findMany({
      orderBy: { id: 'desc' },
      take: limit,
      include: {
        items: true,
        proveedor: { select: { nombre: true, nit: true } },
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
          fecha: dto.fecha ? new Date(dto.fecha.includes('T') ? dto.fecha : `${dto.fecha}T12:00:00`) : new Date(),
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

     
      // 2. Actualizar existencias y costo promedio ponderado
      for (const item of dto.items) {
        if (!item.productoId) continue;

        const qty = Number(item.cantidad);
        const unitCost = Number(item.precioUnitario);

        // Validar cantidad y costo
        if (!Number.isFinite(qty) || qty <= 0 || !Number.isInteger(qty)) {
          throw new Error(
            `Cantidad inválida para el producto: ${item.nombre}. Debe ser un número entero positivo.`
          );
        }

        if (!Number.isFinite(unitCost) || unitCost < 0) {
          throw new Error(`Costo inválido para el producto: ${item.nombre}`);
        }

        // Obtener existencias y costo actuales
        const currentProd = await tx.producto.findUnique({
          where: { id: item.productoId },
          select: {
            stock: true,
            costo: true,
          },
        });

        if (!currentProd) {
          throw new Error(`No se encontró el producto: ${item.nombre}`);
        }

        const oldStock = currentProd.stock || 0;
        const oldCost = currentProd.costo || 0;

        // Calcular el nuevo costo promedio ponderado
        let newAverageCost = oldCost;

        if (unitCost > 0) {
          if (oldStock > 0 && oldCost > 0) {
            newAverageCost =
              ((oldStock * oldCost) + (qty * unitCost)) /
              (oldStock + qty);
          } else {
            newAverageCost = unitCost;
          }
        }

        // Actualizar existencias y costo sin modificar el precio de venta
        const prod = await tx.producto.update({
          where: { id: item.productoId },
          data: {
            stock: { increment: qty },
            ...(unitCost > 0
              ? { costo: Number(newAverageCost.toFixed(4)) }
              : {}),
          },
        });

        // Registrar movimiento en Kardex
        await tx.kardex.create({
          data: {
            productoId: item.productoId,
            tipo: 'entrada',
            cantidad: qty,
            stockAntes: prod.stock - qty,
            stockDespues: prod.stock,
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

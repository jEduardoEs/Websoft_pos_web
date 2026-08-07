// src/modules/productos/services/producto.service.ts

import { ProductoRepository, FindProductosParams } from '../repositories/producto.repository';
import { Producto } from '../types/producto';
import { CreateProductoDto } from '../dto/create-producto.dto';
import { UpdateProductoDto } from '../dto/update-producto.dto';

export class ProductoService {
  private repo = new ProductoRepository();

  async getAll(params?: FindProductosParams): Promise<Producto[]> {
    return this.repo.findAll(params);
  }

  async getById(id: number): Promise<Producto | null> {
    return this.repo.findById(id);
  }

  async create(dto: CreateProductoDto): Promise<Producto> {
    const data: Omit<Producto, 'id' | 'createdAt'> = {
      codigo: dto.codigo ?? null,
      nombre: dto.nombre,
      descripcion: dto.descripcion ?? null,
      precio: dto.precio,
      costo: dto.costo ?? 0,
      stock: dto.stock ?? 0,
      stockMinimo: dto.stockMinimo ?? 5,
      categoria: dto.categoria ?? dto.categoriaId ?? 'General',
      unidad: dto.unidad ?? 'unidad',
      activo: dto.activo ?? true,
      imagenUrl: dto.imagenUrl ?? null,
    };
    return this.repo.create(data);
  }

  async update(id: number, dto: UpdateProductoDto): Promise<Producto> {
    const updateData: Partial<Producto> = {
      codigo: dto.codigo,
      nombre: dto.nombre,
      descripcion: dto.descripcion,
      precio: dto.precio,
      costo: dto.costo,
      stock: dto.stock,
      stockMinimo: dto.stockMinimo,
      categoria: dto.categoria ?? dto.categoriaId,
      unidad: dto.unidad,
      activo: dto.activo,
      imagenUrl: dto.imagenUrl,
    };
    return this.repo.update(id, updateData);
  }

  async delete(id: number): Promise<Producto> {
    return this.repo.delete(id);
  }

  async asignarCodigos(soloSinCodigo: boolean) {
    const { prisma } = await import('@/lib/prisma');

    // Get prefix from config
    const cfg = await prisma.config.findUnique({ where: { clave: 'producto_prefijo' } });
    const prefix = cfg?.valor || 'WSP';

    // Get products to update
    const where = soloSinCodigo
      ? { OR: [{ codigo: null }, { codigo: '' }] }
      : {};
    const productos = await prisma.producto.findMany({
      where, orderBy: { id: 'asc' }, select: { id: true, nombre: true, codigo: true },
    });

    if (productos.length === 0) {
      return { ok: true, actualizados: 0, mensaje: 'Todos los productos ya tienen código' };
    }

    // Get ALL currently used numbers for this prefix
    const todos = await prisma.producto.findMany({
      where: { codigo: { startsWith: prefix + '-' } },
      select: { codigo: true },
    });
    const usados = new Set<number>();
    todos.forEach(p => {
      const n = parseInt(p.codigo?.replace(prefix + '-', '') || '0');
      if (!isNaN(n) && n > 0) usados.add(n);
    });

    // Build a generator that yields unused numbers starting from 1
    function* numerosLibres() {
      let n = 1;
      while (true) {
        if (!usados.has(n)) yield n;
        n++;
      }
    }

    const gen = numerosLibres();
    const updates: { id: number; codigo: string; nombre: string }[] = [];

    for (const prod of productos) {
      const n = gen.next().value as number;
      const codigo = `${prefix}-${String(n).padStart(4, '0')}`;
      usados.add(n);
      updates.push({ id: prod.id, codigo, nombre: prod.nombre });
    }

    // Apply updates in batch transaction
    await prisma.$transaction(
      updates.map(u => prisma.producto.update({
        where: { id: u.id },
        data: { codigo: u.codigo },
      }))
    );

    return {
      ok: true,
      actualizados: updates.length,
      prefijo: prefix,
      productos: updates,
      mensaje: `${updates.length} productos actualizados con prefijo ${prefix}`,
    };
  }
}

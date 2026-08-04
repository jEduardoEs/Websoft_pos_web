// src/modules/productos/services/producto.service.ts

import { ProductoRepository } from '../repositories/producto.repository';
import { Producto } from '../types/producto';
import { CreateProductoDto } from '../dto/create-producto.dto';
import { UpdateProductoDto } from '../dto/update-producto.dto';

export class ProductoService {
  private repo = new ProductoRepository();

  async getAll(): Promise<Producto[]> {
    return this.repo.findAll();
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
}

// src/modules/categorias/services/categoria.service.ts

import { CategoriaRepository } from '../repositories/categoria.repository';
import { CreateCategoriaDto } from '../dto/create-categoria.dto';
import { UpdateCategoriaDto } from '../dto/update-categoria.dto';
import { Categoria } from '../types/categoria';

export class CategoriaService {
  private repo = new CategoriaRepository();

  async getAll(): Promise<Categoria[]> {
    return this.repo.findAll();
  }

  async getById(id: number): Promise<Categoria | null> {
    return this.repo.findById(id);
  }

  async create(dto: CreateCategoriaDto): Promise<Categoria> {
    const data: Categoria = {
      id: 0,
      nombre: dto.nombre,
      descripcion: dto.descripcion,
      activo: dto.activo ?? true,
    } as Categoria;
    return this.repo.create(data);
  }

  async update(id: number, dto: UpdateCategoriaDto): Promise<Categoria> {
    const updateData: Partial<Categoria> = { ...dto };
    return this.repo.update(id, updateData);
  }

  async delete(id: number): Promise<Categoria> {
    return this.repo.delete(id);
  }
}

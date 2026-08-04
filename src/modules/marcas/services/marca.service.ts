// src/modules/marcas/services/marca.service.ts

import { MarcaRepository } from '../repositories/marca.repository';
import { CreateMarcaDto } from '../dto/create-marca.dto';
import { UpdateMarcaDto } from '../dto/update-marca.dto';
import { Marca } from '../types/marca';

export class MarcaService {
  private repo = new MarcaRepository();

  async getAll(): Promise<Marca[]> {
    return this.repo.findAll();
  }

  async getById(id: number): Promise<Marca | null> {
    return this.repo.findById(id);
  }

  async create(dto: CreateMarcaDto): Promise<Marca> {
    const data: Marca = {
      id: 0,
      nombre: dto.nombre,
      descripcion: dto.descripcion,
      activo: dto.activo ?? true,
    } as Marca;
    return this.repo.create(data);
  }

  async update(id: number, dto: UpdateMarcaDto): Promise<Marca> {
    const updateData: Partial<Marca> = { ...dto };
    return this.repo.update(id, updateData);
  }

  async delete(id: number): Promise<Marca> {
    return this.repo.delete(id);
  }
}

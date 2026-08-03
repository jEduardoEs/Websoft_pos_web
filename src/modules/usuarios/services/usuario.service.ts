// src/modules/usuarios/services/usuario.service.ts

import { UsuarioRepository } from '../repositories/usuario.repository';
import { CreateUsuarioDto } from '../dto/create-usuario.dto';
import { UpdateUsuarioDto } from '../dto/update-usuario.dto';
import { Usuario } from '../types/usuario';
import bcrypt from 'bcryptjs';

export class UsuarioService {
  private repo = new UsuarioRepository();

  async getAll(): Promise<Usuario[]> {
    return this.repo.findAll();
  }

  async getById(id: number): Promise<Usuario | null> {
    return this.repo.findById(id);
  }

  async create(dto: CreateUsuarioDto): Promise<Usuario> {
    const hashed = await bcrypt.hash(dto.password, 10);
    const data: Usuario = {
      id: 0, // Prisma will assign
      nombre: dto.nombre,
      usuario: dto.usuario,
      password: hashed,
      rol: dto.rol,
      activo: dto.activo ?? true,
      metaMensual: dto.metaMensual,
    };
    return this.repo.create(data);
  }

  async update(id: number, dto: UpdateUsuarioDto): Promise<Usuario> {
    const updateData: Partial<Usuario> = { ...dto };
    if (dto.password) {
      updateData.password = await bcrypt.hash(dto.password, 10);
    }
    return this.repo.update(id, updateData);
  }

  async delete(id: number): Promise<Usuario> {
    return this.repo.delete(id);
  }
}

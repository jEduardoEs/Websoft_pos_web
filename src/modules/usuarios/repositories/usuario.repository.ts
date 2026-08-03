// src/modules/usuarios/repositories/usuario.repository.ts

import { prisma } from '@/lib/prisma';
import { Usuario } from '../types/usuario';

export class UsuarioRepository {
  async findAll(): Promise<Usuario[]> {
    return prisma.usuario.findMany();
  }

  async findById(id: number): Promise<Usuario | null> {
    return prisma.usuario.findUnique({ where: { id } });
  }

  async create(data: Usuario): Promise<Usuario> {
    return prisma.usuario.create({ data });
  }

  async update(id: number, data: Partial<Usuario>): Promise<Usuario> {
    return prisma.usuario.update({ where: { id }, data });
  }

  async delete(id: number): Promise<Usuario> {
    return prisma.usuario.delete({ where: { id } });
  }
}

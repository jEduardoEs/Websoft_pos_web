// src/modules/clientes/repositories/cliente.repository.ts

import { prisma } from '@/lib/prisma';
import { Cliente } from '../types/cliente';

export class ClienteRepository {
  async findAll(): Promise<Cliente[]> {
    return prisma.cliente.findMany();
  }

  async findById(id: number): Promise<Cliente | null> {
    return prisma.cliente.findUnique({ where: { id } });
  }

  async create(data: Cliente): Promise<Cliente> {
    return prisma.cliente.create({ data });
  }

  async update(id: number, data: Partial<Cliente>): Promise<Cliente> {
    return prisma.cliente.update({ where: { id }, data });
  }

  async delete(id: number): Promise<Cliente> {
    return prisma.cliente.delete({ where: { id } });
  }
}

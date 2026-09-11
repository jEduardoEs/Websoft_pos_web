// src/modules/proveedores/repositories/proveedor.repository.ts

import { prisma } from '@/lib/prisma';
import { Proveedor } from '../types/proveedor';

export class ProveedorRepository {
  async findAll(): Promise<Proveedor[]> {
    return prisma.proveedor.findMany();
  }

  async findById(id: number): Promise<Proveedor | null> {
    return prisma.proveedor.findUnique({ where: { id } });
  }

  async create(data: Proveedor): Promise<Proveedor> {
    return prisma.proveedor.create({ data });
  }

  async update(id: number, data: Partial<Proveedor>): Promise<Proveedor> {
    return prisma.proveedor.update({ where: { id }, data });
  }

  async delete(id: number): Promise<Proveedor> {
    return prisma.proveedor.update({ where: { id }, data: { activo: false } });
  }
}

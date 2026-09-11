// src/modules/permisos/repositories/permission.repository.ts
import { prisma } from '@/lib/prisma';
import { Permission } from '../types/permission.types';

export class PermissionRepository {
  async create(data: Permission): Promise<Permission> {
    return prisma.permission.create({ data });
  }

  async findAll(): Promise<Permission[]> {
    return prisma.permission.findMany();
  }

  async findById(id: string): Promise<Permission | null> {
    return prisma.permission.findUnique({ where: { id } });
  }

  async update(id: string, data: Partial<Permission>): Promise<Permission> {
    return prisma.permission.update({ where: { id }, data });
  }

  async delete(id: string): Promise<Permission> {
    return prisma.permission.delete({ where: { id } });
  }
}

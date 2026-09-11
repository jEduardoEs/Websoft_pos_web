import { prisma } from '@/lib/prisma';
import { RolDef } from '../types/role';

export const roleRepository = {
  async getAll(): Promise<RolDef[]> {
    // Roles base are defined in code; fetch custom roles from config table via Prisma
    const config = await prisma.config.findUnique({ where: { clave: 'roles_personalizados' } });
    const custom: RolDef[] = config?.valor ? JSON.parse(config.valor) : [];
    return custom;
  },
  async saveAll(roles: RolDef[]): Promise<void> {
    await prisma.config.upsert({
      where: { clave: 'roles_personalizados' },
      update: { valor: JSON.stringify(roles) },
      create: { clave: 'roles_personalizados', valor: JSON.stringify(roles) },
    });
  },
};

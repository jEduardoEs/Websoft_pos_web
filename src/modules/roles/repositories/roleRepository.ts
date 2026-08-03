import { prisma } from '@/lib/prisma';
import { RolDef } from '../types/role';

export const roleRepository = {
  async getAll(): Promise<RolDef[]> {
    // Roles base are defined in code; fetch custom roles from config table via Prisma
    const config = await prisma.config.findUnique({ where: { key: 'roles_personalizados' } });
    const custom: RolDef[] = config?.value ? JSON.parse(config.value) : [];
    return custom;
  },
  async saveAll(roles: RolDef[]): Promise<void> {
    await prisma.config.upsert({
      where: { key: 'roles_personalizados' },
      update: { value: JSON.stringify(roles) },
      create: { key: 'roles_personalizados', value: JSON.stringify(roles) },
    });
  },
};

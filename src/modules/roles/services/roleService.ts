import { RolDef } from '../types/role';
import { roleRepository } from '../repositories/roleRepository';
import { MODULOS } from '@/lib/permisos';

export const roleService = {
  async getAllRoles(): Promise<RolDef[]> {
    const custom = await roleRepository.getAll();
    // Merge base roles with custom (custom can override base)
    const merged = [...ROLES_BASE];
    custom.forEach(c => {
      const idx = merged.findIndex(r => r.id === c.id);
      if (idx >= 0) merged[idx] = c;
      else merged.push(c);
    });
    return merged;
  },
  async saveRoles(roles: RolDef[]): Promise<void> {
    // Extract only custom/modified roles (non‑base or changed)
    const toSave = roles.filter(r => {
      const base = ROLES_BASE.find(b => b.id === r.id);
      if (!base) return true;
      return base.color !== r.color || base.nombre !== r.nombre || JSON.stringify(base.permisos) !== JSON.stringify(r.permisos);
    });
    await roleRepository.saveAll(toSave);
  },
  // Helper for slugifying role names (same logic as legacy page)
  slugify(name: string): string {
    return name
      .toLowerCase()
      .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '_')
      .replace(/^_+|_+$/g, '');
  },
};

// Import base constants (must be after they are defined to avoid circular deps)
import { ROLES_BASE } from '../constants/baseRoles';

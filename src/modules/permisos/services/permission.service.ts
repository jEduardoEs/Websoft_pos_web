// src/modules/permisos/services/permission.service.ts
import { PermissionRepository } from '../repositories/permission.repository';
import { CreatePermissionDto } from '../dto/create-permission.dto';
import { Permission } from '../types/permission.types';

export class PermissionService {
  private repo = new PermissionRepository();

  async create(dto: CreatePermissionDto): Promise<Permission> {
    const permission: Permission = {
      id: crypto.randomUUID(),
      name: dto.name,
      description: dto.description,
      scope: dto.scope as any,
    };
    return this.repo.create(permission);
  }

  async findAll(): Promise<Permission[]> {
    return this.repo.findAll();
  }

  async findById(id: string): Promise<Permission | null> {
    return this.repo.findById(id);
  }

  async update(id: string, dto: Partial<CreatePermissionDto>): Promise<Permission> {
    return this.repo.update(id, dto as any);
  }

  async delete(id: string): Promise<Permission> {
    return this.repo.delete(id);
  }
}

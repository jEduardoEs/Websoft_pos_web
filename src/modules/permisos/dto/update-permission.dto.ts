// src/modules/permisos/dto/update-permission.dto.ts

export interface UpdatePermissionDto {
  name?: string;
  description?: string;
  scope?: 'GLOBAL' | 'MODULE' | 'ENTITY';
}

// src/modules/permisos/dto/create-permission.dto.ts

export interface CreatePermissionDto {
  name: string;
  description?: string;
  scope: 'GLOBAL' | 'MODULE' | 'ENTITY';
}

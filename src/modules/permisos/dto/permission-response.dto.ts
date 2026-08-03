// src/modules/permisos/dto/permission-response.dto.ts

export interface PermissionResponseDto {
  id: string;
  name: string;
  description?: string;
  scope: 'GLOBAL' | 'MODULE' | 'ENTITY';
}

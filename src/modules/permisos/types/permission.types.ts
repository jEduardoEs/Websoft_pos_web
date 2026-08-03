// src/modules/permisos/types/permission.types.ts

export interface Permission {
  id: string;
  name: string;
  description?: string;
  scope: PermissionScope;
}

export type PermissionScope = 'GLOBAL' | 'MODULE' | 'ENTITY';

export interface PermissionAssignment {
  permissionId: string;
  roleId?: string;
  userId?: string;
}

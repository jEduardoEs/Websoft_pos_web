// src/modules/permisos/validators/permission.validator.ts
import { z } from 'zod';

export const permissionSchema = z.object({
  name: z.string().min(1, 'El nombre del permiso es requerido'),
  description: z.string().optional(),
  scope: z.enum(['GLOBAL', 'MODULE', 'ENTITY']),
});

export type PermissionInput = z.infer<typeof permissionSchema>;

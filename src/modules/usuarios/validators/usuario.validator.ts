// src/modules/usuarios/validators/usuario.validator.ts

import { z } from 'zod';

export const createUsuarioSchema = z.object({
  nombre: z.string().min(1, 'El nombre es requerido'),
  usuario: z.string().min(1, 'El nombre de usuario es requerido'),
  password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres'),
  rol: z.enum(['admin', 'cajero', 'vendedor', 'contador', 'bodega']),
  activo: z.boolean().optional(),
  metaMensual: z.number().positive().optional(),
});

export const updateUsuarioSchema = createUsuarioSchema.partial();

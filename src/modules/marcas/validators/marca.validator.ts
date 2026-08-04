// src/modules/marcas/validators/marca.validator.ts

import { z } from 'zod';

export const createMarcaSchema = z.object({
  nombre: z.string().min(1, 'El nombre es requerido'),
  descripcion: z.string().optional(),
  activo: z.boolean().optional(),
});

export const updateMarcaSchema = createMarcaSchema.partial();

// src/modules/categorias/validators/categoria.validator.ts

import { z } from 'zod';

export const createCategoriaSchema = z.object({
  nombre: z.string().min(1, 'El nombre es requerido'),
  descripcion: z.string().optional(),
  activo: z.boolean().optional(),
});

export const updateCategoriaSchema = createCategoriaSchema.partial();

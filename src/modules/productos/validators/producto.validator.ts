// src/modules/productos/validators/producto.validator.ts

import { z } from 'zod';

export const createProductoSchema = z.object({
  codigo: z.string().optional().nullable(),
  nombre: z.string().min(1, 'Nombre requerido'),
  descripcion: z.string().optional().nullable(),
  precio: z.coerce.number().min(0, 'Precio debe ser >= 0'),
  costo: z.coerce.number().min(0, 'Costo debe ser >= 0').optional(),
  stock: z.coerce.number().int().min(0).optional(),
  stockMinimo: z.coerce.number().int().min(0).optional(),
  categoriaId: z.string().optional().nullable(),
  categoria: z.string().optional().nullable(), // some legacy UIs send 'categoria' directly
  activo: z.boolean().optional(),
  imagenUrl: z.string().optional().nullable(),
});

export const updateProductoSchema = createProductoSchema.partial();

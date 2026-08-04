// src/modules/inventario/validators/kardex.validator.ts

import { z } from 'zod';

export const ajusteStockSchema = z.object({
  productoId: z.coerce.number().int().min(1, 'ID de producto inválido'),
  cantidad: z.coerce.number().min(0.01, 'La cantidad debe ser mayor a 0'),
  tipo: z.enum(['entrada', 'salida']),
  motivo: z.string().optional(),
});

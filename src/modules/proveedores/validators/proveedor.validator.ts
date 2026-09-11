// src/modules/proveedores/validators/proveedor.validator.ts

import { z } from 'zod';

export const createProveedorSchema = z.object({
  nombre: z.string().min(1, 'El nombre es requerido'),
  nit: z.string().optional(),
  telefono: z.string().optional(),
  email: z.string().email('Correo inválido').optional(),
  direccion: z.string().optional(),
  contacto: z.string().optional(),
  notas: z.string().optional(),
  activo: z.boolean().optional(),
});

export const updateProveedorSchema = createProveedorSchema.partial();

// src/modules/clientes/validators/cliente.validator.ts

import { z } from 'zod';

export const createClienteSchema = z.object({
  nombre: z.string().min(1, 'El nombre es requerido'),
  nit: z.string().optional(),
  telefono: z.string().optional(),
  email: z.string().email('Correo inválido').optional(),
});

export const updateClienteSchema = createClienteSchema.partial();

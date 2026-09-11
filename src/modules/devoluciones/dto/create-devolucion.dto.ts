import { z } from 'zod';

export const createDevolucionDto = z.object({
  ventaId: z.number().optional().nullable(),
  ventaNumero: z.string().optional().nullable(),
  motivo: z.string().min(1, 'El motivo es requerido'),
  totalDevuelto: z.number().min(0, 'El total devuelto no puede ser menor a 0'),
  items: z.array(
    z.object({
      productoId: z.number().optional().nullable(),
      nombre: z.string().min(1, 'El nombre del ítem es requerido'),
      cantidad: z.number().min(0.01, 'La cantidad debe ser mayor a 0'),
      precioUnitario: z.number().min(0),
      subtotal: z.number().min(0),
    })
  ).min(1, 'La devolución debe contener al menos un ítem'),
});

export type CreateDevolucionDto = z.infer<typeof createDevolucionDto>;

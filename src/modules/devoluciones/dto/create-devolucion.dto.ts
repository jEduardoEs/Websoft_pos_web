import { z } from 'zod';

export const createDevolucionDto = z.object({
  clienteNombre: z.string().min(1, 'El nombre del cliente es requerido'),
  clienteDireccion: z.string().optional().nullable(),
  clienteTelefono: z.string().optional().nullable(),
  clienteNit: z.string().optional().nullable(),
  clienteCorreo: z.string().optional().nullable(),
  atencion: z.string().optional().nullable(),
  formaPago: z.string().optional().nullable(),
  descripcion: z.string().optional().nullable(),
  notas: z.string().optional().nullable(),
  validezDias: z.coerce.number().min(1).default(15),
  tiempoInstalacion: z.string().optional().nullable(),
  subtotal: z.number().min(0),
  descuento: z.number().min(0),
  total: z.number().min(0),
  items: z.array(
    z.object({
      codigo: z.string().optional().nullable(),
      descripcion: z.string().min(1, 'La descripción del ítem es requerida'),
      cantidad: z.number().min(0.01),
      precioUnitario: z.number().min(0),
      subtotal: z.number().min(0),
      descuento: z.number().min(0),
      totalItem: z.number().min(0),
    })
  ).min(1, 'La devolución debe contener al menos un ítem'),
});

export type CreateDevolucionDto = z.infer<typeof createDevolucionDto>;

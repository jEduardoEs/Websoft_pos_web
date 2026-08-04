import { z } from 'zod';

export const cajaRequestSchema = z.object({
  accion: z.enum(['abrir', 'cerrar', 'inyeccion', 'retiro']),
  fondo: z.number().min(0).optional(),
  notas: z.string().optional(),
  monto: z.number().min(0.01).optional(),
  motivo: z.string().optional(),
  efectivoContado: z.number().min(0).optional(),
  tarjetaBaucher: z.number().min(0).optional(),
  transferenciaContada: z.number().min(0).optional(),
});

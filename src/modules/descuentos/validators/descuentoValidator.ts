import { z } from 'zod'

export const crearDescuentoSchema = z.object({
  id: z.number().optional(),
  codigo: z.string().min(1, 'El código es requerido'),
  descripcion: z.string().nullable().optional(),
  tipo: z.enum(['porcentaje', 'fijo']).default('porcentaje'),
  valor: z.number().positive('El valor debe ser positivo'),
  minimoCompra: z.number().min(0).default(0),
  usosMaximos: z.number().min(0).default(0),
  fechaInicio: z.string().nullable().optional(),
  fechaFin: z.string().nullable().optional(),
})

export const validarDescuentoSchema = z.object({
  codigo: z.string().min(1, 'Código requerido'),
  total: z.number().min(0, 'El total de venta no puede ser negativo'),
})

export function validateCrearDescuento(data: unknown) {
  return crearDescuentoSchema.safeParse(data)
}

export function validateValidarDescuento(data: unknown) {
  return validarDescuentoSchema.safeParse(data)
}

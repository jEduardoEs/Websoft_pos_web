import { z } from 'zod';

// ============================================================================
// DTOs para Contabilidad (Cuentas, Asientos, Periodos, Activos)
// ============================================================================

export const CuentaContableSchema = z.object({
  id: z.number().optional(),
  codigo: z.string().min(1, "Código requerido"),
  nombre: z.string().min(1, "Nombre requerido"),
  tipo: z.string(), // activo, pasivo, capital, ingreso, costo, gasto
  naturaleza: z.string(), // deudora, acreedora
  nivel: z.number().int().default(1),
  cuentaPadreId: z.number().nullable().optional(),
  activa: z.boolean().default(true),
  createdAt: z.date().optional(),
});

export type CuentaContableDTO = z.infer<typeof CuentaContableSchema>;

export const PartidaContableSchema = z.object({
  id: z.number().optional(),
  asientoId: z.number().optional(),
  cuentaId: z.number().or(z.string().transform(Number)),
  debe: z.number().min(0).default(0),
  haber: z.number().min(0).default(0),
  descripcion: z.string().nullable().optional(),
});

export type PartidaContableDTO = z.infer<typeof PartidaContableSchema>;

export const AsientoContableSchema = z.object({
  id: z.number().optional(),
  numero: z.string().optional(),
  fecha: z.union([z.string(), z.date()]),
  concepto: z.string().min(1, "Concepto requerido"),
  tipo: z.string().default("manual"),
  referenciaId: z.number().nullable().optional(),
  referenciaTipo: z.string().nullable().optional(),
  referenciaNum: z.string().nullable().optional(),
  periodoId: z.number().nullable().optional(),
  usuarioNombre: z.string().nullable().optional(),
  partidas: z.array(PartidaContableSchema).min(2, "Se requieren al menos 2 partidas (Debe y Haber)"),
});

export type AsientoContableDTO = z.infer<typeof AsientoContableSchema>;

export const PeriodoContableSchema = z.object({
  id: z.number().optional(),
  nombre: z.string(),
  fechaInicio: z.union([z.string(), z.date()]),
  fechaFin: z.union([z.string(), z.date()]),
  estado: z.string().default("abierto"), // abierto, cerrado
  cerradoPor: z.string().nullable().optional(),
  cerradoAt: z.date().nullable().optional(),
});

export type PeriodoContableDTO = z.infer<typeof PeriodoContableSchema>;

export const ActivoFijoSchema = z.object({
  id: z.number().optional(),
  codigo: z.string().min(1, "Código requerido"),
  nombre: z.string().min(1, "Nombre requerido"),
  descripcion: z.string().nullable().optional(),
  fechaAdquisicion: z.union([z.string(), z.date()]),
  costoOriginal: z.number().min(0),
  vidaUtilAnios: z.number().int().min(1),
  valorResidual: z.number().min(0).default(0),
  depreciacionMensual: z.number().min(0).optional(),
  depreciacionAcum: z.number().min(0).default(0),
  valorNeto: z.number().min(0).optional(),
  estado: z.string().default("activo"),
  notas: z.string().nullable().optional(),
});

export type ActivoFijoDTO = z.infer<typeof ActivoFijoSchema>;

export interface DescuentoResponseDTO {
  id: number
  codigo: string
  descripcion: string | null
  tipo: 'porcentaje' | 'fijo' | string
  valor: number
  minimoCompra: number
  usosMaximos: number
  usosActuales: number
  fechaInicio: string | null
  fechaFin: string | null
  activo: boolean
}

export interface CreateDescuentoDTO {
  id?: number
  codigo: string
  descripcion?: string | null
  tipo?: string
  valor: number
  minimoCompra?: number
  usosMaximos?: number
  fechaInicio?: string | null
  fechaFin?: string | null
}

export interface UpdateDescuentoDTO {
  id: number
  codigo?: string
  descripcion?: string | null
  tipo?: string
  valor?: number
  minimoCompra?: number
  usosMaximos?: number
  fechaInicio?: string | null
  fechaFin?: string | null
  activo?: boolean
}

export interface DeleteDescuentoDTO {
  id: number
}

export interface ValidateDescuentoDTO {
  codigo: string
  total: number
}

export interface ValidarDescuentoResponseDTO {
  ok: boolean
  porcentaje?: number
  montoDescuento?: number
  descuento?: DescuentoResponseDTO
  error?: string
}

// Aliases para firmas
export type CrearDescuentoDTO = CreateDescuentoDTO
export type ValidarDescuentoInputDTO = ValidateDescuentoDTO
export type ValidarDescuentoResultDTO = ValidarDescuentoResponseDTO

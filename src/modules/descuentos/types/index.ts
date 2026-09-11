import { DescuentoResponseDTO } from '../dto/DescuentoDTO'

export type Descuento = DescuentoResponseDTO
export type DescuentoEntity = DescuentoResponseDTO

export type TipoDescuento = 'porcentaje' | 'fijo'
export type EstadoDescuento = 'activo' | 'inactivo'

export interface DescuentoFormState {
  id: number
  codigo: string
  descripcion: string
  tipo: string
  valor: string | number
  minimoCompra: string | number
  usosMaximos: string | number
  fechaInicio: string
  fechaFin: string
}

export interface DescuentoFilters {
  search?: string
  tipo?: TipoDescuento
  activo?: boolean
}

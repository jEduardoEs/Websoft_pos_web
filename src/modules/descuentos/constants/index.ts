export const DESCUENTOS_MESSAGES = {
  REQUIRED_FIELDS: 'Código y valor son requeridos',
  SAVED_SUCCESS: 'Descuento guardado exitosamente',
  SAVE_ERROR: 'Error al guardar el descuento',
  DEACTIVATED_SUCCESS: 'Código desactivado',
  DEACTIVATE_ERROR: 'Error al desactivar el descuento',
  CONFIRM_DEACTIVATE: (codigo: string) => `¿Desactivar código "${codigo}"?`,
  INVALID_CODE: 'Código no válido',
  NOT_YET_VALID: 'El descuento aún no está vigente',
  EXPIRED: 'El descuento expiró',
  MINIMUM_PURCHASE: (min: number) => `Mínimo de compra: Q ${min}`,
  EXHAUSTED: 'Código agotado',
} as const

export const DESCUENTOS_DEFAULTS = {
  EMPTY_FORM: {
    id: 0,
    codigo: '',
    descripcion: '',
    tipo: 'porcentaje',
    valor: '',
    minimoCompra: '',
    usosMaximos: '0',
    fechaInicio: '',
    fechaFin: '',
  },
} as const

export enum TipoDescuentoEnum {
  PORCENTAJE = 'porcentaje',
  FIJO = 'fijo',
}

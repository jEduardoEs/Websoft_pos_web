import { CrearDescuentoDTO, DescuentoResponseDTO } from '../dto/DescuentoDTO'
import { DescuentoFormState } from '../types'
import { validarDescuentoRules } from './validarDescuento'

export class DescuentosLogic {
  static validarReglas = validarDescuentoRules

  static formToDTO(form: DescuentoFormState): CrearDescuentoDTO {
    return {
      id: form.id > 0 ? form.id : undefined,
      codigo: form.codigo.trim().toUpperCase(),
      descripcion: form.descripcion.trim() || null,
      tipo: form.tipo,
      valor: Number(form.valor) || 0,
      minimoCompra: Number(form.minimoCompra) || 0,
      usosMaximos: Number(form.usosMaximos) || 0,
      fechaInicio: form.fechaInicio || null,
      fechaFin: form.fechaFin || null,
    }
  }

  static formatearUsos(d: DescuentoResponseDTO): string {
    const max = d.usosMaximos === 0 ? '∞' : String(d.usosMaximos)
    return `${d.usosActuales}/${max}`
  }
}

export { validarDescuentoRules }

import { DescuentoResponseDTO, ValidarDescuentoResultDTO } from '../dto/DescuentoDTO'

export function validarDescuentoRules(
  descuento: DescuentoResponseDTO | null,
  total: number
): ValidarDescuentoResultDTO {
  if (!descuento) {
    return { ok: false, error: 'Código de descuento no encontrado' }
  }

  if (!descuento.activo) {
    return { ok: false, error: 'El código de descuento está desactivado' }
  }

  const now = new Date()
  if (descuento.fechaInicio) {
    const start = new Date(descuento.fechaInicio)
    start.setHours(0, 0, 0, 0)
    if (now < start) {
      return { ok: false, error: 'El descuento aún no está vigente' }
    }
  }

  if (descuento.fechaFin) {
    const end = new Date(descuento.fechaFin)
    end.setHours(23, 59, 59, 999)
    if (now > end) {
      return { ok: false, error: 'El descuento expiró' }
    }
  }

  if (descuento.minimoCompra > 0 && total < descuento.minimoCompra) {
    return { ok: false, error: `Mínimo de compra requerido: Q ${descuento.minimoCompra.toFixed(2)}` }
  }

  if (descuento.usosMaximos > 0 && descuento.usosActuales >= descuento.usosMaximos) {
    return { ok: false, error: `Código agotado (${descuento.usosActuales}/${descuento.usosMaximos} usos)` }
  }


  const isPorcentaje = descuento.tipo === 'porcentaje'
  const montoDescuento = isPorcentaje
    ? Number((total * (descuento.valor / 100)).toFixed(2))
    : Math.min(total, descuento.valor)

  const porcentaje = isPorcentaje
    ? descuento.valor
    : total > 0 ? Number(((montoDescuento / total) * 100).toFixed(4)) : 0

  return {
    ok: true,
    porcentaje,
    montoDescuento: Number(montoDescuento.toFixed(2)),
    descuento,
  }
}

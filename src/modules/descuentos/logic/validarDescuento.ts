import { DescuentoResponseDTO, ValidarDescuentoResultDTO } from '../dto/DescuentoDTO'

export function validarDescuentoRules(
  descuento: DescuentoResponseDTO | null,
  total: number
): ValidarDescuentoResultDTO {
  if (!descuento || !descuento.activo) {
    return { ok: false, error: 'Código no válido' }
  }

  const now = new Date()
  if (descuento.fechaInicio && now < new Date(descuento.fechaInicio)) {
    return { ok: false, error: 'El descuento aún no está vigente' }
  }

  if (descuento.fechaFin && now > new Date(descuento.fechaFin)) {
    return { ok: false, error: 'El descuento expiró' }
  }

  if (descuento.minimoCompra > 0 && total < descuento.minimoCompra) {
    return { ok: false, error: `Mínimo de compra: Q ${descuento.minimoCompra}` }
  }

  if (descuento.usosMaximos > 0 && descuento.usosActuales >= descuento.usosMaximos) {
    return { ok: false, error: 'Código agotado' }
  }

  const porcentaje =
    descuento.tipo === 'porcentaje' ? descuento.valor : total > 0 ? (descuento.valor / total) * 100 : 0

  return {
    ok: true,
    porcentaje: Number(porcentaje.toFixed(2)),
    descuento,
  }
}

import { fetchClient } from '@/services/http'
import { CrearDescuentoDTO, DescuentoResponseDTO, ValidarDescuentoResultDTO } from '../dto/DescuentoDTO'

export class DescuentosService {
  async obtenerTodos(): Promise<DescuentoResponseDTO[]> {
    const res = await fetchClient.get<DescuentoResponseDTO[]>('/api/descuentos')
    if (res.ok && Array.isArray(res.data)) {
      return res.data
    }
    return []
  }

  async guardar(data: CrearDescuentoDTO): Promise<boolean> {
    const res = await fetchClient.post<{ ok: boolean }>('/api/descuentos', data)
    return Boolean(res.ok && res.data?.ok)
  }

  async desactivar(id: number): Promise<boolean> {
    const res = await fetchClient.delete<{ ok: boolean }>(`/api/descuentos?id=${id}`)
    return Boolean(res.ok && res.data?.ok)
  }

  async toggleActivo(id: number, activo: boolean): Promise<boolean> {
    try {
      const res = await fetch('/api/descuentos', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, activo }),
      })
      const data = await res.json()
      return Boolean(res.ok && data.ok)
    } catch {
      return false
    }
  }

  async validarCodigo(codigo: string, total: number): Promise<ValidarDescuentoResultDTO> {
    const res = await fetchClient.post<ValidarDescuentoResultDTO>('/api/descuentos/validar', {
      codigo,
      total,
    })
    if (res.ok && res.data) {
      return res.data
    }
    return { ok: false, error: res.error || 'Error al validar el código' }
  }
}

export const descuentosService = new DescuentosService()

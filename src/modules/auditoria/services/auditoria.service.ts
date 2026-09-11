export interface AuditLog {
  id: number
  fecha: string
  usuarioId: number | null
  usuarioNombre: string | null
  accion: string
  tabla: string | null
  registroId: string | null
  detalle: string | null
  ip: string | null
}

export interface FetchAuditoriaParams {
  tabla?: string
  accion?: string
  desde?: string
  hasta?: string
}

export interface FetchAuditoriaResponse {
  logs?: AuditLog[]
  tablas?: string[]
  error?: string
}

export class AuditoriaService {
  static async fetchLogs(params: FetchAuditoriaParams = {}): Promise<FetchAuditoriaResponse> {
    const urlParams = new URLSearchParams()
    if (params.tabla) urlParams.set('tabla', params.tabla)
    if (params.accion) urlParams.set('accion', params.accion)
    if (params.desde) urlParams.set('desde', params.desde)
    if (params.hasta) urlParams.set('hasta', params.hasta)

    const res = await fetch(`/api/auditoria?${urlParams.toString()}`)
    return res.json()
  }
}

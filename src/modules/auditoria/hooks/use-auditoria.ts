import { useState, useCallback } from 'react'
import { toast } from 'sonner'
import { AuditoriaService, AuditLog } from '../services/auditoria.service'

export function useAuditoria() {
  const [logs, setLogs] = useState<AuditLog[]>([])
  const [tablas, setTablas] = useState<string[]>([])
  const [loading, setLoading] = useState(false)

  const [filtroTabla, setFiltroTabla] = useState('')
  const [filtroAccion, setFiltroAccion] = useState('')
  const [desde, setDesde] = useState('')
  const [hasta, setHasta] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const data = await AuditoriaService.fetchLogs({
        tabla: filtroTabla,
        accion: filtroAccion,
        desde,
        hasta
      })
      if (data.error) {
        toast.error(data.error)
      } else {
        setLogs(data.logs || [])
        setTablas(data.tablas || [])
      }
    } catch {
      toast.error('Error al cargar auditoría')
    }
    setLoading(false)
  }, [filtroTabla, filtroAccion, desde, hasta])

  const limpiarFiltros = useCallback(() => {
    setFiltroTabla('')
    setFiltroAccion('')
    setDesde('')
    setHasta('')
  }, [])

  return {
    logs,
    tablas,
    loading,
    filtros: {
      filtroTabla,
      setFiltroTabla,
      filtroAccion,
      setFiltroAccion,
      desde,
      setDesde,
      hasta,
      setHasta
    },
    load,
    limpiarFiltros
  }
}

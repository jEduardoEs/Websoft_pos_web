'use client'
import { useState, useEffect, useCallback } from 'react'
import { toast } from 'sonner'
import { fmtDateTime } from '@/lib/utils'

interface AuditLog {
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

const ACCION_BADGE: Record<string, string> = {
  CREATE: 'badge-green',
  UPDATE: 'badge-blue',
  DELETE: 'badge-red',
  LOGIN: 'badge-purple',
  LOGOUT: 'badge-gray',
}

export default function AuditoriaPage() {
  const [logs, setLogs] = useState<AuditLog[]>([])
  const [tablas, setTablas] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [filtroTabla, setFiltroTabla] = useState('')
  const [filtroAccion, setFiltroAccion] = useState('')
  const [desde, setDesde] = useState('')
  const [hasta, setHasta] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    const params = new URLSearchParams()
    if (filtroTabla) params.set('tabla', filtroTabla)
    if (filtroAccion) params.set('accion', filtroAccion)
    if (desde) params.set('desde', desde)
    if (hasta) params.set('hasta', hasta)
    try {
      const res = await fetch(`/api/auditoria?${params}`)
      const data = await res.json()
      if (data.error) toast.error(data.error)
      else { setLogs(data.logs || []); setTablas(data.tablas || []) }
    } catch { toast.error('Error al cargar auditoría') }
    setLoading(false)
  }, [filtroTabla, filtroAccion, desde, hasta])

  useEffect(() => { load() }, [load])

  const thS = { background: '#f8fafc', fontSize: 11, fontWeight: 700 as const, color: '#64748b', textTransform: 'uppercase' as const, padding: '9px 14px', textAlign: 'left' as const, borderBottom: '1px solid #e2e8f0' }
  const tdS = { padding: '10px 14px', fontSize: 12, borderBottom: '1px solid #f1f5f9', color: '#0f172a' }

  return (
    <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 18 }}>
      <div>
        <h1 style={{ fontSize: 20, fontWeight: 700, color: '#0f172a' }}>Auditoría</h1>
        <p style={{ fontSize: 12, color: '#64748b', marginTop: 3 }}>Registro de acciones realizadas en el sistema</p>
      </div>

      <div className="card" style={{ padding: 16 }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 12, alignItems: 'end' }}>
          <div>
            <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', marginBottom: 4 }}>Tabla</label>
            <select className="input" value={filtroTabla} onChange={e => setFiltroTabla(e.target.value)}>
              <option value="">Todas</option>
              {tablas.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <div>
            <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', marginBottom: 4 }}>Acción</label>
            <select className="input" value={filtroAccion} onChange={e => setFiltroAccion(e.target.value)}>
              <option value="">Todas</option>
              <option value="CREATE">Creación</option>
              <option value="UPDATE">Actualización</option>
              <option value="DELETE">Eliminación</option>
              <option value="LOGIN">Inicio sesión</option>
              <option value="LOGOUT">Cierre sesión</option>
            </select>
          </div>
          <div>
            <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', marginBottom: 4 }}>Desde</label>
            <input className="input" type="date" value={desde} onChange={e => setDesde(e.target.value)} />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', marginBottom: 4 }}>Hasta</label>
            <input className="input" type="date" value={hasta} onChange={e => setHasta(e.target.value)} />
          </div>
          <div>
            <button className="btn-ghost btn-sm" onClick={() => { setFiltroTabla(''); setFiltroAccion(''); setDesde(''); setHasta('') }}>Limpiar filtros</button>
          </div>
        </div>
      </div>

      <div className="card">
        <div style={{ padding: '12px 16px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: 13, fontWeight: 700, color: '#0f172a' }}>{logs.length} registro(s)</span>
          <button className="btn-ghost btn-sm" onClick={load}>↺ Actualizar</button>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>{['Fecha', 'Usuario', 'Acción', 'Tabla', 'Registro', 'Detalle'].map(h => <th key={h} style={thS}>{h}</th>)}</tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={6} style={{ textAlign: 'center', padding: 40, color: '#94a3b8' }}>Cargando...</td></tr>
              ) : logs.length === 0 ? (
                <tr><td colSpan={6} style={{ textAlign: 'center', padding: 40, color: '#94a3b8' }}>Sin registros</td></tr>
              ) : logs.map(log => (
                <tr key={log.id}>
                  <td style={{ ...tdS, whiteSpace: 'nowrap', color: '#64748b' }}>{fmtDateTime(log.fecha)}</td>
                  <td style={{ ...tdS, fontWeight: 600 }}>{log.usuarioNombre || '—'}</td>
                  <td style={tdS}>
                    <span className={ACCION_BADGE[log.accion] || 'badge-gray'}>{log.accion}</span>
                  </td>
                  <td style={{ ...tdS, fontFamily: 'monospace', color: '#475569' }}>{log.tabla || '—'}</td>
                  <td style={{ ...tdS, fontFamily: 'monospace', color: '#94a3b8' }}>{log.registroId || '—'}</td>
                  <td style={{ ...tdS, color: '#64748b' }}>{log.detalle || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

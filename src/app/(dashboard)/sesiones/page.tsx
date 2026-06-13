'use client'
import { useState, useEffect, useCallback } from 'react'
import { toast } from 'sonner'

export default function SesionesPage() {
  const [sessions, setSessions] = useState<any[]>([])
  const [sessionError, setSessionError] = useState('')

  const loadSessions = useCallback(async () => {
    try {
      const res = await fetch('/api/sesion')
      const data = await res.json()
      if (data.error) { setSessionError(data.error); setSessions([]) }
      else { setSessionError(''); setSessions(Array.isArray(data) ? data : []) }
    } catch { setSessionError('Error al cargar sesiones') }
  }, [])

  const forzarCerrarSesion = async (usuarioId: number, nombre: string) => {
    if (!confirm(`¿Cerrar sesión de ${nombre}?`)) return
    const res = await fetch(`/api/sesion?usuario_id=${usuarioId}`, { method: 'DELETE' })
    if ((await res.json()).ok) { toast.success(`Sesión de ${nombre} cerrada`); loadSessions() }
    else toast.error('No se pudo cerrar la sesión')
  }

  useEffect(() => {
    loadSessions()
    const interval = setInterval(loadSessions, 30000)
    return () => clearInterval(interval)
  }, [loadSessions])

  return (
    <div style={{ padding: 24, maxWidth: 860 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 800, color: '#0f172a' }}>Sesiones Activas</h1>
          <div style={{ fontSize: 13, color: '#64748b', marginTop: 2 }}>Usuarios con sesión abierta en el sistema</div>
        </div>
      </div>

      <div className="card">
        <div style={{ padding: '14px 18px', borderBottom: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ fontWeight: 700, fontSize: 15, color: '#0f172a' }}>Sesiones Activas</div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <span style={{ fontSize: 11, color: '#94a3b8' }}>Se actualiza cada 30s</span>
            <button className="btn-ghost btn-sm" onClick={loadSessions}>↺ Actualizar</button>
          </div>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>{['Usuario', 'Rol', 'Login', 'Última actividad', 'Estado', ''].map(h => (
                <th key={h} style={{ background: '#f8fafc', fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', padding: '9px 14px', textAlign: 'left', borderBottom: '1px solid #e2e8f0' }}>{h}</th>
              ))}</tr>
            </thead>
            <tbody>
              {sessions.length === 0
                ? <tr><td colSpan={6} style={{ textAlign: 'center', padding: 40, color: '#94a3b8' }}>Sin sesiones activas</td></tr>
                : sessions.map((s: any) => {
                  const lastAct = new Date(s.lastActivity)
                  const minutesAgo = Math.floor((Date.now() - lastAct.getTime()) / 60000)
                  const isActive = minutesAgo < 10
                  return (
                    <tr key={s.id}>
                      <td style={{ padding: '10px 14px', fontWeight: 600, fontSize: 13, borderBottom: '1px solid #f1f5f9', color: '#0f172a' }}>{s.usuario?.nombre}</td>
                      <td style={{ padding: '10px 14px', borderBottom: '1px solid #f1f5f9' }}>
                        <span style={{ padding: '2px 8px', borderRadius: 20, fontSize: 11, fontWeight: 700, background: '#eff6ff', color: '#1581E3', textTransform: 'capitalize' }}>{s.usuario?.rol}</span>
                      </td>
                      <td style={{ padding: '10px 14px', fontSize: 12, borderBottom: '1px solid #f1f5f9', color: '#64748b', whiteSpace: 'nowrap' }}>{new Date(s.createdAt).toLocaleString('es-GT')}</td>
                      <td style={{ padding: '10px 14px', fontSize: 12, borderBottom: '1px solid #f1f5f9', color: '#64748b' }}>
                        {minutesAgo === 0 ? 'Ahora mismo' : `Hace ${minutesAgo} min`}
                      </td>
                      <td style={{ padding: '10px 14px', borderBottom: '1px solid #f1f5f9' }}>
                        <span style={{ padding: '2px 8px', borderRadius: 20, fontSize: 11, fontWeight: 700, background: isActive ? '#f0fdf4' : '#f8fafc', color: isActive ? '#16a34a' : '#94a3b8' }}>
                          {isActive ? '● Activa' : '○ Inactiva'}
                        </span>
                      </td>
                      <td style={{ padding: '10px 14px', borderBottom: '1px solid #f1f5f9' }}>
                        <button
                          onClick={() => forzarCerrarSesion(s.usuarioId, s.usuario?.nombre)}
                          style={{ fontSize: 11, fontWeight: 700, padding: '4px 10px', background: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca', borderRadius: 6, cursor: 'pointer', fontFamily: 'inherit' }}>
                          Cerrar sesión
                        </button>
                      </td>
                    </tr>
                  )
                })}
            </tbody>
          </table>
        </div>
        {sessionError && (
          <div style={{ padding: '12px 18px', background: '#fef2f2', borderTop: '1px solid #fecaca', fontSize: 12, color: '#dc2626', fontWeight: 600 }}>
            ⚠ {sessionError}
          </div>
        )}
        <div style={{ padding: '12px 18px', background: '#fffbeb', borderTop: '1px solid #fef3c7', fontSize: 12, color: '#92400e' }}>
          Los cajeros no pueden iniciar sesión si ya tienen una sesión activa en otro equipo. La sesión expira tras 8 horas. Admin tiene timeout de 30 min por inactividad.
        </div>
      </div>
    </div>
  )
}

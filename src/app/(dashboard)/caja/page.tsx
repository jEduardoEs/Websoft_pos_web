'use client'
import { useState, useEffect } from 'react'
import { toast } from 'sonner'
import { fmt, fmtDateTime } from '@/lib/utils'

export default function CajaPage() {
  const [activa, setActiva] = useState<any>(null)
  const [fondo, setFondo] = useState('')
  const [notas, setNotas] = useState('')
  const [loading, setLoading] = useState(false)

  const load = async () => { const d = await (await fetch('/api/apertura')).json(); setActiva(d.activa) }
  useEffect(() => { load() }, [])

  const abrir = async () => {
    setLoading(true)
    const res = await fetch('/api/apertura', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ accion: 'abrir', fondo: parseFloat(fondo) || 0, notas }) })
    const data = await res.json()
    setLoading(false)
    if (data.ok) { toast.success('Caja abierta'); setFondo(''); setNotas(''); load() }
    else toast.error(data.error || 'Error')
  }

  const cerrar = async () => {
    if (!confirm('¿Cerrar la caja?')) return
    setLoading(true)
    const res = await fetch('/api/apertura', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ accion: 'cerrar', notas }) })
    const data = await res.json()
    setLoading(false)
    if (data.ok) { toast.success('Caja cerrada'); load() }
    else toast.error(data.error || 'Error')
  }

  return (
    <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 18 }}>
      <div>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: '#0f172a' }}>Apertura / Cierre de Caja</h1>
        <p style={{ fontSize: 13, color: '#64748b', marginTop: 3 }}>Control de turno de caja</p>
      </div>

      <div className="card" style={{ padding: 28, maxWidth: 480 }}>
        {activa ? (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
              <div style={{ width: 12, height: 12, borderRadius: '50%', background: '#22c55e', boxShadow: '0 0 0 3px rgba(34,197,94,.2)' }} />
              <span style={{ fontSize: 16, fontWeight: 700, color: '#16a34a' }}>Caja Abierta</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 24 }}>
              {[
                ['Abierta desde', fmtDateTime(activa.fecha)],
                ['Fondo inicial', fmt(activa.fondoInicial)],
                ['Cajero', activa.usuarioNombre || '—'],
                ['Notas', activa.notas || '—'],
              ].map(([l, v]) => (
                <div key={l} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #f1f5f9' }}>
                  <span style={{ fontSize: 13, color: '#64748b' }}>{l}</span>
                  <span style={{ fontSize: 13, fontWeight: 600, color: '#0f172a' }}>{v}</span>
                </div>
              ))}
            </div>
            <button className="btn-danger" style={{ width: '100%' }} onClick={cerrar} disabled={loading}>
              {loading ? 'Procesando...' : 'Cerrar Caja'}
            </button>
          </div>
        ) : (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
              <div style={{ width: 12, height: 12, borderRadius: '50%', background: '#9ca3af' }} />
              <span style={{ fontSize: 16, fontWeight: 700, color: '#64748b' }}>Caja Cerrada</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginBottom: 24 }}>
              <div>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', marginBottom: 4 }}>Fondo inicial</label>
                <input className="input" type="number" value={fondo} onChange={e => setFondo(e.target.value)} placeholder="0.00" />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', marginBottom: 4 }}>Notas</label>
                <input className="input" value={notas} onChange={e => setNotas(e.target.value)} placeholder="Opcional" />
              </div>
            </div>
            <button className="btn-success" style={{ width: '100%' }} onClick={abrir} disabled={loading}>
              {loading ? 'Abriendo...' : 'Abrir Caja'}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

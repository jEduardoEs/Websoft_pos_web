'use client'
import { useState, useEffect } from 'react'
import { toast } from 'sonner'
import { fmt, fmtDateTime } from '@/lib/utils'

interface Cierre { id: number; fecha: string; fechaInicio: string; fechaFin: string; totalVentas: number; granTotal: number; totalEfectivo: number; totalTarjeta: number; totalTransferencia: number; usuarioNombre: string; notas: string | null }

export default function CierresPage() {
  const today = new Date().toISOString().slice(0, 10)
  const [cierres, setCierres] = useState<Cierre[]>([])
  const [fi, setFi] = useState(today)
  const [ff, setFf] = useState(today)
  const [notas, setNotas] = useState('')
  const [loading, setLoading] = useState(false)

  const load = async () => { setCierres(await (await fetch('/api/cierres')).json()) }
  useEffect(() => { load() }, [])

  const hacer = async () => {
    if (!confirm('¿Hacer cierre de caja?')) return
    setLoading(true)
    const res = await fetch('/api/cierres', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ fechaInicio: fi, fechaFin: ff, notas }) })
    const data = await res.json()
    setLoading(false)
    if (data.ok) { toast.success('Cierre realizado'); setNotas(''); load() }
    else toast.error(data.error || 'Error')
  }

  return (
    <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 18 }}>
      <div>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: '#0f172a' }}>Cierre de Caja</h1>
        <p style={{ fontSize: 13, color: '#64748b', marginTop: 3 }}>Registra el cierre diario de ventas</p>
      </div>

      <div className="card" style={{ padding: 20 }}>
        <h3 style={{ fontWeight: 700, fontSize: 15, marginBottom: 16 }}>Nuevo cierre</h3>
        <div style={{ display: 'flex', gap: 12, alignItems: 'flex-end', flexWrap: 'wrap' }}>
          <div>
            <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', marginBottom: 4 }}>Desde</label>
            <input className="input" type="date" value={fi} onChange={e => setFi(e.target.value)} />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', marginBottom: 4 }}>Hasta</label>
            <input className="input" type="date" value={ff} onChange={e => setFf(e.target.value)} />
          </div>
          <div style={{ flex: 1, minWidth: 200 }}>
            <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', marginBottom: 4 }}>Notas</label>
            <input className="input" value={notas} onChange={e => setNotas(e.target.value)} placeholder="Opcional" />
          </div>
          <button className="btn-primary" onClick={hacer} disabled={loading}>{loading ? 'Procesando...' : 'Hacer Cierre'}</button>
        </div>
      </div>

      <div className="card">
        <div style={{ padding: '14px 18px', borderBottom: '1px solid #f1f5f9', fontWeight: 700, fontSize: 14 }}>Historial de cierres</div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>{['Fecha', 'Período', 'Ventas', 'Efectivo', 'Tarjeta', 'Transferencia', 'Gran Total', 'Usuario'].map(h => (
                <th key={h} style={{ background: '#f8fafc', fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', padding: '9px 13px', textAlign: 'left', borderBottom: '1px solid #f1f5f9', whiteSpace: 'nowrap' }}>{h}</th>
              ))}</tr>
            </thead>
            <tbody>
              {cierres.length === 0 ? <tr><td colSpan={8} style={{ textAlign: 'center', padding: 40, color: '#475569' }}>Sin cierres</td></tr>
              : cierres.map(c => (
                <tr key={c.id}>
                  <td style={{ padding: '10px 13px', fontSize: 12, borderBottom: '1px solid #f1f5f9', whiteSpace: 'nowrap' }}>{fmtDateTime(c.fecha)}</td>
                  <td style={{ padding: '10px 13px', fontSize: 11, borderBottom: '1px solid #f1f5f9', color: '#64748b', whiteSpace: 'nowrap' }}>{fmtDateTime(c.fechaInicio)} — {fmtDateTime(c.fechaFin)}</td>
                  <td style={{ padding: '10px 13px', fontSize: 13, borderBottom: '1px solid #f1f5f9' }}>{c.totalVentas}</td>
                  <td style={{ padding: '10px 13px', fontSize: 13, borderBottom: '1px solid #f1f5f9' }}>{fmt(c.totalEfectivo)}</td>
                  <td style={{ padding: '10px 13px', fontSize: 13, borderBottom: '1px solid #f1f5f9' }}>{fmt(c.totalTarjeta)}</td>
                  <td style={{ padding: '10px 13px', fontSize: 13, borderBottom: '1px solid #f1f5f9' }}>{fmt(c.totalTransferencia)}</td>
                  <td style={{ padding: '10px 13px', fontSize: 14, fontWeight: 700, borderBottom: '1px solid #f1f5f9', color: '#16a34a' }}>{fmt(c.granTotal)}</td>
                  <td style={{ padding: '10px 13px', fontSize: 12, borderBottom: '1px solid #f1f5f9', color: '#64748b' }}>{c.usuarioNombre}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

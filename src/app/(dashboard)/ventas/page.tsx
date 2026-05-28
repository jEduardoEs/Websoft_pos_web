'use client'
import { useState, useEffect } from 'react'
import { toast } from 'sonner'
import { fmt, fmtDateTime } from '@/lib/utils'

interface Venta {
  id: number; numero: string; fecha: string; clienteNombre: string; clienteNit: string
  subtotal: number; descuento: number; impuesto: number; total: number
  metodoPago: string; montoRecibido: number; cambio: number; estado: string
  usuarioNombre: string; notas: string | null
  items?: { nombre: string; cantidad: number; precioUnitario: number; subtotal: number }[]
}

export default function VentasPage() {
  const [ventas, setVentas] = useState<Venta[]>([])
  const [fi, setFi] = useState(new Date().toISOString().slice(0, 10))
  const [ff, setFf] = useState(new Date().toISOString().slice(0, 10))
  const [estado, setEstado] = useState('')
  const [selected, setSelected] = useState<Venta | null>(null)
  const [loading, setLoading] = useState(false)

  const load = async () => {
    setLoading(true)
    const p = new URLSearchParams({ fecha_ini: fi, fecha_fin: ff, ...(estado ? { estado } : {}) })
    const res = await fetch(`/api/ventas?${p}`)
    const data = await res.json()
    setVentas(data)
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  const anular = async () => {
    if (!selected) return
    const motivo = prompt('Motivo de anulación:')
    if (!motivo) return
    const res = await fetch(`/api/ventas/${selected.id}`, {
      method: 'DELETE', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ motivo }),
    })
    const data = await res.json()
    if (data.ok) { toast.success('Venta anulada'); setSelected(null); load() }
    else toast.error(data.error || 'Error')
  }

  const totalGeneral = ventas.filter(v => v.estado === 'completada').reduce((s, v) => s + v.total, 0)

  return (
    <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 18 }}>
      <div>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: '#e2e8f0' }}>Historial de Ventas</h1>
        <p style={{ fontSize: 13, color: '#94a3b8', marginTop: 3 }}>Consulta y gestiona todas las ventas</p>
      </div>

      <div className="card" style={{ padding: 16 }}>
        <div style={{ display: 'flex', gap: 10, alignItems: 'flex-end', flexWrap: 'wrap' }}>
          <div>
            <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', marginBottom: 4 }}>Desde</label>
            <input className="input" type="date" value={fi} onChange={e => setFi(e.target.value)} />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', marginBottom: 4 }}>Hasta</label>
            <input className="input" type="date" value={ff} onChange={e => setFf(e.target.value)} />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', marginBottom: 4 }}>Estado</label>
            <select className="input" value={estado} onChange={e => setEstado(e.target.value)}>
              <option value="">Todos</option>
              <option value="completada">Completada</option>
              <option value="anulada">Anulada</option>
            </select>
          </div>
          <button className="btn-primary" onClick={load} disabled={loading}>
            {loading ? 'Buscando...' : 'Buscar'}
          </button>
          <button className="btn-ghost" onClick={() => { setFi(new Date().toISOString().slice(0, 10)); setFf(new Date().toISOString().slice(0, 10)); setTimeout(load, 100) }}>
            Hoy
          </button>
          <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 16 }}>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: 11, color: '#94a3b8', fontWeight: 700, textTransform: 'uppercase' }}>{ventas.length} ventas</div>
              <div style={{ fontSize: 18, fontWeight: 700, color: '#60a5fa' }}>{fmt(totalGeneral)}</div>
            </div>
          </div>
        </div>
      </div>

      <div className="card">
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>{['#', 'Fecha', 'Cliente', 'NIT', 'Método', 'Total', 'Cajero', 'Estado', ''].map(h => (
                <th key={h} style={{ background: 'rgba(37,99,235,.1)', fontSize: 11, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '.5px', padding: '9px 13px', textAlign: 'left', borderBottom: '1px solid rgba(255,255,255,.06)', whiteSpace: 'nowrap' }}>{h}</th>
              ))}</tr>
            </thead>
            <tbody>
              {ventas.length === 0 ? (
                <tr><td colSpan={9} style={{ textAlign: 'center', padding: 40, color: '#475569' }}>Sin resultados</td></tr>
              ) : ventas.map(v => (
                <tr key={v.id} onClick={() => setSelected(v)} style={{ cursor: 'pointer' }}>
                  <td style={{ padding: '10px 13px', fontSize: 13, borderBottom: '1px solid rgba(255,255,255,.04)', fontWeight: 600, color: '#60a5fa' }}>{v.numero}</td>
                  <td style={{ padding: '10px 13px', fontSize: 12, borderBottom: '1px solid rgba(255,255,255,.04)', color: '#94a3b8', whiteSpace: 'nowrap' }}>{fmtDateTime(v.fecha)}</td>
                  <td style={{ padding: '10px 13px', fontSize: 13, borderBottom: '1px solid rgba(255,255,255,.04)', color: '#e2e8f0' }}>{v.clienteNombre}</td>
                  <td style={{ padding: '10px 13px', fontSize: 12, borderBottom: '1px solid rgba(255,255,255,.04)', color: '#94a3b8' }}>{v.clienteNit}</td>
                  <td style={{ padding: '10px 13px', borderBottom: '1px solid rgba(255,255,255,.04)' }}><span className="badge-blue" style={{ textTransform: 'capitalize' }}>{v.metodoPago}</span></td>
                  <td style={{ padding: '10px 13px', fontSize: 13, fontWeight: 700, borderBottom: '1px solid rgba(255,255,255,.04)', color: '#e2e8f0' }}>{fmt(v.total)}</td>
                  <td style={{ padding: '10px 13px', fontSize: 12, borderBottom: '1px solid rgba(255,255,255,.04)', color: '#94a3b8' }}>{v.usuarioNombre}</td>
                  <td style={{ padding: '10px 13px', borderBottom: '1px solid rgba(255,255,255,.04)' }}><span className={v.estado === 'completada' ? 'badge-green' : 'badge-red'} style={{ textTransform: 'capitalize' }}>{v.estado}</span></td>
                  <td style={{ padding: '10px 13px', borderBottom: '1px solid rgba(255,255,255,.04)' }}>
                    <button className="btn-ghost btn-sm" onClick={e => { e.stopPropagation(); setSelected(v) }}>Ver</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Detail Modal */}
      {selected && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.5)', zIndex: 999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <div style={{ background: 'rgba(255,255,255,.03)', borderRadius: 14, padding: 28, width: '100%', maxWidth: 600, maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 30px 80px rgba(0,0,0,.2)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
              <h3 style={{ fontSize: 18, fontWeight: 700, color: '#e2e8f0' }}>Venta {selected.numero}</h3>
              <button onClick={() => setSelected(null)} style={{ background: 'none', border: 'none', fontSize: 22, cursor: 'pointer', color: '#475569' }}>×</button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 20 }}>
              {[
                ['Fecha', fmtDateTime(selected.fecha)],
                ['Estado', selected.estado],
                ['Cliente', selected.clienteNombre],
                ['NIT', selected.clienteNit],
                ['Método de pago', selected.metodoPago],
                ['Cajero', selected.usuarioNombre],
              ].map(([l, v]) => (
                <div key={l}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', marginBottom: 2 }}>{l}</div>
                  <div style={{ fontSize: 14, color: '#e2e8f0', textTransform: 'capitalize' }}>{v}</div>
                </div>
              ))}
            </div>

            <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 16 }}>
              <thead>
                <tr>{['Producto', 'Cant.', 'P/Unit.', 'Subtotal'].map(h => (
                  <th key={h} style={{ background: 'rgba(37,99,235,.1)', fontSize: 11, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', padding: '8px 12px', textAlign: 'left', borderBottom: '1px solid rgba(255,255,255,.06)' }}>{h}</th>
                ))}</tr>
              </thead>
              <tbody>
                {(selected.items || []).map((item, i) => (
                  <tr key={i}>
                    <td style={{ padding: '9px 12px', fontSize: 13, borderBottom: '1px solid rgba(255,255,255,.04)' }}>{item.nombre}</td>
                    <td style={{ padding: '9px 12px', fontSize: 13, borderBottom: '1px solid rgba(255,255,255,.04)' }}>{item.cantidad}</td>
                    <td style={{ padding: '9px 12px', fontSize: 13, borderBottom: '1px solid rgba(255,255,255,.04)' }}>{fmt(item.precioUnitario)}</td>
                    <td style={{ padding: '9px 12px', fontSize: 13, fontWeight: 600, borderBottom: '1px solid rgba(255,255,255,.04)' }}>{fmt(item.subtotal)}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div style={{ background: 'rgba(37,99,235,.1)', borderRadius: 8, padding: '12px 16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: '#94a3b8', padding: '2px 0' }}><span>Subtotal</span><span>{fmt(selected.subtotal)}</span></div>
              {selected.descuento > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: '#94a3b8', padding: '2px 0' }}><span>Descuento</span><span>-{fmt(selected.descuento)}</span></div>
              )}
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: '#94a3b8', padding: '2px 0' }}><span>Impuesto</span><span>{fmt(selected.impuesto)}</span></div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 17, fontWeight: 700, color: '#e2e8f0', borderTop: '1px solid rgba(255,255,255,.07)', paddingTop: 8, marginTop: 6 }}>
                <span>TOTAL</span><span>{fmt(selected.total)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: '#94a3b8', padding: '4px 0' }}><span>Recibido</span><span>{fmt(selected.montoRecibido)}</span></div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: '#10b981', fontWeight: 600, padding: '2px 0' }}><span>Cambio</span><span>{fmt(selected.cambio)}</span></div>
            </div>

            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 20 }}>
              {selected.estado === 'completada' && (
                <button className="btn-danger btn-sm" onClick={anular}>Anular</button>
              )}
              <button className="btn-ghost btn-sm" onClick={() => setSelected(null)}>Cerrar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

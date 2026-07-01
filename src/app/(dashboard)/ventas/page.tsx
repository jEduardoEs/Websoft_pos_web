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

const lbl: React.CSSProperties = { display: 'block', fontSize: 10, fontWeight: 700, color: '#8a887e', textTransform: 'uppercase', letterSpacing: .5, marginBottom: 4 }

export default function VentasPage() {
  const [ventas, setVentas] = useState<Venta[]>([])
  const [fi, setFi] = useState(new Date().toISOString().slice(0, 10))
  const [ff, setFf] = useState(new Date().toISOString().slice(0, 10))
  const [estado, setEstado] = useState('')
  const [selected, setSelected] = useState<Venta | null>(null)
  const [loading, setLoading] = useState(false)
  const [buscar, setBuscar] = useState('')

  const load = async () => {
    setLoading(true)
    const p = new URLSearchParams({ fecha_ini: fi, fecha_fin: ff, ...(estado ? { estado } : {}), ...(buscar ? { buscar } : {}) })
    const res = await fetch(`/api/ventas?${p}`)
    setVentas(await res.json())
    setLoading(false)
  }

  useEffect(() => { load() }, [fi, ff, estado, buscar])

  const anular = async () => {
    if (!selected) return
    const motivo = prompt('Motivo de anulación:')
    if (!motivo) return
    const res = await fetch(`/api/ventas/${selected.id}`, { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ motivo }) })
    const data = await res.json()
    if (data.ok) { toast.success('Venta anulada'); setSelected(null); load() }
    else toast.error(data.error || 'Error')
  }

  const totalGeneral = ventas.filter(v => v.estado === 'completada').reduce((s, v) => s + v.total, 0)

  return (
    <div className="page-wrap" style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 16 }}>

      <div className="page-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 700, color: '#18181b' }}>Historial de Ventas</h1>
          <p style={{ fontSize: 12, color: '#8a887e', marginTop: 2 }}>Consulta y gestiona todas las ventas</p>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: 10, color: '#8a887e', fontWeight: 700, textTransform: 'uppercase', letterSpacing: .5 }}>{ventas.filter(v => v.estado === 'completada').length} ventas</div>
          <div className="num-display" style={{ fontSize: 20, color: '#1581E3' }}>{fmt(totalGeneral)}</div>
        </div>
      </div>

      {/* Filtros */}
      <div className="card" style={{ padding: 14 }}>
        <div className="filter-bar" style={{ display: 'flex', gap: 10, alignItems: 'flex-end', flexWrap: 'wrap' }}>
          <div>
            <label style={lbl}>Desde</label>
            <input className="input" type="date" value={fi} onChange={e => setFi(e.target.value)} />
          </div>
          <div>
            <label style={lbl}>Hasta</label>
            <input className="input" type="date" value={ff} onChange={e => setFf(e.target.value)} />
          </div>
          <div>
            <label style={lbl}>Estado</label>
            <select className="input" value={estado} onChange={e => setEstado(e.target.value)}>
              <option value="">Todos</option>
              <option value="completada">Completada</option>
              <option value="anulada">Anulada</option>
            </select>
          </div>
          <input className="input" style={{ flex: 1, minWidth: 180 }} placeholder="Buscar cliente, NIT o # factura..." value={buscar} onChange={e => setBuscar(e.target.value)} />
          <button className="btn-ghost" onClick={() => { setFi(new Date().toISOString().slice(0, 10)); setFf(new Date().toISOString().slice(0, 10)) }}>Hoy</button>
          <button className="btn-primary" onClick={load} disabled={loading}>{loading ? 'Buscando...' : 'Buscar'}</button>
        </div>
      </div>

      {/* Tabla */}
      <div className="card">
        <div className="table-responsive" style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 620 }}>
            <thead>
              <tr>{['#', 'Fecha', 'Cliente', 'Método', 'Total', 'Estado', ''].map(h => <th key={h} className="ws-th">{h}</th>)}</tr>
            </thead>
            <tbody>
              {ventas.length === 0 ? (
                <tr><td colSpan={7} style={{ textAlign: 'center', padding: 40, color: '#8a887e', fontSize: 13 }}>Sin resultados para el período seleccionado</td></tr>
              ) : ventas.map(v => (
                <tr key={v.id} onClick={() => setSelected(v)} style={{ cursor: 'pointer' }}>
                  <td className="ws-td" style={{ fontWeight: 700, color: '#1581E3', fontFamily: 'Courier New, monospace', fontSize: 12 }}>{v.numero}</td>
                  <td className="ws-td" style={{ fontSize: 12, color: '#8a887e', whiteSpace: 'nowrap' }}>{fmtDateTime(v.fecha)}</td>
                  <td className="ws-td">
                    <div style={{ fontWeight: 600, color: '#18181b', fontSize: 13 }}>{v.clienteNombre}</div>
                    <div style={{ fontSize: 11, color: '#8a887e' }}>{v.clienteNit}</div>
                  </td>
                  <td className="ws-td"><span className="badge-blue" style={{ textTransform: 'capitalize' }}>{v.metodoPago}</span></td>
                  <td className="ws-td"><span className="num-display" style={{ fontSize: 14, fontWeight: 700, color: '#18181b' }}>{fmt(v.total)}</span></td>
                  <td className="ws-td"><span className={v.estado === 'completada' ? 'badge-green' : 'badge-red'}>{v.estado}</span></td>
                  <td className="ws-td"><button className="btn-ghost btn-sm" onClick={e => { e.stopPropagation(); setSelected(v) }}>Ver</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal detalle */}
      {selected && (
        <div className="modal-overlay" style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.5)', zIndex: 999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
          <div className="modal-box" style={{ background: '#fff', borderRadius: 8, padding: 24, width: '100%', maxWidth: 560, maxHeight: '92vh', overflowY: 'auto', boxShadow: '0 20px 60px rgba(0,0,0,.2)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18, paddingBottom: 14, borderBottom: '1.5px solid #e3e1d8' }}>
              <div>
                <h3 style={{ fontSize: 16, fontWeight: 700, color: '#18181b' }}>Venta {selected.numero}</h3>
                <span className={selected.estado === 'completada' ? 'badge-green' : 'badge-red'} style={{ marginTop: 4, display: 'inline-block' }}>{selected.estado}</span>
              </div>
              <button onClick={() => setSelected(null)} style={{ background: 'none', border: 'none', fontSize: 22, cursor: 'pointer', color: '#8a887e' }}>×</button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 18 }} className="grid-2col">
              {[['Fecha', fmtDateTime(selected.fecha)], ['Cliente', selected.clienteNombre], ['NIT', selected.clienteNit], ['Método', selected.metodoPago], ['Cajero', selected.usuarioNombre]].map(([l, v]) => (
                <div key={l}>
                  <div style={lbl}>{l}</div>
                  <div style={{ fontSize: 13, color: '#18181b', fontWeight: 500, textTransform: 'capitalize' }}>{v}</div>
                </div>
              ))}
            </div>

            <div className="table-responsive" style={{ overflowX: 'auto', marginBottom: 16 }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 400 }}>
                <thead><tr>{['Producto', 'Cant.', 'P/Unit.', 'Total'].map(h => <th key={h} className="ws-th">{h}</th>)}</tr></thead>
                <tbody>
                  {(selected.items || []).map((item, i) => (
                    <tr key={i}>
                      <td className="ws-td">{item.nombre}</td>
                      <td className="ws-td">{item.cantidad}</td>
                      <td className="ws-td">{fmt(item.precioUnitario)}</td>
                      <td className="ws-td" style={{ fontWeight: 600 }}>{fmt(item.subtotal)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div style={{ background: '#f4f3ef', border: '1.5px solid #e3e1d8', borderRadius: 6, padding: '12px 16px', marginBottom: 16 }}>
              {[['Subtotal', fmt(selected.subtotal)], ...(selected.descuento > 0 ? [['Descuento', `-${fmt(selected.descuento)}`]] : []), ['Impuesto', fmt(selected.impuesto)]].map(([l, v]) => (
                <div key={l} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: '#52524d', padding: '2px 0' }}><span>{l}</span><span className="num-display">{v}</span></div>
              ))}
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 16, fontWeight: 700, color: '#18181b', borderTop: '1.5px solid #d8d6cd', paddingTop: 8, marginTop: 6 }}>
                <span>TOTAL</span><span className="num-display">{fmt(selected.total)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: '#52524d', paddingTop: 4 }}>
                <span>Recibido / Cambio</span>
                <span className="num-display">{fmt(selected.montoRecibido)} / {fmt(selected.cambio)}</span>
              </div>
            </div>

            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              {selected.estado === 'completada' && <button className="btn-danger btn-sm" onClick={anular}>Anular venta</button>}
              <button className="btn-ghost btn-sm" onClick={() => setSelected(null)}>Cerrar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

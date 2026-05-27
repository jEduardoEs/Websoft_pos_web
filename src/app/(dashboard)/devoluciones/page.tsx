'use client'
import { useState, useEffect } from 'react'
import { toast } from 'sonner'
import { fmt, fmtDateTime } from '@/lib/utils'

interface Devolucion { id: number; fecha: string; ventaNumero: string | null; motivo: string; totalDevuelto: number; usuarioNombre: string | null; items: any[] }

export default function DevolucionesPage() {
  const [devoluciones, setDevoluciones] = useState<Devolucion[]>([])
  const [ventas, setVentas] = useState<any[]>([])
  const [showModal, setShowModal] = useState(false)
  const [loading, setLoading] = useState(false)
  const [ventaId, setVentaId] = useState('')
  const [ventaDetalle, setVentaDetalle] = useState<any>(null)
  const [motivo, setMotivo] = useState('')
  const [selectedItems, setSelectedItems] = useState<{ [key: number]: number }>({})

  const load = async () => {
    const [d, v] = await Promise.all([
      fetch('/api/devoluciones').then(r => r.json()),
      fetch('/api/ventas?estado=completada').then(r => r.json()),
    ])
    setDevoluciones(d); setVentas(v)
  }
  useEffect(() => { load() }, [])

  const selVenta = async (id: string) => {
    setVentaId(id)
    if (!id) { setVentaDetalle(null); return }
    const v = ventas.find(x => x.id === Number(id))
    setVentaDetalle(v || null)
    setSelectedItems({})
  }

  const totalDev = Object.entries(selectedItems).reduce((s, [itemIdx, qty]) => {
    const item = ventaDetalle?.items?.[Number(itemIdx)]
    return s + (item ? item.precioUnitario * qty : 0)
  }, 0)

  const save = async () => {
    if (!motivo) { toast.error('Motivo requerido'); return }
    const items = Object.entries(selectedItems).filter(([, q]) => q > 0).map(([idx, qty]) => {
      const item = ventaDetalle.items[Number(idx)]
      return { productoId: item.productoId, nombre: item.nombre, cantidad: qty, precioUnitario: item.precioUnitario, subtotal: item.precioUnitario * qty }
    })
    if (items.length === 0) { toast.error('Selecciona al menos un producto'); return }
    setLoading(true)
    const res = await fetch('/api/devoluciones', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ventaId: ventaDetalle?.id, ventaNumero: ventaDetalle?.numero, motivo, items, totalDevuelto: totalDev }),
    })
    setLoading(false)
    if ((await res.json()).ok) { toast.success('Devolución registrada'); setShowModal(false); load() }
  }

  return (
    <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 18 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: '#1a1f36' }}>Devoluciones</h1>
          <p style={{ fontSize: 13, color: '#4a5568', marginTop: 3 }}>{devoluciones.length} devoluciones registradas</p>
        </div>
        <button className="btn-primary" onClick={() => { setVentaId(''); setVentaDetalle(null); setMotivo(''); setSelectedItems({}); setShowModal(true) }}>+ Nueva Devolución</button>
      </div>

      <div className="card">
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>{['Fecha', 'Factura', 'Motivo', 'Total devuelto', 'Usuario'].map(h => (
                <th key={h} style={{ background: '#f4f7fb', fontSize: 11, fontWeight: 700, color: '#4a5568', textTransform: 'uppercase', padding: '9px 13px', textAlign: 'left', borderBottom: '1px solid #e2eaf4' }}>{h}</th>
              ))}</tr>
            </thead>
            <tbody>
              {devoluciones.length === 0 ? <tr><td colSpan={5} style={{ textAlign: 'center', padding: 40, color: '#9ca3af' }}>Sin devoluciones</td></tr>
              : devoluciones.map(d => (
                <tr key={d.id}>
                  <td style={{ padding: '10px 13px', fontSize: 12, borderBottom: '1px solid #f4f7fb', whiteSpace: 'nowrap' }}>{fmtDateTime(d.fecha)}</td>
                  <td style={{ padding: '10px 13px', fontSize: 13, fontWeight: 600, borderBottom: '1px solid #f4f7fb', color: '#2B7FD4' }}>{d.ventaNumero || '—'}</td>
                  <td style={{ padding: '10px 13px', fontSize: 13, borderBottom: '1px solid #f4f7fb' }}>{d.motivo}</td>
                  <td style={{ padding: '10px 13px', fontSize: 13, fontWeight: 700, borderBottom: '1px solid #f4f7fb', color: '#ef4444' }}>{fmt(d.totalDevuelto)}</td>
                  <td style={{ padding: '10px 13px', fontSize: 12, borderBottom: '1px solid #f4f7fb', color: '#4a5568' }}>{d.usuarioNombre || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.5)', zIndex: 999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <div style={{ background: '#fff', borderRadius: 14, padding: 28, width: '100%', maxWidth: 600, maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
              <h3 style={{ fontSize: 17, fontWeight: 700, color: '#1a1f36' }}>Nueva Devolución</h3>
              <button onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', fontSize: 22, cursor: 'pointer', color: '#9ca3af' }}>×</button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginBottom: 20 }}>
              <div>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#4a5568', textTransform: 'uppercase', marginBottom: 4 }}>Factura de venta</label>
                <select className="input" value={ventaId} onChange={e => selVenta(e.target.value)}>
                  <option value="">Seleccionar factura...</option>
                  {ventas.map(v => <option key={v.id} value={v.id}>{v.numero} — {v.clienteNombre} — {fmt(v.total)}</option>)}
                </select>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#4a5568', textTransform: 'uppercase', marginBottom: 4 }}>Motivo *</label>
                <input className="input" value={motivo} onChange={e => setMotivo(e.target.value)} placeholder="Razón de la devolución" />
              </div>
            </div>

            {ventaDetalle && (
              <div style={{ marginBottom: 20 }}>
                <p style={{ fontSize: 12, fontWeight: 700, color: '#4a5568', textTransform: 'uppercase', marginBottom: 10 }}>Seleccionar productos a devolver</p>
                {ventaDetalle.items.map((item: any, i: number) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 0', borderBottom: '1px solid #f4f7fb' }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 13, fontWeight: 600 }}>{item.nombre}</div>
                      <div style={{ fontSize: 11, color: '#4a5568' }}>Cant. comprada: {item.cantidad} — {fmt(item.precioUnitario)}/u</div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontSize: 12, color: '#4a5568' }}>Devolver:</span>
                      <input
                        className="input" type="number" min="0" max={item.cantidad}
                        value={selectedItems[i] || 0}
                        onChange={e => setSelectedItems(prev => ({ ...prev, [i]: Math.min(item.cantidad, Math.max(0, Number(e.target.value))) }))}
                        style={{ width: 70, fontSize: 13 }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}

            {totalDev > 0 && (
              <div style={{ background: '#fef2f2', borderRadius: 8, padding: '12px 16px', marginBottom: 16 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 16, fontWeight: 700, color: '#ef4444' }}>
                  <span>Total a devolver:</span><span>{fmt(totalDev)}</span>
                </div>
              </div>
            )}

            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button className="btn-ghost" onClick={() => setShowModal(false)}>Cancelar</button>
              <button className="btn-danger" onClick={save} disabled={loading}>{loading ? 'Guardando...' : 'Registrar Devolución'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

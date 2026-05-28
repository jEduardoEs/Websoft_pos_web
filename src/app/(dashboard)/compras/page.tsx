'use client'
import { useState, useEffect } from 'react'
import { toast } from 'sonner'
import { fmt, fmtDateTime } from '@/lib/utils'

interface Compra { id: number; numero: string; fecha: string; proveedorNombre: string; total: number; estado: string; items: any[] }

export default function ComprasPage() {
  const [compras, setCompras] = useState<Compra[]>([])
  const [proveedores, setProveedores] = useState<any[]>([])
  const [productos, setProductos] = useState<any[]>([])
  const [showModal, setShowModal] = useState(false)
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({ proveedorId: '', proveedorNombre: '', estado: 'recibida', notas: '' })
  const [items, setItems] = useState<any[]>([])

  const load = async () => {
    const [c, p, pr] = await Promise.all([
      fetch('/api/compras').then(r => r.json()),
      fetch('/api/proveedores').then(r => r.json()),
      fetch('/api/productos').then(r => r.json()),
    ])
    setCompras(c); setProveedores(p); setProductos(pr)
  }
  useEffect(() => { load() }, [])

  const addItem = () => setItems(prev => [...prev, { productoId: '', nombre: '', cantidad: 1, precioUnitario: 0 }])
  const updItem = (i: number, k: string, v: any) => {
    setItems(prev => prev.map((item, idx) => {
      if (idx !== i) return item
      const updated = { ...item, [k]: v }
      if (k === 'productoId') {
        const p = productos.find((x: any) => x.id === Number(v))
        if (p) { updated.nombre = p.nombre; updated.precioUnitario = p.costo || 0 }
      }
      return { ...updated, subtotal: updated.cantidad * updated.precioUnitario }
    }))
  }

  const subtotal = items.reduce((s, i) => s + (i.cantidad * i.precioUnitario), 0)
  const impuesto = subtotal * 0.12
  const total = subtotal + impuesto

  const save = async () => {
    if (items.length === 0) { toast.error('Agrega al menos un producto'); return }
    setLoading(true)
    const res = await fetch('/api/compras', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...form, items: items.map(i => ({ ...i, subtotal: i.cantidad * i.precioUnitario })), subtotal, impuesto, total }),
    })
    setLoading(false)
    if ((await res.json()).ok) { toast.success('Compra registrada'); setShowModal(false); setItems([]); load() }
  }

  return (
    <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 18 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: '#e2e8f0' }}>Compras</h1>
          <p style={{ fontSize: 13, color: '#94a3b8', marginTop: 3 }}>Órdenes de compra a proveedores</p>
        </div>
        <button className="btn-primary" onClick={() => { setForm({ proveedorId: '', proveedorNombre: '', estado: 'recibida', notas: '' }); setItems([]); setShowModal(true) }}>+ Nueva Compra</button>
      </div>

      <div className="card">
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>{['#', 'Fecha', 'Proveedor', 'Total', 'Estado'].map(h => (
                <th key={h} style={{ background: 'rgba(37,99,235,.1)', fontSize: 11, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', padding: '9px 13px', textAlign: 'left', borderBottom: '1px solid rgba(255,255,255,.06)' }}>{h}</th>
              ))}</tr>
            </thead>
            <tbody>
              {compras.length === 0 ? <tr><td colSpan={5} style={{ textAlign: 'center', padding: 40, color: '#475569' }}>Sin compras</td></tr>
              : compras.map(c => (
                <tr key={c.id}>
                  <td style={{ padding: '10px 13px', fontWeight: 700, fontSize: 13, borderBottom: '1px solid rgba(255,255,255,.04)', color: '#60a5fa' }}>{c.numero}</td>
                  <td style={{ padding: '10px 13px', fontSize: 12, borderBottom: '1px solid rgba(255,255,255,.04)', color: '#94a3b8', whiteSpace: 'nowrap' }}>{fmtDateTime(c.fecha)}</td>
                  <td style={{ padding: '10px 13px', fontSize: 13, borderBottom: '1px solid rgba(255,255,255,.04)' }}>{c.proveedorNombre || '—'}</td>
                  <td style={{ padding: '10px 13px', fontSize: 13, fontWeight: 700, borderBottom: '1px solid rgba(255,255,255,.04)' }}>{fmt(c.total)}</td>
                  <td style={{ padding: '10px 13px', borderBottom: '1px solid rgba(255,255,255,.04)' }}><span className={c.estado === 'recibida' ? 'badge-green' : 'badge-orange'} style={{ textTransform: 'capitalize' }}>{c.estado}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.5)', zIndex: 999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <div style={{ background: 'rgba(255,255,255,.03)', borderRadius: 14, padding: 28, width: '100%', maxWidth: 720, maxHeight: '92vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
              <h3 style={{ fontSize: 17, fontWeight: 700, color: '#e2e8f0' }}>Nueva Compra</h3>
              <button onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', fontSize: 22, cursor: 'pointer', color: '#475569' }}>×</button>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 20 }}>
              <div>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', marginBottom: 4 }}>Proveedor</label>
                <select className="input" value={form.proveedorId} onChange={e => { const p = proveedores.find(x => x.id === Number(e.target.value)); setForm(f => ({ ...f, proveedorId: e.target.value, proveedorNombre: p?.nombre || '' })) }}>
                  <option value="">Sin proveedor</option>
                  {proveedores.map(p => <option key={p.id} value={p.id}>{p.nombre}</option>)}
                </select>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', marginBottom: 4 }}>Estado</label>
                <select className="input" value={form.estado} onChange={e => setForm(f => ({ ...f, estado: e.target.value }))}>
                  <option value="recibida">Recibida (actualiza stock)</option>
                  <option value="pendiente">Pendiente</option>
                </select>
              </div>
              <div style={{ gridColumn: '1/-1' }}>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', marginBottom: 4 }}>Notas</label>
                <input className="input" value={form.notas} onChange={e => setForm(f => ({ ...f, notas: e.target.value }))} />
              </div>
            </div>

            <div style={{ marginBottom: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                <span style={{ fontSize: 13, fontWeight: 700, color: '#e2e8f0' }}>Productos</span>
                <button className="btn-ghost btn-sm" onClick={addItem}>+ Agregar</button>
              </div>
              {items.map((item, i) => (
                <div key={i} style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr auto', gap: 8, marginBottom: 8, alignItems: 'flex-end' }}>
                  <div>
                    <select className="input" value={item.productoId} onChange={e => updItem(i, 'productoId', e.target.value)} style={{ fontSize: 12 }}>
                      <option value="">Seleccionar...</option>
                      {productos.map(p => <option key={p.id} value={p.id}>{p.nombre}</option>)}
                    </select>
                  </div>
                  <input className="input" type="number" min="1" value={item.cantidad} onChange={e => updItem(i, 'cantidad', Number(e.target.value))} placeholder="Cant." style={{ fontSize: 12 }} />
                  <input className="input" type="number" min="0" value={item.precioUnitario} onChange={e => updItem(i, 'precioUnitario', Number(e.target.value))} placeholder="Costo" style={{ fontSize: 12 }} />
                  <button onClick={() => setItems(prev => prev.filter((_, idx) => idx !== i))} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: 18, padding: '0 6px' }}>×</button>
                </div>
              ))}
            </div>

            <div style={{ background: 'rgba(37,99,235,.1)', borderRadius: 8, padding: '12px 16px', marginBottom: 20 }}>
              {[['Subtotal', fmt(subtotal)], ['IVA (12%)', fmt(impuesto)], ['Total', fmt(total)]].map(([l, v], i) => (
                <div key={l} style={{ display: 'flex', justifyContent: 'space-between', fontSize: i === 2 ? 16 : 13, fontWeight: i === 2 ? 700 : 400, color: i === 2 ? '#1a1f36' : '#4a5568', padding: '3px 0', borderTop: i === 2 ? '1px solid #e2eaf4' : 'none', paddingTop: i === 2 ? 8 : 3, marginTop: i === 2 ? 6 : 0 }}>
                  <span>{l}</span><span>{v}</span>
                </div>
              ))}
            </div>

            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button className="btn-ghost" onClick={() => setShowModal(false)}>Cancelar</button>
              <button className="btn-primary" onClick={save} disabled={loading}>{loading ? 'Guardando...' : 'Registrar Compra'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

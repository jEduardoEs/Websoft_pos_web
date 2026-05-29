'use client'
import { useState, useEffect } from 'react'
import { toast } from 'sonner'
import { fmt, fmtDate } from '@/lib/utils'

interface Garantia {
  id: number; numero: string; fechaVenta: string; fechaVencimiento: string
  diasGarantia: number; clienteNombre: string; clienteTelefono: string | null
  clienteNit: string | null; productoNombre: string; productoSerie: string | null
  ventaNumero: string | null; estado: string; condiciones: string | null; notas: string | null
}

const emptyForm = {
  clienteNombre: '', clienteTelefono: '', clienteNit: 'CF',
  productoNombre: '', productoSerie: '', ventaNumero: '',
  diasGarantia: '365', fechaVenta: new Date().toISOString().slice(0, 10),
  condiciones: 'Daños físicos anulan la garantía. Se atiende en instalaciones de WebSoft Solutions.',
  notas: '',
}

export default function GarantiasPage() {
  const [garantias, setGarantias] = useState<Garantia[]>([])
  const [buscar, setBuscar] = useState('')
  const [filtroEstado, setFiltroEstado] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState(emptyForm)
  const [loading, setLoading] = useState(false)
  const [ventas, setVentas] = useState<any[]>([])

  const load = async () => {
    const p = new URLSearchParams({ ...(buscar ? { buscar } : {}), ...(filtroEstado ? { estado: filtroEstado } : {}) })
    const res = await fetch(`/api/garantias?${p}`)
    setGarantias(await res.json())
  }

  useEffect(() => { load() }, [buscar, filtroEstado])
  useEffect(() => {
    fetch('/api/ventas?estado=completada').then(r => r.json()).then(setVentas)
  }, [])

  const setF = (k: string, v: string) => setForm(p => ({ ...p, [k]: v }))

  const selVenta = (ventaId: string) => {
    const v = ventas.find((x: any) => x.id === Number(ventaId))
    if (!v) return
    setForm(p => ({
      ...p, ventaNumero: v.numero, clienteNombre: v.clienteNombre,
      clienteNit: v.clienteNit, fechaVenta: new Date(v.fecha).toISOString().slice(0, 10),
      productoNombre: v.items?.[0]?.nombre || '',
    }))
  }

  const save = async () => {
    if (!form.clienteNombre || !form.productoNombre) { toast.error('Cliente y producto requeridos'); return }
    setLoading(true)
    const res = await fetch('/api/garantias', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })
    const data = await res.json()
    setLoading(false)
    if (data.ok) { toast.success(`Garantía ${data.garantia.numero} creada`); setShowModal(false); setForm(emptyForm); load(); printGarantia(data.garantia) }
    else toast.error(data.error || 'Error')
  }

  const cambiarEstado = async (id: number, estado: string) => {
    await fetch(`/api/garantias/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ estado }) })
    toast.success('Estado actualizado'); load()
  }

  const diasRestantes = (g: Garantia) => {
    const diff = new Date(g.fechaVencimiento).getTime() - Date.now()
    return Math.ceil(diff / (1000 * 60 * 60 * 24))
  }

  const printGarantia = (g: any) => {
    const w = window.open('', '_blank', 'width=700,height=500')
    if (!w) return
    w.document.write(`<!DOCTYPE html><html><head><meta charset="UTF-8">
<style>
  *{margin:0;padding:0;box-sizing:border-box}
  body{font-family:'Segoe UI',sans-serif;font-size:11px;padding:24px;color:#0f172a}
  .header{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:16px;padding-bottom:12px;border-bottom:2px solid #2563eb}
  .logo{font-size:18px;font-weight:800}.logo span{color:#2563eb}
  .banner{background:#16a34a;color:#fff;text-align:center;padding:8px;font-size:14px;font-weight:700;letter-spacing:3px;border-radius:5px;margin-bottom:14px}
  .grid{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:12px}
  .row{display:flex;gap:6px;margin-bottom:5px;font-size:10px}.lbl{font-weight:700;min-width:90px;color:#374151}.val{color:#475569}
  .cond{background:#f0fdf4;border:1px solid #bbf7d0;border-radius:6px;padding:10px;margin:12px 0;font-size:10px}
  .sign{border-top:1px solid #0f172a;padding-top:4px;font-size:10px;font-weight:700;margin-top:20px}
  .footer{margin-top:14px;text-align:center;font-size:9px;color:#94a3b8;border-top:1px solid #e2e8f0;padding-top:8px}
</style></head><body>
<div class="header">
  <div><div class="logo">Web<span>Soft</span> Solutions</div><div style="font-size:9px;color:#64748b">Guastatoya, El Progreso · Tel: 3836-1044</div></div>
  <div style="text-align:right;font-size:10px;color:#64748b">Garantía: <b style="color:#16a34a;font-size:14px">${g.numero}</b></div>
</div>
<div class="banner">CERTIFICADO DE GARANTÍA</div>
<div class="grid">
  <div>
    <div class="row"><span class="lbl">Cliente:</span><span class="val">${g.clienteNombre}</span></div>
    <div class="row"><span class="lbl">NIT:</span><span class="val">${g.clienteNit || 'CF'}</span></div>
    <div class="row"><span class="lbl">Teléfono:</span><span class="val">${g.clienteTelefono || ''}</span></div>
  </div>
  <div>
    <div class="row"><span class="lbl">Producto:</span><span class="val"><b>${g.productoNombre}</b></span></div>
    <div class="row"><span class="lbl">No. Serie:</span><span class="val">${g.productoSerie || ''}</span></div>
    <div class="row"><span class="lbl">Factura:</span><span class="val">${g.ventaNumero || ''}</span></div>
    <div class="row"><span class="lbl">Fecha venta:</span><span class="val">${new Date(g.fechaVenta).toLocaleDateString('es-GT')}</span></div>
    <div class="row"><span class="lbl">Vence:</span><span class="val"><b style="color:#16a34a">${new Date(g.fechaVencimiento).toLocaleDateString('es-GT')}</b></span></div>
    <div class="row"><span class="lbl">Duración:</span><span class="val">${g.diasGarantia} días</span></div>
  </div>
</div>
<div class="cond"><b>Condiciones de garantía:</b><br>${g.condiciones || ''}</div>
<div style="display:grid;grid-template-columns:1fr 1fr;gap:20px">
  <div><div class="sign">Firma del cliente: ___________________</div></div>
  <div><div class="sign">WebSoft Solutions: ___________________</div></div>
</div>
<div class="footer">WebSoft Solutions · ${g.numero}</div>
</body></html>`)
    w.document.close()
    setTimeout(() => w.print(), 500)
  }

  const thS = { background: '#f8fafc', fontSize: 11, fontWeight: 700 as const, color: '#64748b', textTransform: 'uppercase' as const, padding: '10px 14px', textAlign: 'left' as const, borderBottom: '1px solid #e2e8f0' }
  const tdS = { padding: '11px 14px', fontSize: 13, borderBottom: '1px solid #f1f5f9' }
  const lbl = { display: 'block' as const, fontSize: 11, fontWeight: 700 as const, color: '#64748b', textTransform: 'uppercase' as const, marginBottom: 4 }

  const estadoBadge = { vigente: 'badge-green', vencida: 'badge-red', reclamada: 'badge-orange', anulada: 'badge-gray' } as any

  return (
    <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 18 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 700, color: '#0f172a' }}>Garantías</h1>
          <p style={{ fontSize: 12, color: '#64748b', marginTop: 3 }}>Certificados de garantía de productos</p>
        </div>
        <button className="btn-primary" onClick={() => { setForm(emptyForm); setShowModal(true) }}>+ Nueva Garantía</button>
      </div>

      <div className="card" style={{ padding: 14 }}>
        <div style={{ display: 'flex', gap: 10 }}>
          <input className="input" placeholder="Buscar por cliente, producto, número..." value={buscar} onChange={e => setBuscar(e.target.value)} style={{ flex: 1 }} />
          <select className="input" value={filtroEstado} onChange={e => setFiltroEstado(e.target.value)} style={{ width: 160 }}>
            <option value="">Todos los estados</option>
            <option value="vigente">Vigente</option>
            <option value="vencida">Vencida</option>
            <option value="reclamada">Reclamada</option>
            <option value="anulada">Anulada</option>
          </select>
        </div>
      </div>

      <div className="card">
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead><tr>{['#', 'Cliente', 'Producto', 'Serie', 'Fecha venta', 'Vence', 'Días restantes', 'Estado', ''].map(h => <th key={h} style={thS}>{h}</th>)}</tr></thead>
            <tbody>
              {garantias.length === 0 ? <tr><td colSpan={9} style={{ textAlign: 'center', padding: 50, color: '#94a3b8' }}>Sin garantías</td></tr>
              : garantias.map(g => {
                const dias = diasRestantes(g)
                return (
                  <tr key={g.id}>
                    <td style={{ ...tdS, fontWeight: 700, color: '#16a34a' }}>{g.numero}</td>
                    <td style={{ ...tdS, fontWeight: 600, color: '#0f172a' }}>{g.clienteNombre}</td>
                    <td style={{ ...tdS, color: '#475569' }}>{g.productoNombre}</td>
                    <td style={{ ...tdS, color: '#64748b', fontSize: 12, fontFamily: 'monospace' }}>{g.productoSerie || '—'}</td>
                    <td style={{ ...tdS, color: '#64748b', fontSize: 12 }}>{fmtDate(g.fechaVenta)}</td>
                    <td style={{ ...tdS, color: '#64748b', fontSize: 12 }}>{fmtDate(g.fechaVencimiento)}</td>
                    <td style={{ ...tdS }}>
                      <span style={{ fontWeight: 700, color: dias <= 0 ? '#dc2626' : dias <= 30 ? '#d97706' : '#16a34a', fontSize: 13 }}>
                        {dias <= 0 ? 'Vencida' : `${dias} días`}
                      </span>
                    </td>
                    <td style={tdS}><span className={estadoBadge[g.estado] || 'badge-gray'} style={{ textTransform: 'capitalize' }}>{g.estado}</span></td>
                    <td style={{ ...tdS }}>
                      <div style={{ display: 'flex', gap: 5 }}>
                        {g.estado === 'vigente' && <button className="btn-ghost btn-sm" onClick={() => cambiarEstado(g.id, 'reclamada')}>Reclamar</button>}
                        <button className="btn-ghost btn-sm" onClick={() => printGarantia(g)}>🖨️</button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.5)', zIndex: 999, display: 'flex', alignItems: 'flex-start', justifyContent: 'center', padding: 20, overflowY: 'auto' }}>
          <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 14, padding: 28, width: '100%', maxWidth: 680, margin: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 20, paddingBottom: 14, borderBottom: '1px solid #e2e8f0' }}>
              <h3 style={{ fontSize: 16, fontWeight: 700, color: '#0f172a' }}>Nueva Garantía</h3>
              <button onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', fontSize: 22, cursor: 'pointer', color: '#94a3b8' }}>×</button>
            </div>
            <div style={{ marginBottom: 14 }}>
              <label style={lbl}>Vincular a factura de venta (opcional)</label>
              <select className="input" onChange={e => selVenta(e.target.value)}>
                <option value="">Seleccionar venta...</option>
                {ventas.slice(0, 50).map((v: any) => <option key={v.id} value={v.id}>{v.numero} — {v.clienteNombre}</option>)}
              </select>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              {[
                { label: 'Nombre cliente *', key: 'clienteNombre', full: true },
                { label: 'NIT', key: 'clienteNit' },
                { label: 'Teléfono', key: 'clienteTelefono' },
                { label: 'Producto *', key: 'productoNombre', full: true },
                { label: 'No. Serie', key: 'productoSerie' },
                { label: 'No. Factura', key: 'ventaNumero' },
                { label: 'Fecha de venta', key: 'fechaVenta', type: 'date' },
                { label: 'Días de garantía', key: 'diasGarantia', type: 'number' },
                { label: 'Condiciones', key: 'condiciones', full: true },
                { label: 'Notas', key: 'notas', full: true },
              ].map((f: any) => (
                <div key={f.key} style={{ gridColumn: f.full ? '1/-1' : 'auto' }}>
                  <label style={lbl}>{f.label}</label>
                  <input className="input" type={f.type || 'text'} value={(form as any)[f.key]} onChange={e => setF(f.key, e.target.value)} />
                </div>
              ))}
            </div>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 20 }}>
              <button className="btn-ghost" onClick={() => setShowModal(false)}>Cancelar</button>
              <button className="btn-primary" onClick={save} disabled={loading}>{loading ? 'Guardando...' : 'Crear e Imprimir'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

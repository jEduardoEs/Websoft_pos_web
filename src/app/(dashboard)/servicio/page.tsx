'use client'
import { useState, useEffect } from 'react'
import { toast } from 'sonner'
import { fmt, fmtDate, fmtDateTime } from '@/lib/utils'

const ESTADOS = [
  { value: 'recibido',   label: 'Recibido',    color: '#64748b', bg: '#f1f5f9' },
  { value: 'diagnostico', label: 'Diagnóstico', color: '#d97706', bg: '#fef3c7' },
  { value: 'en_proceso', label: 'En proceso',  color: '#2563eb', bg: '#eff6ff' },
  { value: 'listo',      label: 'Listo',       color: '#16a34a', bg: '#f0fdf4' },
  { value: 'entregado',  label: 'Entregado',   color: '#7c3aed', bg: '#f5f3ff' },
  { value: 'cancelado',  label: 'Cancelado',   color: '#dc2626', bg: '#fef2f2' },
]

const emptyForm = {
  clienteNombre: '', clienteTelefono: '', clienteNit: 'CF',
  tipoEquipo: '', marca: '', modelo: '', serie: '',
  accesorios: '', descripcionFalla: '', observaciones: '',
  prioridad: 'normal', fechaPromesa: '', tecnicoNombre: '',
  costoReparacion: '', costoRepuestos: '', notas: '',
}

interface Orden {
  id: number; numero: string; fecha: string; clienteNombre: string
  clienteTelefono: string | null; tipoEquipo: string; marca: string | null
  modelo: string | null; descripcionFalla: string; estado: string; prioridad: string
  diagnostico: string | null; trabajoRealizado: string | null
  costoReparacion: number; costoRepuestos: number; total: number
  tecnicoNombre: string | null; fechaPromesa: string | null; fechaEntrega: string | null
  repuestos: any[]; historial: any[]
}

export default function ServicioPage() {
  const [ordenes, setOrdenes] = useState<Orden[]>([])
  const [filtroEstado, setFiltroEstado] = useState('')
  const [buscar, setBuscar] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [showDetalle, setShowDetalle] = useState(false)
  const [selected, setSelected] = useState<Orden | null>(null)
  const [form, setForm] = useState(emptyForm)
  const [repuestos, setRepuestos] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [comentarioCambio, setComentarioCambio] = useState('')

  const load = async () => {
    const p = new URLSearchParams({ ...(filtroEstado ? { estado: filtroEstado } : {}), ...(buscar ? { buscar } : {}) })
    const res = await fetch(`/api/ordenes?${p}`)
    setOrdenes(await res.json())
  }

  useEffect(() => { load() }, [filtroEstado, buscar])

  const setF = (k: string, v: string) => setForm(p => ({ ...p, [k]: v }))

  const save = async () => {
    if (!form.clienteNombre || !form.tipoEquipo || !form.descripcionFalla) {
      toast.error('Cliente, equipo y falla son requeridos'); return
    }
    setLoading(true)
    const res = await fetch('/api/ordenes', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...form, repuestos }),
    })
    const data = await res.json()
    setLoading(false)
    if (data.ok) {
      toast.success(`Orden ${data.orden.numero} creada`)
      setShowModal(false); setForm(emptyForm); setRepuestos([]); load()
      printOrden(data.orden)
    } else toast.error(data.error || 'Error')
  }

  const cambiarEstado = async (id: number, estado: string) => {
    setLoading(true)
    const res = await fetch(`/api/ordenes/${id}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ estado, comentario: comentarioCambio }),
    })
    setLoading(false)
    if ((await res.json()).ok) {
      toast.success(`Estado: ${estado}`)
      setComentarioCambio(''); load()
      if (selected) {
        const r = await fetch(`/api/ordenes/${id}`)
        setSelected(await r.json())
      }
    }
  }

  const printOrden = (orden: any) => {
    const w = window.open('', '_blank', 'width=700,height=600')
    if (!w) return
    w.document.write(`<!DOCTYPE html><html><head><meta charset="UTF-8">
<style>
  *{margin:0;padding:0;box-sizing:border-box}
  body{font-family:'Segoe UI',sans-serif;font-size:11px;padding:20px;color:#0f172a}
  .header{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:16px;padding-bottom:12px;border-bottom:2px solid #2563eb}
  .logo{font-size:18px;font-weight:800}.logo span{color:#2563eb}
  .title{background:#2563eb;color:#fff;text-align:center;padding:8px;font-size:14px;font-weight:700;letter-spacing:3px;border-radius:5px;margin-bottom:14px}
  .grid{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:12px;font-size:10px}
  .row{display:flex;gap:6px;margin-bottom:4px}.lbl{font-weight:700;min-width:90px;color:#374151}.val{color:#475569}
  .falla{background:#fef2f2;border:1px solid #fecaca;border-radius:6px;padding:10px;margin-bottom:12px;font-size:11px}
  .falla strong{color:#dc2626}
  .sign{border-top:1px solid #0f172a;padding-top:4px;font-size:10px;font-weight:700;margin-top:30px}
  .footer{margin-top:16px;text-align:center;font-size:9px;color:#94a3b8;border-top:1px solid #e2e8f0;padding-top:8px}
</style></head><body>
<div class="header">
  <div><div class="logo">Web<span>Soft</span> Solutions</div><div style="font-size:9px;color:#64748b">Guastatoya, El Progreso · Tel: 3836-1044</div></div>
  <div style="text-align:right;font-size:10px;color:#64748b">Orden: <b style="color:#2563eb;font-size:14px">${orden.numero}</b><br>Fecha: ${new Date(orden.fecha).toLocaleDateString('es-GT')}</div>
</div>
<div class="title">ORDEN DE SERVICIO TÉCNICO</div>
<div class="grid">
  <div>
    <div class="row"><span class="lbl">Cliente:</span><span class="val">${orden.clienteNombre}</span></div>
    <div class="row"><span class="lbl">Teléfono:</span><span class="val">${orden.clienteTelefono || ''}</span></div>
    <div class="row"><span class="lbl">NIT:</span><span class="val">${orden.clienteNit || 'CF'}</span></div>
  </div>
  <div>
    <div class="row"><span class="lbl">Equipo:</span><span class="val">${orden.tipoEquipo}</span></div>
    <div class="row"><span class="lbl">Marca/Modelo:</span><span class="val">${orden.marca || ''} ${orden.modelo || ''}</span></div>
    <div class="row"><span class="lbl">Serie:</span><span class="val">${orden.serie || ''}</span></div>
    <div class="row"><span class="lbl">Accesorios:</span><span class="val">${orden.accesorios || ''}</span></div>
    <div class="row"><span class="lbl">Fecha promesa:</span><span class="val">${orden.fechaPromesa ? new Date(orden.fechaPromesa).toLocaleDateString('es-GT') : ''}</span></div>
  </div>
</div>
<div class="falla"><strong>Descripción de la falla:</strong><br>${orden.descripcionFalla}</div>
${orden.observaciones ? `<div style="font-size:10px;margin-bottom:12px;color:#475569"><strong>Observaciones:</strong> ${orden.observaciones}</div>` : ''}
<div style="display:grid;grid-template-columns:1fr 1fr;gap:20px;margin-top:20px">
  <div><div class="sign">Firma del cliente: ___________________</div></div>
  <div><div class="sign">Recibido por: ___________________</div></div>
</div>
<div class="footer">WebSoft Solutions · Sistema POS · ${orden.numero}</div>
</body></html>`)
    w.document.close()
    setTimeout(() => w.print(), 500)
  }

  const estadoInfo = (e: string) => ESTADOS.find(x => x.value === e) || ESTADOS[0]

  const thS = { background: '#f8fafc', fontSize: 11, fontWeight: 700 as const, color: '#64748b', textTransform: 'uppercase' as const, letterSpacing: '.5px' as const, padding: '10px 14px', textAlign: 'left' as const, borderBottom: '1px solid #e2e8f0', whiteSpace: 'nowrap' as const }
  const tdS = { padding: '11px 14px', fontSize: 13, borderBottom: '1px solid #f1f5f9', color: '#0f172a' }
  const lbl = { display: 'block' as const, fontSize: 11, fontWeight: 700 as const, color: '#64748b', textTransform: 'uppercase' as const, marginBottom: 4 }

  // Stats
  const stats = ESTADOS.map(e => ({ ...e, count: ordenes.filter(o => o.estado === e.value).length }))

  return (
    <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 18 }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 700, color: '#0f172a' }}>Servicio Técnico</h1>
          <p style={{ fontSize: 12, color: '#64748b', marginTop: 3 }}>Órdenes de trabajo y reparaciones</p>
        </div>
        <button className="btn-primary" onClick={() => { setForm(emptyForm); setRepuestos([]); setShowModal(true) }}>
          + Nueva Orden
        </button>
      </div>

      {/* Estado cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6,1fr)', gap: 10 }}>
        {stats.map(s => (
          <div key={s.value} onClick={() => setFiltroEstado(filtroEstado === s.value ? '' : s.value)}
            className="card" style={{ padding: '12px 14px', cursor: 'pointer', borderTop: `3px solid ${s.color}`, opacity: filtroEstado && filtroEstado !== s.value ? .5 : 1, transition: 'all .15s' }}>
            <div style={{ fontSize: 22, fontWeight: 800, color: s.color }}>{s.count}</div>
            <div style={{ fontSize: 11, color: '#64748b', marginTop: 2 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="card" style={{ padding: 14 }}>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <input className="input" placeholder="Buscar por número, cliente, equipo..." value={buscar} onChange={e => setBuscar(e.target.value)} style={{ flex: 1 }} />
          {filtroEstado && <button className="btn-ghost btn-sm" onClick={() => setFiltroEstado('')}> Limpiar filtro</button>}
        </div>
      </div>

      {/* Table */}
      <div className="card">
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>{['#', 'Fecha', 'Cliente', 'Equipo', 'Falla', 'Técnico', 'Promesa', 'Total', 'Estado', ''].map(h => <th key={h} style={thS}>{h}</th>)}</tr>
            </thead>
            <tbody>
              {ordenes.length === 0 ? (
                <tr><td colSpan={10} style={{ textAlign: 'center', padding: 50, color: '#94a3b8' }}>Sin órdenes</td></tr>
              ) : ordenes.map(o => {
                const est = estadoInfo(o.estado)
                const vencida = o.fechaPromesa && new Date(o.fechaPromesa) < new Date() && !['entregado', 'cancelado'].includes(o.estado)
                return (
                  <tr key={o.id} onClick={() => { setSelected(o); setShowDetalle(true) }} style={{ cursor: 'pointer' }}>
                    <td style={{ ...tdS, fontWeight: 700, color: '#2563eb' }}>{o.numero}</td>
                    <td style={{ ...tdS, color: '#64748b', fontSize: 12, whiteSpace: 'nowrap' }}>{fmtDate(o.fecha)}</td>
                    <td style={{ ...tdS, fontWeight: 600 }}>{o.clienteNombre}</td>
                    <td style={{ ...tdS, color: '#475569' }}>{o.tipoEquipo} {o.marca ? `· ${o.marca}` : ''}</td>
                    <td style={{ ...tdS, color: '#475569', maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{o.descripcionFalla}</td>
                    <td style={{ ...tdS, color: '#64748b', fontSize: 12 }}>{o.tecnicoNombre || '—'}</td>
                    <td style={{ ...tdS, color: vencida ? '#dc2626' : '#64748b', fontSize: 12, fontWeight: vencida ? 700 : 400 }}>
                      {o.fechaPromesa ? fmtDate(o.fechaPromesa) : '—'}
                      {vencida && ' ⚠'}
                    </td>
                    <td style={{ ...tdS, fontWeight: 700 }}>{o.total > 0 ? fmt(o.total) : '—'}</td>
                    <td style={{ ...tdS }}>
                      <span style={{ background: est.bg, color: est.color, fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 20 }}>{est.label}</span>
                    </td>
                    <td style={{ ...tdS }} onClick={e => e.stopPropagation()}>
                      <button className="btn-ghost btn-sm" onClick={() => printOrden(o)}>🖨</button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* ─── MODAL NUEVA ORDEN ─── */}
      {showModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.5)', zIndex: 999, display: 'flex', alignItems: 'flex-start', justifyContent: 'center', padding: 20, overflowY: 'auto' }}>
          <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 14, padding: 28, width: '100%', maxWidth: 800, margin: 'auto', boxShadow: '0 20px 60px rgba(0,0,0,.15)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 20, paddingBottom: 14, borderBottom: '1px solid #e2e8f0' }}>
              <h3 style={{ fontSize: 16, fontWeight: 700, color: '#0f172a' }}>Nueva Orden de Servicio</h3>
              <button onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', fontSize: 22, cursor: 'pointer', color: '#94a3b8' }}>×</button>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 16 }}>
              {/* Cliente */}
              <div style={{ gridColumn: '1/-1', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 8, padding: 14 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: '#2563eb', textTransform: 'uppercase', marginBottom: 10 }}>Cliente</div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
                  <div style={{ gridColumn: '1/-1' }}><label style={lbl}>Nombre *</label><input className="input" value={form.clienteNombre} onChange={e => setF('clienteNombre', e.target.value)} /></div>
                  <div><label style={lbl}>Teléfono</label><input className="input" value={form.clienteTelefono} onChange={e => setF('clienteTelefono', e.target.value)} /></div>
                  <div><label style={lbl}>NIT</label><input className="input" value={form.clienteNit} onChange={e => setF('clienteNit', e.target.value)} /></div>
                  <div><label style={lbl}>Prioridad</label>
                    <select className="input" value={form.prioridad} onChange={e => setF('prioridad', e.target.value)}>
                      <option value="normal">Normal</option>
                      <option value="urgente">Urgente</option>
                      <option value="vip">VIP</option>
                    </select>
                  </div>
                </div>
              </div>
              {/* Equipo */}
              <div style={{ gridColumn: '1/-1', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 8, padding: 14 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: '#2563eb', textTransform: 'uppercase', marginBottom: 10 }}>Equipo</div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10 }}>
                  <div><label style={lbl}>Tipo de equipo *</label><input className="input" value={form.tipoEquipo} onChange={e => setF('tipoEquipo', e.target.value)} placeholder="Ej: Laptop, Cámara, DVR..." /></div>
                  <div><label style={lbl}>Marca</label><input className="input" value={form.marca} onChange={e => setF('marca', e.target.value)} /></div>
                  <div><label style={lbl}>Modelo</label><input className="input" value={form.modelo} onChange={e => setF('modelo', e.target.value)} /></div>
                  <div><label style={lbl}>No. Serie</label><input className="input" value={form.serie} onChange={e => setF('serie', e.target.value)} /></div>
                  <div style={{ gridColumn: '2/-1' }}><label style={lbl}>Accesorios entregados</label><input className="input" value={form.accesorios} onChange={e => setF('accesorios', e.target.value)} placeholder="Cable, cargador, funda..." /></div>
                </div>
              </div>
              {/* Falla */}
              <div style={{ gridColumn: '1/-1' }}>
                <label style={lbl}>Descripción de la falla *</label>
                <textarea className="input" rows={3} value={form.descripcionFalla} onChange={e => setF('descripcionFalla', e.target.value)} placeholder="Describe el problema reportado por el cliente..." />
              </div>
              <div>
                <label style={lbl}>Observaciones internas</label>
                <textarea className="input" rows={2} value={form.observaciones} onChange={e => setF('observaciones', e.target.value)} />
              </div>
              <div>
                <label style={lbl}>Técnico asignado</label>
                <input className="input" value={form.tecnicoNombre} onChange={e => setF('tecnicoNombre', e.target.value)} placeholder="Nombre del técnico" />
              </div>
              <div>
                <label style={lbl}>Fecha promesa de entrega</label>
                <input className="input" type="date" value={form.fechaPromesa} onChange={e => setF('fechaPromesa', e.target.value)} />
              </div>
              <div>
                <label style={lbl}>Costo estimado reparación</label>
                <input className="input" type="number" value={form.costoReparacion} onChange={e => setF('costoReparacion', e.target.value)} placeholder="Q 0.00" />
              </div>
            </div>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 8 }}>
              <button className="btn-ghost" onClick={() => setShowModal(false)}>Cancelar</button>
              <button className="btn-primary" onClick={save} disabled={loading}>{loading ? 'Guardando...' : 'Crear Orden e Imprimir'}</button>
            </div>
          </div>
        </div>
      )}

      {/* ─── DETALLE ─── */}
      {showDetalle && selected && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.5)', zIndex: 999, display: 'flex', alignItems: 'flex-start', justifyContent: 'center', padding: 20, overflowY: 'auto' }}>
          <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 14, padding: 28, width: '100%', maxWidth: 700, margin: 'auto', boxShadow: '0 20px 60px rgba(0,0,0,.15)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 20 }}>
              <div>
                <div style={{ fontSize: 18, fontWeight: 800, color: '#0f172a' }}>{selected.numero}</div>
                <div style={{ fontSize: 12, color: '#64748b' }}>{selected.clienteNombre} · {selected.tipoEquipo}</div>
              </div>
              <button onClick={() => setShowDetalle(false)} style={{ background: 'none', border: 'none', fontSize: 24, cursor: 'pointer', color: '#94a3b8' }}>×</button>
            </div>

            {/* Estado actual + cambiar */}
            <div style={{ background: '#f8fafc', borderRadius: 10, padding: 14, marginBottom: 16 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', marginBottom: 10 }}>Cambiar estado</div>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 10 }}>
                {ESTADOS.map(e => (
                  <button key={e.value} onClick={() => cambiarEstado(selected.id, e.value)}
                    style={{ padding: '5px 12px', borderRadius: 20, border: `1.5px solid ${e.color}`, background: selected.estado === e.value ? e.color : 'transparent', color: selected.estado === e.value ? '#fff' : e.color, fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>
                    {e.label}
                  </button>
                ))}
              </div>
              <input className="input" value={comentarioCambio} onChange={e => setComentarioCambio(e.target.value)} placeholder="Comentario del cambio (opcional)" style={{ fontSize: 12 }} />
            </div>

            {/* Info */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16, fontSize: 13 }}>
              {[['Falla', selected.descripcionFalla], ['Técnico', selected.tecnicoNombre || '—'], ['Promesa', selected.fechaPromesa ? fmtDate(selected.fechaPromesa) : '—'], ['Total', fmt(selected.total)]].map(([l, v]) => (
                <div key={l}>
                  <div style={{ fontSize: 10, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', marginBottom: 2 }}>{l}</div>
                  <div style={{ color: '#0f172a' }}>{v}</div>
                </div>
              ))}
            </div>

            {/* Historial */}
            {selected.historial?.length > 0 && (
              <div>
                <div style={{ fontSize: 12, fontWeight: 700, color: '#0f172a', marginBottom: 8 }}>Historial de cambios</div>
                {selected.historial.map((h: any, i: number) => (
                  <div key={i} style={{ display: 'flex', gap: 10, padding: '8px 0', borderBottom: '1px solid #f1f5f9', fontSize: 12 }}>
                    <span style={{ color: '#94a3b8', whiteSpace: 'nowrap' }}>{fmtDateTime(h.fecha)}</span>
                    <span style={{ color: '#2563eb', fontWeight: 600 }}>{h.estadoNuevo}</span>
                    {h.comentario && <span style={{ color: '#475569' }}>{h.comentario}</span>}
                    <span style={{ color: '#94a3b8', marginLeft: 'auto' }}>{h.usuarioNombre}</span>
                  </div>
                ))}
              </div>
            )}

            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 20 }}>
              <button className="btn-ghost" onClick={() => setShowDetalle(false)}>Cerrar</button>
              <button className="btn-primary" onClick={() => printOrden(selected)}>Imprimir</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

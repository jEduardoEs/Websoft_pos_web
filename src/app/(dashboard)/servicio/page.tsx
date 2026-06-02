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
    const w = window.open('', '_blank', 'width=860,height=700')
    if (!w) return
    const genDate = new Date().toLocaleDateString('es-GT',{day:'2-digit',month:'long',year:'numeric'})
    const otDate = new Date(orden.fecha||orden.createdAt).toLocaleDateString('es-GT',{day:'2-digit',month:'long',year:'numeric'})
    w.document.write(`<!DOCTYPE html><html lang="es"><head><meta charset="UTF-8"/><title>OT ${orden.numero||orden.id}</title><style>@page{margin:8mm;size:A4}@media print{html,body{height:100%}table{font-size:10px}}*{margin:0;padding:0;box-sizing:border-box}body{font-family:'Segoe UI',Arial,sans-serif;color:#0f172a;background:#fff;font-size:11px;line-height:1.5}.page{min-height:297mm;display:flex;flex-direction:column}.accent{height:5px;background:#1581E3;-webkit-print-color-adjust:exact;print-color-adjust:exact}.header{padding:18px 28px 14px;display:flex;justify-content:space-between;align-items:center;border-bottom:1px solid #e2e8f0}.brand{display:flex;align-items:center;gap:12px}.brand-logo{width:44px;height:44px;object-fit:contain}.brand-text .name{font-size:20px;font-weight:700;color:#0f172a;letter-spacing:-0.3px}.brand-text .name span{color:#1581E3}.brand-text .sub{font-size:9px;color:#64748b;text-transform:uppercase;letter-spacing:1px;margin-top:1px}.doc-right{text-align:right}.doc-badge{font-size:9px;font-weight:700;color:#fff;background:#1581E3;padding:3px 12px;border-radius:20px;letter-spacing:1px;text-transform:uppercase;display:inline-block;margin-bottom:6px;-webkit-print-color-adjust:exact;print-color-adjust:exact}.doc-num{font-size:18px;font-weight:700;color:#1581E3}.doc-date{font-size:10px;color:#64748b;margin-top:3px}.body{padding:20px 28px;flex:1}.info-grid{display:grid;grid-template-columns:1fr 1fr;gap:14px;margin-bottom:18px}.info-box{background:#f8fafc;border-radius:8px;padding:12px 14px;border-left:3px solid #1581E3;-webkit-print-color-adjust:exact;print-color-adjust:exact}.info-box-title{font-size:9px;font-weight:700;color:#64748b;text-transform:uppercase;letter-spacing:1px;margin-bottom:6px}.info-box p{font-size:11px;color:#0f172a;line-height:1.65}.info-box strong{font-weight:600}.sec-title{font-size:9px;font-weight:700;color:#64748b;text-transform:uppercase;letter-spacing:1px;margin-bottom:8px;padding-bottom:5px;border-bottom:1px solid #e2e8f0}table{width:100%;border-collapse:collapse;margin-bottom:14px}thead tr{background:#1581E3;-webkit-print-color-adjust:exact;print-color-adjust:exact}thead th{padding:8px 11px;font-size:9px;font-weight:700;color:#fff;text-align:left;text-transform:uppercase;letter-spacing:0.8px}th.r,td.r{text-align:right}th.c,td.c{text-align:center}tbody tr:nth-child(even){background:#f8fafc;-webkit-print-color-adjust:exact;print-color-adjust:exact}tbody td{padding:8px 11px;font-size:11px;color:#334155;border-bottom:1px solid #f1f5f9}td.b{font-weight:600;color:#0f172a}.totals{display:flex;justify-content:flex-end;margin-bottom:18px}.totals-box{width:260px;border-radius:8px;overflow:hidden;border:1px solid #e2e8f0}.t-row{display:flex;justify-content:space-between;padding:7px 14px;border-bottom:1px solid #e2e8f0;font-size:11px}.t-grand{background:#1581E3;padding:11px 14px;display:flex;justify-content:space-between;-webkit-print-color-adjust:exact;print-color-adjust:exact}.t-grand span{color:#fff;font-weight:700;font-size:13px}.highlight{background:#eff8ff;border-left:3px solid #1581E3;border-radius:0 6px 6px 0;padding:9px 13px;margin-bottom:10px;font-size:10px;font-weight:600;color:#1e40af;line-height:1.7;-webkit-print-color-adjust:exact;print-color-adjust:exact}.highlight strong{font-size:11.5px;display:block;margin-bottom:3px}.conds{font-size:10px;color:#475569;line-height:1.75}.conds strong{color:#0f172a}.signs{display:grid;grid-template-columns:1fr 1fr;gap:40px;margin-top:24px;padding-top:16px;border-top:1px solid #e2e8f0}.sign-line{border-top:1.5px solid #0f172a;padding-top:6px;font-size:10px;color:#475569}.sign-line strong{display:block;font-size:11px;color:#0f172a;margin-bottom:40px}.footer{padding:12px 28px;border-top:1px solid #e2e8f0;display:flex;justify-content:space-between;align-items:center;background:#f8fafc;-webkit-print-color-adjust:exact;print-color-adjust:exact}.footer-txt{font-size:9px;color:#94a3b8;line-height:1.6}.footer-brand{font-size:11px;font-weight:700;color:#0f172a}.footer-brand span{color:#1581E3}@media print{body{-webkit-print-color-adjust:exact;print-color-adjust:exact}}</style></head><body><div class="page"><div class="accent"></div><div class="header"><div class="brand"><img src="https://websoft-solutions.vercel.app/logo.png" class="brand-logo" alt="WebSoft" onerror="this.style.display='none'"/><div class="brand-text"><div class="name">WebSoft<span> Solutions</span></div><div class="sub">Tecnologia y Seguridad &middot; Guastatoya, El Progreso</div></div></div><div class="doc-right"><div class="doc-badge">Orden de Trabajo</div><div class="doc-num">${orden.numero||'OT-'+String(orden.id).padStart(6,'0')}</div><div class="doc-date">Fecha: ${otDate}</div></div></div>
<div class="body">
<div class="info-grid">
  <div class="info-box"><div class="info-box-title">Cliente</div><p><strong>${orden.clienteNombre}</strong><br/>${orden.clienteTelefono?'Tel: '+orden.clienteTelefono+'<br/>':''}${orden.clienteNit&&orden.clienteNit!=='CF'?'NIT: '+orden.clienteNit:''}</p></div>
  <div class="info-box"><div class="info-box-title">Equipo recibido</div><p><strong>${orden.equipo||orden.descripcion||'Equipo'}</strong><br/>${orden.marca?'Marca: '+orden.marca+'<br/>':''}${orden.modelo?'Modelo: '+orden.modelo+'<br/>':''}${orden.serie?'Serie: '+orden.serie:''}</p></div>
</div>
<div class="sec-title">Falla reportada por el cliente</div>
<div style="background:#fef2f2;border-left:3px solid #dc2626;border-radius:0 6px 6px 0;padding:10px 13px;margin-bottom:14px;font-size:11px;color:#334155;line-height:1.7">${orden.fallaReportada||orden.descripcion||'Sin descripcion'}</div>
${orden.diagnostico?'<div class="sec-title">Diagnostico tecnico</div><div style="background:#f0fdf4;border-left:3px solid #16a34a;border-radius:0 6px 6px 0;padding:10px 13px;margin-bottom:14px;font-size:11px;color:#334155;line-height:1.7">'+orden.diagnostico+'</div>':''}
${orden.trabajoRealizado?'<div class="highlight"><strong>Trabajo realizado</strong>'+orden.trabajoRealizado+'</div>':''}
<div class="sec-title">Condiciones del servicio</div>
<div class="conds">1. <strong>GARANTIA DEL SERVICIO:</strong> 30 dias por el trabajo realizado.<br/>2. <strong>EXCLUSIONES:</strong> Danos posteriores a la entrega o mal uso del equipo.<br/>3. <strong>EQUIPOS SIN REPARACION:</strong> Deben retirarse en un plazo de 30 dias.<br/>4. <strong>RESPONSABILIDAD:</strong> WebSoft no se responsabiliza por perdida de datos.</div>
<div class="signs"><div class="sign-line"><strong>Tecnico responsable</strong>WebSoft Solutions</div><div class="sign-line"><strong>Cliente conformidad</strong>${orden.clienteNombre}</div></div>
</div><div class="footer"><div class="footer-txt"><div class="footer-brand">WebSoft<span> Solutions</span></div>Guastatoya, El Progreso &middot; Tel: 3836-1044 / 3671-4377<br/>websoftsolutions.com.gt</div><div class="footer-txt" style="text-align:right">Generado el ${genDate}<br/>Documento confidencial</div></div></div><script>setTimeout(()=>window.print(),600)</script></body></html>`)
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
                      <button className="btn-ghost btn-sm" onClick={() => printOrden(o)}>🖨 </button>
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

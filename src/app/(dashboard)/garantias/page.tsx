'use client'
import { useState, useEffect } from 'react'
import { toast } from 'sonner'
import { fmt, fmtDate, fmtDateTime } from '@/lib/utils'

interface Garantia {
  id: number; numero: string; fechaVenta: string; fechaVencimiento: string
  diasGarantia: number; clienteNombre: string; clienteTelefono: string | null
  clienteNit: string | null; productoNombre: string; productoSerie: string | null
  ventaNumero: string | null; estado: string; condiciones: string | null
}

interface Reclamo {
  id: number; numero: string; fecha: string; garantiaNumero: string
  clienteNombre: string; motivoReclamo: string; descripcionFalla: string
  tieneFactura: boolean; numeroFactura: string | null; estado: string
  decision: string | null; resolucion: string | null; ordenTrabajoId: number | null
}

const emptyForm = {
  clienteNombre: '', clienteTelefono: '', clienteNit: 'CF',
  productoNombre: '', productoSerie: '', ventaNumero: '',
  diasGarantia: '365', fechaVenta: new Date().toISOString().slice(0, 10),
  condiciones: 'Daños físicos anulan la garantía. Se atiende en instalaciones de WebSoft Solutions.',
  notas: '',
}

const emptyReclamo = {
  motivoReclamo: '', descripcionFalla: '', clienteNit: '',
  clienteDpi: '', clienteTelefono: '', tieneFactura: false,
  numeroFactura: '', notas: '',
}

export default function GarantiasPage() {
  const [garantias, setGarantias] = useState<Garantia[]>([])
  const [buscar, setBuscar] = useState('')
  const [filtroEstado, setFiltroEstado] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [showReclamo, setShowReclamo] = useState(false)
  const [showReclamos, setShowReclamos] = useState(false)
  const [selectedGarantia, setSelectedGarantia] = useState<Garantia | null>(null)
  const [reclamos, setReclamos] = useState<Reclamo[]>([])
  const [form, setForm] = useState(emptyForm)
  const [reclamoForm, setReclamoForm] = useState(emptyReclamo)
  const [loading, setLoading] = useState(false)
  const [ventas, setVentas] = useState<any[]>([])
  const [tab, setTab] = useState<'garantias'|'reclamos'>('garantias')
  const [todosReclamos, setTodosReclamos] = useState<Reclamo[]>([])

  const load = async () => {
    const p = new URLSearchParams({ ...(buscar ? { buscar } : {}), ...(filtroEstado ? { estado: filtroEstado } : {}) })
    const res = await fetch(`/api/garantias?${p}`)
    setGarantias(await res.json())
  }

  const loadReclamos = async (garantiaId?: number) => {
    const p = garantiaId ? `?garantia_id=${garantiaId}` : ''
    const res = await fetch(`/api/garantias/reclamos${p}`)
    const data = await res.json()
    if (garantiaId) setReclamos(data)
    else setTodosReclamos(data)
  }

  useEffect(() => { load() }, [buscar, filtroEstado])
  useEffect(() => { if (tab === 'reclamos') loadReclamos() }, [tab])
  useEffect(() => {
    fetch('/api/ventas?estado=completada').then(r => r.json()).then(setVentas)
  }, [])

  const setF = (k: string, v: any) => setForm(p => ({ ...p, [k]: v }))
  const setRF = (k: string, v: any) => setReclamoForm(p => ({ ...p, [k]: v }))

  const selVenta = (ventaId: string) => {
    const v = ventas.find((x: any) => x.id === Number(ventaId))
    if (!v) return
    setForm(p => ({
      ...p, ventaNumero: v.numero, clienteNombre: v.clienteNombre,
      clienteNit: v.clienteNit, fechaVenta: new Date(v.fecha).toISOString().slice(0, 10),
      productoNombre: v.items?.[0]?.nombre || '',
    }))
  }

  const saveGarantia = async () => {
    if (!form.clienteNombre || !form.productoNombre) { toast.error('Cliente y producto requeridos'); return }
    setLoading(true)
    const res = await fetch('/api/garantias', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })
    const data = await res.json()
    setLoading(false)
    if (data.ok) {
      toast.success(`Garantía ${data.garantia.numero} creada`)
      setShowModal(false); setForm(emptyForm); load()
      printGarantia(data.garantia)
    } else toast.error(data.error || 'Error')
  }

  const abrirReclamo = async (g: Garantia) => {
    setSelectedGarantia(g)
    setReclamoForm({ ...emptyReclamo, clienteNit: g.clienteNit || '', clienteTelefono: g.clienteTelefono || '', numeroFactura: g.ventaNumero || '' })
    await loadReclamos(g.id)
    setShowReclamo(true)
  }

  const saveReclamo = async () => {
    if (!selectedGarantia) return
    if (!reclamoForm.motivoReclamo || !reclamoForm.descripcionFalla) {
      toast.error('Motivo y descripción son requeridos'); return
    }
    setLoading(true)
    const res = await fetch('/api/garantias/reclamos', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ garantiaId: selectedGarantia.id, ...reclamoForm }),
    })
    const data = await res.json()
    setLoading(false)
    if (data.ok) {
      toast.success(`Reclamo ${data.reclamo.numero} registrado`)
      setShowReclamo(false); load(); loadReclamos()
      printReclamo(data.reclamo, selectedGarantia)
    } else toast.error(data.error || 'Error')
  }

  const resolverReclamo = async (reclamo: Reclamo, decision: string, resolucion: string) => {
    const crearOrden = decision === 'reparar' && !reclamo.ordenTrabajoId
    const res = await fetch(`/api/garantias/reclamos/${reclamo.id}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ estado: 'resuelto', decision, resolucion, crearOrden }),
    })
    const data = await res.json()
    if (data.ok) {
      toast.success(crearOrden && data.ordenTrabajoId ? 'Resuelto — Orden de servicio creada automáticamente' : 'Reclamo resuelto')
      loadReclamos(); load()
    }
  }

  const diasRestantes = (g: Garantia) => Math.ceil((new Date(g.fechaVencimiento).getTime() - Date.now()) / 86400000)

  const printGarantia = (g: any) => {
    const w = window.open('', '_blank', 'width=860,height=700')
    if (!w) return
    const genDate = new Date().toLocaleDateString('es-GT',{day:'2-digit',month:'long',year:'numeric'})
    const fechaEmision = new Date(g.fechaEmision||g.createdAt).toLocaleDateString('es-GT',{day:'2-digit',month:'long',year:'numeric'})
    const fechaVenc = g.fechaVencimiento ? new Date(g.fechaVencimiento).toLocaleDateString('es-GT',{day:'2-digit',month:'long',year:'numeric'}) : 'No especificada'
    w.document.write(`<!DOCTYPE html><html lang="es"><head><meta charset="UTF-8"/><title>Garantia ${g.numero||g.id}</title><style>@page{margin:8mm;size:A4}@media print{html,body{height:100%}table{font-size:10px}}*{margin:0;padding:0;box-sizing:border-box}body{font-family:'Segoe UI',Arial,sans-serif;color:#0f172a;background:#fff;font-size:11px;line-height:1.5}.page{min-height:297mm;display:flex;flex-direction:column}.accent{height:5px;background:#1581E3;-webkit-print-color-adjust:exact;print-color-adjust:exact}.header{padding:18px 28px 14px;display:flex;justify-content:space-between;align-items:center;border-bottom:1px solid #e2e8f0}.brand{display:flex;align-items:center;gap:12px}.brand-logo{width:44px;height:44px;object-fit:contain}.brand-text .name{font-size:20px;font-weight:700;color:#0f172a;letter-spacing:-0.3px}.brand-text .name span{color:#1581E3}.brand-text .sub{font-size:9px;color:#64748b;text-transform:uppercase;letter-spacing:1px;margin-top:1px}.doc-right{text-align:right}.doc-badge{font-size:9px;font-weight:700;color:#fff;background:#1581E3;padding:3px 12px;border-radius:20px;letter-spacing:1px;text-transform:uppercase;display:inline-block;margin-bottom:6px;-webkit-print-color-adjust:exact;print-color-adjust:exact}.doc-num{font-size:18px;font-weight:700;color:#1581E3}.doc-date{font-size:10px;color:#64748b;margin-top:3px}.body{padding:20px 28px;flex:1}.info-grid{display:grid;grid-template-columns:1fr 1fr;gap:14px;margin-bottom:18px}.info-box{background:#f8fafc;border-radius:8px;padding:12px 14px;border-left:3px solid #1581E3;-webkit-print-color-adjust:exact;print-color-adjust:exact}.info-box-title{font-size:9px;font-weight:700;color:#64748b;text-transform:uppercase;letter-spacing:1px;margin-bottom:6px}.info-box p{font-size:11px;color:#0f172a;line-height:1.65}.info-box strong{font-weight:600}.sec-title{font-size:9px;font-weight:700;color:#64748b;text-transform:uppercase;letter-spacing:1px;margin-bottom:8px;padding-bottom:5px;border-bottom:1px solid #e2e8f0}table{width:100%;border-collapse:collapse;margin-bottom:14px}thead tr{background:#1581E3;-webkit-print-color-adjust:exact;print-color-adjust:exact}thead th{padding:8px 11px;font-size:9px;font-weight:700;color:#fff;text-align:left;text-transform:uppercase;letter-spacing:0.8px}th.r,td.r{text-align:right}th.c,td.c{text-align:center}tbody tr:nth-child(even){background:#f8fafc;-webkit-print-color-adjust:exact;print-color-adjust:exact}tbody td{padding:8px 11px;font-size:11px;color:#334155;border-bottom:1px solid #f1f5f9}td.b{font-weight:600;color:#0f172a}.totals{display:flex;justify-content:flex-end;margin-bottom:18px}.totals-box{width:260px;border-radius:8px;overflow:hidden;border:1px solid #e2e8f0}.t-row{display:flex;justify-content:space-between;padding:7px 14px;border-bottom:1px solid #e2e8f0;font-size:11px}.t-grand{background:#1581E3;padding:11px 14px;display:flex;justify-content:space-between;-webkit-print-color-adjust:exact;print-color-adjust:exact}.t-grand span{color:#fff;font-weight:700;font-size:13px}.highlight{background:#eff8ff;border-left:3px solid #1581E3;border-radius:0 6px 6px 0;padding:9px 13px;margin-bottom:10px;font-size:10px;font-weight:600;color:#1e40af;line-height:1.7;-webkit-print-color-adjust:exact;print-color-adjust:exact}.highlight strong{font-size:11.5px;display:block;margin-bottom:3px}.conds{font-size:10px;color:#475569;line-height:1.75}.conds strong{color:#0f172a}.signs{display:grid;grid-template-columns:1fr 1fr;gap:40px;margin-top:24px;padding-top:16px;border-top:1px solid #e2e8f0}.sign-line{border-top:1.5px solid #0f172a;padding-top:6px;font-size:10px;color:#475569}.sign-line strong{display:block;font-size:11px;color:#0f172a;margin-bottom:40px}.footer{padding:12px 28px;border-top:1px solid #e2e8f0;display:flex;justify-content:space-between;align-items:center;background:#f8fafc;-webkit-print-color-adjust:exact;print-color-adjust:exact}.footer-txt{font-size:9px;color:#94a3b8;line-height:1.6}.footer-brand{font-size:11px;font-weight:700;color:#0f172a}.footer-brand span{color:#1581E3}@media print{body{-webkit-print-color-adjust:exact;print-color-adjust:exact}}</style></head><body><div class="page"><div class="accent"></div><div class="header"><div class="brand"><img src="https://websoft-solutions.vercel.app/logo.png" class="brand-logo" alt="WebSoft" onerror="this.style.display='none'"/><div class="brand-text"><div class="name">WebSoft<span> Solutions</span></div><div class="sub">Tecnologia y Seguridad &middot; Guastatoya, El Progreso</div></div></div><div class="doc-right"><div class="doc-badge">Certificado de Garantia</div><div class="doc-num">${g.numero||'GRT-'+String(g.id).padStart(6,'0')}</div><div class="doc-date">Emision: ${fechaEmision}</div><div class="doc-date" style="color:#dc2626">Vence: ${fechaVenc}</div></div></div>
<div class="body">
<div class="info-grid">
  <div class="info-box"><div class="info-box-title">Cliente</div><p><strong>${g.clienteNombre}</strong><br/>${g.clienteNit&&g.clienteNit!=='CF'?'NIT: '+g.clienteNit+'<br/>':''}${g.clienteTelefono?'Tel: '+g.clienteTelefono:''}</p></div>
  <div class="info-box"><div class="info-box-title">Producto / Servicio</div><p><strong>${g.producto||g.descripcion||'Producto WebSoft'}</strong><br/>${g.serie?'No. Serie: '+g.serie+'<br/>':''}${g.ventaNumero?'Factura: '+g.ventaNumero:''}</p></div>
</div>
<div class="sec-title">Descripcion de la garantia</div>
<div style="background:#f8fafc;border-radius:8px;padding:14px;margin-bottom:18px;font-size:11px;color:#334155;line-height:1.7">${g.descripcion||g.observaciones||'Garantia por defectos de fabricacion y mano de obra.'}</div>
<div class="sec-title">Condiciones</div>
<div class="conds">1. <strong>COBERTURA:</strong> Defectos de fabricacion y mano de obra bajo uso normal.<br/>2. <strong>EXCLUSIONES:</strong> Danos fisicos, mal uso, voltaje incorrecto o modificaciones no autorizadas.<br/>3. <strong>SERVICIO:</strong> La garantia se hace efectiva presentando este documento en nuestras instalaciones.<br/>4. <strong>VIGENCIA:</strong> ${g.meses||12} meses a partir de la fecha de emision.</div>
<div class="signs"><div class="sign-line"><strong>Autorizado por</strong>WebSoft Solutions</div><div class="sign-line"><strong>Recibido por</strong>${g.clienteNombre}</div></div>
</div><div class="footer"><div class="footer-txt"><div class="footer-brand">WebSoft<span> Solutions</span></div>Guastatoya, El Progreso &middot; Tel: 3836-1044 / 3671-4377<br/>websoftsolutions.com.gt</div><div class="footer-txt" style="text-align:right">Generado el ${genDate}<br/>Documento confidencial</div></div></div><script>setTimeout(()=>window.print(),600)</script></body></html>`)
    w.document.close(); setTimeout(() => w.print(), 500)
  }

  const printReclamo = (r: any, g: Garantia) => {
    const w = window.open('', '_blank', 'width=700,height=500')
    if (!w) return
    w.document.write(`<!DOCTYPE html><html><head><meta charset="UTF-8">
<style>
  *{margin:0;padding:0;box-sizing:border-box}body{font-family:'Segoe UI',sans-serif;font-size:11px;padding:24px;color:#0f172a}
  .header{display:flex;justify-content:space-between;margin-bottom:16px;padding-bottom:12px;border-bottom:2px solid #dc2626}
  .logo{font-size:18px;font-weight:800}.logo span{color:#2563eb}
  .banner{background:#dc2626;color:#fff;text-align:center;padding:8px;font-size:14px;font-weight:700;letter-spacing:3px;border-radius:5px;margin-bottom:14px}
  .row{display:flex;gap:6px;margin-bottom:5px;font-size:10px}.lbl{font-weight:700;min-width:120px;color:#374151}.val{color:#475569}
  .falla{background:#fef2f2;border:1px solid #fecaca;border-radius:6px;padding:10px;margin:10px 0;font-size:10px}
  .sign{border-top:1px solid #0f172a;padding-top:4px;font-size:10px;font-weight:700;margin-top:20px}
</style></head><body>
<div class="header"><div><div class="logo">Web<span>Soft</span> Solutions</div><div style="font-size:9px;color:#64748b">Guastatoya · Tel: 3836-1044</div></div>
<div style="text-align:right;font-size:10px"><b style="color:#dc2626;font-size:14px">${r.numero}</b><br>${new Date(r.fecha).toLocaleDateString('es-GT')}</div></div>
<div class="banner">RECLAMO DE GARANTÍA</div>
<div class="row"><span class="lbl">Garantía:</span><span class="val">${g.numero}</span></div>
<div class="row"><span class="lbl">Cliente:</span><span class="val">${g.clienteNombre}</span></div>
<div class="row"><span class="lbl">NIT:</span><span class="val">${r.clienteNit || 'CF'}</span></div>
<div class="row"><span class="lbl">DPI:</span><span class="val">${r.clienteDpi || '___________________'}</span></div>
<div class="row"><span class="lbl">Teléfono:</span><span class="val">${r.clienteTelefono || ''}</span></div>
<div class="row"><span class="lbl">Producto:</span><span class="val">${g.productoNombre}</span></div>
<div class="row"><span class="lbl">No. Serie:</span><span class="val">${g.productoSerie || ''}</span></div>
<div class="row"><span class="lbl">Tiene factura:</span><span class="val">${r.tieneFactura ? 'SÍ — ' + (r.numeroFactura || '') : 'NO'}</span></div>
<div class="falla"><b>Motivo del reclamo:</b> ${r.motivoReclamo}<br><br><b>Descripción del defecto:</b><br>${r.descripcionFalla}</div>
<div style="display:grid;grid-template-columns:1fr 1fr;gap:20px;margin-top:20px">
  <div><div class="sign">Firma del cliente: ___________________</div></div>
  <div><div class="sign">Recibido por WebSoft: ___________________</div></div>
</div>
</body></html>`)
    w.document.close(); setTimeout(() => w.print(), 500)
  }

  const estadoBadge: any = { vigente: 'badge-green', vencida: 'badge-red', reclamada: 'badge-orange', anulada: 'badge-gray', facturada: 'badge-blue' }
  const estadoReclamoBadge: any = { recibido: 'badge-blue', en_revision: 'badge-orange', aprobado: 'badge-green', rechazado: 'badge-red', resuelto: 'badge-gray' }

  const thS = { background: '#f8fafc', fontSize: 11, fontWeight: 700 as const, color: '#64748b', textTransform: 'uppercase' as const, padding: '10px 14px', textAlign: 'left' as const, borderBottom: '1px solid #e2e8f0' }
  const tdS = { padding: '11px 14px', fontSize: 13, borderBottom: '1px solid #f1f5f9' }
  const lbl = { display: 'block' as const, fontSize: 11, fontWeight: 700 as const, color: '#64748b', textTransform: 'uppercase' as const, marginBottom: 4 }

  const MOTIVOS = ['Producto defectuoso de fábrica', 'Falla de funcionamiento', 'Daño en transporte', 'Problema de instalación', 'No enciende / no funciona', 'Pantalla dañada', 'Problema de conectividad', 'Otro']

  return (
    <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 18 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 700, color: '#0f172a' }}>Garantías</h1>
          <p style={{ fontSize: 12, color: '#64748b', marginTop: 3 }}>Certificados y reclamos de garantía</p>
        </div>
        <button className="btn-primary" onClick={() => { setForm(emptyForm); setShowModal(true) }}>+ Nueva Garantía</button>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 2, background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 10, padding: 4, width: 'fit-content' }}>
        {([['garantias', ' Garantías'], ['reclamos', ' Reclamos']] as const).map(([id, label]) => (
          <button key={id} onClick={() => setTab(id)} style={{ padding: '8px 16px', border: 'none', borderRadius: 8, cursor: 'pointer', fontSize: 12, fontWeight: 600, fontFamily: 'inherit', background: tab === id ? '#2563eb' : 'transparent', color: tab === id ? '#fff' : '#64748b', transition: 'all .15s' }}>{label}</button>
        ))}
      </div>

      {tab === 'garantias' && (
        <>
          <div className="card" style={{ padding: 14 }}>
            <div style={{ display: 'flex', gap: 10 }}>
              <input className="input" placeholder="Buscar por cliente, producto, número..." value={buscar} onChange={e => setBuscar(e.target.value)} style={{ flex: 1 }} />
              <select className="input" value={filtroEstado} onChange={e => setFiltroEstado(e.target.value)} style={{ width: 160 }}>
                <option value="">Todos</option>
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
                <thead><tr>{['#', 'Cliente', 'Producto', 'Serie', 'Venta', 'Vence', 'Días', 'Estado', ''].map(h => <th key={h} style={thS}>{h}</th>)}</tr></thead>
                <tbody>
                  {garantias.length === 0
                    ? <tr><td colSpan={9} style={{ textAlign: 'center', padding: 50, color: '#94a3b8' }}>Sin garantías</td></tr>
                    : garantias.map(g => {
                      const dias = diasRestantes(g)
                      return (
                        <tr key={g.id}>
                          <td style={{ ...tdS, fontWeight: 700, color: '#16a34a' }}>{g.numero}</td>
                          <td style={{ ...tdS, fontWeight: 600, color: '#0f172a' }}>{g.clienteNombre}</td>
                          <td style={{ ...tdS, color: '#475569' }}>{g.productoNombre}</td>
                          <td style={{ ...tdS, color: '#64748b', fontSize: 11, fontFamily: 'monospace' }}>{g.productoSerie || '—'}</td>
                          <td style={{ ...tdS, color: '#64748b', fontSize: 11 }}>{fmtDate(g.fechaVenta)}</td>
                          <td style={{ ...tdS, color: '#64748b', fontSize: 11 }}>{fmtDate(g.fechaVencimiento)}</td>
                          <td style={tdS}>
                            <span style={{ fontWeight: 700, color: dias <= 0 ? '#dc2626' : dias <= 30 ? '#d97706' : '#16a34a', fontSize: 13 }}>
                              {dias <= 0 ? 'Vencida' : `${dias}d`}
                            </span>
                          </td>
                          <td style={tdS}><span className={estadoBadge[g.estado] || 'badge-gray'} style={{ textTransform: 'capitalize' }}>{g.estado}</span></td>
                          <td style={{ ...tdS }}>
                            <div style={{ display: 'flex', gap: 5 }}>
                              {g.estado === 'vigente' && (
                                <button onClick={() => abrirReclamo(g)}
                                  style={{ fontSize: 11, fontWeight: 700, padding: '4px 10px', background: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca', borderRadius: 6, cursor: 'pointer', fontFamily: 'inherit' }}>
                                  Reclamar
                                </button>
                              )}
                              <button className="btn-ghost btn-sm" onClick={() => printGarantia(g)}>🖨 </button>
                            </div>
                          </td>
                        </tr>
                      )
                    })}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {tab === 'reclamos' && (
        <div className="card">
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead><tr>{['#', 'Fecha', 'Garantía', 'Cliente', 'Motivo', 'Decisión', 'Estado', ''].map(h => <th key={h} style={thS}>{h}</th>)}</tr></thead>
              <tbody>
                {todosReclamos.length === 0
                  ? <tr><td colSpan={8} style={{ textAlign: 'center', padding: 50, color: '#94a3b8' }}>Sin reclamos</td></tr>
                  : todosReclamos.map(r => (
                    <tr key={r.id}>
                      <td style={{ ...tdS, fontWeight: 700, color: '#dc2626' }}>{r.numero}</td>
                      <td style={{ ...tdS, color: '#64748b', fontSize: 11, whiteSpace: 'nowrap' }}>{fmtDate(r.fecha)}</td>
                      <td style={{ ...tdS, color: '#2563eb', fontWeight: 600 }}>{r.garantiaNumero}</td>
                      <td style={{ ...tdS, fontWeight: 600 }}>{r.clienteNombre}</td>
                      <td style={{ ...tdS, color: '#475569', maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.motivoReclamo}</td>
                      <td style={tdS}>{r.decision ? <span className="badge-blue" style={{ textTransform: 'capitalize' }}>{r.decision}</span> : <span style={{ color: '#94a3b8' }}>Pendiente</span>}</td>
                      <td style={tdS}><span className={estadoReclamoBadge[r.estado] || 'badge-gray'} style={{ textTransform: 'capitalize' }}>{r.estado}</span></td>
                      <td style={tdS}>
                        {r.estado === 'recibido' && (
                          <div style={{ display: 'flex', gap: 5 }}>
                            <button onClick={() => resolverReclamo(r, 'reparar', 'En reparación')}
                              style={{ fontSize: 10, fontWeight: 700, padding: '3px 8px', background: '#eff6ff', color: '#2563eb', border: '1px solid #bfdbfe', borderRadius: 6, cursor: 'pointer', fontFamily: 'inherit' }}> Reparar</button>
                            <button onClick={() => resolverReclamo(r, 'reemplazar', 'Producto reemplazado')}
                              style={{ fontSize: 10, fontWeight: 700, padding: '3px 8px', background: '#f0fdf4', color: '#16a34a', border: '1px solid #bbf7d0', borderRadius: 6, cursor: 'pointer', fontFamily: 'inherit' }}>↻ Reemplazar</button>
                            <button onClick={() => resolverReclamo(r, 'rechazar', 'No cubre garantía')}
                              style={{ fontSize: 10, fontWeight: 700, padding: '3px 8px', background: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca', borderRadius: 6, cursor: 'pointer', fontFamily: 'inherit' }}> Rechazar</button>
                          </div>
                        )}
                        {r.ordenTrabajoId && <span style={{ fontSize: 10, color: '#64748b' }}>OT #{r.ordenTrabajoId}</span>}
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* MODAL NUEVA GARANTIA */}
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
                { label: 'NIT', key: 'clienteNit' }, { label: 'Teléfono', key: 'clienteTelefono' },
                { label: 'Producto *', key: 'productoNombre', full: true },
                { label: 'No. Serie', key: 'productoSerie' }, { label: 'No. Factura', key: 'ventaNumero' },
                { label: 'Fecha de venta', key: 'fechaVenta', type: 'date' },
                { label: 'Días de garantía', key: 'diasGarantia', type: 'number' },
                { label: 'Condiciones', key: 'condiciones', full: true },
              ].map((f: any) => (
                <div key={f.key} style={{ gridColumn: f.full ? '1/-1' : 'auto' }}>
                  <label style={lbl}>{f.label}</label>
                  <input className="input" type={f.type || 'text'} value={(form as any)[f.key]} onChange={e => setF(f.key, e.target.value)} />
                </div>
              ))}
            </div>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 20 }}>
              <button className="btn-ghost" onClick={() => setShowModal(false)}>Cancelar</button>
              <button className="btn-primary" onClick={saveGarantia} disabled={loading}>{loading ? 'Guardando...' : 'Crear e Imprimir'}</button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL RECLAMO */}
      {showReclamo && selectedGarantia && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.5)', zIndex: 999, display: 'flex', alignItems: 'flex-start', justifyContent: 'center', padding: 20, overflowY: 'auto' }}>
          <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 14, padding: 28, width: '100%', maxWidth: 680, margin: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 20, paddingBottom: 14, borderBottom: '2px solid #dc2626' }}>
              <div>
                <h3 style={{ fontSize: 16, fontWeight: 700, color: '#0f172a' }}>Reclamo de Garantía</h3>
                <p style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>{selectedGarantia.numero} · {selectedGarantia.clienteNombre} · {selectedGarantia.productoNombre}</p>
              </div>
              <button onClick={() => setShowReclamo(false)} style={{ background: 'none', border: 'none', fontSize: 22, cursor: 'pointer', color: '#94a3b8' }}>×</button>
            </div>

            {/* Garantia info */}
            <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 8, padding: 12, marginBottom: 16, fontSize: 12 }}>
              <div style={{ display: 'flex', gap: 20 }}>
                <span> Vence: <strong>{fmtDate(selectedGarantia.fechaVencimiento)}</strong></span>
                <span>⏳ {diasRestantes(selectedGarantia)} días restantes</span>
                <span> Serie: <strong>{selectedGarantia.productoSerie || '—'}</strong></span>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14 }}>
              <div>
                <label style={lbl}>NIT del cliente</label>
                <input className="input" value={reclamoForm.clienteNit} onChange={e => setRF('clienteNit', e.target.value)} placeholder="CF" />
              </div>
              <div>
                <label style={lbl}>DPI del cliente</label>
                <input className="input" value={reclamoForm.clienteDpi} onChange={e => setRF('clienteDpi', e.target.value)} placeholder="Número de DPI" />
              </div>
              <div>
                <label style={lbl}>Teléfono</label>
                <input className="input" value={reclamoForm.clienteTelefono} onChange={e => setRF('clienteTelefono', e.target.value)} />
              </div>
              <div>
                <label style={lbl}>¿Presenta factura original?</label>
                <div style={{ display: 'flex', gap: 10, marginTop: 6 }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', fontSize: 13 }}>
                    <input type="radio" checked={reclamoForm.tieneFactura} onChange={() => setRF('tieneFactura', true)} /> Sí
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', fontSize: 13 }}>
                    <input type="radio" checked={!reclamoForm.tieneFactura} onChange={() => setRF('tieneFactura', false)} /> No
                  </label>
                </div>
              </div>
              {reclamoForm.tieneFactura && (
                <div>
                  <label style={lbl}>Número de factura</label>
                  <input className="input" value={reclamoForm.numeroFactura} onChange={e => setRF('numeroFactura', e.target.value)} />
                </div>
              )}
              <div style={{ gridColumn: '1/-1' }}>
                <label style={lbl}>Motivo del reclamo *</label>
                <select className="input" value={reclamoForm.motivoReclamo} onChange={e => setRF('motivoReclamo', e.target.value)}>
                  <option value="">Seleccionar motivo...</option>
                  {MOTIVOS.map(m => <option key={m} value={m}>{m}</option>)}
                </select>
              </div>
              <div style={{ gridColumn: '1/-1' }}>
                <label style={lbl}>Descripción detallada del defecto *</label>
                <textarea className="input" rows={3} value={reclamoForm.descripcionFalla} onChange={e => setRF('descripcionFalla', e.target.value)} placeholder="Describe con detalle el problema que presenta el producto..." />
              </div>
              <div style={{ gridColumn: '1/-1' }}>
                <label style={lbl}>Notas internas</label>
                <input className="input" value={reclamoForm.notas} onChange={e => setRF('notas', e.target.value)} placeholder="Observaciones del técnico al recibir el equipo" />
              </div>
            </div>

            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button className="btn-ghost" onClick={() => setShowReclamo(false)}>Cancelar</button>
              <button onClick={saveReclamo} disabled={loading}
                style={{ background: '#dc2626', color: '#fff', border: 'none', padding: '10px 24px', borderRadius: 8, fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>
                {loading ? 'Registrando...' : 'Registrar Reclamo e Imprimir'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

'use client'
import { useState, useEffect } from 'react'
import { toast } from 'sonner'
import { fmt, fmtDate } from '@/lib/utils'

interface CotizacionItem {
  id?: number
  codigo: string
  descripcion: string
  cantidad: number
  precioUnitario: number
  subtotal: number
  descuento: number
  totalItem: number
}

interface Cotizacion {
  id: number
  numero: string
  fecha: string
  clienteNombre: string
  clienteDireccion: string | null
  clienteTelefono: string | null
  clienteNit: string | null
  atencion: string | null
  formaPago: string | null
  descripcion: string | null
  notas: string | null
  subtotal: number
  descuento: number
  total: number
  estado: string
  validezDias: number
  usuarioNombre: string | null
  items: CotizacionItem[]
}

const emptyItem = (): CotizacionItem => ({
  codigo: '', descripcion: '', cantidad: 1, precioUnitario: 0, subtotal: 0, descuento: 0, totalItem: 0,
})

const emptyForm = {
  clienteNombre: '', clienteDireccion: '', clienteTelefono: '', clienteNit: 'CF',
  atencion: '', formaPago: 'Efectivo, Transferencia, Deposito, Cheque Preautorizado',
  descripcion: '', notas: '', validezDias: '15',
}

const WEBSOFT_LOGO = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" width="70" height="70">
  <circle cx="100" cy="100" r="95" fill="none" stroke="#1a5fa0" stroke-width="6"/>
  <path d="M60 70 Q80 50 100 70 Q120 50 140 70 L130 130 Q110 150 100 140 Q90 150 70 130 Z" fill="none" stroke="#1a5fa0" stroke-width="5"/>
  <circle cx="100" cy="100" r="15" fill="#1a5fa0"/>
  <line x1="100" y1="85" x2="100" y2="45" stroke="#1a5fa0" stroke-width="4"/>
  <line x1="85" y1="100" x2="45" y2="100" stroke="#1a5fa0" stroke-width="4"/>
  <line x1="115" y1="100" x2="155" y2="100" stroke="#1a5fa0" stroke-width="4"/>
  <line x1="100" y1="115" x2="100" y2="155" stroke="#1a5fa0" stroke-width="4"/>
</svg>`

export default function CotizacionesPage() {
  const [cotizaciones, setCotizaciones] = useState<Cotizacion[]>([])
  const [showModal, setShowModal] = useState(false)
  const [showPreview, setShowPreview] = useState(false)
  const [selected, setSelected] = useState<Cotizacion | null>(null)
  const [form, setForm] = useState(emptyForm)
  const [items, setItems] = useState<CotizacionItem[]>([emptyItem()])
  const [loading, setLoading] = useState(false)
  const [config, setConfig] = useState<any>({})

  const load = async () => {
    const [c, cfg] = await Promise.all([
      fetch('/api/cotizaciones').then(r => r.json()),
      fetch('/api/config').then(r => r.json()),
    ])
    setCotizaciones(Array.isArray(c) ? c : [])
    setConfig(cfg)
  }

  useEffect(() => { load() }, [])

  const setF = (k: string, v: string) => setForm(p => ({ ...p, [k]: v }))

  const updItem = (i: number, k: keyof CotizacionItem, v: string | number) => {
    setItems(prev => prev.map((item, idx) => {
      if (idx !== i) return item
      const updated = { ...item, [k]: v }
      const sub = updated.cantidad * updated.precioUnitario
      const desc = updated.descuento || 0
      updated.subtotal = sub
      updated.totalItem = sub - desc
      return updated
    }))
  }

  const addItem = () => setItems(p => [...p, emptyItem()])
  const removeItem = (i: number) => setItems(p => p.filter((_, idx) => idx !== i))

  const subtotal = items.reduce((s, i) => s + i.subtotal, 0)
  const descuentoTotal = items.reduce((s, i) => s + i.descuento, 0)
  const total = subtotal - descuentoTotal

  const save = async () => {
    if (!form.clienteNombre.trim()) { toast.error('Nombre del cliente requerido'); return }
    if (items.every(i => !i.descripcion.trim())) { toast.error('Agrega al menos un item'); return }
    setLoading(true)
    const validItems = items.filter(i => i.descripcion.trim())
    const res = await fetch('/api/cotizaciones', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...form, items: validItems, subtotal, descuento: descuentoTotal, total }),
    })
    const data = await res.json()
    setLoading(false)
    if (data.ok) {
      toast.success(`Cotizacion ${data.cotizacion.numero} creada`)
      setShowModal(false)
      setForm(emptyForm)
      setItems([emptyItem()])
      load()
      setSelected(data.cotizacion)
      setShowPreview(true)
    } else {
      toast.error(data.error || 'Error')
    }
  }

  const cambiarEstado = async (id: number, estado: string) => {
    await fetch(`/api/cotizaciones/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ estado }),
    })
    load()
    if (selected?.id === id) setSelected(prev => prev ? { ...prev, estado } : null)
  }

  const eliminar = async (id: number) => {
    if (!confirm('Eliminar esta cotizacion?')) return
    await fetch(`/api/cotizaciones/${id}`, { method: 'DELETE' })
    toast.success('Eliminada')
    setShowPreview(false)
    setSelected(null)
    load()
  }

  const imprimir = (cot: Cotizacion) => {
    const w = window.open('', '_blank', 'width=900,height=700')
    if (!w) return
    const rows = cot.items.map(it => `
      <tr>
        <td class="code">${it.codigo || ''}</td>
        <td>${it.descripcion}</td>
        <td class="center">${it.cantidad}</td>
        <td class="right">Q ${it.precioUnitario.toFixed(2)}</td>
        <td class="right">Q ${it.subtotal.toFixed(2)}</td>
        <td class="right">${it.descuento > 0 ? `Q ${it.descuento.toFixed(2)}` : 'Q0.00'}</td>
        <td class="right bold">Q ${it.totalItem.toFixed(2)}</td>
      </tr>`).join('')

    w.document.write(`<!DOCTYPE html>
<html><head><meta charset="UTF-8">
<style>
  @import url('https://fonts.googleapis.com/css2?family=Montserrat:wght@400;600;700;800&display=swap');
  *{margin:0;padding:0;box-sizing:border-box}
  body{font-family:'Montserrat',sans-serif;font-size:11px;color:#1a1a2e;padding:20px;background:#fff}
  .header{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:16px}
  .logo-area{display:flex;align-items:center;gap:12px}
  .logo-circle{width:70px;height:70px;border-radius:50%;border:4px solid #1a5fa0;display:flex;align-items:center;justify-content:center;position:relative}
  .logo-inner{width:46px;height:46px;border:3px solid #1a5fa0;border-radius:50%;display:flex;align-items:center;justify-content:center}
  .logo-dot{width:14px;height:14px;background:#1a5fa0;border-radius:50%}
  .logo-line-h{position:absolute;width:60px;height:3px;background:#1a5fa0;top:50%;transform:translateY(-50%)}
  .logo-line-v{position:absolute;height:60px;width:3px;background:#1a5fa0;left:50%;transform:translateX(-50%)}
  .brand-name{font-size:20px;font-weight:800;color:#1a1a2e;line-height:1}
  .brand-soft{color:#1a5fa0}
  .brand-sub{font-size:9px;letter-spacing:3px;color:#1a5fa0;font-weight:600;margin-top:2px}
  .company-info{text-align:right;font-size:10px;color:#444;line-height:1.6}
  .company-info strong{font-size:13px;font-weight:800;color:#1a1a2e;display:block}
  .title-banner{background:#1a5fa0;color:#fff;text-align:center;padding:8px;font-size:22px;font-weight:800;letter-spacing:4px;margin-bottom:14px;border-radius:4px}
  .divider{border:none;border-top:2px solid #1a5fa0;margin:10px 0}
  .divider-thin{border:none;border-top:1px solid #ccc;margin:8px 0}
  .client-grid{display:grid;grid-template-columns:1fr 1fr;gap:6px;font-size:10px;margin-bottom:10px}
  .client-row{display:flex;gap:6px}
  .client-label{font-weight:700;color:#1a1a2e;min-width:70px}
  .client-val{color:#333}
  .forma-pago{font-size:10px;margin-bottom:8px}
  .forma-pago strong{color:#1a5fa0}
  .cot-title{font-size:12px;font-weight:700;margin-bottom:8px;color:#1a1a2e}
  table{width:100%;border-collapse:collapse;margin-bottom:10px}
  thead tr{background:#1a5fa0;color:#fff}
  thead th{padding:7px 8px;font-size:10px;font-weight:700;text-align:left;letter-spacing:.3px}
  tbody tr:nth-child(even){background:#f0f5ff}
  tbody td{padding:6px 8px;border-bottom:1px solid #dde5f5;font-size:10px;vertical-align:top}
  .code{font-family:monospace;font-size:9px;color:#1a5fa0;font-weight:700}
  .center{text-align:center}
  .right{text-align:right}
  .bold{font-weight:700}
  .totals{display:flex;justify-content:flex-end;margin-bottom:14px}
  .totals-box{background:#f0f5ff;border:2px solid #1a5fa0;border-radius:6px;padding:10px 16px;min-width:220px}
  .totals-row{display:flex;justify-content:space-between;padding:3px 0;font-size:11px;color:#333}
  .totals-row.final{font-size:14px;font-weight:800;color:#1a5fa0;border-top:2px solid #1a5fa0;padding-top:6px;margin-top:4px}
  .notice{font-size:9px;font-weight:700;color:#cc0000;margin-bottom:8px;line-height:1.6}
  .conditions{font-size:8.5px;color:#444;line-height:1.6;margin-bottom:14px}
  .conditions strong{color:#1a1a2e}
  .sign-area{display:grid;grid-template-columns:1fr 1fr;gap:30px;margin-top:20px}
  .sign-line{border-top:1.5px solid #1a1a2e;padding-top:4px;font-size:10px;font-weight:700;color:#1a1a2e}
  .badge-pendiente{background:#fff3cd;color:#856404;padding:2px 8px;border-radius:10px;font-size:9px;font-weight:700}
  .badge-aceptada{background:#d1e7dd;color:#0a5c36;padding:2px 8px;border-radius:10px;font-size:9px;font-weight:700}
  @media print{body{padding:10px}@page{margin:10mm}}
</style>
</head><body>
<div class="header">
  <div class="logo-area">
    <div class="logo-circle">
      <div class="logo-line-h"></div>
      <div class="logo-line-v"></div>
      <div class="logo-inner"><div class="logo-dot"></div></div>
    </div>
    <div>
      <div class="brand-name">Web<span class="brand-soft">Soft</span></div>
      <div class="brand-sub">S O L U T I O N S</div>
    </div>
  </div>
  <div class="company-info">
    <strong>WEBSOFT SOLUTIONS</strong>
    GUASTATOYA, EL PROGRESO,<br>
    Barrio el Calvario entre Calle principal y 4ta calle,<br>
    Guastatoya, El Progreso<br>
    TEL: (502) 3836-1044
  </div>
</div>

<div class="title-banner">COTIZACION</div>

<hr class="divider">
<div class="client-grid">
  <div>
    <div class="client-row"><span class="client-label">Nombre:</span><span class="client-val">${cot.clienteNombre}</span></div>
    <div class="client-row"><span class="client-label">Direccion:</span><span class="client-val">${cot.clienteDireccion || ''}</span></div>
    <div class="client-row"><span class="client-label">Telefono:</span><span class="client-val">${cot.clienteTelefono || ''}</span></div>
  </div>
  <div>
    <div class="client-row"><span class="client-label">Atencion:</span><span class="client-val">${cot.atencion || ''}</span></div>
    <div class="client-row"><span class="client-label">Fecha:</span><span class="client-val">${new Date(cot.fecha).toLocaleDateString('es-GT')}</span></div>
    <div class="client-row"><span class="client-label">Visitanos en:</span><span class="client-val" style="color:#1a5fa0">www.websoft.solutions.com</span></div>
  </div>
</div>
<hr class="divider">

<div class="forma-pago"><strong>Forma de Pago:</strong> ${cot.formaPago || ''}</div>
${cot.descripcion ? `<div class="cot-title">${cot.descripcion}</div>` : ''}

<table>
  <thead>
    <tr>
      <th style="width:80px">Codigo</th>
      <th>Descripcion</th>
      <th style="width:55px;text-align:center">Cantidad</th>
      <th style="width:80px;text-align:right">Precio Unitario</th>
      <th style="width:80px;text-align:right">Sub Total</th>
      <th style="width:80px;text-align:right">Descuento</th>
      <th style="width:90px;text-align:right">Sub Total para pagar</th>
    </tr>
  </thead>
  <tbody>${rows}</tbody>
</table>

<div class="totals">
  <div class="totals-box">
    <div class="totals-row"><span>Totales</span><span>Q ${cot.subtotal.toFixed(2)}</span></div>
    <div class="totals-row"><span>Descuento</span><span>Q ${cot.descuento.toFixed(2)}</span></div>
    <div class="totals-row final"><span>TOTAL A PAGAR</span><span>Q ${cot.total.toFixed(2)}</span></div>
  </div>
</div>

<div style="font-size:10px;font-weight:700;margin-bottom:6px">CF.OF</div>

<div class="notice">
  SUJETO A DISPONIBILIDAD DEL(OS) PRODUCTO(S).<br>
  ANTES DE GENERAR PAGO CONSULTAR EXISTENCIAS CON SU VENDEDOR DE WEBSOFT SOLUTIONS.
</div>

<div class="conditions">
  <strong>CONDICIONES:</strong><br>
  1. <strong>FORMA DE PAGO:</strong> ANTICIPADO, CONTRA ENTREGA, FINANCIADO (Por Terceros) y TARJETAS DE CREDITO (Aplican Restricciones). ANTICIPADO: Cheque de caja(Q), efectivo(Q), cheque personal(Q). Favor emitir su cheque a nombre de WebSoft Solutions.<br>
  2. <strong>ENTREGA:</strong> De inmediato a 3 dias (Segun su forma de pago). Al no tener existencia puede variar hasta un maximo de 3 semanas.<br>
  3. <strong>GARANTIA:</strong> Las garantias se atienden en las instalaciones de WebSoft Solutions en Guastatoya, El Progreso. Tenemos la discrecion de reparar o reemplazar la unidad defectuosa. DANOS FISICOS INTERNOS o EXTERNOS ANULAN LA GARANTIA.<br>
  4. <strong>SERVICIO TECNICO Y ASESORIA:</strong> Contamos con un departamento tecnico calificado para poder solucionar cualquier problema durante su periodo de garantia.
</div>

<div class="sign-area">
  <div>
    <div class="sign-line">Aceptado (Cliente): ____________________________</div>
    <div style="font-size:9px;color:#666;margin-top:4px">Fecha de aceptacion: _____ / _____ / ______</div>
  </div>
  <div style="text-align:right;font-size:9px;color:#888">
    Cotizacion valida por ${cot.validezDias} dias<br>
    ${cot.numero}
  </div>
</div>
</body></html>`)
    w.document.close()
    setTimeout(() => w.print(), 600)
  }

  const estadoBadge = (e: string) => {
    const map: Record<string, string> = {
      pendiente: 'badge-orange',
      aceptada: 'badge-green',
      rechazada: 'badge-red',
      vencida: 'badge-gray',
    }
    return map[e] || 'badge-gray'
  }

  return (
    <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 18 }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          {/* WebSoft mini logo */}
          <div style={{ width: 46, height: 46, borderRadius: '50%', border: '3px solid #1a5fa0', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', flexShrink: 0 }}>
            <div style={{ position: 'absolute', width: '100%', height: 2.5, background: '#1a5fa0', top: '50%', transform: 'translateY(-50%)' }} />
            <div style={{ position: 'absolute', height: '100%', width: 2.5, background: '#1a5fa0', left: '50%', transform: 'translateX(-50%)' }} />
            <div style={{ width: 14, height: 14, background: '#1a5fa0', borderRadius: '50%', border: '2.5px solid #fff', zIndex: 1 }} />
          </div>
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 800, color: '#e2e8f0', lineHeight: 1 }}>
              Web<span style={{ color: '#1a5fa0' }}>Soft</span> — Cotizaciones
            </h1>
            <p style={{ fontSize: 12, color: '#94a3b8', marginTop: 3, letterSpacing: 1 }}>WEBSOFT SOLUTIONS</p>
          </div>
        </div>
        <button className="btn-primary" onClick={() => setShowModal(true)} style={{ background: '#1a5fa0' }}>
          + Nueva Cotizacion
        </button>
      </div>

      {/* Lista */}
      <div className="card">
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                {['#', 'Fecha', 'Cliente', 'Atencion', 'Total', 'Estado', ''].map(h => (
                  <th key={h} style={{ background: '#1a5fa0', color: '#fff', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', padding: '10px 13px', textAlign: 'left', letterSpacing: '.5px' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {cotizaciones.length === 0 ? (
                <tr><td colSpan={7} style={{ textAlign: 'center', padding: 50, color: '#475569', fontSize: 14 }}>
                  No hay cotizaciones aun. Crea la primera.
                </td></tr>
              ) : cotizaciones.map(c => (
                <tr key={c.id} onClick={() => { setSelected(c); setShowPreview(true) }} style={{ cursor: 'pointer' }}>
                  <td style={{ padding: '11px 13px', fontSize: 13, fontWeight: 700, borderBottom: '1px solid rgba(255,255,255,.04)', color: '#1a5fa0' }}>{c.numero}</td>
                  <td style={{ padding: '11px 13px', fontSize: 12, borderBottom: '1px solid rgba(255,255,255,.04)', color: '#94a3b8', whiteSpace: 'nowrap' }}>{fmtDate(c.fecha)}</td>
                  <td style={{ padding: '11px 13px', fontSize: 13, borderBottom: '1px solid rgba(255,255,255,.04)', fontWeight: 600, color: '#e2e8f0' }}>{c.clienteNombre}</td>
                  <td style={{ padding: '11px 13px', fontSize: 12, borderBottom: '1px solid rgba(255,255,255,.04)', color: '#94a3b8' }}>{c.atencion || '—'}</td>
                  <td style={{ padding: '11px 13px', fontSize: 13, fontWeight: 700, borderBottom: '1px solid rgba(255,255,255,.04)', color: '#e2e8f0' }}>{fmt(c.total)}</td>
                  <td style={{ padding: '11px 13px', borderBottom: '1px solid rgba(255,255,255,.04)' }}>
                    <span className={estadoBadge(c.estado)} style={{ textTransform: 'capitalize' }}>{c.estado}</span>
                  </td>
                  <td style={{ padding: '11px 13px', borderBottom: '1px solid rgba(255,255,255,.04)' }}>
                    <div style={{ display: 'flex', gap: 6 }} onClick={e => e.stopPropagation()}>
                      <button className="btn-ghost btn-sm" onClick={() => { setSelected(c); setShowPreview(true) }}>Ver</button>
                      <button className="btn-ghost btn-sm" onClick={() => imprimir(c)}>Imprimir</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL NUEVA COTIZACION */}
      {showModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.6)', zIndex: 999, display: 'flex', alignItems: 'flex-start', justifyContent: 'center', padding: '20px', overflowY: 'auto' }}>
          <div style={{ background: 'rgba(255,255,255,.03)', borderRadius: 16, padding: 28, width: '100%', maxWidth: 820, margin: 'auto' }}>
            {/* Header modal */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, paddingBottom: 16, borderBottom: '2px solid #1a5fa0' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 36, height: 36, borderRadius: '50%', border: '2.5px solid #1a5fa0', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
                  <div style={{ position: 'absolute', width: '100%', height: 2, background: '#1a5fa0' }} />
                  <div style={{ position: 'absolute', height: '100%', width: 2, background: '#1a5fa0' }} />
                  <div style={{ width: 10, height: 10, background: '#1a5fa0', borderRadius: '50%', border: '2px solid #fff', zIndex: 1 }} />
                </div>
                <div>
                  <div style={{ fontWeight: 800, fontSize: 16, color: '#e2e8f0' }}>Nueva Cotizacion</div>
                  <div style={{ fontSize: 11, color: '#1a5fa0', letterSpacing: 1 }}>WEBSOFT SOLUTIONS</div>
                </div>
              </div>
              <button onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', fontSize: 24, cursor: 'pointer', color: '#475569' }}>×</button>
            </div>

            {/* Cliente info */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 18 }}>
              {[
                { label: 'Nombre del cliente *', key: 'clienteNombre', full: true },
                { label: 'Direccion', key: 'clienteDireccion' },
                { label: 'Telefono', key: 'clienteTelefono' },
                { label: 'NIT', key: 'clienteNit' },
                { label: 'Atencion (vendedor)', key: 'atencion' },
                { label: 'Validez (dias)', key: 'validezDias', type: 'number' },
                { label: 'Forma de pago', key: 'formaPago', full: true },
                { label: 'Descripcion del servicio/producto', key: 'descripcion', full: true },
              ].map((f: any) => (
                <div key={f.key} style={{ gridColumn: f.full ? '1/-1' : 'auto' }}>
                  <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#1a5fa0', textTransform: 'uppercase', marginBottom: 4, letterSpacing: '.5px' }}>{f.label}</label>
                  <input
                    className="input"
                    type={f.type || 'text'}
                    value={(form as any)[f.key]}
                    onChange={e => setF(f.key, e.target.value)}
                    style={{ borderColor: '#c5d5e8' }}
                  />
                </div>
              ))}
            </div>

            {/* Items */}
            <div style={{ marginBottom: 18 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                <span style={{ fontSize: 12, fontWeight: 700, color: '#1a5fa0', textTransform: 'uppercase', letterSpacing: '.5px' }}>Detalle de productos / servicios</span>
                <button className="btn-ghost btn-sm" onClick={addItem} style={{ borderColor: '#1a5fa0', color: '#1a5fa0' }}>+ Agregar fila</button>
              </div>

              {/* Table header */}
              <div style={{ display: 'grid', gridTemplateColumns: '90px 1fr 70px 100px 90px 90px 24px', gap: 6, marginBottom: 6 }}>
                {['Codigo', 'Descripcion', 'Cant.', 'Precio Unit.', 'Descuento', 'Total', ''].map(h => (
                  <div key={h} style={{ fontSize: 10, fontWeight: 700, color: '#fff', background: '#1a5fa0', padding: '5px 6px', borderRadius: 4, textAlign: h === 'Cant.' ? 'center' : 'left' }}>{h}</div>
                ))}
              </div>

              {items.map((item, i) => (
                <div key={i} style={{ display: 'grid', gridTemplateColumns: '90px 1fr 70px 100px 90px 90px 24px', gap: 6, marginBottom: 6, alignItems: 'center' }}>
                  <input className="input" value={item.codigo} onChange={e => updItem(i, 'codigo', e.target.value)} placeholder="SRV-001" style={{ fontSize: 11, padding: '5px 7px' }} />
                  <input className="input" value={item.descripcion} onChange={e => updItem(i, 'descripcion', e.target.value)} placeholder="Descripcion del item" style={{ fontSize: 11, padding: '5px 7px' }} />
                  <input className="input" type="number" min="0" value={item.cantidad} onChange={e => updItem(i, 'cantidad', Number(e.target.value))} style={{ fontSize: 11, padding: '5px 7px', textAlign: 'center' }} />
                  <input className="input" type="number" min="0" value={item.precioUnitario} onChange={e => updItem(i, 'precioUnitario', Number(e.target.value))} style={{ fontSize: 11, padding: '5px 7px' }} />
                  <input className="input" type="number" min="0" value={item.descuento} onChange={e => updItem(i, 'descuento', Number(e.target.value))} style={{ fontSize: 11, padding: '5px 7px' }} />
                  <div style={{ fontSize: 12, fontWeight: 700, color: '#1a5fa0', textAlign: 'right', padding: '5px 4px' }}>Q {item.totalItem.toFixed(2)}</div>
                  <button onClick={() => removeItem(i)} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: 18, lineHeight: 1, padding: 0 }}>×</button>
                </div>
              ))}
            </div>

            {/* Totales */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 20 }}>
              <div style={{ background: '#f0f5ff', border: '2px solid #1a5fa0', borderRadius: 10, padding: '12px 18px', minWidth: 220 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: '#94a3b8', marginBottom: 4 }}><span>Subtotal</span><span>{fmt(subtotal)}</span></div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: '#94a3b8', marginBottom: 8 }}><span>Descuento</span><span>{fmt(descuentoTotal)}</span></div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 17, fontWeight: 800, color: '#1a5fa0', borderTop: '2px solid #1a5fa0', paddingTop: 8 }}><span>TOTAL</span><span>{fmt(total)}</span></div>
              </div>
            </div>

            {/* Notes */}
            <div style={{ marginBottom: 20 }}>
              <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#1a5fa0', textTransform: 'uppercase', marginBottom: 4 }}>Notas adicionales</label>
              <textarea className="input" rows={2} value={form.notas} onChange={e => setF('notas', e.target.value)} style={{ resize: 'vertical' }} />
            </div>

            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button className="btn-ghost" onClick={() => setShowModal(false)}>Cancelar</button>
              <button onClick={save} disabled={loading} style={{ background: '#1a5fa0', color: '#fff', border: 'none', padding: '10px 24px', borderRadius: 8, fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>
                {loading ? 'Guardando...' : 'Guardar e Imprimir'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* PREVIEW / DETALLE */}
      {showPreview && selected && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.6)', zIndex: 999, display: 'flex', alignItems: 'flex-start', justifyContent: 'center', padding: 20, overflowY: 'auto' }}>
          <div style={{ background: 'rgba(255,255,255,.03)', borderRadius: 16, padding: 28, width: '100%', maxWidth: 720, margin: 'auto' }}>
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 20 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ width: 50, height: 50, borderRadius: '50%', border: '3px solid #1a5fa0', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', flexShrink: 0 }}>
                  <div style={{ position: 'absolute', width: '100%', height: 2.5, background: '#1a5fa0' }} />
                  <div style={{ position: 'absolute', height: '100%', width: 2.5, background: '#1a5fa0' }} />
                  <div style={{ width: 13, height: 13, background: '#1a5fa0', borderRadius: '50%', border: '2px solid #fff', zIndex: 1 }} />
                </div>
                <div>
                  <div style={{ fontWeight: 800, fontSize: 18, color: '#e2e8f0' }}>Web<span style={{ color: '#1a5fa0' }}>Soft</span> Solutions</div>
                  <div style={{ fontSize: 11, color: '#1a5fa0', letterSpacing: 1 }}>GUASTATOYA, EL PROGRESO</div>
                </div>
              </div>
              <button onClick={() => setShowPreview(false)} style={{ background: 'none', border: 'none', fontSize: 24, cursor: 'pointer', color: '#475569' }}>×</button>
            </div>

            <div style={{ background: '#1a5fa0', color: '#fff', textAlign: 'center', padding: '8px', fontSize: 18, fontWeight: 800, letterSpacing: 4, borderRadius: 6, marginBottom: 16 }}>COTIZACION</div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16, fontSize: 13 }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                {[['Numero', selected.numero], ['Cliente', selected.clienteNombre], ['Telefono', selected.clienteTelefono || '—'], ['Direccion', selected.clienteDireccion || '—']].map(([l, v]) => (
                  <div key={l} style={{ display: 'flex', gap: 8 }}>
                    <span style={{ fontWeight: 700, color: '#1a5fa0', minWidth: 80 }}>{l}:</span>
                    <span style={{ color: '#e2e8f0' }}>{v}</span>
                  </div>
                ))}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                {[['Atencion', selected.atencion || '—'], ['Fecha', fmtDate(selected.fecha)], ['Forma pago', selected.formaPago || '—'], ['Estado', selected.estado]].map(([l, v]) => (
                  <div key={l} style={{ display: 'flex', gap: 8 }}>
                    <span style={{ fontWeight: 700, color: '#1a5fa0', minWidth: 80 }}>{l}:</span>
                    <span style={{ color: '#e2e8f0', textTransform: 'capitalize' }}>{v}</span>
                  </div>
                ))}
              </div>
            </div>

            {selected.descripcion && (
              <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 10, color: '#e2e8f0' }}>{selected.descripcion}</div>
            )}

            <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 14 }}>
              <thead>
                <tr style={{ background: '#1a5fa0' }}>
                  {['Codigo', 'Descripcion', 'Cant.', 'P/Unit.', 'Subtotal', 'Desc.', 'Total'].map(h => (
                    <th key={h} style={{ color: '#fff', fontSize: 10, fontWeight: 700, padding: '8px 10px', textAlign: 'left', textTransform: 'uppercase' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {selected.items.map((it, i) => (
                  <tr key={i} style={{ background: i % 2 === 0 ? '#f0f5ff' : '#fff' }}>
                    <td style={{ padding: '8px 10px', fontSize: 11, fontFamily: 'monospace', color: '#1a5fa0', fontWeight: 700, borderBottom: '1px solid #dde5f5' }}>{it.codigo || ''}</td>
                    <td style={{ padding: '8px 10px', fontSize: 12, borderBottom: '1px solid #dde5f5' }}>{it.descripcion}</td>
                    <td style={{ padding: '8px 10px', fontSize: 12, textAlign: 'center', borderBottom: '1px solid #dde5f5' }}>{it.cantidad}</td>
                    <td style={{ padding: '8px 10px', fontSize: 12, borderBottom: '1px solid #dde5f5' }}>{fmt(it.precioUnitario)}</td>
                    <td style={{ padding: '8px 10px', fontSize: 12, borderBottom: '1px solid #dde5f5' }}>{fmt(it.subtotal)}</td>
                    <td style={{ padding: '8px 10px', fontSize: 12, borderBottom: '1px solid #dde5f5' }}>{it.descuento > 0 ? fmt(it.descuento) : 'Q0.00'}</td>
                    <td style={{ padding: '8px 10px', fontSize: 12, fontWeight: 700, borderBottom: '1px solid #dde5f5' }}>{fmt(it.totalItem)}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 20 }}>
              <div style={{ background: '#f0f5ff', border: '2px solid #1a5fa0', borderRadius: 10, padding: '12px 18px', minWidth: 200 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: '#94a3b8', marginBottom: 4 }}><span>Subtotal</span><span>{fmt(selected.subtotal)}</span></div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: '#94a3b8', marginBottom: 8 }}><span>Descuento</span><span>{fmt(selected.descuento)}</span></div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 17, fontWeight: 800, color: '#1a5fa0', borderTop: '2px solid #1a5fa0', paddingTop: 8 }}><span>TOTAL</span><span>{fmt(selected.total)}</span></div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: 10, justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', gap: 8 }}>
                <select
                  value={selected.estado}
                  onChange={e => cambiarEstado(selected.id, e.target.value)}
                  className="input"
                  style={{ fontSize: 12, width: 150 }}
                >
                  <option value="pendiente">Pendiente</option>
                  <option value="aceptada">Aceptada</option>
                  <option value="rechazada">Rechazada</option>
                  <option value="vencida">Vencida</option>
                </select>
                <button className="btn-danger btn-sm" onClick={() => eliminar(selected.id)}>Eliminar</button>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button className="btn-ghost" onClick={() => setShowPreview(false)}>Cerrar</button>
                <button onClick={() => imprimir(selected)} style={{ background: '#1a5fa0', color: '#fff', border: 'none', padding: '8px 18px', borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>
                  Imprimir / PDF
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

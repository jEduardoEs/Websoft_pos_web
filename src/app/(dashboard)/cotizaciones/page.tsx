'use client'
import { useState, useEffect } from 'react'
import { toast } from 'sonner'
import { fmt, fmtDate } from '@/lib/utils'

// ─── Types ───────────────────────────────────────────────
interface LineItem {
  tipo: 'producto' | 'servicio' | 'instalacion'
  codigo: string
  descripcion: string
  // Producto
  costoCompra: number
  precioVenta: number   // auto: costoCompra * 1.30 * 1.05
  cantidad: number
  subtotal: number
  descuento: number
  total: number
  // Instalacion extra fields (solo si tipo='instalacion')
  km: number
  precioGasolina: number  // Q/litro
  rendimiento: number     // km/litro
  tecnicos: number
  horas: number
  manoObra: number
}

interface Cotizacion {
  id: number; numero: string; fecha: string
  clienteNombre: string; clienteDireccion: string | null
  clienteTelefono: string | null; clienteNit: string | null
  atencion: string | null; formaPago: string | null
  descripcion: string | null; notas: string | null
  subtotal: number; descuento: number; total: number
  estado: string; validezDias: number; usuarioNombre: string | null
  items: any[]
}

// ─── Helpers ─────────────────────────────────────────────
const IVA = 0.05
const GANANCIA = 0.30
const IVA_PROD = 0.05

function calcPrecioVenta(costo: number) {
  return costo * (1 + GANANCIA) * (1 + IVA_PROD)
}

function calcInstalacion(item: LineItem) {
  // Gasolina: (km * 2 ida-vuelta) / rendimiento * precio_litro
  const litros = (item.km * 2) / (item.rendimiento || 30)
  const gas = litros * (item.precioGasolina || 28)
  // Comida: Q35 por tecnico por tiempo
  const comida = item.tecnicos * item.horas * 35
  // Mano de obra
  const obra = item.manoObra
  return gas + comida + obra
}

function newProducto(): LineItem {
  return { tipo: 'producto', codigo: '', descripcion: '', costoCompra: 0, precioVenta: 0, cantidad: 1, subtotal: 0, descuento: 0, total: 0, km: 0, precioGasolina: 28, rendimiento: 30, tecnicos: 1, horas: 1, manoObra: 0 }
}
function newServicio(): LineItem {
  return { tipo: 'servicio', codigo: '', descripcion: '', costoCompra: 0, precioVenta: 0, cantidad: 1, subtotal: 0, descuento: 0, total: 0, km: 0, precioGasolina: 28, rendimiento: 30, tecnicos: 1, horas: 1, manoObra: 0 }
}
function newInstalacion(): LineItem {
  return { tipo: 'instalacion', codigo: 'INST-001', descripcion: 'Instalacion tecnica', costoCompra: 0, precioVenta: 0, cantidad: 1, subtotal: 0, descuento: 0, total: 0, km: 20, precioGasolina: 28, rendimiento: 30, tecnicos: 1, horas: 4, manoObra: 200 }
}

const emptyForm = {
  clienteNombre: '', clienteDireccion: '', clienteTelefono: '',
  clienteNit: 'CF', atencion: '', formaPago: 'Efectivo, Transferencia, Deposito, Cheque Preautorizado',
  descripcion: '', notas: '', validezDias: '15',
}

// ─── Component ───────────────────────────────────────────
export default function CotizacionesPage() {
  const [cotizaciones, setCotizaciones] = useState<Cotizacion[]>([])
  const [showModal, setShowModal] = useState(false)
  const [showPreview, setShowPreview] = useState(false)
  const [selected, setSelected] = useState<Cotizacion | null>(null)
  const [form, setForm] = useState(emptyForm)
  const [items, setItems] = useState<LineItem[]>([newProducto()])
  const [loading, setLoading] = useState(false)
  const [expandedInst, setExpandedInst] = useState<number[]>([])

  const load = async () => {
    const c = await fetch('/api/cotizaciones').then(r => r.json())
    setCotizaciones(Array.isArray(c) ? c : [])
  }
  useEffect(() => { load() }, [])

  const setF = (k: string, v: string) => setForm(p => ({ ...p, [k]: v }))

  // ─── Item update logic ───
  const updItem = (i: number, k: keyof LineItem, v: number | string) => {
    setItems(prev => prev.map((item, idx) => {
      if (idx !== i) return item
      const updated = { ...item, [k]: v }

      if (updated.tipo === 'producto') {
        // Auto-calc precio venta from costo
        if (k === 'costoCompra') {
          updated.precioVenta = calcPrecioVenta(Number(v))
        }
        const precio = updated.precioVenta
        const sub = precio * updated.cantidad
        updated.subtotal = sub
        updated.total = sub - updated.descuento

      } else if (updated.tipo === 'instalacion') {
        // Auto-calc from km, gas, comida, manoObra
        const inst = calcInstalacion(updated)
        updated.precioVenta = inst
        updated.subtotal = inst * updated.cantidad
        updated.total = updated.subtotal - updated.descuento

      } else {
        // Servicio — precio manual
        const sub = updated.precioVenta * updated.cantidad
        updated.subtotal = sub
        updated.total = sub - updated.descuento
      }
      return updated
    }))
  }

  const addItem = (tipo: 'producto' | 'servicio' | 'instalacion') => {
    const item = tipo === 'producto' ? newProducto() : tipo === 'instalacion' ? newInstalacion() : newServicio()
    setItems(p => [...p, item])
    if (tipo === 'instalacion') setExpandedInst(prev => [...prev, items.length])
  }

  const removeItem = (i: number) => setItems(p => p.filter((_, idx) => idx !== i))

  // ─── Totals ───
  const subtotalSinIva = items.reduce((s, i) => s + i.total, 0)
  const iva = subtotalSinIva * IVA
  const total = subtotalSinIva + iva
  const descuentoTotal = items.reduce((s, i) => s + i.descuento, 0)

  // ─── Save ───
  const save = async () => {
    if (!form.clienteNombre.trim()) { toast.error('Nombre del cliente requerido'); return }
    const validItems = items.filter(i => i.descripcion.trim())
    if (validItems.length === 0) { toast.error('Agrega al menos un item'); return }
    setLoading(true)
    const res = await fetch('/api/cotizaciones', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...form,
        items: validItems.map(i => ({
          codigo: i.codigo,
          descripcion: i.descripcion + (i.tipo === 'instalacion'
            ? ` (${i.km}km · ${i.tecnicos} tecnico(s) · ${i.horas}h)`
            : i.tipo === 'producto' && i.costoCompra > 0
            ? ` (costo Q${i.costoCompra.toFixed(2)})`
            : ''),
          cantidad: i.cantidad,
          precioUnitario: i.precioVenta,
          subtotal: i.subtotal,
          descuento: i.descuento,
          totalItem: i.total,
        })),
        subtotal: subtotalSinIva,
        descuento: descuentoTotal,
        total,
      }),
    })
    const data = await res.json()
    setLoading(false)
    if (data.ok) {
      toast.success(`${data.cotizacion.numero} creada`)
      setShowModal(false)
      setForm(emptyForm)
      setItems([newProducto()])
      load()
      setSelected(data.cotizacion)
      setShowPreview(true)
    } else toast.error(data.error || 'Error')
  }

  // ─── Print ───
  const imprimir = (cot: Cotizacion) => {
    const w = window.open('', '_blank', 'width=900,height=700')
    if (!w) return
    const rows = cot.items.map(it => `
      <tr>
        <td class="code">${it.codigo || ''}</td>
        <td>${it.descripcion}</td>
        <td class="center">${it.cantidad}</td>
        <td class="right">Q ${Number(it.precioUnitario).toFixed(2)}</td>
        <td class="right">Q ${Number(it.subtotal).toFixed(2)}</td>
        <td class="right">${it.descuento > 0 ? `Q ${Number(it.descuento).toFixed(2)}` : 'Q 0.00'}</td>
        <td class="right bold">Q ${Number(it.totalItem).toFixed(2)}</td>
      </tr>`).join('')
    const ivaCalc = ((cot.subtotal - cot.descuento) * 0.05).toFixed(2)
    const baseCalc = (cot.subtotal - cot.descuento).toFixed(2)

    w.document.write(`<!DOCTYPE html>
<html><head><meta charset="UTF-8">
<style>
  @import url('https://fonts.googleapis.com/css2?family=Montserrat:wght@400;600;700;800&display=swap');
  *{margin:0;padding:0;box-sizing:border-box}
  body{font-family:'Montserrat',sans-serif;font-size:11px;color:#1a1a2e;padding:22px;background:#fff}
  .header{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:18px}
  .logo-wrap{display:flex;align-items:center;gap:12px}
  .logo-img{width:64px;height:64px;border-radius:8px;object-fit:contain}
  .brand{line-height:1}
  .brand-name{font-size:22px;font-weight:800;color:#1a1a2e}
  .brand-name span{color:#1a5fa0}
  .brand-sub{font-size:8px;letter-spacing:3px;color:#1a5fa0;font-weight:700;margin-top:2px}
  .co-info{text-align:right;font-size:10px;color:#444;line-height:1.7}
  .co-info strong{font-size:13px;font-weight:800;color:#1a1a2e;display:block;margin-bottom:2px}
  .banner{background:#1a5fa0;color:#fff;text-align:center;padding:9px;font-size:18px;font-weight:800;letter-spacing:5px;border-radius:5px;margin-bottom:14px}
  hr.thick{border:none;border-top:2px solid #1a5fa0;margin:10px 0}
  hr.thin{border:none;border-top:1px solid #ddd;margin:8px 0}
  .grid2{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:10px}
  .row{display:flex;gap:6px;font-size:10px;margin-bottom:3px}
  .lbl{font-weight:700;color:#1a1a2e;min-width:75px}
  .val{color:#333}
  .fp{font-size:10px;margin-bottom:10px}
  .fp strong{color:#1a5fa0}
  table{width:100%;border-collapse:collapse;margin-bottom:10px}
  thead tr{background:#1a5fa0;color:#fff}
  thead th{padding:7px 8px;font-size:10px;font-weight:700;text-align:left}
  tbody tr:nth-child(even){background:#f0f5ff}
  tbody td{padding:6px 8px;border-bottom:1px solid #dde5f5;font-size:10px;vertical-align:top}
  .code{font-family:monospace;font-size:9px;color:#1a5fa0;font-weight:700}
  .center{text-align:center}.right{text-align:right}.bold{font-weight:700}
  .totals-wrap{display:flex;justify-content:flex-end;margin-bottom:12px}
  .totals{background:#f0f5ff;border:2px solid #1a5fa0;border-radius:6px;padding:10px 16px;min-width:230px}
  .t-row{display:flex;justify-content:space-between;font-size:11px;padding:3px 0;color:#444}
  .t-final{font-size:15px;font-weight:800;color:#1a5fa0;border-top:2px solid #1a5fa0;padding-top:7px;margin-top:5px;display:flex;justify-content:space-between}
  .notice{font-size:9px;font-weight:700;color:#cc0000;margin-bottom:7px;line-height:1.6}
  .conds{font-size:8.5px;color:#555;line-height:1.6;margin-bottom:14px}
  .conds strong{color:#1a1a2e}
  .signs{display:grid;grid-template-columns:1fr 1fr;gap:30px;margin-top:20px}
  .sign-line{border-top:1.5px solid #1a1a2e;padding-top:4px;font-size:10px;font-weight:700}
  @media print{body{padding:10px}@page{margin:8mm}}
</style>
</head><body>
<div class="header">
  <div class="logo-wrap">
    <img class="logo-img" src="https://websoft-solutions.vercel.app/logo.png" alt="Logo" onerror="this.style.display='none'"/>
    <div class="brand">
      <div class="brand-name">Web<span>Soft</span></div>
      <div class="brand-sub">S O L U T I O N S</div>
    </div>
  </div>
  <div class="co-info">
    <strong>WEBSOFT SOLUTIONS</strong>
    GUASTATOYA, EL PROGRESO<br>
    Barrio el Calvario entre Calle principal y 4ta calle<br>
    TEL: (502) 3836-1044 / 3671-4377<br>
    www.websoft-solutions.vercel.app
  </div>
</div>
<div class="banner">C O T I Z A C I O N</div>
<hr class="thick">
<div class="grid2">
  <div>
    <div class="row"><span class="lbl">Nombre:</span><span class="val">${cot.clienteNombre}</span></div>
    <div class="row"><span class="lbl">Direccion:</span><span class="val">${cot.clienteDireccion || ''}</span></div>
    <div class="row"><span class="lbl">Telefono:</span><span class="val">${cot.clienteTelefono || ''}</span></div>
    <div class="row"><span class="lbl">NIT:</span><span class="val">${cot.clienteNit || 'CF'}</span></div>
  </div>
  <div>
    <div class="row"><span class="lbl">Atencion a:</span><span class="val">${cot.atencion || ''}</span></div>
    <div class="row"><span class="lbl">Fecha:</span><span class="val">${new Date(cot.fecha).toLocaleDateString('es-GT')}</span></div>
    <div class="row"><span class="lbl">No. Cotizacion:</span><span class="val"><b>${cot.numero}</b></span></div>
    <div class="row"><span class="lbl">Validez:</span><span class="val">${cot.validezDias} dias</span></div>
  </div>
</div>
<hr class="thick">
<div class="fp"><strong>Forma de Pago:</strong> ${cot.formaPago || ''}</div>
${cot.descripcion ? `<div style="font-weight:700;font-size:11px;margin-bottom:8px">${cot.descripcion}</div>` : ''}
<table>
  <thead><tr>
    <th style="width:75px">Codigo</th>
    <th>Descripcion</th>
    <th style="width:50px;text-align:center">Cant.</th>
    <th style="width:80px;text-align:right">P/Unit.</th>
    <th style="width:80px;text-align:right">Subtotal</th>
    <th style="width:75px;text-align:right">Descuento</th>
    <th style="width:85px;text-align:right">Total</th>
  </tr></thead>
  <tbody>${rows}</tbody>
</table>
<div class="totals-wrap">
  <div class="totals">
    <div class="t-row"><span>Base imponible</span><span>Q ${baseCalc}</span></div>
    ${cot.descuento > 0 ? `<div class="t-row"><span>Descuento</span><span>-Q ${cot.descuento.toFixed(2)}</span></div>` : ''}
    <div class="t-row"><span>IVA (5%)</span><span>Q ${ivaCalc}</span></div>
    <div class="t-final"><span>TOTAL A PAGAR</span><span>Q ${cot.total.toFixed(2)}</span></div>
  </div>
</div>
<div class="notice">SUJETO A DISPONIBILIDAD. ANTES DE GENERAR PAGO CONSULTAR EXISTENCIAS CON SU VENDEDOR DE WEBSOFT SOLUTIONS.</div>
<div class="conds">
  <strong>CONDICIONES:</strong><br>
  1. <strong>PAGO:</strong> Anticipado, contra entrega, financiado o tarjeta. Cheques a nombre de WebSoft Solutions.<br>
  2. <strong>ENTREGA:</strong> Inmediata a 3 dias segun forma de pago. Sin existencia puede variar hasta 3 semanas.<br>
  3. <strong>GARANTIA:</strong> Se atiende en instalaciones de WebSoft. Danos fisicos anulan garantia.<br>
  4. <strong>SERVICIO:</strong> Departamento tecnico calificado para soporte durante garantia.
</div>
<div class="signs">
  <div><div class="sign-line">Aceptado (Cliente): _______________________</div>
  <div style="font-size:9px;color:#888;margin-top:4px">Fecha: _____ / _____ / ______</div></div>
  <div style="text-align:right;font-size:9px;color:#aaa">${cot.numero} · Valida ${cot.validezDias} dias</div>
</div>
</body></html>`)
    w.document.close()
    setTimeout(() => w.print(), 600)
  }

  const cambiarEstado = async (id: number, estado: string) => {
    await fetch(`/api/cotizaciones/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ estado }) })
    load()
    setSelected(p => p ? { ...p, estado } : null)
  }

  const eliminar = async (id: number) => {
    if (!confirm('Eliminar cotizacion?')) return
    await fetch(`/api/cotizaciones/${id}`, { method: 'DELETE' })
    toast.success('Eliminada')
    setShowPreview(false); setSelected(null); load()
  }

  const estadoBadge = (e: string) => ({ pendiente: 'badge-orange', aceptada: 'badge-green', rechazada: 'badge-red', vencida: 'badge-gray' }[e] || 'badge-gray')

  const labelStyle = { display: 'block' as const, fontSize: 10, fontWeight: 700 as const, color: '#64748b', textTransform: 'uppercase' as const, letterSpacing: '.5px', marginBottom: 4 }
  const sectionTitle = { fontSize: 11, fontWeight: 700 as const, color: '#2563eb', textTransform: 'uppercase' as const, letterSpacing: 1, marginBottom: 8, paddingBottom: 6, borderBottom: '1px solid rgba(255,255,255,.07)' }

  return (
    <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 18 }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 700, color: '#0f172a' }}>Cotizaciones</h1>
          <p style={{ fontSize: 12, color: '#64748b', marginTop: 3 }}>Genera y gestiona cotizaciones para tus clientes</p>
        </div>
        <button className="btn-primary" onClick={() => { setForm(emptyForm); setItems([newProducto()]); setShowModal(true) }}>
          + Nueva Cotizacion
        </button>
      </div>

      {/* Table */}
      <div className="card">
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                {['#', 'Fecha', 'Cliente', 'Atencion', 'Total', 'Estado', ''].map(h => (
                  <th key={h} style={{ background: '#f8fafc', fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '.5px', padding: '10px 14px', textAlign: 'left', borderBottom: '1px solid #e2e8f0' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {cotizaciones.length === 0 ? (
                <tr><td colSpan={7} style={{ textAlign: 'center', padding: 50, color: '#64748b', fontSize: 13 }}>Sin cotizaciones. Crea la primera.</td></tr>
              ) : cotizaciones.map(c => (
                <tr key={c.id} onClick={() => { setSelected(c); setShowPreview(true) }} style={{ cursor: 'pointer' }}>
                  <td style={{ padding: '10px 14px', fontSize: 13, fontWeight: 700, borderBottom: '1px solid #f1f5f9', color: '#2563eb' }}>{c.numero}</td>
                  <td style={{ padding: '10px 14px', fontSize: 12, borderBottom: '1px solid #f1f5f9', color: '#64748b', whiteSpace: 'nowrap' }}>{fmtDate(c.fecha)}</td>
                  <td style={{ padding: '10px 14px', fontSize: 13, fontWeight: 600, borderBottom: '1px solid #f1f5f9', color: '#0f172a' }}>{c.clienteNombre}</td>
                  <td style={{ padding: '10px 14px', fontSize: 12, borderBottom: '1px solid #f1f5f9', color: '#64748b' }}>{c.atencion || '—'}</td>
                  <td style={{ padding: '10px 14px', fontSize: 13, fontWeight: 700, borderBottom: '1px solid #f1f5f9', color: '#0f172a' }}>{fmt(c.total)}</td>
                  <td style={{ padding: '10px 14px', borderBottom: '1px solid #f1f5f9' }}><span className={estadoBadge(c.estado)} style={{ textTransform: 'capitalize' }}>{c.estado}</span></td>
                  <td style={{ padding: '10px 14px', borderBottom: '1px solid #f1f5f9' }}>
                    <div style={{ display: 'flex', gap: 6 }} onClick={e => e.stopPropagation()}>
                      <button className="btn-ghost btn-sm" onClick={() => imprimir(c)}>Imprimir</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ─── MODAL NUEVA ─── */}
      {showModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.7)', zIndex: 999, display: 'flex', alignItems: 'flex-start', justifyContent: 'center', padding: 20, overflowY: 'auto' }}>
          <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: 12, padding: 28, width: '100%', maxWidth: 900, margin: 'auto' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
              <h3 style={{ fontSize: 16, fontWeight: 700, color: '#0f172a' }}>Nueva Cotizacion</h3>
              <button onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', fontSize: 22, cursor: 'pointer', color: '#64748b' }}>×</button>
            </div>

            {/* Cliente */}
            <div style={{ ...sectionStyle, marginBottom: 16 }}>
              <div style={sectionTitle}>Datos del cliente</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
                <div style={{ gridColumn: '1/-1' }}>
                  <label style={labelStyle}>Nombre del cliente *</label>
                  <input className="input" value={form.clienteNombre} onChange={e => setF('clienteNombre', e.target.value)} placeholder="Nombre completo" />
                </div>
                <div><label style={labelStyle}>Direccion</label><input className="input" value={form.clienteDireccion} onChange={e => setF('clienteDireccion', e.target.value)} /></div>
                <div><label style={labelStyle}>Telefono</label><input className="input" value={form.clienteTelefono} onChange={e => setF('clienteTelefono', e.target.value)} /></div>
                <div><label style={labelStyle}>NIT</label><input className="input" value={form.clienteNit} onChange={e => setF('clienteNit', e.target.value)} /></div>
                <div><label style={labelStyle}>Atencion a (vendedor)</label><input className="input" value={form.atencion} onChange={e => setF('atencion', e.target.value)} /></div>
                <div><label style={labelStyle}>Validez (dias)</label><input className="input" type="number" value={form.validezDias} onChange={e => setF('validezDias', e.target.value)} /></div>
                <div style={{ gridColumn: '1/-1' }}><label style={labelStyle}>Forma de pago</label><input className="input" value={form.formaPago} onChange={e => setF('formaPago', e.target.value)} /></div>
                <div style={{ gridColumn: '1/-1' }}><label style={labelStyle}>Titulo / descripcion general</label><input className="input" value={form.descripcion} onChange={e => setF('descripcion', e.target.value)} /></div>
              </div>
            </div>

            {/* Items */}
            <div style={{ ...sectionStyle, marginBottom: 16 }}>
              <div style={{ ...sectionTitle, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span>Detalle de productos / servicios</span>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button className="btn-ghost btn-sm" onClick={() => addItem('producto')}>+ Producto</button>
                  <button className="btn-ghost btn-sm" onClick={() => addItem('servicio')}>+ Servicio</button>
                  <button className="btn-ghost btn-sm" onClick={() => addItem('instalacion')} style={{ borderColor: '#d29922', color: '#d97706' }}>+ Instalacion</button>
                </div>
              </div>

              {/* Header cols */}
              <div style={{ display: 'grid', gridTemplateColumns: '80px 1fr 60px 110px 90px 80px 24px', gap: 6, marginBottom: 6 }}>
                {['Codigo', 'Descripcion', 'Cant.', 'Precio Unit.', 'Desc.', 'Total', ''].map(h => (
                  <div key={h} style={{ fontSize: 10, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', padding: '5px 0' }}>{h}</div>
                ))}
              </div>

              {items.map((item, i) => (
                <div key={i} style={{ marginBottom: 6 }}>
                  {/* Badge tipo */}
                  <div style={{ fontSize: 9, fontWeight: 700, color: item.tipo === 'instalacion' ? '#d29922' : item.tipo === 'servicio' ? '#58a6ff' : '#3fb950', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 3 }}>
                    {item.tipo}
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '80px 1fr 60px 110px 90px 80px 24px', gap: 6, alignItems: 'center' }}>
                    <input className="input" value={item.codigo} onChange={e => updItem(i, 'codigo', e.target.value)} placeholder="COD" style={{ fontSize: 11, padding: '5px 7px' }} />
                    <input className="input" value={item.descripcion} onChange={e => updItem(i, 'descripcion', e.target.value)} placeholder="Descripcion" style={{ fontSize: 11, padding: '5px 7px' }} />
                    <input className="input" type="number" min="1" value={item.cantidad} onChange={e => updItem(i, 'cantidad', Number(e.target.value))} style={{ fontSize: 11, padding: '5px 7px', textAlign: 'center' }} />
                    <div>
                      {item.tipo === 'producto' ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                          <input className="input" type="number" min="0" value={item.costoCompra || ''} onChange={e => updItem(i, 'costoCompra', Number(e.target.value))} placeholder="Costo compra" style={{ fontSize: 10, padding: '4px 6px' }} />
                          <div style={{ fontSize: 10, color: '#16a34a', padding: '2px 6px' }}>Venta: Q {item.precioVenta.toFixed(2)}</div>
                          <div style={{ fontSize: 9, color: '#64748b' }}>+30% ganancia +5% IVA prod</div>
                        </div>
                      ) : item.tipo === 'instalacion' ? (
                        <div>
                          <div style={{ fontSize: 11, fontWeight: 700, color: '#d97706', padding: '4px 6px' }}>Q {item.precioVenta.toFixed(2)}</div>
                          <div style={{ fontSize: 9, color: '#64748b' }}>auto-calculado</div>
                        </div>
                      ) : (
                        <input className="input" type="number" min="0" value={item.precioVenta || ''} onChange={e => updItem(i, 'precioVenta', Number(e.target.value))} placeholder="Precio" style={{ fontSize: 11, padding: '5px 7px' }} />
                      )}
                    </div>
                    <input className="input" type="number" min="0" value={item.descuento || ''} onChange={e => updItem(i, 'descuento', Number(e.target.value))} placeholder="0" style={{ fontSize: 11, padding: '5px 7px' }} />
                    <div style={{ fontSize: 12, fontWeight: 700, color: '#0f172a', textAlign: 'right' }}>Q {item.total.toFixed(2)}</div>
                    <button onClick={() => removeItem(i)} style={{ background: 'none', border: 'none', color: '#dc2626', cursor: 'pointer', fontSize: 16 }}>×</button>
                  </div>

                  {/* Instalacion expandable calculator */}
                  {item.tipo === 'instalacion' && (
                    <div style={{ background: 'rgba(210,153,34,.06)', border: '1px solid rgba(210,153,34,.2)', borderRadius: 8, padding: 12, marginTop: 6 }}>
                      <div style={{ fontSize: 10, fontWeight: 700, color: '#d97706', marginBottom: 10, textTransform: 'uppercase', letterSpacing: .5 }}>
                        Calculadora de instalacion automatica
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', gap: 10 }}>
                        <div>
                          <label style={{ ...labelStyle, color: '#d97706' }}>Km al destino</label>
                          <input className="input" type="number" min="0" value={item.km} onChange={e => updItem(i, 'km', Number(e.target.value))} style={{ fontSize: 12 }} />
                          <div style={{ fontSize: 9, color: '#64748b', marginTop: 2 }}>Ida y vuelta x2</div>
                        </div>
                        <div>
                          <label style={{ ...labelStyle, color: '#d97706' }}>Precio gasolina Q/L</label>
                          <input className="input" type="number" min="0" value={item.precioGasolina} onChange={e => updItem(i, 'precioGasolina', Number(e.target.value))} style={{ fontSize: 12 }} />
                        </div>
                        <div>
                          <label style={{ ...labelStyle, color: '#d97706' }}>Rendimiento km/L</label>
                          <input className="input" type="number" min="1" value={item.rendimiento} onChange={e => updItem(i, 'rendimiento', Number(e.target.value))} style={{ fontSize: 12 }} />
                        </div>
                        <div>
                          <label style={{ ...labelStyle, color: '#d97706' }}>Num. tecnicos</label>
                          <input className="input" type="number" min="1" value={item.tecnicos} onChange={e => updItem(i, 'tecnicos', Number(e.target.value))} style={{ fontSize: 12 }} />
                          <div style={{ fontSize: 9, color: '#64748b', marginTop: 2 }}>Q35/tecnico/hora comida</div>
                        </div>
                        <div>
                          <label style={{ ...labelStyle, color: '#d97706' }}>Horas de trabajo</label>
                          <input className="input" type="number" min="1" value={item.horas} onChange={e => updItem(i, 'horas', Number(e.target.value))} style={{ fontSize: 12 }} />
                        </div>
                        <div style={{ gridColumn: '1/-1' }}>
                          <label style={{ ...labelStyle, color: '#d97706' }}>Mano de obra (Q)</label>
                          <input className="input" type="number" min="0" value={item.manoObra} onChange={e => updItem(i, 'manoObra', Number(e.target.value))} style={{ fontSize: 12, maxWidth: 160 }} />
                        </div>
                      </div>
                      {/* Desglose */}
                      <div style={{ display: 'flex', gap: 20, marginTop: 10, fontSize: 11, color: '#64748b' }}>
                        <span>⛽ Gas: <strong style={{ color: '#d97706' }}>Q {((item.km * 2 / (item.rendimiento || 30)) * (item.precioGasolina || 28)).toFixed(2)}</strong></span>
                        <span>🍽 Comida: <strong style={{ color: '#d97706' }}>Q {(item.tecnicos * item.horas * 35).toFixed(2)}</strong></span>
                        <span>🔧 M. Obra: <strong style={{ color: '#d97706' }}>Q {(item.manoObra || 0).toFixed(2)}</strong></span>
                        <span>= <strong style={{ color: '#d97706', fontSize: 13 }}>Q {item.precioVenta.toFixed(2)}</strong></span>
                      </div>
                    </div>
                  )}

                  {i < items.length - 1 && <div style={{ borderBottom: '1px solid #f1f5f9', marginTop: 8 }} />}
                </div>
              ))}
            </div>

            {/* Totales */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 20 }}>
              <div style={{ background: '#f0f4f8', border: '1px solid #e2e8f0', borderRadius: 10, padding: '14px 20px', minWidth: 240 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: '#64748b', marginBottom: 5 }}><span>Base</span><span>{fmt(subtotalSinIva - descuentoTotal)}</span></div>
                {descuentoTotal > 0 && <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: '#dc2626', marginBottom: 5 }}><span>Descuento</span><span>-{fmt(descuentoTotal)}</span></div>}
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: '#64748b', marginBottom: 10 }}><span>IVA (5%)</span><span>{fmt(iva)}</span></div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 18, fontWeight: 800, color: '#2563eb', borderTop: '1px solid #e2e8f0', paddingTop: 10 }}><span>TOTAL</span><span>{fmt(total)}</span></div>
              </div>
            </div>

            {/* Notas */}
            <div style={{ marginBottom: 20 }}>
              <label style={labelStyle}>Notas adicionales</label>
              <textarea className="input" rows={2} value={form.notas} onChange={e => setF('notas', e.target.value)} />
            </div>

            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button className="btn-ghost" onClick={() => setShowModal(false)}>Cancelar</button>
              <button className="btn-primary" onClick={save} disabled={loading}>
                {loading ? 'Guardando...' : 'Guardar Cotizacion'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── PREVIEW ─── */}
      {showPreview && selected && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.7)', zIndex: 999, display: 'flex', alignItems: 'flex-start', justifyContent: 'center', padding: 20, overflowY: 'auto' }}>
          <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: 12, padding: 28, width: '100%', maxWidth: 700, margin: 'auto' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
              <div>
                <div style={{ fontSize: 18, fontWeight: 700, color: '#0f172a' }}>{selected.numero}</div>
                <div style={{ fontSize: 12, color: '#64748b' }}>{fmtDate(selected.fecha)} · {selected.clienteNombre}</div>
              </div>
              <button onClick={() => setShowPreview(false)} style={{ background: 'none', border: 'none', fontSize: 24, cursor: 'pointer', color: '#64748b' }}>×</button>
            </div>

            <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 14 }}>
              <thead>
                <tr style={{ background: '#f8fafc' }}>
                  {['Codigo', 'Descripcion', 'Cant.', 'P/Unit.', 'Desc.', 'Total'].map(h => (
                    <th key={h} style={{ fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', padding: '8px 12px', textAlign: 'left', borderBottom: '1px solid #e2e8f0' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {selected.items.map((it, i) => (
                  <tr key={i}>
                    <td style={{ padding: '9px 12px', fontSize: 11, fontFamily: 'monospace', color: '#2563eb', fontWeight: 700, borderBottom: '1px solid #f1f5f9' }}>{it.codigo || ''}</td>
                    <td style={{ padding: '9px 12px', fontSize: 12, borderBottom: '1px solid #f1f5f9', color: '#0f172a' }}>{it.descripcion}</td>
                    <td style={{ padding: '9px 12px', fontSize: 12, textAlign: 'center', borderBottom: '1px solid #f1f5f9' }}>{it.cantidad}</td>
                    <td style={{ padding: '9px 12px', fontSize: 12, borderBottom: '1px solid #f1f5f9', color: '#64748b' }}>{fmt(it.precioUnitario)}</td>
                    <td style={{ padding: '9px 12px', fontSize: 12, borderBottom: '1px solid #f1f5f9', color: it.descuento > 0 ? '#f85149' : '#484f58' }}>{it.descuento > 0 ? fmt(it.descuento) : '—'}</td>
                    <td style={{ padding: '9px 12px', fontSize: 13, fontWeight: 700, borderBottom: '1px solid #f1f5f9', color: '#16a34a' }}>{fmt(it.totalItem)}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 20 }}>
              <div style={{ background: '#f0f4f8', border: '1px solid #e2e8f0', borderRadius: 10, padding: '12px 18px', minWidth: 220 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: '#64748b', marginBottom: 4 }}><span>Base</span><span>{fmt(selected.subtotal - selected.descuento)}</span></div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: '#64748b', marginBottom: 8 }}><span>IVA 5%</span><span>{fmt(selected.total - (selected.subtotal - selected.descuento))}</span></div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 18, fontWeight: 800, color: '#2563eb', borderTop: '1px solid #e2e8f0', paddingTop: 8 }}><span>TOTAL</span><span>{fmt(selected.total)}</span></div>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <select value={selected.estado} onChange={e => cambiarEstado(selected.id, e.target.value)} className="input" style={{ width: 140, fontSize: 12 }}>
                  <option value="pendiente">Pendiente</option>
                  <option value="aceptada">Aceptada</option>
                  <option value="rechazada">Rechazada</option>
                  <option value="vencida">Vencida</option>
                </select>
                <button className="btn-danger btn-sm" onClick={() => eliminar(selected.id)}>Eliminar</button>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button className="btn-ghost" onClick={() => setShowPreview(false)}>Cerrar</button>
                <button className="btn-primary" onClick={() => imprimir(selected)}>Imprimir / PDF</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

const sectionStyle = {
  background: 'rgba(255,255,255,.02)',
  border: '1px solid rgba(255,255,255,.07)',
  borderRadius: 8,
  padding: 16,
}

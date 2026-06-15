'use client'
import { useState, useEffect, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import { toast } from 'sonner'
import { fmt, fmtDate } from '@/lib/utils'

const IVA = 0.05

interface Producto {
  id: number
  codigo: string | null
  nombre: string
  precio: number
  costo: number
  stock: number
}

interface LineItem {
  tipo: 'producto' | 'servicio' | 'instalacion'
  productoId: number | null
  codigo: string
  descripcion: string
  costoCompra: number
  precioVenta: number
  cantidad: number
  descuento: number
  subtotal: number
  total: number
  // instalacion
  km: number
  precioGasolina: number
  rendimiento: number
  tecnicos: number
  horas: number
  manoObra: number
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
  tiempoInstalacion: string | null
  usuarioNombre: string | null
  items: any[]
}

function calcGas(item: LineItem) {
  return (item.km * 2) / (item.rendimiento || 30) * (item.precioGasolina || 28)
}
function calcComida(item: LineItem) {
  return item.tecnicos * item.horas * 35
}
function calcInstalacion(item: LineItem) {
  return calcGas(item) + calcComida(item) + (item.manoObra || 0)
}

function recalc(item: LineItem): LineItem {
  let precio = item.precioVenta
  if (item.tipo === 'producto' && item.costoCompra > 0) {
    // Si viene del inventario (tiene productoId) → respetar precio tal cual
    // Si es manual (sin productoId) → calcular 30% sobre costo
    if (!item.productoId) {
      precio = item.costoCompra * 1.30
      item = { ...item, precioVenta: precio }
    }
  }
  if (item.tipo === 'instalacion') {
    precio = calcInstalacion(item)
    item = { ...item, precioVenta: precio }
  }
  const sub = precio * item.cantidad
  const total = sub - (item.descuento || 0)
  return { ...item, subtotal: sub, total }
}

function newItem(tipo: LineItem['tipo']): LineItem {
  const base = { tipo, productoId: null, codigo: '', descripcion: '', costoCompra: 0, precioVenta: 0, cantidad: 1, descuento: 0, subtotal: 0, total: 0, km: 20, precioGasolina: 28, rendimiento: 30, tecnicos: 1, horas: 4, manoObra: 200 }
  if (tipo === 'instalacion') return { ...base, codigo: 'INST-001', descripcion: 'Instalacion tecnica' }
  return base
}

const emptyForm = {
  clienteNombre: '', clienteDireccion: '', clienteTelefono: '',
  clienteNit: 'CF', atencion: '',
  formaPago: 'Efectivo, Transferencia, Deposito, Cheque Preautorizado',
  descripcion: '', notas: '', validezDias: '15', tiempoInstalacion: '',
}

export default function CotizacionesPage() {
  const [cotizaciones, setCotizaciones] = useState<Cotizacion[]>([])
  const [showModal, setShowModal] = useState(false)
  const [showPreview, setShowPreview] = useState(false)
  const [selected, setSelected] = useState<Cotizacion | null>(null)
  const [form, setForm] = useState(emptyForm)
  const [items, setItems] = useState<LineItem[]>([newItem('producto')])
  const [loading, setLoading] = useState(false)
  const [productos, setProductos] = useState<Producto[]>([])
  const [buscarProd, setBuscarProd] = useState('')

  const { data: session } = useSession()
  const isAdmin = session?.user?.role === 'admin'

  const [pinModal, setPinModal] = useState<{ id: number; estado: string; numero: string } | null>(null)
  const [pin, setPin] = useState('')
  const [pinLoading, setPinLoading] = useState(false)
  const [pinError, setPinError] = useState('')
  const [editingId, setEditingId] = useState<number | null>(null)

  const load = async () => {
    const c = await fetch('/api/cotizaciones').then(r => r.json())
    setCotizaciones(Array.isArray(c) ? c : [])
  }

  const loadProductos = useCallback(async () => {
    const res = await fetch(`/api/productos?buscar=${encodeURIComponent(buscarProd)}`)
    setProductos(await res.json())
  }, [buscarProd])

  useEffect(() => { load() }, [])
  useEffect(() => { loadProductos() }, [loadProductos])

  const setF = (k: string, v: string) => setForm(p => ({ ...p, [k]: v }))

  const buscarNitCliente = async (nit: string) => {
    setF('clienteNit', nit)
    if (nit.length < 3 || nit.toUpperCase() === 'CF') return
    try {
      const res = await fetch(`/api/clientes/buscar-nit?nit=${encodeURIComponent(nit)}`)
      const data = await res.json()
      if (data.encontrado && data.cliente) {
        setForm(p => ({
          ...p,
          clienteNombre: data.cliente.nombre,
          clienteTelefono: data.cliente.telefono || p.clienteTelefono,
          clienteDireccion: data.cliente.direccion || p.clienteDireccion,
          clienteNit: nit,
        }))
        toast.success(`Cliente: ${data.cliente.nombre}`)
      }
    } catch { /* ignore */ }
  }

  const selProducto = (i: number, prod: Producto) => {
    setItems(prev => prev.map((item, idx) => {
      if (idx !== i) return item
      const updated: LineItem = {
        ...item,
        productoId: prod.id,
        codigo: prod.codigo || '',
        descripcion: prod.nombre,
        costoCompra: prod.costo,
        precioVenta: prod.precio > 0 ? prod.precio : prod.costo * 1.30,
      }
      return recalc(updated)
    }))
  }

  const updItem = (i: number, k: keyof LineItem, v: number | string) => {
    setItems(prev => prev.map((item, idx) => {
      if (idx !== i) return item
      const updated = { ...item, [k]: v }
      return recalc(updated)
    }))
  }

  const addItem = (tipo: LineItem['tipo']) => setItems(p => [...p, newItem(tipo)])
  const removeItem = (i: number) => setItems(p => p.filter((_, idx) => idx !== i))

  // Totals — IVA solo al final
  const baseTotal = items.reduce((s, i) => s + i.total, 0)
  const iva = baseTotal * IVA
  const totalFinal = baseTotal + iva
  const descuentoTotal = items.reduce((s, i) => s + i.descuento, 0)

  const save = async () => {
    if (!form.clienteNombre.trim()) { toast.error('Nombre del cliente requerido'); return }
    const validItems = items.filter(i => i.descripcion.trim())
    if (validItems.length === 0) { toast.error('Agrega al menos un item'); return }

    setLoading(true)
    try {
      const payload = {
        clienteNombre: form.clienteNombre, clienteDireccion: form.clienteDireccion,
        clienteTelefono: form.clienteTelefono, clienteNit: form.clienteNit,
        atencion: form.atencion, formaPago: form.formaPago,
        descripcion: form.descripcion, notas: form.notas,
        tiempoInstalacion: form.tiempoInstalacion,
        validezDias: parseInt(form.validezDias) || 15,
        items: validItems.map(it => ({
          codigo: it.codigo,
          descripcion: it.descripcion + (it.tipo === 'instalacion' ? ` (${it.km}km · ${it.tecnicos} tec. · ${it.horas}h)` : ''),
          cantidad: it.cantidad, precioUnitario: it.precioVenta,
          subtotal: it.subtotal, descuento: it.descuento, totalItem: it.total,
        })),
        subtotal: baseTotal, descuento: descuentoTotal, total: totalFinal,
      }
      const url = editingId ? `/api/cotizaciones/${editingId}` : '/api/cotizaciones'
      const method = editingId ? 'PUT' : 'POST'
      const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
      const data = await res.json()
      if (data.ok) {
        toast.success(editingId ? 'Cotizacion actualizada' : `${data.cotizacion.numero} creada`)
        setShowModal(false); setForm(emptyForm); setItems([newItem('producto')]); setEditingId(null)
        await load()
        if (!editingId) { setSelected(data.cotizacion); setShowPreview(true) }
      } else {
        toast.error(data.error || 'Error al guardar')
      }
    } catch { toast.error('Error de conexion') }
    finally { setLoading(false) }
  }

  const solicitarCambioEstado = (id: number, estado: string, numero: string) => {
    const estadosProtegidos = ['aceptada', 'rechazada']
    if (!isAdmin && estadosProtegidos.includes(estado)) {
      setPinModal({ id, estado, numero })
      setPin('')
      setPinError('')
      return
    }
    aplicarEstado(id, estado, null)
  }

  const aplicarEstado = async (id: number, estado: string, pinValue: string | null) => {
    setPinLoading(true)
    const res = await fetch(`/api/cotizaciones/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ estado, pin: pinValue }),
    })
    const data = await res.json()
    setPinLoading(false)
    if (data.ok) {
      setPinModal(null)
      setPin('')
      await load()
      setSelected(p => p ? { ...p, estado } : null)
      toast.success(`Cotizacion ${estado}`)
    } else if (data.error === 'PIN_WRONG') {
      setPinError('PIN incorrecto. Intenta de nuevo.')
    } else if (data.error === 'PIN_REQUIRED') {
      setPinError('Se requiere PIN de administrador.')
    } else {
      toast.error(data.message || 'Error')
      setPinModal(null)
    }
  }

  // Keep old name for compatibility
  const cambiarEstado = (id: number, estado: string) => {
    solicitarCambioEstado(id, estado, selected?.numero || '')
  }

  const eliminar = async (id: number) => {
    if (!confirm('Eliminar esta cotizacion?')) return
    await fetch(`/api/cotizaciones/${id}`, { method: 'DELETE' })
    toast.success('Eliminada')
    setShowPreview(false); setSelected(null); load()
  }

  const openEditCot = (c: Cotizacion) => {
    setEditingId(c.id)
    setForm({
      clienteNombre: c.clienteNombre, clienteDireccion: c.clienteDireccion || '',
      clienteTelefono: c.clienteTelefono || '', clienteNit: c.clienteNit || 'CF',
      atencion: c.atencion || '', formaPago: c.formaPago || '',
      descripcion: c.descripcion || '', notas: c.notas || '',
      validezDias: String(c.validezDias || 15), tiempoInstalacion: c.tiempoInstalacion || '',
    })
    setItems((c.items || []).map((it: any) => ({
      tipo: 'producto' as const, productoId: null, codigo: it.codigo || '',
      descripcion: it.descripcion, costoCompra: 0,
      precioVenta: Number(it.precioUnitario), cantidad: Number(it.cantidad),
      descuento: Number(it.descuento) || 0, subtotal: Number(it.subtotal),
      total: Number(it.totalItem), km: 20, precioGasolina: 28, rendimiento: 30,
      tecnicos: 1, horas: 4, manoObra: 200,
    })))
    setShowModal(true)
  }
    const w = window.open('', '_blank', 'width=900,height=700')
    if (!w) return
    const ivaAmt = cot.total - cot.subtotal + cot.descuento
    const baseAmt = cot.subtotal - cot.descuento
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

    w.document.write(`<!DOCTYPE html>
<html><head><meta charset="UTF-8">
<style>
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
  *{margin:0;padding:0;box-sizing:border-box}
  body{font-family:'Inter',sans-serif;font-size:11px;color:#0f172a;padding:24px 28px;background:#fff}
  .header{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:18px}
  .logo-wrap{display:flex;align-items:center;gap:12px}
  .logo-img{width:56px;height:56px;border-radius:10px;object-fit:contain}
  .brand-name{font-size:20px;font-weight:700;color:#0f172a;line-height:1}
  .brand-name span{color:#2563eb}
  .brand-sub{font-size:8px;letter-spacing:2px;color:#64748b;font-weight:600;margin-top:2px;text-transform:uppercase}
  .co-info{text-align:right;font-size:10px;color:#475569;line-height:1.7}
  .co-info strong{font-size:14px;font-weight:700;color:#0f172a;display:block;margin-bottom:2px}
  .banner{background:#2563eb;color:#fff;text-align:center;padding:9px;font-size:16px;font-weight:700;letter-spacing:5px;border-radius:6px;margin-bottom:14px}
  hr.blue{border:none;border-top:2px solid #2563eb;margin:10px 0}
  hr.light{border:none;border-top:1px solid #e2e8f0;margin:8px 0}
  .grid2{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:10px;font-size:10px}
  .row{display:flex;gap:6px;margin-bottom:3px}
  .lbl{font-weight:700;color:#374151;min-width:75px;flex-shrink:0}
  .val{color:#475569}
  .fp{font-size:10px;margin-bottom:10px}.fp strong{color:#2563eb}
  table{width:100%;border-collapse:collapse;margin-bottom:12px}
  thead tr{background:#eff6ff}
  thead th{padding:7px 9px;font-size:10px;font-weight:700;text-align:left;color:#1e40af;border-bottom:2px solid #bfdbfe}
  tbody tr:nth-child(even){background:#f8fafc}
  tbody td{padding:6px 9px;border-bottom:1px solid #f1f5f9;font-size:10px}
  .code{font-family:monospace;font-size:9px;color:#2563eb;font-weight:700}
  .center{text-align:center}.right{text-align:right}.bold{font-weight:700}
  .totals-wrap{display:flex;justify-content:flex-end;margin-bottom:12px}
  .totals{background:#f8fafc;border:1.5px solid #bfdbfe;border-radius:8px;padding:11px 16px;min-width:230px}
  .t-row{display:flex;justify-content:space-between;font-size:11px;padding:3px 0;color:#475569}
  .t-iva{display:flex;justify-content:space-between;font-size:11px;padding:3px 0;color:#d97706;font-weight:600}
  .t-final{font-size:15px;font-weight:800;color:#2563eb;border-top:2px solid #bfdbfe;padding-top:7px;margin-top:5px;display:flex;justify-content:space-between}
  .notice{font-size:9px;font-weight:700;color:#dc2626;margin-bottom:7px;line-height:1.6}
  .conds{font-size:8.5px;color:#64748b;line-height:1.6;margin-bottom:10px}
  .conds strong{color:#374151}
  .highlight-block{font-size:10px;font-weight:700;color:#0f172a;background:#f0f9ff;border-left:3px solid #2563eb;padding:7px 12px;margin-bottom:7px;border-radius:0 6px 6px 0;line-height:1.6}
  .highlight-block strong{color:#1e40af;font-size:11px}
  .signs{display:grid;grid-template-columns:1fr 1fr;gap:30px;margin-top:20px}
  .sign-line{border-top:1.5px solid #0f172a;padding-top:4px;font-size:10px;font-weight:700}
  .footer{margin-top:16px;padding-top:10px;border-top:1px solid #e2e8f0;display:flex;justify-content:space-between;font-size:9px;color:#94a3b8}
  @media print{body{padding:12px}@page{margin:8mm;size:A4}}
</style>
</head><body>
<div class="header">
  <div class="logo-wrap">
    <img class="logo-img" src="https://websoft-solutions.vercel.app/logo.png" alt="Logo" onerror="this.style.display='none'"/>
    <div>
      <div class="brand-name">Web<span>Soft</span> Solutions</div>
      <div class="brand-sub">Guastatoya · El Progreso · Guatemala</div>
    </div>
  </div>
  <div class="co-info">
    <strong>WEBSOFT SOLUTIONS</strong>
    Barrio el Calvario, Guastatoya, El Progreso<br>
    TEL: (502) 3836-1044 / 3671-4377<br>
    www.websoft-solutions.vercel.app
  </div>
</div>

<div class="banner">C O T I Z A C I O N</div>
<hr class="blue">

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
<hr class="blue">

<div class="fp"><strong>Forma de Pago:</strong> ${cot.formaPago || ''}</div>
${cot.descripcion ? `<div style="font-weight:700;font-size:11px;margin-bottom:8px;color:#1e40af">${cot.descripcion}</div>` : ''}

<table>
  <thead><tr>
    <th style="width:72px">Codigo</th>
    <th>Descripcion</th>
    <th style="width:48px;text-align:center">Cant.</th>
    <th style="width:78px;text-align:right">P/Unit.</th>
    <th style="width:78px;text-align:right">Subtotal</th>
    <th style="width:72px;text-align:right">Descuento</th>
    <th style="width:82px;text-align:right">Total</th>
  </tr></thead>
  <tbody>${rows}</tbody>
</table>

<div class="totals-wrap">
  <div class="totals">
    <div class="t-row"><span>Base</span><span>Q ${baseAmt.toFixed(2)}</span></div>
    ${cot.descuento > 0 ? `<div class="t-row" style="color:#dc2626"><span>Descuento</span><span>-Q ${cot.descuento.toFixed(2)}</span></div>` : ''}
    <div class="t-iva"><span>IVA Incluido (5%)</span><span>Q ${ivaAmt.toFixed(2)}</span></div>
    <div class="t-final"><span>TOTAL A PAGAR</span><span>Q ${cot.total.toFixed(2)}</span></div>
  </div>
</div>

<div class="notice">SUJETO A DISPONIBILIDAD. CONSULTAR EXISTENCIAS ANTES DE GENERAR PAGO.</div>
<div class="conds">
  <strong>CONDICIONES:</strong>
  1. <strong>PAGO:</strong> Anticipado, contra entrega, financiado o tarjeta. Cheques a nombre de WebSoft Solutions.
  2. <strong>ENTREGA:</strong> Inmediata a 3 dias segun pago. Sin existencia puede variar hasta 3 semanas.
  3. <strong>GARANTIA:</strong> Se atiende en instalaciones de WebSoft. Danos fisicos anulan garantia.
  4. <strong>SERVICIO:</strong> Departamento tecnico calificado para soporte durante garantia.
</div>
${cot.tiempoInstalacion ? `<div class="highlight-block"><strong>TIEMPO DE INSTALACION:</strong> ${cot.tiempoInstalacion}</div>` : ''}
${cot.notas ? `<div class="highlight-block"><strong>NOTAS ADICIONALES:</strong> ${cot.notas}</div>` : ''}

<div class="signs">
  <div>
    <div class="sign-line">Aceptado (Cliente): _________________________</div>
    <div style="font-size:9px;color:#94a3b8;margin-top:4px">Fecha: _____ / _____ / ______</div>
  </div>
  <div style="text-align:right;font-size:9px;color:#94a3b8">${cot.numero} · Valida ${cot.validezDias} dias</div>
</div>

<div class="footer">
  <span>WebSoft Solutions · Sistema POS</span>
  <span>Tel: 3836-1044 / 3671-4377 · Guastatoya, El Progreso</span>
</div>
</body></html>`)
    w.document.close()
    setTimeout(() => w.print(), 700)
  }

  const estadoBadge = (e: string) => ({ pendiente: 'badge-orange', aceptada: 'badge-green', rechazada: 'badge-red', vencida: 'badge-gray', facturada: 'badge-blue' }[e] || 'badge-gray')

  const lbl = { display: 'block' as const, fontSize: 10, fontWeight: 700 as const, color: '#64748b', textTransform: 'uppercase' as const, letterSpacing: '.5px', marginBottom: 4 }
  const sec = { background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 8, padding: 14, marginBottom: 14 }
  const secTitle = { fontSize: 11, fontWeight: 700 as const, color: '#2563eb', textTransform: 'uppercase' as const, letterSpacing: 1, marginBottom: 10, display: 'flex' as const, alignItems: 'center' as const, justifyContent: 'space-between' as const }

  return (
    <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 18 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 700, color: '#0f172a' }}>Cotizaciones</h1>
          <p style={{ fontSize: 12, color: '#64748b', marginTop: 3 }}>Genera y gestiona cotizaciones con calculo automatico</p>
        </div>
        <button className="btn-primary" onClick={() => { setForm(emptyForm); setItems([newItem('producto')]); setShowModal(true) }}>
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
                <tr><td colSpan={7} style={{ textAlign: 'center', padding: 50, color: '#94a3b8', fontSize: 13 }}>Sin cotizaciones aun. Crea la primera.</td></tr>
              ) : cotizaciones.map(c => (
                <tr key={c.id} onClick={() => { setSelected(c); setShowPreview(true) }} style={{ cursor: 'pointer' }}>
                  <td style={{ padding: '10px 14px', fontSize: 13, fontWeight: 700, borderBottom: '1px solid #f1f5f9', color: '#2563eb' }}>{c.numero}</td>
                  <td style={{ padding: '10px 14px', fontSize: 12, borderBottom: '1px solid #f1f5f9', color: '#64748b', whiteSpace: 'nowrap' }}>{fmtDate(c.fecha)}</td>
                  <td style={{ padding: '10px 14px', fontSize: 13, fontWeight: 600, borderBottom: '1px solid #f1f5f9', color: '#0f172a' }}>{c.clienteNombre}</td>
                  <td style={{ padding: '10px 14px', fontSize: 12, borderBottom: '1px solid #f1f5f9', color: '#64748b' }}>{c.atencion || '—'}</td>
                  <td style={{ padding: '10px 14px', fontSize: 13, fontWeight: 700, borderBottom: '1px solid #f1f5f9', color: '#0f172a' }}>{fmt(c.total)}</td>
                  <td style={{ padding: '10px 14px', borderBottom: '1px solid #f1f5f9' }}><span className={estadoBadge(c.estado)} style={{ textTransform: 'capitalize' }}>{c.estado}</span></td>
                  <td style={{ padding: '10px 14px', borderBottom: '1px solid #f1f5f9' }} onClick={e => e.stopPropagation()}>
                    <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
                      {(c.estado === 'aceptada' || c.estado === 'pendiente') && (
                        <a href="/pos" onClick={() => { localStorage.setItem('cot_facturar', c.id.toString()); }}
                          style={{ fontSize: 10, fontWeight: 700, padding: '3px 8px', background: '#eff6ff', color: '#2563eb', border: '1px solid #bfdbfe', borderRadius: 6, cursor: 'pointer', fontFamily: 'inherit', textDecoration: 'none', display: 'inline-flex', alignItems: 'center' }}>
                           Facturar
                        </a>
                      )}
                      {c.estado === 'pendiente' && (
                        <>
                          <button onClick={() => solicitarCambioEstado(c.id, 'aceptada', c.numero)}
                            style={{ fontSize: 10, fontWeight: 700, padding: '3px 8px', background: '#f0fdf4', color: '#16a34a', border: '1px solid #bbf7d0', borderRadius: 6, cursor: 'pointer', fontFamily: 'inherit' }}>
                             Aceptar
                          </button>
                          <button onClick={() => solicitarCambioEstado(c.id, 'rechazada', c.numero)}
                            style={{ fontSize: 10, fontWeight: 700, padding: '3px 8px', background: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca', borderRadius: 6, cursor: 'pointer', fontFamily: 'inherit' }}>
                             Rechazar
                          </button>
                        </>
                      )}
                      {c.estado === 'aceptada' && (
                        <button onClick={() => solicitarCambioEstado(c.id, 'pendiente', c.numero)}
                          style={{ fontSize: 10, fontWeight: 700, padding: '3px 8px', background: '#fef3c7', color: '#d97706', border: '1px solid #fde68a', borderRadius: 6, cursor: 'pointer', fontFamily: 'inherit' }}>
                          ↩ Pendiente
                        </button>
                      )}
                      <button className="btn-ghost btn-sm" onClick={() => openEditCot(c)} style={{ fontSize: 10, padding: '3px 8px' }}>Editar</button>
                      <button className="btn-ghost btn-sm" onClick={() => imprimir(c)} style={{ fontSize: 10, padding: '3px 8px' }}>Imprimir</button>
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
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.5)', zIndex: 999, display: 'flex', alignItems: 'flex-start', justifyContent: 'center', padding: 20, overflowY: 'auto' }}>
          <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 14, padding: 28, width: '100%', maxWidth: 920, margin: 'auto', boxShadow: '0 20px 60px rgba(0,0,0,.15)' }}>

            {/* Header modal */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, paddingBottom: 14, borderBottom: '1px solid #e2e8f0' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <img src="https://websoft-solutions.vercel.app/logo.png" alt="Logo" style={{ width: 36, height: 36, borderRadius: 8, objectFit: 'contain' }} onError={e => { (e.target as HTMLImageElement).style.display = 'none' }} />
                <div>
                  <div style={{ fontWeight: 700, fontSize: 16, color: '#0f172a' }}>{editingId ? 'Editar Cotizacion' : 'Nueva Cotizacion'}</div>
                  <div style={{ fontSize: 11, color: '#2563eb', letterSpacing: .5 }}>WebSoft Solutions</div>
                </div>
              </div>
              <button onClick={() => { setShowModal(false); setEditingId(null) }} style={{ background: 'none', border: 'none', fontSize: 24, cursor: 'pointer', color: '#94a3b8' }}>×</button>
            </div>

            {/* Cliente */}
            <div style={sec}>
              <div style={secTitle}>Datos del cliente</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
                <div>
                  <label style={lbl}>NIT (busca cliente automatico)</label>
                  <input className="input" value={form.clienteNit}
                    onChange={e => buscarNitCliente(e.target.value)}
                    onBlur={e => buscarNitCliente(e.target.value)}
                    placeholder="CF" />
                </div>
                <div style={{ gridColumn: '2 / -1' }}>
                  <label style={lbl}>Nombre del cliente *</label>
                  <input className="input" value={form.clienteNombre} onChange={e => setF('clienteNombre', e.target.value)} placeholder="Nombre completo" />
                </div>
                <div>
                  <label style={lbl}>Telefono</label>
                  <input className="input" value={form.clienteTelefono} onChange={e => setF('clienteTelefono', e.target.value)} />
                </div>
                <div style={{ gridColumn: '2 / -1' }}>
                  <label style={lbl}>Direccion</label>
                  <input className="input" value={form.clienteDireccion} onChange={e => setF('clienteDireccion', e.target.value)} />
                </div>
                <div>
                  <label style={lbl}>Atencion a</label>
                  <input className="input" value={form.atencion} onChange={e => setF('atencion', e.target.value)} />
                </div>
                <div>
                  <label style={lbl}>Validez (dias)</label>
                  <input className="input" type="number" value={form.validezDias} onChange={e => setF('validezDias', e.target.value)} />
                </div>
                <div>
                  <label style={lbl}>Forma de pago</label>
                  <input className="input" value={form.formaPago} onChange={e => setF('formaPago', e.target.value)} />
                </div>
                <div style={{ gridColumn: '1 / -1' }}>
                  <label style={lbl}>Titulo / descripcion general</label>
                  <input className="input" value={form.descripcion} onChange={e => setF('descripcion', e.target.value)} placeholder="Ej: Instalacion sistema CCTV 4 camaras" />
                </div>
              </div>
            </div>

            {/* Items */}
            <div style={sec}>
              <div style={secTitle}>
                <span>Detalle de productos / servicios</span>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button className="btn-ghost btn-sm" onClick={() => addItem('producto')}>+ Producto</button>
                  <button className="btn-ghost btn-sm" onClick={() => addItem('servicio')}>+ Servicio</button>
                  <button className="btn-ghost btn-sm" onClick={() => addItem('instalacion')} style={{ borderColor: '#d97706', color: '#d97706' }}>+ Instalacion</button>
                </div>
              </div>

              {/* Search productos */}
              <div style={{ marginBottom: 12 }}>
                <input className="input" placeholder="Buscar producto de tu inventario..." value={buscarProd} onChange={e => setBuscarProd(e.target.value)} style={{ fontSize: 12 }} />
                {buscarProd && productos.length > 0 && (
                  <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 8, marginTop: 4, maxHeight: 160, overflowY: 'auto', boxShadow: '0 4px 12px rgba(0,0,0,.1)' }}>
                    {productos.slice(0, 8).map(p => (
                      <div key={p.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 12px', borderBottom: '1px solid #f1f5f9', cursor: 'pointer', fontSize: 12 }}
                        onClick={() => {
                          // Find the last producto item or add new one
                          const lastProdIdx = items.map((it, i) => ({ it, i })).filter(x => x.it.tipo === 'producto' && !x.it.descripcion).pop()
                          if (lastProdIdx !== undefined) {
                            selProducto(lastProdIdx.i, p)
                          } else {
                            const newIt = newItem('producto')
                            setItems(prev => {
                              const updated = [...prev, newIt]
                              return updated.map((item, idx) => {
                                if (idx !== updated.length - 1) return item
                                return recalc({ ...item, productoId: p.id, codigo: p.codigo || '', descripcion: p.nombre, costoCompra: p.costo, precioVenta: p.precio > 0 ? p.precio : p.costo * 1.30 })
                              })
                            })
                          }
                          setBuscarProd('')
                        }}>
                        <span style={{ fontWeight: 600, color: '#0f172a' }}>{p.nombre}</span>
                        <div style={{ display: 'flex', gap: 12 }}>
                          <span style={{ color: '#64748b', fontSize: 11 }}>Costo: {fmt(p.costo)}</span>
                          <span style={{ color: '#2563eb', fontWeight: 700 }}>Venta: {fmt(p.precio > 0 ? p.precio : p.costo * 1.30)}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Column headers */}
              <div style={{ display: 'grid', gridTemplateColumns: '80px 1fr 55px 110px 80px 75px 22px', gap: 6, marginBottom: 5 }}>
                {['Codigo', 'Descripcion', 'Cant.', 'Precio Venta', 'Desc.', 'Total', ''].map(h => (
                  <div key={h} style={{ fontSize: 10, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', padding: '4px 0' }}>{h}</div>
                ))}
              </div>

              {items.map((item, i) => (
                <div key={i} style={{ marginBottom: 8 }}>
                  <div style={{ fontSize: 9, fontWeight: 700, color: item.tipo === 'instalacion' ? '#d97706' : item.tipo === 'servicio' ? '#2563eb' : '#16a34a', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 3 }}>
                    {item.tipo}
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '80px 1fr 55px 110px 80px 75px 22px', gap: 6, alignItems: 'start' }}>
                    <input className="input" value={item.codigo} onChange={e => updItem(i, 'codigo', e.target.value)} placeholder="COD" style={{ fontSize: 11, padding: '5px 7px' }} />
                    <input className="input" value={item.descripcion} onChange={e => updItem(i, 'descripcion', e.target.value)} placeholder="Descripcion" style={{ fontSize: 11, padding: '5px 7px' }} />
                    <input className="input" type="number" min="1" value={item.cantidad} onChange={e => updItem(i, 'cantidad', Number(e.target.value))} style={{ fontSize: 11, padding: '5px 7px', textAlign: 'center' }} />

                    {/* Precio column */}
                    <div>
                      {item.tipo === 'producto' ? (
                        <div>
                          <input className="input" type="number" min="0" value={item.precioVenta || ''} onChange={e => updItem(i, 'precioVenta', Number(e.target.value))} placeholder="Precio venta" style={{ fontSize: 11, padding: '5px 7px' }} />
                          {item.costoCompra > 0 && (
                            <div style={{ fontSize: 9, color: '#94a3b8', padding: '2px 7px' }}>
                              Costo: Q {item.costoCompra.toFixed(2)}
                              {item.precioVenta > 0 && item.costoCompra > 0 && Math.abs(item.precioVenta - item.costoCompra * 1.30) < 0.01 && ' (+30%)'}
                            </div>
                          )}
                        </div>
                      ) : item.tipo === 'instalacion' ? (
                        <div>
                          <div style={{ fontSize: 12, fontWeight: 700, color: '#d97706', padding: '5px 7px' }}>Q {item.precioVenta.toFixed(2)}</div>
                          <div style={{ fontSize: 9, color: '#94a3b8', padding: '0 7px' }}>auto calculado</div>
                        </div>
                      ) : (
                        <input className="input" type="number" min="0" value={item.precioVenta || ''} onChange={e => updItem(i, 'precioVenta', Number(e.target.value))} placeholder="Precio" style={{ fontSize: 11, padding: '5px 7px' }} />
                      )}
                    </div>

                    <input className="input" type="number" min="0" value={item.descuento || ''} onChange={e => updItem(i, 'descuento', Number(e.target.value))} placeholder="0" style={{ fontSize: 11, padding: '5px 7px' }} />
                    <div style={{ fontSize: 13, fontWeight: 700, color: '#0f172a', textAlign: 'right', paddingTop: 7 }}>Q {item.total.toFixed(2)}</div>
                    <button onClick={() => removeItem(i)} style={{ background: 'none', border: 'none', color: '#dc2626', cursor: 'pointer', fontSize: 16, paddingTop: 4 }}>×</button>
                  </div>

                  {/* Instalacion calculator */}
                  {item.tipo === 'instalacion' && (
                    <div style={{ background: '#fffbeb', border: '1px solid #fed7aa', borderRadius: 8, padding: 12, marginTop: 6 }}>
                      <div style={{ fontSize: 10, fontWeight: 700, color: '#d97706', marginBottom: 10, textTransform: 'uppercase' }}>
                        Calculadora de instalacion
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', gap: 10 }}>
                        {[
                          { label: 'Km al destino', key: 'km', note: 'Ida y vuelta x2' },
                          { label: 'Precio gas Q/L', key: 'precioGasolina' },
                          { label: 'Rendimiento km/L', key: 'rendimiento' },
                          { label: 'Num. tecnicos', key: 'tecnicos', note: 'Q35/tec/hora comida' },
                          { label: 'Horas de trabajo', key: 'horas' },
                        ].map(f => (
                          <div key={f.key}>
                            <label style={{ ...lbl, color: '#d97706' }}>{f.label}</label>
                            <input className="input" type="number" min="0" value={(item as any)[f.key]} onChange={e => updItem(i, f.key as keyof LineItem, Number(e.target.value))} style={{ fontSize: 12 }} />
                            {f.note && <div style={{ fontSize: 9, color: '#94a3b8', marginTop: 2 }}>{f.note}</div>}
                          </div>
                        ))}
                        <div style={{ gridColumn: '1/-1' }}>
                          <label style={{ ...lbl, color: '#d97706' }}>Mano de obra (Q)</label>
                          <input className="input" type="number" min="0" value={item.manoObra} onChange={e => updItem(i, 'manoObra', Number(e.target.value))} style={{ fontSize: 12, maxWidth: 160 }} />
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: 20, marginTop: 10, fontSize: 11, color: '#64748b' }}>
                        <span>⛽ Gas: <strong style={{ color: '#d97706' }}>Q {calcGas(item).toFixed(2)}</strong></span>
                        <span> Comida: <strong style={{ color: '#d97706' }}>Q {calcComida(item).toFixed(2)}</strong></span>
                        <span> M.Obra: <strong style={{ color: '#d97706' }}>Q {(item.manoObra || 0).toFixed(2)}</strong></span>
                        <span style={{ fontWeight: 700 }}>= <strong style={{ color: '#d97706', fontSize: 13 }}>Q {item.precioVenta.toFixed(2)}</strong></span>
                      </div>
                    </div>
                  )}

                  {i < items.length - 1 && <div style={{ borderBottom: '1px solid #f1f5f9', marginTop: 8 }} />}
                </div>
              ))}
            </div>

            {/* Totales — IVA SOLO UNA VEZ AL FINAL */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 16 }}>
              <div style={{ background: '#f8fafc', border: '1.5px solid #bfdbfe', borderRadius: 10, padding: '14px 20px', minWidth: 250 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: '#475569', marginBottom: 5 }}>
                  <span>Base</span><span>Q {baseTotal.toFixed(2)}</span>
                </div>
                {descuentoTotal > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: '#dc2626', marginBottom: 5 }}>
                    <span>Descuento</span><span>-Q {descuentoTotal.toFixed(2)}</span>
                  </div>
                )}
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: '#d97706', fontWeight: 600, marginBottom: 10 }}>
                  <span>IVA (5%)</span><span>Q {iva.toFixed(2)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 19, fontWeight: 800, color: '#2563eb', borderTop: '2px solid #bfdbfe', paddingTop: 10 }}>
                  <span>TOTAL</span><span>Q {totalFinal.toFixed(2)}</span>
                </div>
              </div>
            </div>

            <div style={{ marginBottom: 18 }}>
              <label style={lbl}>Notas adicionales</label>
              <textarea className="input" rows={2} value={form.notas} onChange={e => setF('notas', e.target.value)} />
            </div>
            <div style={{ gridColumn: '1/-1' }}>
              <label style={lbl}>Tiempo estimado de instalación</label>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 8 }}>
                {[
                  { label: '1 día', val: '1 día hábil (8:00am – 5:00pm)' },
                  { label: '1-2 días', val: '1 a 2 días hábiles (8:00am – 5:00pm)' },
                  { label: '2-3 días', val: '2 a 3 días hábiles (8:00am – 5:00pm)' },
                  { label: '3-4 días', val: '3 a 4 días hábiles (8:00am – 5:00pm)' },
                  { label: 'Personalizado', val: '' },
                ].map(op => (
                  <button key={op.label} type="button"
                    onClick={() => setF('tiempoInstalacion', op.val)}
                    style={{ padding: '5px 12px', borderRadius: 20, border: '1.5px solid', fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', transition: 'all .15s', borderColor: form.tiempoInstalacion === op.val && op.val ? '#2563eb' : '#e2e8f0', background: form.tiempoInstalacion === op.val && op.val ? '#eff6ff' : '#f8fafc', color: form.tiempoInstalacion === op.val && op.val ? '#2563eb' : '#64748b' }}>
                    {op.label}
                  </button>
                ))}
              </div>
              <input className="input" value={form.tiempoInstalacion} onChange={e => setF('tiempoInstalacion', e.target.value)}
                placeholder="Ej: 1 a 2 días hábiles en horario 8:00am a 5:00pm..." />
              <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 4 }}>
                Guía: 1-4 cámaras = 1-2 días · 5-8 cámaras = 2-3 días · 9+ cámaras = 3-4 días
              </div>
            </div>

            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button className="btn-ghost" onClick={() => { setShowModal(false); setEditingId(null) }}>Cancelar</button>
              <button className="btn-primary" onClick={save} disabled={loading} style={{ minWidth: 140 }}>
                {loading ? 'Guardando...' : editingId ? 'Actualizar Cotizacion' : 'Guardar Cotizacion'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── PREVIEW ─── */}
      {showPreview && selected && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.5)', zIndex: 999, display: 'flex', alignItems: 'flex-start', justifyContent: 'center', padding: 20, overflowY: 'auto' }}>
          <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 14, padding: 28, width: '100%', maxWidth: 700, margin: 'auto', boxShadow: '0 20px 60px rgba(0,0,0,.15)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18, paddingBottom: 14, borderBottom: '1px solid #e2e8f0' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <img src="https://websoft-solutions.vercel.app/logo.png" alt="Logo" style={{ width: 38, height: 38, borderRadius: 8, objectFit: 'contain' }} onError={e => { (e.target as HTMLImageElement).style.display = 'none' }} />
                <div>
                  <div style={{ fontWeight: 700, fontSize: 16, color: '#0f172a' }}>{selected.numero}</div>
                  <div style={{ fontSize: 12, color: '#64748b' }}>{fmtDate(selected.fecha)} · {selected.clienteNombre}</div>
                </div>
              </div>
              <button onClick={() => setShowPreview(false)} style={{ background: 'none', border: 'none', fontSize: 24, cursor: 'pointer', color: '#94a3b8' }}>×</button>
            </div>

            <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 14 }}>
              <thead>
                <tr>
                  {['Codigo', 'Descripcion', 'Cant.', 'P/Unit.', 'Desc.', 'Total'].map(h => (
                    <th key={h} style={{ background: '#f8fafc', fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', padding: '8px 12px', textAlign: 'left', borderBottom: '1px solid #e2e8f0' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {selected.items.map((it, i) => (
                  <tr key={i}>
                    <td style={{ padding: '9px 12px', fontSize: 11, fontFamily: 'monospace', color: '#2563eb', fontWeight: 700, borderBottom: '1px solid #f1f5f9' }}>{it.codigo || ''}</td>
                    <td style={{ padding: '9px 12px', fontSize: 12, borderBottom: '1px solid #f1f5f9', color: '#0f172a' }}>{it.descripcion}</td>
                    <td style={{ padding: '9px 12px', fontSize: 12, textAlign: 'center', borderBottom: '1px solid #f1f5f9' }}>{it.cantidad}</td>
                    <td style={{ padding: '9px 12px', fontSize: 12, borderBottom: '1px solid #f1f5f9', color: '#475569' }}>{fmt(it.precioUnitario)}</td>
                    <td style={{ padding: '9px 12px', fontSize: 12, borderBottom: '1px solid #f1f5f9', color: it.descuento > 0 ? '#dc2626' : '#94a3b8' }}>{it.descuento > 0 ? fmt(it.descuento) : '—'}</td>
                    <td style={{ padding: '9px 12px', fontSize: 13, fontWeight: 700, borderBottom: '1px solid #f1f5f9', color: '#0f172a' }}>{fmt(it.totalItem)}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 20 }}>
              <div style={{ background: '#f8fafc', border: '1.5px solid #bfdbfe', borderRadius: 10, padding: '12px 18px', minWidth: 230 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: '#475569', marginBottom: 4 }}><span>Base</span><span>{fmt(selected.subtotal - selected.descuento)}</span></div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: '#d97706', fontWeight: 600, marginBottom: 8 }}><span>IVA (5%)</span><span>{fmt(selected.total - (selected.subtotal - selected.descuento))}</span></div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 18, fontWeight: 800, color: '#2563eb', borderTop: '2px solid #bfdbfe', paddingTop: 8 }}><span>TOTAL</span><span>{fmt(selected.total)}</span></div>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', gap: 8 }}>
                <div style={{ display: 'flex', gap: 6 }}>
                  {selected.estado === 'pendiente' && (
                    <>
                      <button onClick={() => solicitarCambioEstado(selected.id, 'aceptada', selected.numero)}
                        style={{ padding: '6px 14px', background: '#16a34a', color: '#fff', border: 'none', borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>
                         Aceptar
                      </button>
                      <button onClick={() => solicitarCambioEstado(selected.id, 'rechazada', selected.numero)}
                        style={{ padding: '6px 14px', background: '#dc2626', color: '#fff', border: 'none', borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>
                         Rechazar
                      </button>
                    </>
                  )}
                  {selected.estado !== 'pendiente' && (
                    <button onClick={() => solicitarCambioEstado(selected.id, 'pendiente', selected.numero)}
                      style={{ padding: '6px 14px', background: '#f8fafc', color: '#64748b', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
                      ↩ Reabrir
                    </button>
                  )}
                  <button onClick={() => solicitarCambioEstado(selected.id, 'vencida', selected.numero)}
                    style={{ padding: '6px 14px', background: '#f8fafc', color: '#94a3b8', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: 12, cursor: 'pointer', fontFamily: 'inherit' }}>
                    Marcar vencida
                  </button>
                </div>
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

      {/* ─── PIN AUTHORIZATION MODAL ─── */}
      {pinModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.6)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: '#fff', borderRadius: 14, padding: 28, width: 380, boxShadow: '0 20px 60px rgba(0,0,0,.25)' }}>
            <div style={{ textAlign: 'center', marginBottom: 20 }}>
              <div style={{ width: 56, height: 56, background: '#fef3c7', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px', fontSize: 26 }}></div>
              <div style={{ fontWeight: 800, fontSize: 17, color: '#0f172a', marginBottom: 6 }}>Autorizacion requerida</div>
              <div style={{ fontSize: 13, color: '#64748b' }}>
                {'Para '}<strong style={{ color: pinModal.estado === 'aceptada' ? '#16a34a' : '#dc2626' }}>{pinModal.estado === 'aceptada' ? 'ACEPTAR' : 'RECHAZAR'}</strong>{' la cotizacion '}<strong>{pinModal.numero}</strong>{' se requiere el PIN del administrador.'}
              </div>
            </div>
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', marginBottom: 6 }}>PIN de Administrador</label>
              <input
                className="input"
                type="password"
                value={pin}
                onChange={e => { setPin(e.target.value); setPinError('') }}
                onKeyDown={e => e.key === 'Enter' && pin && aplicarEstado(pinModal.id, pinModal.estado, pin)}
                placeholder="Ingresa el PIN"
                autoFocus
                style={{ fontSize: 20, textAlign: 'center', letterSpacing: 6, fontWeight: 700 }}
              />
              {pinError && <div style={{ fontSize: 12, color: '#dc2626', fontWeight: 600, marginTop: 6 }}>⚠ {pinError}</div>}
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button className="btn-ghost" style={{ flex: 1 }} onClick={() => { setPinModal(null); setPin(''); setPinError('') }}>Cancelar</button>
              <button
                onClick={() => aplicarEstado(pinModal.id, pinModal.estado, pin)}
                disabled={!pin || pinLoading}
                style={{ flex: 1, background: pinModal.estado === 'aceptada' ? '#16a34a' : '#dc2626', color: '#fff', border: 'none', padding: '10px', borderRadius: 8, fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', opacity: !pin || pinLoading ? .6 : 1 }}
              >
                {pinLoading ? 'Verificando...' : 'Autorizar'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}

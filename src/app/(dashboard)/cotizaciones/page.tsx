'use client'
import { useState, useEffect, useCallback, useRef } from 'react'
import { useSession } from 'next-auth/react'
import { toast } from 'sonner'
import { fmt, fmtDate } from '@/lib/utils'
import { calculateGravable, calculateIVA } from '@/shared/money'
import { createNewCotizacionItem, recalcLineItem, calculateCotizacionTotals } from '@/modules/cotizaciones/utils/cotizacion-calc.helper'
import { printCotizacionHTML } from '@/modules/cotizaciones/utils/cotizacion-print.helper'
import { CotizacionPreviewModal } from '@/modules/cotizaciones/components/CotizacionPreviewModal'
import { CotizacionPinModal } from '@/modules/cotizaciones/components/CotizacionPinModal'
import { CotizacionSendModal } from '@/modules/cotizaciones/components/CotizacionSendModal'

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
  // instalacion — tarifa fija por zona + cargo adicional opcional
  zonaId: number | null
  zonaNombre: string
  zonaTarifa: number
  cargoAdicional: number
  notaAdicional: string
}

interface Cotizacion {
  id: number
  numero: string
  fecha: string
  clienteNombre: string
  clienteDireccion: string | null
  clienteTelefono: string | null
  clienteNit: string | null
  clienteCorreo: string | null
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

const newItem = createNewCotizacionItem
const recalc = recalcLineItem

const emptyForm = {
  clienteNombre: '', clienteDireccion: '', clienteTelefono: '',
  clienteNit: 'CF', clienteCorreo: '', atencion: '',
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
  const [openMenuId, setOpenMenuId] = useState<number | null>(null)
  const menuRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    const close = (e: MouseEvent) => {
      if (menuRef.current && menuRef.current.contains(e.target as Node)) return
      setOpenMenuId(null)
    }
    document.addEventListener('mousedown', close)
    return () => document.removeEventListener('mousedown', close)
  }, [])
  const [productos, setProductos] = useState<Producto[]>([])
  const [zonas, setZonas] = useState<{ id: number; nombre: string; departamento: string; tarifa: number }[]>([])
  const [buscarProd, setBuscarProd] = useState('')

  const { data: session } = useSession()
  const isAdmin = session?.user?.role === 'admin'

  const [pinModal, setPinModal] = useState<{ id: number; estado: string; numero: string } | null>(null)
  const [pin, setPin] = useState('')
  const [pinLoading, setPinLoading] = useState(false)
  const [pinError, setPinError] = useState('')
  const [editingId, setEditingId] = useState<number | null>(null)
  const [sendModal, setSendModal] = useState<Cotizacion | null>(null)
  const [sendEmail, setSendEmail] = useState('')
  const [sendLoading, setSendLoading] = useState(false)

  const load = async () => {
    const c = await fetch('/api/cotizaciones').then(r => r.json())
    setCotizaciones(Array.isArray(c) ? c : [])
  }

  const loadProductos = useCallback(async () => {
    const res = await fetch(`/api/productos?buscar=${encodeURIComponent(buscarProd)}`)
    setProductos(await res.json())
  }, [buscarProd])

  const loadZonas = async () => {
    const res = await fetch('/api/zonas-instalacion?activas=true')
    const d = await res.json()
    setZonas(d.zonas || [])
  }

  useEffect(() => { load() }, [])
  useEffect(() => { loadProductos() }, [loadProductos])
  useEffect(() => { loadZonas() }, [])

  const setF = (k: string, v: string) => setForm(p => ({ ...p, [k]: v }))

  const [clienteSugerencias, setClienteSugerencias] = useState<any[]>([])
  const [showClienteSugerencias, setShowClienteSugerencias] = useState(false)

  const buscarNitCliente = async (nit: string) => {
    const cleanNit = (nit || '').trim()
    setF('clienteNit', cleanNit)
    if (cleanNit.length < 3 || cleanNit.toUpperCase() === 'CF') return
    try {
      const res = await fetch(`/api/clientes/buscar-nit?nit=${encodeURIComponent(cleanNit)}`)
      const data = await res.json()
      if (data.encontrado && data.cliente) {
        setForm(p => ({
          ...p,
          clienteNombre: data.cliente.nombre,
          clienteTelefono: data.cliente.telefono || p.clienteTelefono,
          clienteDireccion: data.cliente.direccion || p.clienteDireccion,
          clienteCorreo: data.cliente.email || p.clienteCorreo,
          clienteNit: data.cliente.nit || cleanNit,
        }))
        toast.success(`Cliente ${data.cliente.nombre} encontrado — Datos cargados`)
      } else {
        setForm(p => ({
          ...p,
          clienteNombre: '',
          clienteTelefono: '',
          clienteDireccion: '',
          clienteCorreo: '',
          clienteNit: cleanNit,
        }))
      }
    } catch { /* ignore */ }
  }

  const buscarClienteNombre = async (query: string) => {
    setF('clienteNombre', query)
    if (!query || query.trim().length < 2) {
      setClienteSugerencias([])
      setShowClienteSugerencias(false)
      return
    }
    try {
      const res = await fetch(`/api/clientes?buscar=${encodeURIComponent(query.trim())}`)
      const data = await res.json()
      if (Array.isArray(data) && data.length > 0) {
        setClienteSugerencias(data.slice(0, 6))
        setShowClienteSugerencias(true)
      } else {
        setClienteSugerencias([])
        setShowClienteSugerencias(false)
      }
    } catch {
      setClienteSugerencias([])
      setShowClienteSugerencias(false)
    }
  }

  const seleccionarClienteSugerido = (c: any) => {
    setForm(p => ({
      ...p,
      clienteNombre: c.nombre,
      clienteNit: c.nit || 'CF',
      clienteTelefono: c.telefono || '',
      clienteDireccion: c.direccion || '',
      clienteCorreo: c.email || '',
    }))
    setClienteSugerencias([])
    setShowClienteSugerencias(false)
    toast.success(`Cliente "${c.nombre}" seleccionado — Datos cargados`)
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
        precioVenta: prod.precio || prod.costo || 0,
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

  // Totals — IVA incluido en el total final
  const { itemsSubtotalBruto, itemsDescuentoTotal, totalFinal, baseTotal, ivaCalculado: iva } = calculateCotizacionTotals(items)

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
          descripcion: it.descripcion + (it.tipo === 'instalacion' ? ` (${it.zonaNombre || 'Zona'})` : ''),
          cantidad: it.cantidad, precioUnitario: it.precioVenta,
          subtotal: it.subtotal, descuento: it.descuento, totalItem: it.total,
        })),
        subtotal: itemsSubtotalBruto, descuento: itemsDescuentoTotal, total: totalFinal,
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
      clienteCorreo: c.clienteCorreo || '',
      atencion: c.atencion || '', formaPago: c.formaPago || '',
      descripcion: c.descripcion || '', notas: c.notas || '',
      validezDias: String(c.validezDias || 15), tiempoInstalacion: c.tiempoInstalacion || '',
    })
    setItems((c.items || []).map((it: any) => ({
      tipo: 'producto' as const, productoId: null, codigo: it.codigo || '',
      descripcion: it.descripcion, costoCompra: 0,
      precioVenta: Number(it.precioUnitario), cantidad: Number(it.cantidad),
      descuento: Number(it.descuento) || 0, subtotal: Number(it.subtotal),
      total: Number(it.totalItem), zonaId: null, zonaNombre: '', zonaTarifa: 0,
      cargoAdicional: 0, notaAdicional: '',
    })))
    setShowModal(true)
  }

  const abrirSendModal = (cot: Cotizacion) => { setSendEmail(cot.clienteCorreo || ''); setSendModal(cot) }

  const duplicarCotizacion = (c: Cotizacion) => {
    setEditingId(null)
    setForm({
      clienteNombre: c.clienteNombre, clienteDireccion: c.clienteDireccion || '',
      clienteTelefono: c.clienteTelefono || '', clienteNit: c.clienteNit || 'CF',
      clienteCorreo: c.clienteCorreo || '',
      atencion: c.atencion || '', formaPago: c.formaPago || '',
      descripcion: c.descripcion || '', notas: c.notas || '',
      validezDias: String(c.validezDias || 15), tiempoInstalacion: c.tiempoInstalacion || '',
    })
    setItems((c.items || []).map((it: any) => ({
      tipo: 'producto' as const, productoId: null, codigo: it.codigo || '',
      descripcion: it.descripcion, costoCompra: 0,
      precioVenta: Number(it.precioUnitario), cantidad: Number(it.cantidad),
      descuento: Number(it.descuento) || 0, subtotal: Number(it.subtotal),
      total: Number(it.totalItem), zonaId: null, zonaNombre: '', zonaTarifa: 0,
      cargoAdicional: 0, notaAdicional: '',
    })))
    setShowModal(true)
    toast.info('Cotización duplicada — se guardará con número nuevo')
  }

  const enviarWA = (cot: Cotizacion) => {
    const tel = (cot.clienteTelefono || '').replace(/\D/g, '')
    const num = tel.startsWith('502') ? tel : '502' + tel
    const msg = `Hola ${cot.clienteNombre}, le enviamos su cotización *${cot.numero}* de WebSoft Solutions por un total de *Q ${cot.total.toFixed(2)}*. Quedo atento a su confirmación.`
    window.open(`https://wa.me/${num}?text=${encodeURIComponent(msg)}`, '_blank')
  }

  const enviarCorreoManual = async (cot: Cotizacion) => {
    if (!sendEmail) { toast.error('Ingresa un correo'); return }
    setSendLoading(true)
    const res = await fetch(`/api/cotizaciones/${cot.id}/enviar-correo`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: sendEmail }) })
    setSendLoading(false)
    const d = await res.json()
    if (d.ok) { toast.success('Cotización enviada por correo'); setSendModal(null) }
    else toast.error(d.error || 'Error al enviar')
  }

  const imprimir = (cot: Cotizacion) => printCotizacionHTML(cot)

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
        <button className="btn-primary" onClick={() => { setForm({ ...emptyForm, atencion: session?.user?.name || '' }); setItems([newItem('producto')]); setShowModal(true) }}>
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
                  <td style={{ padding: '8px 14px', borderBottom: '1px solid #f1f5f9' }} onClick={e => e.stopPropagation()}>
                    <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                      {(c.estado === 'aceptada' || c.estado === 'pendiente') && (
                        <a href="/pos" onClick={() => localStorage.setItem('cot_facturar', c.id.toString())}
                          style={{ fontSize: 10, fontWeight: 700, padding: '4px 9px', background: '#1581E3', color: '#fff', borderRadius: 4, cursor: 'pointer', fontFamily: 'inherit', textDecoration: 'none', whiteSpace: 'nowrap' }}>
                          Facturar
                        </a>
                      )}
                      {c.estado === 'pendiente' && (
                        <>
                          <button onClick={() => solicitarCambioEstado(c.id, 'aceptada', c.numero)}
                            style={{ fontSize: 10, fontWeight: 700, padding: '4px 8px', background: '#f0fdf4', color: '#16a34a', border: '1px solid #bbf7d0', borderRadius: 4, cursor: 'pointer', fontFamily: 'inherit', whiteSpace: 'nowrap' }}>
                            Aceptar
                          </button>
                          <button onClick={() => solicitarCambioEstado(c.id, 'rechazada', c.numero)}
                            style={{ fontSize: 10, fontWeight: 700, padding: '4px 8px', background: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca', borderRadius: 4, cursor: 'pointer', fontFamily: 'inherit', whiteSpace: 'nowrap' }}>
                            Rechazar
                          </button>
                        </>
                      )}
                      <div ref={openMenuId === c.id ? menuRef : null} style={{ position: 'relative' }}>
                        <button onClick={() => setOpenMenuId(openMenuId === c.id ? null : c.id)}
                          style={{ padding: '4px 8px', background: '#fff', border: '1.5px solid #d8d6cd', borderRadius: 4, cursor: 'pointer', fontSize: 15, color: '#52524d', lineHeight: 1, fontFamily: 'inherit' }}>
                          ⋯
                        </button>
                        {openMenuId === c.id && (
                          <div style={{ position: 'absolute', right: 0, top: '110%', background: '#fff', border: '1.5px solid #d8d6cd', borderRadius: 6, boxShadow: '0 8px 24px rgba(0,0,0,.15)', zIndex: 999, minWidth: 160, overflow: 'hidden' }}>
                            {[
                              { label: 'Editar', action: () => { openEditCot(c); setOpenMenuId(null) } },
                              { label: 'Duplicar', action: () => { duplicarCotizacion(c); setOpenMenuId(null) } },
                              { label: 'Enviar', action: () => { abrirSendModal(c); setOpenMenuId(null) } },
                              ...(c.estado === 'aceptada' ? [{ label: '↩ Revertir', action: () => { solicitarCambioEstado(c.id, 'pendiente', c.numero); setOpenMenuId(null) } }] : []),
                            ].map((item, idx) => (
                              <button key={idx} onClick={item.action}
                                style={{ display: 'block', width: '100%', padding: '10px 16px', fontSize: 12, fontWeight: 500, color: '#18181b', background: 'none', border: 'none', borderTop: idx > 0 ? '1px solid #f1f5f9' : 'none', cursor: 'pointer', textAlign: 'left', fontFamily: 'inherit' }}
                                onMouseEnter={e => (e.currentTarget.style.background = '#f4f3ef')}
                                onMouseLeave={e => (e.currentTarget.style.background = 'none')}>
                                {item.label}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
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
                <img src="https://websoftsolutions.com.gt/logo.png" alt="Logo" style={{ width: 36, height: 36, borderRadius: 8, objectFit: 'contain' }} onError={e => { (e.target as HTMLImageElement).style.display = 'none' }} />
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
                <div style={{ gridColumn: '2 / -1', position: 'relative' }}>
                  <label style={lbl}>Nombre del cliente * (escribe para buscar por nombre)</label>
                  <input
                    className="input"
                    value={form.clienteNombre}
                    onChange={e => buscarClienteNombre(e.target.value)}
                    placeholder="Nombre completo o busca por nombre..."
                    onFocus={() => { if (clienteSugerencias.length > 0) setShowClienteSugerencias(true); }}
                  />
                  {showClienteSugerencias && clienteSugerencias.length > 0 && (
                    <div
                      style={{
                        position: 'absolute',
                        top: '100%',
                        left: 0,
                        right: 0,
                        background: '#fff',
                        border: '1.5px solid #d8d6cd',
                        borderRadius: 8,
                        marginTop: 4,
                        maxHeight: 200,
                        overflowY: 'auto',
                        boxShadow: '0 10px 25px rgba(0,0,0,.15)',
                        zIndex: 1000,
                      }}
                    >
                      {clienteSugerencias.map(c => (
                        <div
                          key={c.id}
                          onClick={() => seleccionarClienteSugerido(c)}
                          style={{
                            padding: '9px 14px',
                            borderBottom: '1px solid #f1f5f9',
                            cursor: 'pointer',
                            fontSize: 12,
                          }}
                          onMouseEnter={e => (e.currentTarget.style.background = '#f4f3ef')}
                          onMouseLeave={e => (e.currentTarget.style.background = 'none')}
                        >
                          <div style={{ fontWeight: 600, color: '#18181b' }}>{c.nombre}</div>
                          <div style={{ fontSize: 11, color: '#8a887e', marginTop: 2 }}>
                            NIT: <strong>{c.nit || 'CF'}</strong> {c.telefono ? `· Tel: ${c.telefono}` : ''} {c.email ? `· ${c.email}` : ''}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
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
                  <label style={lbl}>Atendido por / Vendedor</label>
                  <input className="input" value={form.atencion} onChange={e => setF('atencion', e.target.value)} placeholder="Nombre del vendedor" />
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
                    <input className="input" type="number" min="1" value={item.cantidad} onChange={e => updItem(i, 'cantidad', e.target.value === '' ? '' : parseFloat(e.target.value) || 0)} style={{ fontSize: 11, padding: '5px 7px', textAlign: 'center' }} />

                    {/* Precio column */}
                    <div>
                      {item.tipo === 'producto' ? (
                        <div>
                          <input className="input" type="number" min="0" value={item.precioVenta === 0 ? '' : item.precioVenta} onChange={e => updItem(i, 'precioVenta', e.target.value === '' ? '' : parseFloat(e.target.value) || 0)} placeholder="Precio venta" style={{ fontSize: 11, padding: '5px 7px' }} />
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
                        <input className="input" type="number" min="0" value={item.precioVenta === 0 ? '' : item.precioVenta} onChange={e => updItem(i, 'precioVenta', e.target.value === '' ? '' : parseFloat(e.target.value) || 0)} placeholder="Precio" style={{ fontSize: 11, padding: '5px 7px' }} />
                      )}
                    </div>

                    <input className="input" type="number" min="0" value={item.descuento || ''} onChange={e => updItem(i, 'descuento', e.target.value === '' ? '' : parseFloat(e.target.value) || 0)} placeholder="0" style={{ fontSize: 11, padding: '5px 7px' }} />
                    <div style={{ fontSize: 13, fontWeight: 700, color: '#0f172a', textAlign: 'right', paddingTop: 7 }}>Q {item.total.toFixed(2)}</div>
                    <button onClick={() => removeItem(i)} style={{ background: 'none', border: 'none', color: '#dc2626', cursor: 'pointer', fontSize: 16, paddingTop: 4 }}>×</button>
                  </div>

                  {/* Instalacion: selector de zona con tarifa fija */}
                  {item.tipo === 'instalacion' && (
                    <div style={{ background: '#fffbeb', border: '1px solid #fed7aa', borderRadius: 8, padding: 12, marginTop: 6 }}>
                      <div style={{ fontSize: 10, fontWeight: 700, color: '#d97706', marginBottom: 10, textTransform: 'uppercase' }}>
                        Costo de instalación por zona
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 10, alignItems: 'end' }}>
                        <div>
                          <label style={{ ...lbl, color: '#d97706' }}>Zona de instalación</label>
                          <select className="input" value={item.zonaId || ''} style={{ fontSize: 13 }}
                            onChange={e => {
                              const zonaId = Number(e.target.value) || null
                              const z = zonas.find(zz => zz.id === zonaId)
                              setItems(prev => prev.map((it, idx) => idx === i ? recalc({ ...it, zonaId, zonaNombre: z?.nombre || '', zonaTarifa: z?.tarifa || 0 }) : it))
                            }}>
                            <option value="">Selecciona una zona...</option>
                            {zonas.map(z => (
                              <option key={z.id} value={z.id}>{z.nombre} — {z.departamento} (Q{z.tarifa.toFixed(2)})</option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label style={{ ...lbl, color: '#d97706' }}>Cargo adicional (Q)</label>
                          <input className="input" type="number" min="0" value={item.cargoAdicional || ''} onChange={e => updItem(i, 'cargoAdicional', Number(e.target.value))} placeholder="0.00" style={{ fontSize: 13 }} />
                        </div>
                        {item.cargoAdicional > 0 && (
                          <div style={{ gridColumn: '1/-1' }}>
                            <label style={{ ...lbl, color: '#d97706' }}>Motivo del cargo adicional</label>
                            <input className="input" value={item.notaAdicional} onChange={e => updItem(i, 'notaAdicional', e.target.value)} placeholder="Ej: técnico extra, equipo especial, trabajo nocturno..." style={{ fontSize: 12 }} />
                          </div>
                        )}
                      </div>
                      <div style={{ display: 'flex', gap: 20, marginTop: 10, fontSize: 11, color: '#64748b' }}>
                        <span>Zona: <strong style={{ color: '#d97706' }}>Q {(item.zonaTarifa || 0).toFixed(2)}</strong></span>
                        {item.cargoAdicional > 0 && <span>Adicional: <strong style={{ color: '#d97706' }}>Q {item.cargoAdicional.toFixed(2)}</strong></span>}
                        <span style={{ fontWeight: 700 }}>Total: <strong style={{ color: '#d97706', fontSize: 13 }}>Q {item.precioVenta.toFixed(2)}</strong></span>
                      </div>
                    </div>
                  )}

                  {i < items.length - 1 && <div style={{ borderBottom: '1px solid #f1f5f9', marginTop: 8 }} />}
                </div>
              ))}
            </div>

            {/* Totales — IVA SOLO UNA VEZ AL FINAL */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 16 }}>
              <div style={{ background: '#f8fafc', border: '1.5px solid #bfdbfe', borderRadius: 10, padding: '14px 20px', minWidth: 260 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: '#475569', marginBottom: 5 }}>
                  <span>Subtotal</span><span>Q {itemsSubtotalBruto.toFixed(2)}</span>
                </div>
                {itemsDescuentoTotal > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: '#dc2626', marginBottom: 5 }}>
                    <span>Descuento</span><span>-Q {itemsDescuentoTotal.toFixed(2)}</span>
                  </div>
                )}
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: '#d97706', fontWeight: 600, marginBottom: 10 }}>
                  <span>IVA (5% Incluido)</span><span>Q {iva.toFixed(2)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 19, fontWeight: 800, color: '#2563eb', borderTop: '2px solid #bfdbfe', paddingTop: 10 }}>
                  <span>TOTAL A PAGAR</span><span>Q {totalFinal.toFixed(2)}</span>
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
                <img src="https://websoftsolutions.com.gt/logo.png" alt="Logo" style={{ width: 38, height: 38, borderRadius: 8, objectFit: 'contain' }} onError={e => { (e.target as HTMLImageElement).style.display = 'none' }} />
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
              <div style={{ background: '#f8fafc', border: '1.5px solid #bfdbfe', borderRadius: 10, padding: '12px 18px', minWidth: 240 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: '#475569', marginBottom: 4 }}><span>Subtotal</span><span>{fmt(selected.subtotal || selected.total)}</span></div>
                {selected.descuento > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: '#dc2626', marginBottom: 4 }}><span>Descuento</span><span>-{fmt(selected.descuento)}</span></div>
                )}
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: '#d97706', fontWeight: 600, marginBottom: 8 }}><span>IVA (5% Incluido)</span><span>{fmt(calculateIVA(selected.total, 0.05))}</span></div>
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
                <button className="btn-primary" onClick={() => { if (selected) abrirSendModal(selected) }}>Enviar / Descargar</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─── PREVIEW MODAL ─── */}
      <CotizacionPreviewModal
        selected={showPreview ? selected : null}
        onClose={() => setShowPreview(false)}
        onImprimir={imprimir}
        onSolicitarCambioEstado={solicitarCambioEstado}
        onEliminar={eliminar}
        onAbrirSendModal={abrirSendModal}
      />

      {/* ─── PIN AUTHORIZATION MODAL ─── */}
      <CotizacionPinModal
        pinModal={pinModal}
        pin={pin}
        pinError={pinError}
        onPinChange={setPin}
        onConfirm={() => pinModal && aplicarEstado(pinModal.id, pinModal.estado, pin)}
        onClose={() => { setPinModal(null); setPin(''); setPinError('') }}
      />

      {/* ─── SEND EMAIL / DOWNLOAD MODAL ─── */}
      <CotizacionSendModal
        sendModal={sendModal}
        sendEmail={sendEmail}
        sendLoading={sendLoading}
        onEmailChange={setSendEmail}
        onSendEmail={enviarCorreoManual}
        onDownloadPDF={(id) => window.open(`/api/cotizaciones/${id}/pdf`, '_blank')}
        onClose={() => setSendModal(null)}
      />

    </div>
  )
}


'use client'
import { useState, useEffect, useRef, useCallback } from 'react'
import { toast } from 'sonner'
import { fmt } from '@/lib/utils'
import { buildTicketHTML, printTicketWindow } from '@/lib/ticket-printer'

// ─── Types ───────────────────────────────────────────────────────────────────
interface Producto { id: number; codigo: string | null; nombre: string; precio: number; stock: number; imagenUrl?: string | null }
interface Cotizacion { id: number; numero: string; clienteNombre: string; clienteNit: string | null; total: number; items: any[] }

interface CartItem {
  tipo: 'inventario' | 'libre'
  productoId: number | null
  codigo: string
  nombre: string
  cantidad: number
  precioUnitario: number
  stock: number
  descuento: number
  subtotal: number
}

interface Config {
  empresa_nombre: string; iva_porcentaje: string; moneda_simbolo: string
  ticket_mensaje: string; empresa_nit: string; empresa_direccion: string; empresa_telefono: string
  ticket_mostrar_logo?: string; fel_activo?: string; email_factura_activo?: string
}

// ─── Component ───────────────────────────────────────────────────────────────
export default function POSPage() {
  const [productos, setProductos] = useState<Producto[]>([])
  const [cotizaciones, setCotizaciones] = useState<Cotizacion[]>([])
  const [cart, setCart] = useState<CartItem[]>([])
  const [buscar, setBuscar] = useState('')
  const [buscarCot, setBuscarCot] = useState('')
  const [config, setConfig] = useState<Config | null>(null)
  const [clienteNombre, setClienteNombre] = useState('Consumidor Final')
  const [clienteNit, setClienteNit] = useState('CF')
  const [clienteCorreo, setClienteCorreo] = useState('')
  const [clienteId, setClienteId] = useState<number|null>(null)
  const [clienteTieneCorreo, setClienteTieneCorreo] = useState(false)
  const [metodoPago, setMetodoPago] = useState('efectivo')
  const [montoRecibido, setMontoRecibido] = useState('')
  const [descPct, setDescPct] = useState(0)
  const [codigoDesc, setCodigoDesc] = useState('')
  const [loading, setLoading] = useState(false)
  const [showCobro, setShowCobro] = useState(false)
  const [lastVenta, setLastVenta] = useState<any>(null)
  const [lastFel, setLastFel] = useState<any>(null)
  const [tab, setTab] = useState<'inventario'|'cotizacion'|'libre'>('inventario')
  const [nitStatus, setNitStatus] = useState<'idle'|'found'|'notfound'>('idle')
  const [showRegCliente, setShowRegCliente] = useState(false)
  const [regForm, setRegForm] = useState({ nombre: '', telefono: '', direccion: '', correo: '' })
  const [libreForm, setLibreForm] = useState({ codigo: '', nombre: '', precio: '', cantidad: '1' })
  const searchRef = useRef<HTMLInputElement>(null)

  const loadProductos = useCallback(async () => {
    const res = await fetch(`/api/productos?buscar=${encodeURIComponent(buscar)}`)
    setProductos(await res.json())
  }, [buscar])

  const loadCotizaciones = useCallback(async () => {
    const res = await fetch(`/api/cotizaciones`)
    const data = await res.json()
    setCotizaciones(Array.isArray(data) ? data.filter((c: any) => ['aceptada','pendiente'].includes(c.estado)) : [])
  }, [])

  useEffect(() => { loadProductos() }, [loadProductos])
  useEffect(() => { fetch('/api/config').then(r => r.json()).then(setConfig) }, [])
  useEffect(() => { if (tab === 'cotizacion') loadCotizaciones() }, [tab, loadCotizaciones])

  // Barcode scanner
  const barcodeBuffer = useRef({ val: '', timer: null as any })
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const buf = barcodeBuffer.current
      if (e.key === 'Enter' && buf.val.length > 2) { setBuscar(buf.val); setTab('inventario'); buf.val = ''; return }
      if (e.key.length === 1) {
        buf.val += e.key
        clearTimeout(buf.timer)
        buf.timer = setTimeout(() => { buf.val = '' }, 100)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  // ─── Cart ops ────────────────────────────────────────────────────────────
  const addInventario = (prod: Producto) => {
    if (prod.stock <= 0) { toast.error('Sin stock'); return }
    setCart(prev => {
      const ex = prev.find(x => x.productoId === prod.id)
      if (ex) {
        if (ex.cantidad >= ex.stock) { toast.warning('Stock máximo'); return prev }
        return prev.map(x => x.productoId === prod.id ? { ...x, cantidad: x.cantidad + 1, subtotal: (x.cantidad + 1) * x.precioUnitario } : x)
      }
      return [...prev, { tipo: 'inventario', productoId: prod.id, codigo: prod.codigo || '', nombre: prod.nombre, cantidad: 1, precioUnitario: prod.precio, stock: prod.stock, descuento: 0, subtotal: prod.precio }]
    })
  }

  const addLibre = () => {
    if (!libreForm.nombre || !libreForm.precio) { toast.error('Descripción y precio requeridos'); return }
    const precio = parseFloat(libreForm.precio) || 0
    const cantidad = parseInt(libreForm.cantidad) || 1
    setCart(prev => [...prev, { tipo: 'libre', productoId: null, codigo: libreForm.codigo, nombre: libreForm.nombre, cantidad, precioUnitario: precio, stock: 99999, descuento: 0, subtotal: precio * cantidad }])
    setLibreForm({ codigo: '', nombre: '', precio: '', cantidad: '1' })
    toast.success('Item agregado')
  }

  const cargarCotizacion = (cot: Cotizacion) => {
    if (cot.items?.length === 0) { toast.error('Cotización sin items'); return }
    const nuevos: CartItem[] = cot.items.map((it: any) => ({
      tipo: 'libre' as const,
      productoId: null,
      codigo: it.codigo || '',
      nombre: it.descripcion,
      cantidad: it.cantidad,
      precioUnitario: it.precioUnitario,
      stock: 99999,
      descuento: it.descuento || 0,
      subtotal: it.totalItem,
    }))
    setCart(nuevos)
    setClienteNombre(cot.clienteNombre)
    setClienteNit(cot.clienteNit || 'CF')
    setTab('inventario')
    toast.success(`Cotización ${cot.numero} cargada`)
  }

  const removeItem = (i: number) => setCart(prev => prev.filter((_, idx) => idx !== i))
  const changeQty = (i: number, d: number) => setCart(prev => prev.map((item, idx) => {
    if (idx !== i) return item
    const q = Math.max(1, item.tipo === 'libre' ? item.cantidad + d : Math.min(item.stock, item.cantidad + d))
    return { ...item, cantidad: q, subtotal: q * item.precioUnitario - item.descuento }
  }))
  const changePrice = (i: number, val: string) => setCart(prev => prev.map((item, idx) => {
    if (idx !== i) return item
    const p = parseFloat(val) || 0
    return { ...item, precioUnitario: p, subtotal: item.cantidad * p - item.descuento }
  }))

  // ─── Totals ──────────────────────────────────────────────────────────────
  const subtotal = cart.reduce((s, x) => s + x.subtotal, 0)
  const descuento = subtotal * descPct / 100
  const ivaPct = parseFloat(config?.iva_porcentaje || '5')
  const impuesto = (subtotal - descuento) * ivaPct / 100
  const total = subtotal - descuento + impuesto
  const cambio = Math.max(0, parseFloat(montoRecibido || '0') - total)

  // ─── NIT lookup ──────────────────────────────────────────────────────────
  const buscarNit = (nit: string) => { setClienteNit(nit); setNitStatus('idle'); if (nit.length < 3 || nit.toUpperCase() === 'CF') setClienteNombre('Consumidor Final') }
  const ejecutarBusquedaNit = async () => {
    if (clienteNit.length < 3 || clienteNit.toUpperCase() === 'CF') return
    const res = await fetch(`/api/clientes/buscar-nit?nit=${encodeURIComponent(clienteNit)}`)
    const data = await res.json()
    if (data.encontrado) {
      setClienteNombre(data.cliente.nombre)
      setNitStatus('found')
      setClienteId(data.cliente.id)
      const emailGuardado = data.cliente.email || data.cliente.correo || ''
      setClienteCorreo(emailGuardado)
      setClienteTieneCorreo(!!emailGuardado)
      setRegForm({ nombre: data.cliente.nombre, telefono: data.cliente.telefono || '', direccion: data.cliente.direccion || '', correo: emailGuardado })
      toast.success(`Cliente: ${data.cliente.nombre}`)
    }
    else { setNitStatus('notfound'); setClienteId(null); setClienteTieneCorreo(false); setClienteNombre('') }
  }
  const registrarCliente = async () => {
    if (!regForm.nombre.trim()) { toast.error('Nombre requerido'); return }
    const body = clienteId
      ? { id: clienteId, nombre: regForm.nombre, nit: clienteNit, telefono: regForm.telefono, direccion: regForm.direccion, email: regForm.correo }
      : { nombre: regForm.nombre, nit: clienteNit, telefono: regForm.telefono, direccion: regForm.direccion, email: regForm.correo }
    const res = await fetch('/api/clientes', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
    const data = await res.json()
    if (data.ok) {
      setClienteNombre(regForm.nombre)
      if (regForm.correo) setClienteCorreo(regForm.correo)
      setClienteTieneCorreo(!!regForm.correo)
      setNitStatus('found')
      setShowRegCliente(false)
      toast.success(clienteId ? 'Cliente actualizado' : 'Cliente registrado')
    } else { toast.error(data.error || 'Error al guardar') }
  }

  // ─── Descuento ───────────────────────────────────────────────────────────
  const validarDescuento = async () => {
    if (!codigoDesc.trim()) return
    const res = await fetch('/api/descuentos/validar', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ codigo: codigoDesc, total: subtotal }) })
    const data = await res.json()
    if (data.ok) { setDescPct(data.porcentaje); toast.success(`Descuento ${data.porcentaje}% aplicado`) }
    else toast.error(data.error || 'Código inválido')
  }

  // ─── Cobrar ──────────────────────────────────────────────────────────────
  const cobrar = async () => {
    if (cart.length === 0) { toast.error('Carrito vacío'); return }
    if (metodoPago === 'efectivo' && parseFloat(montoRecibido || '0') < total) { toast.error('Monto insuficiente'); return }
    setLoading(true)
    try {
      const res = await fetch('/api/ventas', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clienteNombre, clienteNit, clienteCorreo,
          items: cart, subtotal, descuento, impuesto, total,
          metodoPago, montoRecibido: parseFloat(montoRecibido || '0'), cambio,
        }),
      })
      const data = await res.json()
      if (data.ok) {
        setLastVenta(data.venta)
        setLastFel(data.fel)
        setShowCobro(true)
        // Mostrar toast según resultado FEL
        if (data.fel?.ok && !data.fel?.sandbox) toast.success(`Venta ${data.venta.numero} — DTE certificado`)
        else if (data.fel?.ok && data.fel?.sandbox) toast.success(`Venta ${data.venta.numero} — FEL sandbox`)
        else if (data.fel && !data.fel.ok) toast.warning(`Venta registrada, pero FEL falló: ${data.fel.error}`)
        else toast.success(`Venta ${data.venta.numero}`)
        // Toast correo
        if (data.email?.ok) toast.success(`Factura enviada a ${clienteCorreo}`)
        loadProductos()
        // Auto-imprimir ticket al cobrar
        setTimeout(() => {
          if (!config || !data.venta) return
          const v = data.venta
          const f = data.fel
          const html = buildTicketHTML({
            empresaNombre: config.empresa_nombre, empresaNit: config.empresa_nit,
            empresaDireccion: config.empresa_direccion, empresaTelefono: config.empresa_telefono,
            empresaLogoUrl: 'https://websoft-solutions.vercel.app/logo.png',
            mostrarLogo: config.ticket_mostrar_logo !== 'false',
            ticketMensaje: config.ticket_mensaje,
            numero: v.numero, fecha: v.fecha,
            clienteNombre: v.clienteNombre, clienteNit: v.clienteNit,
            cajero: v.usuarioNombre || 'Cajero',
            felUuid: f?.uuid, felSerie: f?.serie, felNumero: f?.numero,
            felCertificacion: f?.fechaCertificacion, isSandbox: f?.sandbox,
            items: (v.items || []).map((it: any) => ({ nombre: it.nombre, cantidad: it.cantidad, precioUnitario: it.precioUnitario, descuento: it.descuento || 0, subtotal: it.subtotal })),
            subtotal: v.subtotal, descuento: v.descuento, impuesto: v.impuesto,
            total: v.total, metodoPago: v.metodoPago, montoRecibido: v.montoRecibido, cambio: v.cambio, ivaPct,
          })
          printTicketWindow(html)
        }, 400)
      }
      else toast.error(data.error || 'Error')
    } catch { toast.error('Error de conexión') }
    setLoading(false)
  }

  const resetPos = () => {
    setCart([]); setClienteNombre('Consumidor Final'); setClienteNit('CF'); setClienteCorreo('')
    setMetodoPago('efectivo'); setMontoRecibido(''); setDescPct(0); setCodigoDesc('')
    setShowCobro(false); setLastVenta(null); setLastFel(null); setNitStatus('idle')
    searchRef.current?.focus()
  }

  // ─── Ticket Térmico ──────────────────────────────────────────────────────
  const printTicket = () => {
    if (!lastVenta || !config) return
    const html = buildTicketHTML({
      empresaNombre:   config.empresa_nombre,
      empresaNit:      config.empresa_nit,
      empresaDireccion: config.empresa_direccion,
      empresaTelefono: config.empresa_telefono,
      empresaLogoUrl:  'https://websoft-solutions.vercel.app/logo.png',
      mostrarLogo:     config.ticket_mostrar_logo !== 'false',
      ticketMensaje:   config.ticket_mensaje,
      numero:          lastVenta.numero,
      fecha:           lastVenta.fecha,
      clienteNombre:   lastVenta.clienteNombre,
      clienteNit:      lastVenta.clienteNit,
      cajero:          lastVenta.usuarioNombre || 'Cajero',
      // FEL
      felUuid:          lastFel?.uuid,
      felSerie:         lastFel?.serie,
      felNumero:        lastFel?.numero,
      felCertificacion: lastFel?.fechaCertificacion,
      isSandbox:        lastFel?.sandbox,
      items: (lastVenta.items || []).map((it: any) => ({
        nombre:         it.nombre,
        cantidad:       it.cantidad,
        precioUnitario: it.precioUnitario,
        descuento:      it.descuento || 0,
        subtotal:       it.subtotal,
      })),
      subtotal:       lastVenta.subtotal,
      descuento:      lastVenta.descuento,
      impuesto:       lastVenta.impuesto,
      total:          lastVenta.total,
      metodoPago:     lastVenta.metodoPago,
      montoRecibido:  lastVenta.montoRecibido,
      cambio:         lastVenta.cambio,
      ivaPct,
    })
    printTicketWindow(html)
  }

  const tabStyle = (t: string) => ({
    padding: '7px 14px', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 12,
    fontWeight: 600, fontFamily: 'inherit',
    background: tab === t ? '#2563eb' : '#f8fafc',
    color: tab === t ? '#fff' : '#64748b',
    transition: 'all .15s',
  })

  const cotFiltradas = cotizaciones.filter(c =>
    !buscarCot || c.numero.toLowerCase().includes(buscarCot.toLowerCase()) || c.clienteNombre.toLowerCase().includes(buscarCot.toLowerCase())
  )

  const felActivo = config?.fel_activo === 'true'
  const emailActivo = config?.email_factura_activo === 'true'

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', height: 'calc(100vh - 56px)', overflow: 'hidden' }}>

      {/* ─── LEFT: Product Selection ─── */}
      <div style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden', borderRight: '1px solid #e2e8f0', background: '#fff' }}>
        <div style={{ padding: '10px 12px', borderBottom: '1px solid #e2e8f0', display: 'flex', gap: 6, background: '#f8fafc', alignItems: 'center' }}>
          <button style={tabStyle('inventario')} onClick={() => setTab('inventario')}>Inventario</button>
          <button style={tabStyle('cotizacion')} onClick={() => setTab('cotizacion')}>Desde Cotización</button>
          <button style={tabStyle('libre')} onClick={() => setTab('libre')}>Línea Libre</button>
          {felActivo && (
            <span style={{ marginLeft: 'auto', fontSize: 10, fontWeight: 700, background: '#f0fdf4', color: '#166534', border: '1px solid #bbf7d0', padding: '3px 8px', borderRadius: 10 }}>
              FEL activo
            </span>
          )}
        </div>

        {/* INVENTARIO */}
        {tab === 'inventario' && (
          <>
            <div style={{ padding: '10px 12px', borderBottom: '1px solid #e2e8f0' }}>
              <input ref={searchRef} className="input" placeholder="Buscar o escanear código de barras..." value={buscar} onChange={e => setBuscar(e.target.value)} autoFocus />
            </div>
            <div style={{ flex: 1, overflowY: 'auto', padding: 10, display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(130px,1fr))', gap: 8, alignContent: 'start' }}>
              {productos.map(p => (
                <div key={p.id} onClick={() => addInventario(p)} style={{ border: '1.5px solid #e2e8f0', borderRadius: 10, padding: '8px', textAlign: 'center', cursor: p.stock <= 0 ? 'not-allowed' : 'pointer', opacity: p.stock <= 0 ? .45 : 1, background: '#fff', transition: 'all .15s' }}>
                  {p.imagenUrl
                    ? <img src={p.imagenUrl} alt={p.nombre} style={{ width: '100%', height: 70, objectFit: 'contain', borderRadius: 6, marginBottom: 4 }} />
                    : <div style={{ width: '100%', height: 60, background: '#f8fafc', borderRadius: 6, marginBottom: 4, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24 }}></div>}
                  <div style={{ fontSize: 9, color: '#94a3b8', marginBottom: 1 }}>{p.codigo}</div>
                  <div style={{ fontSize: 11, fontWeight: 600, color: '#0f172a', marginBottom: 3, lineHeight: 1.3 }}>{p.nombre}</div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: '#2563eb' }}>{fmt(p.precio)}</div>
                  <div style={{ fontSize: 9, color: p.stock <= 5 ? '#d97706' : '#64748b', marginTop: 2 }}>{p.stock <= 0 ? 'Sin stock' : `${p.stock} uds`}</div>
                </div>
              ))}
              {productos.length === 0 && <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: 40, color: '#94a3b8' }}>Sin productos</div>}
            </div>
          </>
        )}

        {/* COTIZACION */}
        {tab === 'cotizacion' && (
          <div style={{ flex: 1, overflowY: 'auto', padding: 14 }}>
            <p style={{ fontSize: 12, color: '#64748b', marginBottom: 12 }}>Selecciona una cotización para cargarla al carrito.</p>
            <input className="input" placeholder="Buscar cotización..." value={buscarCot} onChange={e => setBuscarCot(e.target.value)} style={{ marginBottom: 12 }} />
            {cotFiltradas.length === 0
              ? <div style={{ textAlign: 'center', padding: 40, color: '#94a3b8' }}>Sin cotizaciones aceptadas o pendientes</div>
              : cotFiltradas.map(c => (
                <div key={c.id} onClick={() => cargarCotizacion(c)} style={{ border: '1.5px solid #e2e8f0', borderRadius: 10, padding: '12px 16px', marginBottom: 8, cursor: 'pointer', transition: 'all .15s', background: '#fff' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                    <span style={{ fontWeight: 700, color: '#2563eb', fontSize: 14 }}>{c.numero}</span>
                    <span style={{ fontWeight: 700, color: '#0f172a', fontSize: 14 }}>{fmt(c.total)}</span>
                  </div>
                  <div style={{ fontSize: 12, color: '#475569', marginBottom: 4 }}>{c.clienteNombre}</div>
                  <div style={{ fontSize: 11, color: '#94a3b8' }}>{c.items?.length || 0} items</div>
                </div>
              ))}
          </div>
        )}

        {/* LINEA LIBRE */}
        {tab === 'libre' && (
          <div style={{ flex: 1, padding: 14, display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 8, padding: 12, fontSize: 12, color: '#78350f' }}>
              Agrega servicios o productos con precio especial. No descuentan stock.
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', marginBottom: 4 }}>Código (opcional)</label>
              <input className="input" value={libreForm.codigo} onChange={e => setLibreForm(p => ({ ...p, codigo: e.target.value }))} placeholder="INST-001" />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', marginBottom: 4 }}>Descripción *</label>
              <input className="input" value={libreForm.nombre} onChange={e => setLibreForm(p => ({ ...p, nombre: e.target.value }))} placeholder="Ej: Instalación CCTV, Servicio técnico..." />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', marginBottom: 4 }}>Precio (Q) *</label>
                <input className="input" type="number" min="0" value={libreForm.precio} onChange={e => setLibreForm(p => ({ ...p, precio: e.target.value }))} placeholder="0.00" style={{ fontSize: 16, fontWeight: 700 }} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', marginBottom: 4 }}>Cantidad</label>
                <input className="input" type="number" min="1" value={libreForm.cantidad} onChange={e => setLibreForm(p => ({ ...p, cantidad: e.target.value }))} />
              </div>
            </div>
            <button className="btn-primary" onClick={addLibre} style={{ width: '100%', padding: 13, fontSize: 15 }}>
              + Agregar al carrito
            </button>
          </div>
        )}
      </div>

      {/* ─── RIGHT: Cart ─── */}
      <div style={{ display: 'flex', flexDirection: 'column', background: '#fff', overflow: 'hidden' }}>
        <div style={{ padding: '10px 14px', borderBottom: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontWeight: 700, fontSize: 14, color: '#0f172a' }}>Carrito ({cart.length})</span>
          <button className="btn-ghost btn-sm" onClick={() => setCart([])}>Limpiar</button>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: 8 }}>
          {cart.length === 0
            ? <div style={{ textAlign: 'center', padding: '30px 10px', color: '#94a3b8', fontSize: 13 }}>Agrega productos o carga una cotización</div>
            : cart.map((item, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: 8, border: '1px solid #e2e8f0', borderLeft: `3px solid ${item.tipo === 'libre' ? '#d97706' : '#2563eb'}`, borderRadius: 8, marginBottom: 6, background: '#fafbfc' }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 11, color: item.tipo === 'libre' ? '#d97706' : '#2563eb', fontWeight: 700, textTransform: 'uppercase', marginBottom: 1 }}>
                    {item.tipo === 'libre' ? 'Libre' : 'Stock'}
                  </div>
                  <div style={{ fontSize: 12, fontWeight: 600, color: '#0f172a', lineHeight: 1.2 }}>{item.nombre}</div>
                  {item.tipo === 'libre'
                    ? <input style={{ border: '1px solid #e2e8f0', borderRadius: 4, padding: '2px 6px', fontSize: 11, width: 80, marginTop: 2 }} type="number" value={item.precioUnitario} onChange={e => changePrice(i, e.target.value)} />
                    : <div style={{ fontSize: 10, color: '#64748b' }}>{fmt(item.precioUnitario)}/u</div>}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                  <button onClick={() => changeQty(i, -1)} style={{ width: 22, height: 22, borderRadius: 5, border: '1.5px solid #e2e8f0', background: '#fff', cursor: 'pointer', fontSize: 14, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>-</button>
                  <span style={{ width: 28, textAlign: 'center', fontSize: 13, fontWeight: 700 }}>{item.cantidad}</span>
                  <button onClick={() => changeQty(i, 1)} style={{ width: 22, height: 22, borderRadius: 5, border: '1.5px solid #e2e8f0', background: '#fff', cursor: 'pointer', fontSize: 14, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>+</button>
                </div>
                <span style={{ fontSize: 13, fontWeight: 700, color: '#0f172a', minWidth: 60, textAlign: 'right' }}>{fmt(item.subtotal)}</span>
                <button onClick={() => removeItem(i)} style={{ background: 'none', border: 'none', color: '#cbd5e1', cursor: 'pointer', fontSize: 16, padding: '2px 4px' }}>×</button>
              </div>
            ))}
        </div>

        {/* Totals */}
        <div style={{ padding: '10px 14px', borderTop: '1px solid #e2e8f0', background: '#f8fafc' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '2px 0', fontSize: 12, color: '#64748b' }}><span>Subtotal</span><span>{fmt(subtotal)}</span></div>
          {descPct > 0 && <div style={{ display: 'flex', justifyContent: 'space-between', padding: '2px 0', fontSize: 12, color: '#dc2626' }}><span>Desc. ({descPct}%)</span><span>-{fmt(descuento)}</span></div>}
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '2px 0', fontSize: 12, color: '#64748b' }}><span>IVA ({ivaPct}%)</span><span>{fmt(impuesto)}</span></div>
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '7px 0 0', borderTop: '1px solid #e2e8f0', marginTop: 5, fontSize: 17, fontWeight: 800, color: '#0f172a' }}>
            <span>TOTAL</span><span style={{ color: '#2563eb' }}>{fmt(total)}</span>
          </div>
        </div>

        {/* Actions */}
        <div style={{ padding: '10px 14px', display: 'flex', flexDirection: 'column', gap: 7, borderTop: '1px solid #e2e8f0' }}>
          {/* NIT */}
          <div>
            <label style={{ display: 'block', fontSize: 10, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', marginBottom: 3 }}>NIT del cliente</label>
            <div style={{ display: 'flex', gap: 6 }}>
              <input className="input" value={clienteNit} onChange={e => buscarNit(e.target.value)} onKeyDown={e => e.key === 'Enter' && ejecutarBusquedaNit()} placeholder="CF" style={{ padding: '6px 8px', fontSize: 12, flex: 1, borderColor: nitStatus === 'found' ? '#16a34a' : nitStatus === 'notfound' ? '#dc2626' : undefined }} />
              <button onClick={ejecutarBusquedaNit} style={{ background: '#2563eb', color: '#fff', border: 'none', borderRadius: 8, padding: '6px 10px', fontSize: 11, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', whiteSpace: 'nowrap' }}>Buscar</button>
            </div>
            {nitStatus === 'found' && (
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 3 }}>
                <div style={{ fontSize: 10, color: '#16a34a', fontWeight: 600 }}>{clienteNombre}</div>
                <button onClick={() => setShowRegCliente(true)} style={{ fontSize: 10, fontWeight: 700, color: '#2563eb', background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: 6, padding: '2px 8px', cursor: 'pointer', fontFamily: 'inherit' }}>
                  {clienteTieneCorreo ? 'Actualizar' : '+ Agregar correo'}
                </button>
              </div>
            )}
            {nitStatus === 'notfound' && (
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 3 }}>
                <span style={{ fontSize: 10, color: '#dc2626', fontWeight: 600 }}>NIT no registrado</span>
                <button onClick={() => setShowRegCliente(true)} style={{ fontSize: 10, fontWeight: 700, color: '#2563eb', background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: 6, padding: '2px 8px', cursor: 'pointer', fontFamily: 'inherit' }}>+ Registrar</button>
              </div>
            )}
          </div>

          {/* Nombre */}
          <div>
            <label style={{ display: 'block', fontSize: 10, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', marginBottom: 3 }}>Nombre</label>
            <input className="input" value={clienteNombre} onChange={e => setClienteNombre(e.target.value)} placeholder="Consumidor Final" style={{ padding: '6px 8px', fontSize: 12 }} />
          </div>

          {/* Correo — visible si email o FEL activos */}
          {(emailActivo || felActivo) && (
            <div>
              <label style={{ display: 'block', fontSize: 10, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', marginBottom: 3 }}>
                Correo cliente {emailActivo ? '(factura por email)' : '(DTE)'}
              </label>
              <input
                className="input"
                type="email"
                value={clienteCorreo}
                onChange={e => setClienteCorreo(e.target.value)}
                placeholder="cliente@correo.com (opcional)"
                style={{ padding: '6px 8px', fontSize: 12 }}
              />
            </div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 7 }}>
            <div>
              <label style={{ display: 'block', fontSize: 10, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', marginBottom: 3 }}>Método pago</label>
              <select className="input" value={metodoPago} onChange={e => setMetodoPago(e.target.value)} style={{ padding: '6px 8px', fontSize: 12 }}>
                <option value="efectivo">Efectivo</option>
                <option value="tarjeta">Tarjeta</option>
                <option value="transferencia">Transferencia</option>
              </select>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 10, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', marginBottom: 3 }}>Monto recibido</label>
              <input className="input" type="number" value={montoRecibido} onChange={e => setMontoRecibido(e.target.value)} placeholder={fmt(total)} style={{ padding: '6px 8px', fontSize: 12 }} />
            </div>
          </div>

          {montoRecibido && parseFloat(montoRecibido) >= total && (
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, fontWeight: 700, color: '#16a34a', padding: '2px 0' }}>
              <span>Cambio:</span><span>{fmt(cambio)}</span>
            </div>
          )}

          <div style={{ display: 'flex', gap: 7 }}>
            <input className="input" placeholder="Código descuento" value={codigoDesc} onChange={e => setCodigoDesc(e.target.value)} style={{ padding: '6px 8px', fontSize: 12, flex: 1 }} />
            <button className="btn-ghost btn-sm" onClick={validarDescuento}>Aplicar</button>
          </div>

          <button className="btn-success" style={{ width: '100%', padding: 13, fontSize: 15 }} onClick={cobrar} disabled={loading || cart.length === 0}>
            {loading ? 'Procesando...' : `Cobrar ${fmt(total)}`}
          </button>
        </div>
      </div>

      {/* Modal Registrar / Actualizar Cliente */}
      {showRegCliente && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: '#fff', borderRadius: 14, padding: 24, width: 380, boxShadow: '0 20px 60px rgba(0,0,0,.2)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
              <div style={{ fontSize: 15, fontWeight: 700, color: '#0f172a' }}>{clienteId ? 'Actualizar Cliente' : 'Registrar Cliente'}</div>
              <button onClick={() => setShowRegCliente(false)} style={{ background: 'none', border: 'none', fontSize: 20, cursor: 'pointer', color: '#94a3b8' }}>×</button>
            </div>
            <div style={{ marginBottom: 12, padding: '8px 12px', background: '#f8fafc', borderRadius: 8, fontSize: 12, color: '#64748b', display: 'flex', justifyContent: 'space-between' }}>
              <span>NIT: <strong style={{ color: '#2563eb' }}>{clienteNit}</strong></span>
              {clienteId && <span style={{ fontSize: 10, background: '#dbeafe', color: '#1e40af', padding: '2px 8px', borderRadius: 8, fontWeight: 700 }}>Cliente existente</span>}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 18 }}>
              {([{ label: 'Nombre *', key: 'nombre', placeholder: 'Nombre completo', type: 'text' }, { label: 'Teléfono', key: 'telefono', placeholder: '5555-5555', type: 'text' }, { label: 'Correo electrónico', key: 'correo', placeholder: 'cliente@correo.com', type: 'email' }, { label: 'Dirección', key: 'direccion', placeholder: 'Dirección', type: 'text' }] as any[]).map((f: any) => (
                <div key={f.key}>
                  <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', marginBottom: 4 }}>{f.label}</label>
                  <input className="input" type={f.type} value={(regForm as any)[f.key]} onChange={e => setRegForm(p => ({ ...p, [f.key]: e.target.value }))} placeholder={f.placeholder} />
                </div>
              ))}
            </div>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <button className="btn-ghost btn-sm" onClick={() => setShowRegCliente(false)}>Cancelar</button>
              <button className="btn-primary btn-sm" onClick={registrarCliente}>{clienteId ? 'Actualizar' : 'Guardar Cliente'}</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Cobro exitoso */}
      {showCobro && lastVenta && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.5)', zIndex: 999, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: '#fff', borderRadius: 14, padding: 28, width: 400, boxShadow: '0 30px 80px rgba(0,0,0,.2)', textAlign: 'center' }}>
            <div style={{ width: 60, height: 60, background: '#f0fdf4', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', fontSize: 28 }}></div>
            <h3 style={{ fontSize: 18, fontWeight: 800, color: '#0f172a', marginBottom: 8 }}>Venta Registrada</h3>
            <p style={{ fontSize: 14, color: '#64748b', marginBottom: 4 }}>Factura <strong style={{ color: '#2563eb' }}>{lastVenta.numero}</strong></p>
            <p style={{ fontSize: 22, fontWeight: 800, color: '#0f172a', marginBottom: 10 }}>{fmt(lastVenta.total)}</p>
            {lastVenta.cambio > 0 && <p style={{ fontSize: 15, color: '#16a34a', marginBottom: 10 }}>Cambio: <strong>{fmt(lastVenta.cambio)}</strong></p>}

            {/* Estado FEL */}
            {lastFel && (
              <div style={{ background: lastFel.ok ? '#f0fdf4' : '#fef2f2', border: `1px solid ${lastFel.ok ? '#bbf7d0' : '#fecaca'}`, borderRadius: 8, padding: '8px 12px', marginBottom: 12, fontSize: 11 }}>
                {lastFel.ok ? (
                  <>
                    <div style={{ fontWeight: 700, color: lastFel.sandbox ? '#d97706' : '#166534', marginBottom: 2 }}>
                      {lastFel.sandbox ? 'FEL Sandbox' : 'DTE Certificado'}
                    </div>
                    {lastFel.uuid && <div style={{ fontFamily: 'monospace', fontSize: 10, color: '#64748b', wordBreak: 'break-all' }}>{lastFel.uuid}</div>}
                    {lastFel.serie && <div style={{ fontSize: 10, color: '#64748b', marginTop: 2 }}>Serie {lastFel.serie} — No. {lastFel.numero}</div>}
                  </>
                ) : (
                  <div style={{ fontWeight: 700, color: '#dc2626' }}>FEL error: {lastFel.error}</div>
                )}
              </div>
            )}

            <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
              <button className="btn-ghost" onClick={printTicket}>Imprimir Ticket</button>
              <button className="btn-primary" onClick={resetPos}>Nueva Venta</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

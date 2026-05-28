'use client'
import { useState, useEffect, useRef, useCallback } from 'react'
import { toast } from 'sonner'
import { fmt } from '@/lib/utils'

interface Producto {
  id: number
  codigo: string | null
  nombre: string
  precio: number
  stock: number
  categoria: string
}

interface CartItem {
  productoId: number
  codigo: string
  nombre: string
  cantidad: number
  precioUnitario: number
  stock: number
  descuento: number
  subtotal: number
}

interface Config {
  empresa_nombre: string
  iva_porcentaje: string
  moneda_simbolo: string
  ticket_mensaje: string
  empresa_nit: string
  empresa_direccion: string
  empresa_telefono: string
}

interface VentaResult {
  id: number
  numero: string
  fecha: string
  clienteNombre: string
  clienteNit: string
  subtotal: number
  descuento: number
  impuesto: number
  total: number
  metodoPago: string
  montoRecibido: number
  cambio: number
  items: CartItem[]
}

export default function POSPage() {
  const [productos, setProductos] = useState<Producto[]>([])
  const [cart, setCart] = useState<CartItem[]>([])
  const [buscar, setBuscar] = useState('')
  const [config, setConfig] = useState<Config | null>(null)
  const [clienteNombre, setClienteNombre] = useState('Consumidor Final')
  const [clienteNit, setClienteNit] = useState('CF')
  const [metodoPago, setMetodoPago] = useState('efectivo')
  const [montoRecibido, setMontoRecibido] = useState('')
  const [descPct, setDescPct] = useState(0)
  const [codigoDesc, setCodigoDesc] = useState('')
  const [loading, setLoading] = useState(false)
  const [showCobro, setShowCobro] = useState(false)
  const [lastVenta, setLastVenta] = useState<VentaResult | null>(null)
  const searchRef = useRef<HTMLInputElement>(null)

  const loadProductos = useCallback(async () => {
    const p = new URLSearchParams({ buscar })
    const res = await fetch(`/api/productos?${p}`)
    const data = await res.json()
    setProductos(data)
  }, [buscar])

  useEffect(() => { loadProductos() }, [loadProductos])
  useEffect(() => {
    fetch('/api/config').then(r => r.json()).then(setConfig)
  }, [])

  const addToCart = (prod: Producto) => {
    if (prod.stock <= 0) { toast.error('Sin stock'); return }
    setCart(prev => {
      const ex = prev.find(x => x.productoId === prod.id)
      if (ex) {
        if (ex.cantidad >= ex.stock) { toast.warning('Stock maximo alcanzado'); return prev }
        return prev.map(x => x.productoId === prod.id
          ? { ...x, cantidad: x.cantidad + 1, subtotal: (x.cantidad + 1) * x.precioUnitario }
          : x)
      }
      return [...prev, {
        productoId: prod.id,
        codigo: prod.codigo || '',
        nombre: prod.nombre,
        cantidad: 1,
        precioUnitario: prod.precio,
        stock: prod.stock,
        descuento: 0,
        subtotal: prod.precio,
      }]
    })
  }

  const removeItem = (i: number) => setCart(prev => prev.filter((_, idx) => idx !== i))

  const changeQty = (i: number, d: number) => setCart(prev => prev.map((item, idx) => {
    if (idx !== i) return item
    const q = Math.max(1, Math.min(item.stock, item.cantidad + d))
    return { ...item, cantidad: q, subtotal: q * item.precioUnitario }
  }))

  const subtotal = cart.reduce((s, x) => s + x.subtotal, 0)
  const descuento = subtotal * descPct / 100
  const ivaPct = parseFloat(config?.iva_porcentaje || '12')
  const impuesto = (subtotal - descuento) * ivaPct / 100
  const total = subtotal - descuento + impuesto
  const cambio = Math.max(0, parseFloat(montoRecibido || '0') - total)

  const validarDescuento = async () => {
    if (!codigoDesc.trim()) return
    const res = await fetch('/api/descuentos/validar', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ codigo: codigoDesc, total: subtotal }),
    })
    const data = await res.json()
    if (data.ok) {
      setDescPct(data.porcentaje)
      toast.success(`Descuento ${data.porcentaje}% aplicado`)
    } else {
      toast.error(data.error || 'Codigo invalido')
    }
  }

  const cobrar = async () => {
    if (cart.length === 0) { toast.error('Carrito vacio'); return }
    if (metodoPago === 'efectivo' && parseFloat(montoRecibido || '0') < total) {
      toast.error('Monto insuficiente'); return
    }
    setLoading(true)
    try {
      const res = await fetch('/api/ventas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clienteNombre,
          clienteNit,
          items: cart,
          subtotal,
          descuento,
          impuesto,
          total,
          metodoPago,
          montoRecibido: parseFloat(montoRecibido || '0'),
          cambio,
        }),
      })
      const data = await res.json()
      if (data.ok) {
        setLastVenta(data.venta)
        setShowCobro(true)
        toast.success(`Venta #${data.venta.numero} registrada`)
        loadProductos()
      } else {
        toast.error(data.error || 'Error al registrar venta')
      }
    } catch {
      toast.error('Error de conexion')
    }
    setLoading(false)
  }

  const resetPos = () => {
    setCart([])
    setClienteNombre('Consumidor Final')
    setClienteNit('CF')
    setMetodoPago('efectivo')
    setMontoRecibido('')
    setDescPct(0)
    setCodigoDesc('')
    setShowCobro(false)
    setLastVenta(null)
    searchRef.current?.focus()
  }

  const printTicket = () => {
    if (!lastVenta || !config) return
    const w = window.open('', '_blank', 'width=400,height=700')
    if (!w) return
    const rows = (lastVenta.items || []).map((it: CartItem) =>
      `<tr><td>${it.nombre}</td><td style="text-align:center">${it.cantidad}</td><td style="text-align:right">${fmt(it.precioUnitario)}</td><td style="text-align:right">${fmt(it.subtotal)}</td></tr>`
    ).join('')
    w.document.write(`<!DOCTYPE html><html><head><meta charset="UTF-8"><style>
      body{font-family:'Courier New',monospace;font-size:12px;width:300px;margin:0 auto;padding:10px}
      h2{font-size:14px;text-align:center;margin:0}p{margin:2px 0;text-align:center}
      hr{border:none;border-top:1px dashed #000;margin:6px 0}
      table{width:100%;font-size:11px;border-collapse:collapse}
      th{text-align:left;font-size:10px;border-bottom:1px solid #000}
      td{padding:2px 0}.total-row{font-weight:bold;font-size:13px}
    </style></head><body>
      <h2>${config.empresa_nombre}</h2>
      <p>NIT: ${config.empresa_nit}</p>
      <p>${config.empresa_direccion || ''}</p>
      <hr>
      <p>Factura: <b>${lastVenta.numero}</b></p>
      <p>${new Date(lastVenta.fecha).toLocaleString('es-GT')}</p>
      <p>Cliente: ${lastVenta.clienteNombre}</p>
      <hr>
      <table><thead><tr><th>Producto</th><th>Cant</th><th>P/U</th><th>Total</th></tr></thead>
      <tbody>${rows}</tbody></table>
      <hr>
      <table><tbody>
        <tr><td>Subtotal</td><td style="text-align:right">${fmt(lastVenta.subtotal)}</td></tr>
        ${lastVenta.descuento > 0 ? `<tr><td>Descuento</td><td style="text-align:right">-${fmt(lastVenta.descuento)}</td></tr>` : ''}
        <tr><td>IVA (${ivaPct}%)</td><td style="text-align:right">${fmt(lastVenta.impuesto)}</td></tr>
        <tr class="total-row"><td>TOTAL</td><td style="text-align:right">${fmt(lastVenta.total)}</td></tr>
        <tr><td>Pago</td><td style="text-align:right">${fmt(lastVenta.montoRecibido)}</td></tr>
        <tr><td>Cambio</td><td style="text-align:right">${fmt(lastVenta.cambio)}</td></tr>
      </tbody></table>
      <hr><p>${config.ticket_mensaje}</p>
    </body></html>`)
    w.document.close()
    w.print()
  }

  const totalesRows: Array<[string, string]> = [
    ['Subtotal', fmt(subtotal)],
    [`IVA (${ivaPct}%)`, fmt(impuesto)],
  ]
  if (descPct > 0) {
    totalesRows.splice(1, 0, [`Descuento (${descPct}%)`, `-${fmt(descuento)}`])
  }

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', height: 'calc(100vh - 54px)', overflow: 'hidden' }}>
      {/* LEFT */}
      <div style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden', borderRight: '1px solid #e2eaf4', background: '#ffffff' }}>
        <div style={{ padding: '10px 12px', borderBottom: '1px solid #f1f5f9' }}>
          <input
            ref={searchRef}
            className="input"
            placeholder="Buscar producto o codigo de barras..."
            value={buscar}
            onChange={e => setBuscar(e.target.value)}
            autoFocus
          />
        </div>
        <div style={{ flex: 1, overflowY: 'auto', padding: 10, display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(130px,1fr))', gap: 8, alignContent: 'start' }}>
          {productos.map(p => (
            <div
              key={p.id}
              onClick={() => addToCart(p)}
              style={{
                border: '1.5px solid #e2eaf4', borderRadius: 10, padding: '10px 8px',
                textAlign: 'center', cursor: p.stock <= 0 ? 'not-allowed' : 'pointer',
                opacity: p.stock <= 0 ? .45 : 1, background: '#ffffff',
              }}
            >
              <div style={{ fontSize: 10, color: '#64748b', marginBottom: 2 }}>{p.codigo}</div>
              <div style={{ fontSize: 12, fontWeight: 600, color: '#0f172a', marginBottom: 4, lineHeight: 1.3 }}>{p.nombre}</div>
              <div style={{ fontSize: 15, fontWeight: 700, color: '#2563eb' }}>{fmt(p.precio)}</div>
              <div style={{ fontSize: 10, color: p.stock <= 5 ? '#f59e0b' : '#4a5568', marginTop: 3 }}>
                {p.stock <= 0 ? 'Sin stock' : `${p.stock} en stock`}
              </div>
            </div>
          ))}
          {productos.length === 0 && (
            <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: 40, color: '#475569', fontSize: 13 }}>
              No se encontraron productos
            </div>
          )}
        </div>
      </div>

      {/* RIGHT */}
      <div style={{ display: 'flex', flexDirection: 'column', background: '#ffffff', overflow: 'hidden' }}>
        <div style={{ padding: '10px 14px', borderBottom: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontWeight: 700, fontSize: 14, color: '#0f172a' }}>Carrito ({cart.length})</span>
          <button className="btn-ghost btn-sm" onClick={() => setCart([])}>Limpiar</button>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: 8 }}>
          {cart.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '30px 10px', color: '#475569', fontSize: 13 }}>
              Agrega productos al carrito
            </div>
          ) : cart.map((item, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: 8, border: '1px solid #e2e8f0', borderRadius: 8, marginBottom: 6, background: '#ffffff' }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: '#0f172a', lineHeight: 1.2 }}>{item.nombre}</div>
                <div style={{ fontSize: 10, color: '#64748b' }}>{fmt(item.precioUnitario)}/u</div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                <button onClick={() => changeQty(i, -1)} style={{ width: 22, height: 22, borderRadius: 5, border: '1.5px solid #e2eaf4', background: '#ffffff', cursor: 'pointer', fontSize: 14, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>-</button>
                <span style={{ width: 28, textAlign: 'center', fontSize: 13, fontWeight: 700 }}>{item.cantidad}</span>
                <button onClick={() => changeQty(i, 1)} style={{ width: 22, height: 22, borderRadius: 5, border: '1.5px solid #e2eaf4', background: '#ffffff', cursor: 'pointer', fontSize: 14, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>+</button>
              </div>
              <span style={{ fontSize: 13, fontWeight: 700, color: '#0f172a', minWidth: 60, textAlign: 'right' }}>{fmt(item.subtotal)}</span>
              <button onClick={() => removeItem(i)} style={{ background: 'none', border: 'none', color: '#c5d5e8', cursor: 'pointer', fontSize: 16, padding: '2px 4px' }}>x</button>
            </div>
          ))}
        </div>

        {/* Totals */}
        <div style={{ padding: '10px 14px', borderTop: '1px solid #f1f5f9', background: '#f8fafc' }}>
          {totalesRows.map(([l, v]) => (
            <div key={l} style={{ display: 'flex', justifyContent: 'space-between', padding: '2px 0', fontSize: 12, color: '#64748b' }}>
              <span>{l}</span><span>{v}</span>
            </div>
          ))}
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '7px 0 0', borderTop: '1px solid #f1f5f9', marginTop: 5, fontSize: 17, fontWeight: 700, color: '#0f172a' }}>
            <span>TOTAL</span><span>{fmt(total)}</span>
          </div>
        </div>

        {/* Actions */}
        <div style={{ padding: '10px 14px', display: 'flex', flexDirection: 'column', gap: 7, borderTop: '1px solid #f1f5f9' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 7 }}>
            <div>
              <label style={{ display: 'block', fontSize: 10, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '.5px', marginBottom: 3 }}>NIT</label>
              <input className="input" value={clienteNit} onChange={e => setClienteNit(e.target.value)} placeholder="CF" style={{ padding: '6px 8px', fontSize: 12 }} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 10, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '.5px', marginBottom: 3 }}>Nombre</label>
              <input className="input" value={clienteNombre} onChange={e => setClienteNombre(e.target.value)} placeholder="Consumidor Final" style={{ padding: '6px 8px', fontSize: 12 }} />
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 7 }}>
            <div>
              <label style={{ display: 'block', fontSize: 10, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '.5px', marginBottom: 3 }}>Metodo pago</label>
              <select className="input" value={metodoPago} onChange={e => setMetodoPago(e.target.value)} style={{ padding: '6px 8px', fontSize: 12 }}>
                <option value="efectivo">Efectivo</option>
                <option value="tarjeta">Tarjeta</option>
                <option value="transferencia">Transferencia</option>
              </select>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 10, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '.5px', marginBottom: 3 }}>Monto recibido</label>
              <input className="input" type="number" value={montoRecibido} onChange={e => setMontoRecibido(e.target.value)} placeholder={fmt(total)} style={{ padding: '6px 8px', fontSize: 12 }} />
            </div>
          </div>
          {montoRecibido && parseFloat(montoRecibido) >= total && (
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, fontWeight: 700, color: '#16a34a', padding: '4px 0' }}>
              <span>Cambio:</span><span>{fmt(cambio)}</span>
            </div>
          )}
          <div style={{ display: 'flex', gap: 7 }}>
            <input className="input" placeholder="Codigo descuento" value={codigoDesc} onChange={e => setCodigoDesc(e.target.value)} style={{ padding: '6px 8px', fontSize: 12, flex: 1 }} />
            <button className="btn-ghost btn-sm" onClick={validarDescuento}>Aplicar</button>
          </div>
          <button
            className="btn-success"
            style={{ width: '100%', padding: 13, fontSize: 15 }}
            onClick={cobrar}
            disabled={loading || cart.length === 0}
          >
            {loading ? 'Procesando...' : `Cobrar ${fmt(total)}`}
          </button>
        </div>
      </div>

      {/* Modal cobro exitoso */}
      {showCobro && lastVenta && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.5)', zIndex: 999, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: '#ffffff', borderRadius: 14, padding: 28, width: 380, boxShadow: '0 30px 80px rgba(0,0,0,.2)', textAlign: 'center' }}>
            <div style={{ width: 60, height: 60, background: '#dcfce7', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
              <svg width="28" height="28" fill="none" stroke="#22c55e" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg>
            </div>
            <h3 style={{ fontSize: 18, fontWeight: 700, color: '#0f172a', marginBottom: 8 }}>Venta Registrada</h3>
            <p style={{ fontSize: 14, color: '#64748b', marginBottom: 4 }}>Factura <strong style={{ color: '#2563eb' }}>{lastVenta.numero}</strong></p>
            <p style={{ fontSize: 22, fontWeight: 700, color: '#0f172a', marginBottom: 16 }}>{fmt(lastVenta.total)}</p>
            {lastVenta.cambio > 0 && (
              <p style={{ fontSize: 15, color: '#16a34a', marginBottom: 16 }}>Cambio: <strong>{fmt(lastVenta.cambio)}</strong></p>
            )}
            <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
              <button className="btn-ghost" onClick={printTicket}>Imprimir</button>
              <button className="btn-primary" onClick={resetPos}>Nueva Venta</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

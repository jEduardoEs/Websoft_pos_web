'use client'
import { useState, useEffect } from 'react'
import { toast } from 'sonner'
import { fmt, fmtDate } from '@/lib/utils'

interface Compra {
  id: number; fecha: string; total: number; notas: string | null; estado: string
  proveedorId: number | null; proveedor: { nombre: string } | null
  numeroFactura: string | null; serieFactura: string | null; facturaUrl: string | null
  usuarioNombre: string | null; items: CompraItem[]
}

interface CompraItem {
  id: number; productoId: number | null; nombre: string
  cantidad: number; precioUnitario: number; subtotal: number
}

interface Producto { id: number; codigo: string | null; nombre: string; precio: number; costo: number }
interface Proveedor { id: number; nombre: string }

export default function ComprasPage() {
  const [compras, setCompras] = useState<Compra[]>([])
  const [proveedores, setProveedores] = useState<Proveedor[]>([])
  const [productos, setProductos] = useState<Producto[]>([])
  const [showModal, setShowModal] = useState(false)
  const [showDetalle, setShowDetalle] = useState(false)
  const [selected, setSelected] = useState<Compra | null>(null)
  const [loading, setLoading] = useState(false)
  const [xmlParsed, setXmlParsed] = useState<any>(null)
  const [xmlLoading, setXmlLoading] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [buscarProd, setBuscarProd] = useState('')

  const [form, setForm] = useState({
    proveedorId: '', fecha: new Date().toISOString().slice(0, 10),
    numeroFactura: '', serieFactura: '', facturaUrl: '', notas: '',
  })
  const [items, setItems] = useState<{ productoId: string; nombre: string; cantidad: string; precioUnitario: string; subtotal: number }[]>([])

  const load = async () => {
    const [c, p, pr] = await Promise.all([
      fetch('/api/compras').then(r => r.json()),
      fetch('/api/proveedores').then(r => r.json()),
      fetch('/api/productos').then(r => r.json()),
    ])
    setCompras(Array.isArray(c) ? c : [])
    setProveedores(Array.isArray(p) ? p : [])
    setProductos(Array.isArray(pr) ? pr : [])
  }

  useEffect(() => { load() }, [])

  const setF = (k: string, v: string) => setForm(p => ({ ...p, [k]: v }))

  const addItem = () => setItems(p => [...p, { productoId: '', nombre: '', cantidad: '1', precioUnitario: '', subtotal: 0 }])

  const selProducto = (i: number, prodId: string) => {
    const prod = productos.find(p => p.id === Number(prodId))
    setItems(prev => prev.map((item, idx) => {
      if (idx !== i) return item
      const precio = prod?.costo || 0
      const cantidad = Number(item.cantidad) || 1
      return { ...item, productoId: prodId, nombre: prod?.nombre || '', precioUnitario: String(precio), subtotal: precio * cantidad }
    }))
  }

  const updItem = (i: number, k: string, v: string) => {
    setItems(prev => prev.map((item, idx) => {
      if (idx !== i) return item
      const updated = { ...item, [k]: v }
      const precio = parseFloat(updated.precioUnitario) || 0
      const cantidad = parseFloat(updated.cantidad) || 0
      return { ...updated, subtotal: precio * cantidad }
    }))
  }

  const removeItem = (i: number) => setItems(p => p.filter((_, idx) => idx !== i))

  const uploadFactura = async (file: File) => {
    setUploading(true)
    const fd = new FormData()
    fd.append('file', file)
    const res = await fetch('/api/upload/factura', { method: 'POST', body: fd })
    const data = await res.json()
    setUploading(false)
    if (data.ok) { setF('facturaUrl', data.url); toast.success('Factura subida') }
    else toast.error(data.error || 'Error al subir factura')
  }

  const total = items.reduce((s, i) => s + i.subtotal, 0)

  const parseXML = async (file: File) => {
    setXmlLoading(true)
    try {
      const text = await file.text()
      const parser = new DOMParser()
      const xml = parser.parseFromString(text, 'application/xml')

      // SAT Guatemala FEL XML structure
      const get = (tag: string) => xml.getElementsByTagName(tag)[0]?.textContent?.trim() || ''
      const getAttr = (tag: string, attr: string) => xml.getElementsByTagName(tag)[0]?.getAttribute(attr) || ''

      // Try standard DTE format
      const nitEmisor = get('NITEmisor') || get('NitEmisor') || getAttr('Emisor', 'NITEmisor')
      const nombreEmisor = get('NombreEmisor') || get('NombreComercial') || getAttr('Emisor', 'NombreComercial')
      const totalAux = get('GranTotal') || get('Total') || get('MontoTotal')
      const numAut = get('NumeroAutorizacion') || getAttr('DatosEmision', 'NumeroAutorizacion')
      const serie = get('Serie') || getAttr('DatosEmision', 'Serie')
      const numero = get('Numero') || getAttr('DatosEmision', 'Numero')

      // Parse items
      const itemNodes = xml.getElementsByTagName('Item')
      const xmlItems: any[] = []
      for (let i = 0; i < itemNodes.length; i++) {
        const item = itemNodes[i]
        const desc = item.getElementsByTagName('Descripcion')[0]?.textContent?.trim() ||
                     item.getElementsByTagName('NombreCorto')[0]?.textContent?.trim() || ''
        const cantidad = +(item.getElementsByTagName('Cantidad')[0]?.textContent?.trim() || '1')
        const precio = +(item.getElementsByTagName('PrecioUnitario')[0]?.textContent?.trim() ||
                        item.getElementsByTagName('MontoItem')[0]?.textContent?.trim() || '0')
        if (desc) xmlItems.push({ nombre: desc, cantidad, precioUnitario: (precio/1.05).toFixed(2), subtotal: (cantidad*precio/1.05).toFixed(2) })
      }

      const parsed = {
        nitEmisor: nitEmisor || '',
        nombreEmisor: nombreEmisor || '',
        total: totalAux || '',
        numAutorizacion: numAut || '',
        serie: serie || '',
        numero: numero || '',
        items: xmlItems,
      }

      setXmlParsed(parsed)
      // Autocomplete form
      if (parsed.nombreEmisor) setForm(p => ({ ...p, proveedorNombre: parsed.nombreEmisor }))
      if (parsed.total) setForm(p => ({ ...p, total: parsed.total }))
      if (parsed.numAutorizacion) setForm(p => ({ ...p, numeroFactura: parsed.numAutorizacion }))
      if (parsed.serie) setForm(p => ({ ...p, serieFactura: parsed.serie }))
      if (xmlItems.length > 0) setItems(xmlItems.map((i: any) => ({ ...i, productoId: '' })))
      toast.success('XML leido correctamente — datos autocompletados')
    } catch {
      toast.error('Error al leer el XML. Verifica que sea un archivo FEL valido.')
    }
    setXmlLoading(false)
  }

  const save = async () => {
    if (items.length === 0) { toast.error('Agrega al menos un producto'); return }
    const invalid = items.find(i => !i.nombre || !i.cantidad || !i.precioUnitario)
    if (invalid) { toast.error('Completa todos los campos de los items'); return }
    setLoading(true)
    const res = await fetch('/api/compras', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...form,
        items: items.map(i => ({ productoId: i.productoId || null, nombre: i.nombre, cantidad: +i.cantidad, precioUnitario: +i.precioUnitario })),
      }),
    })
    const data = await res.json()
    setLoading(false)
    if (data.ok) {
      toast.success('Compra registrada — stock actualizado')
      setShowModal(false)
      setForm({ proveedorId: '', fecha: new Date().toISOString().slice(0, 10), numeroFactura: '', serieFactura: '', facturaUrl: '', notas: '' })
      setItems([])
      load()
    } else toast.error(data.error || 'Error')
  }

  const prodFiltrados = productos.filter(p => !buscarProd || p.nombre.toLowerCase().includes(buscarProd.toLowerCase()) || (p.codigo || '').toLowerCase().includes(buscarProd.toLowerCase()))

  const thS = { background: '#f8fafc', fontSize: 11, fontWeight: 700 as const, color: '#64748b', textTransform: 'uppercase' as const, padding: '10px 14px', textAlign: 'left' as const, borderBottom: '1px solid #e2e8f0' }
  const tdS = { padding: '11px 14px', fontSize: 13, borderBottom: '1px solid #f1f5f9', color: '#0f172a' }
  const lbl = { display: 'block' as const, fontSize: 11, fontWeight: 700 as const, color: '#64748b', textTransform: 'uppercase' as const, marginBottom: 4 }

  return (
    <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 18 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 700, color: '#0f172a' }}>Compras</h1>
          <p style={{ fontSize: 12, color: '#64748b', marginTop: 3 }}>Registro de compras a proveedores con respaldo de factura</p>
        </div>
        <button className="btn-primary" onClick={() => { setItems([{ productoId: '', nombre: '', cantidad: '1', precioUnitario: '', subtotal: 0 }]); setShowModal(true) }}>
          + Nueva Compra
        </button>
      </div>

      <div className="card">
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead><tr>{['Fecha', 'Proveedor', 'Serie/Factura', 'Items', 'Total', 'Factura', 'Estado', ''].map(h => <th key={h} style={thS}>{h}</th>)}</tr></thead>
            <tbody>
              {compras.length === 0
                ? <tr><td colSpan={8} style={{ textAlign: 'center', padding: 50, color: '#94a3b8' }}>Sin compras registradas</td></tr>
                : compras.map(c => (
                  <tr key={c.id} onClick={() => { setSelected(c); setShowDetalle(true) }} style={{ cursor: 'pointer' }}>
                    <td style={{ ...tdS, whiteSpace: 'nowrap', color: '#64748b', fontSize: 12 }}>{fmtDate(c.fecha)}</td>
                    <td style={{ ...tdS, fontWeight: 600 }}>{c.proveedor?.nombre || '—'}</td>
                    <td style={{ ...tdS, fontFamily: 'monospace', fontSize: 12 }}>
                      {c.serieFactura && <span style={{ color: '#64748b' }}>{c.serieFactura} — </span>}
                      {c.numeroFactura ? <span style={{ color: '#2563eb', fontWeight: 700 }}>{c.numeroFactura}</span> : <span style={{ color: '#94a3b8' }}>Sin no.</span>}
                    </td>
                    <td style={{ ...tdS, color: '#64748b' }}>{c.items?.length || 0} productos</td>
                    <td style={{ ...tdS, fontWeight: 700 }}>{fmt(c.total)}</td>
                    <td style={tdS}>
                      {c.facturaUrl
                        ? <a href={c.facturaUrl} target="_blank" rel="noopener noreferrer" onClick={e => e.stopPropagation()}
                            style={{ fontSize: 12, color: '#2563eb', fontWeight: 600, textDecoration: 'none', background: '#eff6ff', padding: '3px 8px', borderRadius: 6 }}>
                             Ver
                          </a>
                        : <span style={{ fontSize: 11, color: '#94a3b8' }}>Sin archivo</span>}
                    </td>
                    <td style={tdS}><span className="badge-green">{c.estado}</span></td>
                    <td style={{ ...tdS, color: '#64748b', fontSize: 11 }}>{c.usuarioNombre}</td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL */}
      {showModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.5)', zIndex: 999, display: 'flex', alignItems: 'flex-start', justifyContent: 'center', padding: 20, overflowY: 'auto' }}>
          <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 14, padding: 28, width: '100%', maxWidth: 860, margin: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 20, paddingBottom: 14, borderBottom: '1px solid #e2e8f0' }}>
              <h3 style={{ fontSize: 16, fontWeight: 700, color: '#0f172a' }}>Nueva Compra</h3>
              <button onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', fontSize: 22, cursor: 'pointer', color: '#94a3b8' }}>×</button>
            </div>

            {/* Encabezado factura */}
            <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 8, padding: 16, marginBottom: 16 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#2563eb', textTransform: 'uppercase', marginBottom: 12 }}>Datos de la factura</div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 12 }}>
                <div>
                  <label style={lbl}>Proveedor</label>
                  <select className="input" value={form.proveedorId} onChange={e => setF('proveedorId', e.target.value)}>
                    <option value="">Sin proveedor</option>
                    {proveedores.map(p => <option key={p.id} value={p.id}>{p.nombre}</option>)}
                  </select>
                </div>
                <div>
                  <label style={lbl}>Fecha de compra</label>
                  <input className="input" type="date" value={form.fecha} onChange={e => setF('fecha', e.target.value)} />
                </div>
                <div>
                  <label style={lbl}>Serie de factura</label>
                  <input className="input" value={form.serieFactura} onChange={e => setF('serieFactura', e.target.value.toUpperCase())} placeholder="Ej: A, B, ABC..." />
                </div>
                <div>
                  <label style={lbl}>Número de factura</label>
                  <input className="input" value={form.numeroFactura} onChange={e => setF('numeroFactura', e.target.value)} placeholder="Ej: 000123" />
                </div>
                <div style={{ gridColumn: '3', gridRow: '1/3' }}>
                  <label style={lbl}>Factura PDF o imagen</label>
                  <div style={{ border: '2px dashed #e2e8f0', borderRadius: 8, padding: 16, textAlign: 'center', cursor: 'pointer', background: form.facturaUrl ? '#f0fdf4' : '#fff' }}
                    onClick={() => document.getElementById('upload-factura')?.click()}>
                    {form.facturaUrl
                      ? <div><div style={{ fontSize: 20, marginBottom: 4 }}></div><div style={{ fontSize: 12, color: '#16a34a', fontWeight: 600 }}>Factura subida</div>
                          <a href={form.facturaUrl} target="_blank" rel="noopener noreferrer" style={{ fontSize: 11, color: '#2563eb' }}>Ver archivo</a></div>
                      : <div><div style={{ fontSize: 28, marginBottom: 4 }}></div>
                          <div style={{ fontSize: 12, color: '#64748b' }}>{uploading ? 'Subiendo...' : 'Clic para subir PDF o foto de factura'}</div>
                          <div style={{ fontSize: 10, color: '#94a3b8', marginTop: 4 }}>PDF, JPG, PNG</div></div>}
                  </div>
                  <input id="upload-factura" type="file" accept=".pdf,image/*" style={{ display: 'none' }} onChange={e => e.target.files?.[0] && uploadFactura(e.target.files[0])} />
                </div>
                <div style={{ gridColumn: '1/3' }}>
                  <label style={lbl}>Notas</label>
                  <input className="input" value={form.notas} onChange={e => setF('notas', e.target.value)} placeholder="Observaciones de la compra" />
                </div>
              </div>
            </div>

            {/* Productos */}
            <div style={{ marginBottom: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: '#2563eb', textTransform: 'uppercase' }}>Artículos comprados</div>
                <button className="btn-ghost btn-sm" onClick={addItem}>+ Agregar item</button>
              </div>

              {/* Buscador de productos */}
              <div style={{ marginBottom: 10 }}>
                <input className="input" placeholder="Buscar producto del inventario..." value={buscarProd} onChange={e => setBuscarProd(e.target.value)} style={{ fontSize: 12 }} />
              </div>

              {/* Headers */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 80px 110px 90px 24px', gap: 6, marginBottom: 6 }}>
                {['Producto (inventario)', 'Nombre / descripción', 'Cant.', 'Costo unit.', 'Subtotal', ''].map(h => (
                  <div key={h} style={{ fontSize: 10, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', padding: '4px 0' }}>{h}</div>
                ))}
              </div>

              {items.map((item, i) => (
                <div key={i} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 80px 110px 90px 24px', gap: 6, marginBottom: 6, alignItems: 'center' }}>
                  <select className="input" value={item.productoId} onChange={e => selProducto(i, e.target.value)} style={{ fontSize: 12 }}>
                    <option value="">Servicio / otro</option>
                    {(buscarProd ? prodFiltrados : productos).map(p => <option key={p.id} value={p.id}>{p.codigo ? `[${p.codigo}] ` : ''}{p.nombre}</option>)}
                  </select>
                  <input className="input" value={item.nombre} onChange={e => updItem(i, 'nombre', e.target.value)} placeholder="Descripción" style={{ fontSize: 12 }} />
                  <input className="input" type="number" min="1" value={item.cantidad} onChange={e => updItem(i, 'cantidad', e.target.value)} style={{ fontSize: 12, textAlign: 'center' }} />
                  <input className="input" type="number" min="0" value={item.precioUnitario} onChange={e => updItem(i, 'precioUnitario', e.target.value)} placeholder="0.00" style={{ fontSize: 12 }} />
                  <div style={{ fontSize: 13, fontWeight: 700, color: '#0f172a', textAlign: 'right' }}>Q {item.subtotal.toFixed(2)}</div>
                  <button onClick={() => removeItem(i)} style={{ background: 'none', border: 'none', color: '#dc2626', cursor: 'pointer', fontSize: 16 }}>×</button>
                </div>
              ))}

              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 12, paddingTop: 12, borderTop: '1px solid #e2e8f0' }}>
                <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 8, padding: '10px 18px', textAlign: 'right' }}>
                  <div style={{ fontSize: 12, color: '#64748b', marginBottom: 2 }}>Total sin IVA</div>
                  <div style={{ fontSize: 20, fontWeight: 800, color: '#0f172a' }}>{fmt(total)}</div>
                  <div style={{ fontSize: 10, color: '#94a3b8', marginTop: 2 }}>IVA incluido en cada artículo</div>
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button className="btn-ghost" onClick={() => setShowModal(false)}>Cancelar</button>
              <button className="btn-primary" onClick={save} disabled={loading || uploading}>
                {loading ? 'Guardando...' : 'Registrar Compra'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DETALLE */}
      {showDetalle && selected && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.5)', zIndex: 999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 14, padding: 28, width: '100%', maxWidth: 620, boxShadow: '0 20px 60px rgba(0,0,0,.15)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 18, paddingBottom: 14, borderBottom: '1px solid #e2e8f0' }}>
              <div>
                <div style={{ fontSize: 16, fontWeight: 800, color: '#0f172a' }}>{selected.proveedor?.nombre || 'Sin proveedor'}</div>
                <div style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>
                  {fmtDate(selected.fecha)}
                  {selected.serieFactura && ` · Serie ${selected.serieFactura}`}
                  {selected.numeroFactura && ` · Factura ${selected.numeroFactura}`}
                </div>
              </div>
              <button onClick={() => setShowDetalle(false)} style={{ background: 'none', border: 'none', fontSize: 22, cursor: 'pointer', color: '#94a3b8' }}>×</button>
            </div>

            {selected.facturaUrl && (
              <div style={{ marginBottom: 14 }}>
                <a href={selected.facturaUrl} target="_blank" rel="noopener noreferrer"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: '#eff6ff', color: '#2563eb', border: '1px solid #bfdbfe', borderRadius: 8, padding: '8px 14px', fontSize: 13, fontWeight: 600, textDecoration: 'none' }}>
                   Ver factura adjunta
                </a>
              </div>
            )}

            <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 16 }}>
              <thead><tr>{['Producto', 'Cantidad', 'Costo unit.', 'Subtotal'].map(h => <th key={h} style={thS}>{h}</th>)}</tr></thead>
              <tbody>
                {selected.items.map((it, i) => (
                  <tr key={i}>
                    <td style={tdS}>{it.nombre}</td>
                    <td style={{ ...tdS, textAlign: 'center' }}>{it.cantidad}</td>
                    <td style={{ ...tdS, color: '#64748b' }}>{fmt(it.precioUnitario)}</td>
                    <td style={{ ...tdS, fontWeight: 700 }}>{fmt(it.subtotal)}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 800, fontSize: 16, paddingTop: 12, borderTop: '2px solid #e2e8f0' }}>
              <span>Total</span><span style={{ color: '#2563eb' }}>{fmt(selected.total)}</span>
            </div>

            {selected.notas && <div style={{ marginTop: 12, fontSize: 12, color: '#64748b', background: '#f8fafc', padding: 10, borderRadius: 8 }}>{selected.notas}</div>}
          </div>
        </div>
      )}
    </div>
  )
}

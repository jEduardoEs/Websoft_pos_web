'use client'
import { useState, useEffect } from 'react'
import { toast } from 'sonner'
import { fmt, fmtDateTime } from '@/lib/utils'

interface Producto {
  id: number
  codigo: string | null
  nombre: string
  descripcion: string | null
  precio: number
  costo: number
  stock: number
  stockMinimo: number
  categoria: string
  unidad: string
  activo: boolean
  imagenUrl?: string | null
}

interface FormData {
  id: number
  codigo: string
  nombre: string
  descripcion: string
  precio: string
  costo: string
  stock: string
  stockMinimo: string
  categoria: string
  unidad: string
  imagenUrl: string
}

interface KardexItem {
  id: number
  fecha: string
  tipo: string
  cantidad: number
  stockAntes: number
  stockDespues: number
  motivo: string | null
  usuarioNombre: string | null
}

const CATS_DEFAULT = ['General', 'CCTV', 'Periféricos', 'Componentes PC', 'Cables', 'Accesorios', 'Redes', 'Servicios', 'Herramientas']
const empty: FormData = { id: 0, codigo: '', nombre: '', descripcion: '', precio: '', costo: '', stock: '', stockMinimo: '5', categoria: 'General', unidad: 'unidad', imagenUrl: '' }

export default function InventarioPage() {
  const [productos, setProductos] = useState<Producto[]>([])
  const [buscar, setBuscar] = useState('')
  const [categoria, setCategoria] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [nuevaCategoria, setNuevaCategoria] = useState('')
  const [form, setForm] = useState<FormData>(empty)
  const [loading, setLoading] = useState(false)
  const [kardexModal, setKardexModal] = useState<Producto | null>(null)
  const [kardex, setKardex] = useState<KardexItem[]>([])
  const [ajusteCantidad, setAjusteCantidad] = useState('')
  const [ajusteTipo, setAjusteTipo] = useState('entrada')
  const [ajusteMotivo, setAjusteMotivo] = useState('')
  const [uploading, setUploading] = useState(false)

  const uploadImage = async (file: File) => {
    setUploading(true)
    const fd = new FormData()
    fd.append('file', file)
    const res = await fetch('/api/upload', { method: 'POST', body: fd })
    const data = await res.json()
    setUploading(false)
    if (data.ok) {
      setForm(prev => ({ ...prev, imagenUrl: data.url }))
    } else {
      alert(data.error || 'Error al subir imagen. Configura Cloudinary en Vercel.')
    }
  }

  const load = async () => {
    const p = new URLSearchParams({ buscar, ...(categoria ? { categoria } : {}) })
    const res = await fetch(`/api/productos?${p}`)
    setProductos(await res.json())
  }

  useEffect(() => { load() }, [buscar, categoria])

  const categorias = Array.from(new Set([...CATS_DEFAULT, ...productos.map(p => p.categoria)])).filter(Boolean).sort()

  const openNew = () => { setForm(empty); setShowModal(true) }
  const openEdit = (p: Producto) => {
    setForm({
      id: p.id,
      codigo: p.codigo || '',
      nombre: p.nombre,
      descripcion: p.descripcion || '',
      precio: String(p.precio),
      costo: String(p.costo),
      stock: String(p.stock),
      stockMinimo: String(p.stockMinimo),
      categoria: p.categoria,
      unidad: p.unidad,
      imagenUrl: p.imagenUrl || '',
    })
    setShowModal(true)
  }

  const save = async () => {
    if (!form.nombre) { toast.error('Nombre requerido'); return }
    setLoading(true)
    const res = await fetch('/api/productos', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })
    const data = await res.json()
    setLoading(false)
    if (data.ok) { toast.success('Guardado'); setShowModal(false); load() }
    else toast.error(data.error || 'Error')
  }

  const del = async (p: Producto) => {
    if (!confirm(`Eliminar "${p.nombre}"?`)) return
    const res = await fetch(`/api/productos?id=${p.id}`, { method: 'DELETE' })
    const data = await res.json()
    if (data.ok) { toast.success('Eliminado'); load() }
    else toast.error(data.error || 'Error')
  }

  const openKardex = async (p: Producto) => {
    setKardexModal(p)
    const res = await fetch(`/api/kardex?producto_id=${p.id}`)
    setKardex(await res.json())
  }

  const ajustar = async () => {
    if (!ajusteCantidad || !kardexModal) return
    setLoading(true)
    const res = await fetch('/api/kardex', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ productoId: kardexModal.id, cantidad: Number(ajusteCantidad), tipo: ajusteTipo, motivo: ajusteMotivo }),
    })
    const data = await res.json()
    setLoading(false)
    if (data.ok) {
      toast.success('Ajuste aplicado')
      setAjusteCantidad('')
      setAjusteMotivo('')
      openKardex(kardexModal)
      load()
    } else toast.error(data.error || 'Error')
  }

  const fields = [
    { label: 'Nombre *', key: 'nombre' as keyof FormData, full: true },
    { label: 'Codigo', key: 'codigo' as keyof FormData },
    { label: 'Descripcion', key: 'descripcion' as keyof FormData, full: true },
    { label: 'Precio venta', key: 'precio' as keyof FormData, type: 'number' },
    { label: 'Costo', key: 'costo' as keyof FormData, type: 'number' },
    { label: 'Stock inicial', key: 'stock' as keyof FormData, type: 'number' },
    { label: 'Stock minimo', key: 'stockMinimo' as keyof FormData, type: 'number' },
    { label: 'Categoria', key: 'categoria' as keyof FormData },
    { label: 'Unidad', key: 'unidad' as keyof FormData },
  ]

  return (
    <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 18 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: '#0f172a' }}>Inventario</h1>
          <p style={{ fontSize: 13, color: '#64748b', marginTop: 3 }}>{productos.length} productos activos</p>
        </div>
        <button className="btn-primary" onClick={openNew}>+ Nuevo Producto</button>
      </div>

      <div className="card" style={{ padding: 14 }}>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <input className="input" placeholder="Buscar producto..." value={buscar} onChange={e => setBuscar(e.target.value)} style={{ flex: 1, minWidth: 200 }} />
          <select className="input" value={categoria} onChange={e => setCategoria(e.target.value)} style={{ width: 180 }}>
            <option value="">Todas las categorias</option>
            {categorias.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
      </div>

      <div className="card">
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                {['Codigo', 'Nombre', 'Categoria', 'Precio', 'Costo', 'Stock', 'Min.', 'Unidad', ''].map(h => (
                  <th key={h} style={{ background: '#f8fafc', fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '.5px', padding: '9px 13px', textAlign: 'left', borderBottom: '1px solid #f1f5f9', whiteSpace: 'nowrap' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {productos.length === 0 ? (
                <tr><td colSpan={9} style={{ textAlign: 'center', padding: 40, color: '#475569' }}>Sin productos</td></tr>
              ) : productos.map(p => (
                <tr key={p.id}>
                  <td style={{ padding: '10px 13px', fontSize: 12, borderBottom: '1px solid #f1f5f9', color: '#64748b' }}>{p.codigo || '-'}</td>
                  <td style={{ padding: '10px 13px', fontSize: 13, borderBottom: '1px solid #f1f5f9', fontWeight: 600, color: '#0f172a' }}>{p.nombre}</td>
                  <td style={{ padding: '10px 13px', fontSize: 12, borderBottom: '1px solid #f1f5f9' }}><span className="badge-blue">{p.categoria}</span></td>
                  <td style={{ padding: '10px 13px', fontSize: 13, borderBottom: '1px solid #f1f5f9', fontWeight: 600 }}>{fmt(p.precio)}</td>
                  <td style={{ padding: '10px 13px', fontSize: 13, borderBottom: '1px solid #f1f5f9', color: '#64748b' }}>{fmt(p.costo)}</td>
                  <td style={{ padding: '10px 13px', borderBottom: '1px solid #f1f5f9' }}>
                    <span className={p.stock <= 0 ? 'badge-red' : p.stock <= p.stockMinimo ? 'badge-orange' : 'badge-green'}>{p.stock}</span>
                  </td>
                  <td style={{ padding: '10px 13px', fontSize: 13, borderBottom: '1px solid #f1f5f9', color: '#64748b' }}>{p.stockMinimo}</td>
                  <td style={{ padding: '10px 13px', fontSize: 12, borderBottom: '1px solid #f1f5f9', color: '#64748b' }}>{p.unidad}</td>
                  <td style={{ padding: '10px 13px', borderBottom: '1px solid #f1f5f9' }}>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button className="btn-ghost btn-sm" onClick={() => openEdit(p)}>Editar</button>
                      <button className="btn-ghost btn-sm" onClick={() => openKardex(p)}>Kardex</button>
                      <button className="btn-danger btn-sm" onClick={() => del(p)}>Borrar</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.5)', zIndex: 999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <div style={{ background: '#ffffff', borderRadius: 14, padding: 28, width: '100%', maxWidth: 560, maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
              <h3 style={{ fontSize: 17, fontWeight: 700, color: '#0f172a' }}>{form.id ? 'Editar' : 'Nuevo'} Producto</h3>
              <button onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', fontSize: 22, cursor: 'pointer', color: '#475569' }}>x</button>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              {fields.map(f => (
                <div key={f.key} style={{ gridColumn: f.full ? '1/-1' : 'auto' }}>
                  <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '.5px', marginBottom: 4 }}>{f.label}</label>
                  <input
                    className="input"
                    type={f.type || 'text'}
                    value={form[f.key]}
                    onChange={e => setForm(prev => ({ ...prev, [f.key]: e.target.value }))}
              {/* Categoria */}
              <div>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', marginBottom: 4 }}>Categoria</label>
                <select className="input" value={form.categoria}
                  onChange={e => setForm(p => ({ ...p, categoria: e.target.value }))}>
                  {categorias.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                </select>
                <div style={{ display: 'flex', gap: 6, marginTop: 8 }}>
                  <input className="input" value={nuevaCategoria}
                    onChange={e => setNuevaCategoria(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter' && nuevaCategoria.trim()) { setForm(p => ({ ...p, categoria: nuevaCategoria.trim() })); setNuevaCategoria('') }}}
                    placeholder="Nueva categoria..." style={{ flex: 1, fontSize: 12 }} />
                  <button type="button" onClick={() => { if (nuevaCategoria.trim()) { setForm(p => ({ ...p, categoria: nuevaCategoria.trim() })); setNuevaCategoria('') }}}
                    style={{ background: '#2563eb', color: '#fff', border: 'none', borderRadius: 8, padding: '0 14px', cursor: 'pointer', fontSize: 12, fontWeight: 600, fontFamily: 'inherit', whiteSpace: 'nowrap' }}>
                    + Agregar
                  </button>
                </div>
                {form.categoria && <div style={{ fontSize: 11, color: '#2563eb', marginTop: 4 }}>Seleccionada: <strong>{form.categoria}</strong></div>}
              </div>
                  />
                </div>
              ))}
            </div>
            {/* Image upload */}
            <div style={{ gridColumn: '1/-1', marginTop: 4 }}>
              <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', marginBottom: 4 }}>Imagen del producto</label>
              <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                {form.imagenUrl ? (
                  <img src={form.imagenUrl} alt="preview" style={{ width: 70, height: 70, objectFit: 'contain', borderRadius: 8, border: '1px solid #e2e8f0' }} />
                ) : (
                  <div style={{ width: 70, height: 70, background: '#f8fafc', border: '1px dashed #e2e8f0', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24 }}></div>
                )}
                <div>
                  <input type="file" accept="image/*" onChange={e => e.target.files?.[0] && uploadImage(e.target.files[0])} style={{ fontSize: 12 }} />
                  {uploading && <div style={{ fontSize: 11, color: '#2563eb', marginTop: 4 }}>Subiendo imagen...</div>}
                  {form.imagenUrl && <div style={{ fontSize: 10, color: '#16a34a', marginTop: 4 }}> Imagen guardada</div>}
                  <div style={{ fontSize: 10, color: '#94a3b8', marginTop: 2 }}>Requiere Cloudinary configurado en Vercel</div>
                </div>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 24 }}>
              <button className="btn-ghost" onClick={() => setShowModal(false)}>Cancelar</button>
              <button className="btn-primary" onClick={save} disabled={loading || uploading}>{loading ? 'Guardando...' : 'Guardar'}</button>
            </div>
          </div>
        </div>
      )}

      {kardexModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.5)', zIndex: 999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <div style={{ background: '#ffffff', borderRadius: 14, padding: 28, width: '100%', maxWidth: 700, maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
              <div>
                <h3 style={{ fontSize: 17, fontWeight: 700, color: '#0f172a' }}>Kardex - {kardexModal.nombre}</h3>
                <p style={{ fontSize: 13, color: '#64748b', marginTop: 2 }}>Stock actual: <strong style={{ color: '#2563eb' }}>{kardexModal.stock}</strong></p>
              </div>
              <button onClick={() => setKardexModal(null)} style={{ background: 'none', border: 'none', fontSize: 22, cursor: 'pointer', color: '#475569' }}>x</button>
            </div>

            <div style={{ background: '#f8fafc', borderRadius: 10, padding: 14, marginBottom: 16 }}>
              <p style={{ fontSize: 12, fontWeight: 700, color: '#64748b', marginBottom: 10, textTransform: 'uppercase' }}>Ajuste de inventario</p>
              <div style={{ display: 'flex', gap: 10, alignItems: 'flex-end', flexWrap: 'wrap' }}>
                <div>
                  <label style={{ display: 'block', fontSize: 10, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', marginBottom: 3 }}>Tipo</label>
                  <select className="input" value={ajusteTipo} onChange={e => setAjusteTipo(e.target.value)} style={{ width: 130 }}>
                    <option value="entrada">Entrada</option>
                    <option value="salida">Salida</option>
                    <option value="ajuste">Ajuste</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 10, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', marginBottom: 3 }}>Cantidad</label>
                  <input className="input" type="number" min="1" value={ajusteCantidad} onChange={e => setAjusteCantidad(e.target.value)} style={{ width: 100 }} />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', fontSize: 10, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', marginBottom: 3 }}>Motivo</label>
                  <input className="input" value={ajusteMotivo} onChange={e => setAjusteMotivo(e.target.value)} placeholder="Razon del ajuste" />
                </div>
                <button className="btn-primary" onClick={ajustar} disabled={loading}>Aplicar</button>
              </div>
            </div>

            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr>
                    {['Fecha', 'Tipo', 'Cant.', 'Antes', 'Despues', 'Motivo', 'Usuario'].map(h => (
                      <th key={h} style={{ background: '#f8fafc', fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', padding: '8px 12px', textAlign: 'left', borderBottom: '1px solid #f1f5f9' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {kardex.length === 0 ? (
                    <tr><td colSpan={7} style={{ textAlign: 'center', padding: 30, color: '#475569' }}>Sin movimientos</td></tr>
                  ) : kardex.map((k, i) => (
                    <tr key={i}>
                      <td style={{ padding: '8px 12px', fontSize: 12, borderBottom: '1px solid #f1f5f9', whiteSpace: 'nowrap' }}>{fmtDateTime(k.fecha)}</td>
                      <td style={{ padding: '8px 12px', borderBottom: '1px solid #f1f5f9' }}>
                        <span className={k.tipo === 'entrada' ? 'badge-green' : k.tipo === 'salida' ? 'badge-red' : 'badge-orange'} style={{ textTransform: 'capitalize' }}>{k.tipo}</span>
                      </td>
                      <td style={{ padding: '8px 12px', fontSize: 13, fontWeight: 600, borderBottom: '1px solid #f1f5f9' }}>{k.cantidad}</td>
                      <td style={{ padding: '8px 12px', fontSize: 13, borderBottom: '1px solid #f1f5f9', color: '#64748b' }}>{k.stockAntes}</td>
                      <td style={{ padding: '8px 12px', fontSize: 13, fontWeight: 600, borderBottom: '1px solid #f1f5f9', color: '#2563eb' }}>{k.stockDespues}</td>
                      <td style={{ padding: '8px 12px', fontSize: 12, borderBottom: '1px solid #f1f5f9', color: '#64748b' }}>{k.motivo || '-'}</td>
                      <td style={{ padding: '8px 12px', fontSize: 12, borderBottom: '1px solid #f1f5f9', color: '#64748b' }}>{k.usuarioNombre || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

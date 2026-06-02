'use client'
import { useState, useEffect } from 'react'
import { toast } from 'sonner'
import { fmt } from '@/lib/utils'

interface Produto {
  id: number; codigo: string | null; nombre: string; descripcion: string | null
  precio: number; costo: number; stock: number; stockMinimo: number
  categoria: string; unidad: string; activo: boolean; imagenUrl?: string | null
}

interface FormData {
  id: number; codigo: string; nombre: string; descripcion: string
  precio: string; costo: string; stock: string; stockMinimo: string
  categoria: string; unidad: string; imagenUrl: string
}

interface KardexItem {
  id: number; fecha: string; tipo: string; cantidad: number
  stockAntes: number; stockDespues: number; motivo: string | null; usuarioNombre: string | null
}

const CATS_DEFAULT = ['General','CCTV','Periféricos','Componentes PC','Cables','Accesorios','Redes','Servicios','Herramientas']
const empty: FormData = { id: 0, codigo: '', nombre: '', descripcion: '', precio: '', costo: '', stock: '', stockMinimo: '5', categoria: 'General', unidad: 'unidad', imagenUrl: '' }

export default function InventarioPage() {
  const [productos, setProductos] = useState<Produto[]>([])
  const [buscar, setBuscar] = useState('')
  const [filtCat, setFiltCat] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [nuevaCategoria, setNuevaCategoria] = useState('')
  const [form, setForm] = useState<FormData>(empty)
  const [loading, setLoading] = useState(false)
  const [kardexModal, setKardexModal] = useState<Produto | null>(null)
  const [kardex, setKardex] = useState<KardexItem[]>([])
  const [ajusteCantidad, setAjusteCantidad] = useState('')
  const [ajusteTipo, setAjusteTipo] = useState('entrada')
  const [ajusteMotivo, setAjusteMotivo] = useState('')
  const [uploading, setUploading] = useState(false)

  const load = async () => {
    const p = new URLSearchParams({ buscar, ...(filtCat ? { categoria: filtCat } : {}) })
    const res = await fetch(`/api/productos?${p}`)
    setProductos(await res.json())
  }

  useEffect(() => { load() }, [buscar, filtCat])

  const categorias = Array.from(new Set([...CATS_DEFAULT, ...productos.map(p => p.categoria)])).filter(Boolean).sort()

  const openNew = () => { setForm(empty); setShowModal(true) }
  const openEdit = (p: Produto) => {
    setForm({ id: p.id, codigo: p.codigo || '', nombre: p.nombre, descripcion: p.descripcion || '', precio: String(p.precio), costo: String(p.costo), stock: String(p.stock), stockMinimo: String(p.stockMinimo), categoria: p.categoria, unidad: p.unidad, imagenUrl: p.imagenUrl || '' })
    setShowModal(true)
  }

  const save = async () => {
    if (!form.nombre) { toast.error('Nombre requerido'); return }
    setLoading(true)
    const res = await fetch('/api/productos', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) })
    const data = await res.json()
    setLoading(false)
    if (data.ok) { toast.success('Guardado'); setShowModal(false); load() }
    else toast.error(data.error || 'Error')
  }

  const del = async (p: Produto) => {
    if (!confirm(`Eliminar "${p.nombre}"?`)) return
    const res = await fetch(`/api/productos?id=${p.id}`, { method: 'DELETE' })
    const data = await res.json()
    if (data.ok) { toast.success('Eliminado'); load() }
    else toast.error(data.error || 'Error')
  }

  const openKardex = async (p: Produto) => {
    setKardexModal(p)
    const res = await fetch(`/api/kardex?producto_id=${p.id}`)
    setKardex(await res.json())
  }

  const ajustar = async () => {
    if (!ajusteCantidad || !kardexModal) return
    setLoading(true)
    const res = await fetch('/api/kardex', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ productoId: kardexModal.id, cantidad: Number(ajusteCantidad), tipo: ajusteTipo, motivo: ajusteMotivo }) })
    const data = await res.json()
    setLoading(false)
    if (data.ok) { toast.success('Ajuste aplicado'); setAjusteCantidad(''); setAjusteMotivo(''); openKardex(kardexModal); load() }
    else toast.error(data.error || 'Error')
  }

  const uploadImage = async (file: File) => {
    setUploading(true)
    const fd = new FormData()
    fd.append('file', file)
    const res = await fetch('/api/upload', { method: 'POST', body: fd })
    const data = await res.json()
    setUploading(false)
    if (data.ok) setForm(prev => ({ ...prev, imagenUrl: data.url }))
    else alert(data.error || 'Error al subir imagen')
  }

  const setF = (k: keyof FormData, v: string) => setForm(p => ({ ...p, [k]: v }))

  const lbl: React.CSSProperties = { display: 'block', fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '.5px', marginBottom: 4 }
  const thS: React.CSSProperties = { background: '#f8fafc', fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', padding: '9px 13px', textAlign: 'left', borderBottom: '1px solid #f1f5f9' }
  const tdS: React.CSSProperties = { padding: '10px 13px', fontSize: 13, borderBottom: '1px solid #f1f5f9' }

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
        <div style={{ display: 'flex', gap: 10 }}>
          <input className="input" placeholder="Buscar producto..." value={buscar} onChange={e => setBuscar(e.target.value)} style={{ flex: 1 }} />
          <select className="input" value={filtCat} onChange={e => setFiltCat(e.target.value)} style={{ width: 180 }}>
            <option value="">Todas las categorias</option>
            {categorias.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
      </div>

      <div className="card">
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>{['Codigo','Nombre','Categoria','Precio','Costo','Stock','Min.','Unidad',''].map(h => (
                <th key={h} style={thS}>{h}</th>
              ))}</tr>
            </thead>
            <tbody>
              {productos.length === 0 ? (
                <tr><td colSpan={9} style={{ textAlign: 'center', padding: 40, color: '#64748b' }}>Sin productos</td></tr>
              ) : productos.map(p => (
                <tr key={p.id}>
                  <td style={{ ...tdS, fontSize: 11, fontFamily: 'monospace', color: '#64748b' }}>{p.codigo || '—'}</td>
                  <td style={{ ...tdS, fontWeight: 600 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      {p.imagenUrl && <img src={p.imagenUrl} alt="" style={{ width: 28, height: 28, objectFit: 'contain', borderRadius: 4 }} />}
                      <span>{p.nombre}</span>
                    </div>
                  </td>
                  <td style={tdS}><span className="badge-blue" style={{ fontSize: 10 }}>{p.categoria}</span></td>
                  <td style={{ ...tdS, fontWeight: 700, color: '#2563eb' }}>{fmt(p.precio)}</td>
                  <td style={{ ...tdS, color: '#64748b' }}>{fmt(p.costo)}</td>
                  <td style={tdS}>
                    <span style={{ fontWeight: 700, color: p.stock <= p.stockMinimo ? '#dc2626' : p.stock <= p.stockMinimo * 2 ? '#d97706' : '#16a34a' }}>{p.stock}</span>
                  </td>
                  <td style={{ ...tdS, color: '#64748b' }}>{p.stockMinimo}</td>
                  <td style={{ ...tdS, color: '#64748b', fontSize: 12 }}>{p.unidad}</td>
                  <td style={tdS}>
                    <div style={{ display: 'flex', gap: 5 }}>
                      <button className="btn-ghost btn-sm" onClick={() => openEdit(p)}>
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                      </button>
                      <button className="btn-ghost btn-sm" onClick={() => openKardex(p)} style={{ color: '#7c3aed', borderColor: '#ddd6fe' }}>
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 .49-4.5"/></svg>
                      </button>
                      <button className="btn-danger btn-sm" onClick={() => del(p)}>
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6M14 11v6"/></svg>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL NUEVO/EDITAR PRODUCTO */}
      {showModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.5)', zIndex: 999, display: 'flex', alignItems: 'flex-start', justifyContent: 'center', padding: 20, overflowY: 'auto' }}>
          <div style={{ background: '#fff', borderRadius: 14, padding: 28, width: '100%', maxWidth: 600, margin: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 20 }}>
              <h3 style={{ fontSize: 17, fontWeight: 700, color: '#0f172a' }}>{form.id ? 'Editar' : 'Nuevo'} Producto</h3>
              <button onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', fontSize: 22, cursor: 'pointer', color: '#475569' }}>×</button>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>

              {/* Nombre */}
              <div style={{ gridColumn: '1/-1' }}>
                <label style={lbl}>Nombre *</label>
                <input className="input" value={form.nombre} onChange={e => setF('nombre', e.target.value)} />
              </div>

              {/* Codigo */}
              <div>
                <label style={lbl}>Codigo (dejar vacío = auto)</label>
                <input className="input" value={form.codigo} onChange={e => setF('codigo', e.target.value)} placeholder="WSP-0001" />
              </div>

              {/* Categoria */}
              <div>
                <label style={lbl}>Categoria</label>
                <select className="input" value={form.categoria} onChange={e => setF('categoria', e.target.value)}>
                  {categorias.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                </select>
                <div style={{ display: 'flex', gap: 6, marginTop: 6 }}>
                  <input className="input" value={nuevaCategoria} onChange={e => setNuevaCategoria(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter' && nuevaCategoria.trim()) { setF('categoria', nuevaCategoria.trim()); setNuevaCategoria('') }}}
                    placeholder="+ Nueva categoria..." style={{ flex: 1, fontSize: 12 }} />
                  <button type="button" onClick={() => { if (nuevaCategoria.trim()) { setF('categoria', nuevaCategoria.trim()); setNuevaCategoria('') }}}
                    style={{ background: '#2563eb', color: '#fff', border: 'none', borderRadius: 8, padding: '0 12px', cursor: 'pointer', fontSize: 12, fontWeight: 600, fontFamily: 'inherit', whiteSpace: 'nowrap' }}>
                    Agregar
                  </button>
                </div>
              </div>

              {/* Descripcion */}
              <div style={{ gridColumn: '1/-1' }}>
                <label style={lbl}>Descripcion</label>
                <input className="input" value={form.descripcion} onChange={e => setF('descripcion', e.target.value)} />
              </div>

              {/* Precio y Costo */}
              <div>
                <label style={lbl}>Precio venta</label>
                <input className="input" type="number" value={form.precio} onChange={e => setF('precio', e.target.value)} />
              </div>
              <div>
                <label style={lbl}>Costo</label>
                <input className="input" type="number" value={form.costo} onChange={e => setF('costo', e.target.value)} />
              </div>

              {/* Stock */}
              <div>
                <label style={lbl}>Stock inicial</label>
                <input className="input" type="number" value={form.stock} onChange={e => setF('stock', e.target.value)} />
              </div>
              <div>
                <label style={lbl}>Stock minimo</label>
                <input className="input" type="number" value={form.stockMinimo} onChange={e => setF('stockMinimo', e.target.value)} />
              </div>

              {/* Unidad */}
              <div>
                <label style={lbl}>Unidad</label>
                <input className="input" value={form.unidad} onChange={e => setF('unidad', e.target.value)} placeholder="unidad, caja, par..." />
              </div>

              {/* Imagen */}
              <div style={{ gridColumn: '1/-1' }}>
                <label style={lbl}>Imagen del producto</label>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  {form.imagenUrl && <img src={form.imagenUrl} alt="" style={{ width: 56, height: 56, objectFit: 'contain', borderRadius: 8, border: '1px solid #e2e8f0' }} />}
                  <div>
                    <input type="file" accept="image/*" onChange={e => e.target.files?.[0] && uploadImage(e.target.files[0])} style={{ fontSize: 12 }} />
                    <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 4 }}>Requiere Cloudinary configurado en Vercel</div>
                  </div>
                </div>
                {uploading && <div style={{ fontSize: 12, color: '#2563eb', marginTop: 6 }}>Subiendo imagen...</div>}
              </div>

            </div>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 20 }}>
              <button className="btn-ghost" onClick={() => setShowModal(false)}>Cancelar</button>
              <button className="btn-primary" onClick={save} disabled={loading}>{loading ? 'Guardando...' : 'Guardar'}</button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL KARDEX */}
      {kardexModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.5)', zIndex: 999, display: 'flex', alignItems: 'flex-start', justifyContent: 'center', padding: 20, overflowY: 'auto' }}>
          <div style={{ background: '#fff', borderRadius: 14, padding: 28, width: '100%', maxWidth: 680, margin: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 20 }}>
              <div>
                <h3 style={{ fontSize: 17, fontWeight: 700, color: '#0f172a' }}>Kardex — {kardexModal.nombre}</h3>
                <p style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>Stock actual: <strong style={{ color: '#2563eb' }}>{kardexModal.stock}</strong></p>
              </div>
              <button onClick={() => setKardexModal(null)} style={{ background: 'none', border: 'none', fontSize: 22, cursor: 'pointer', color: '#475569' }}>×</button>
            </div>

            {/* Ajuste manual */}
            <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 10, padding: 16, marginBottom: 20 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', marginBottom: 12 }}>Ajuste manual de stock</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 2fr auto', gap: 10, alignItems: 'flex-end' }}>
                <div>
                  <label style={lbl}>Tipo</label>
                  <select className="input" value={ajusteTipo} onChange={e => setAjusteTipo(e.target.value)}>
                    <option value="entrada">Entrada</option>
                    <option value="salida">Salida</option>
                    <option value="ajuste">Ajuste</option>
                  </select>
                </div>
                <div>
                  <label style={lbl}>Cantidad</label>
                  <input className="input" type="number" min="1" value={ajusteCantidad} onChange={e => setAjusteCantidad(e.target.value)} />
                </div>
                <div>
                  <label style={lbl}>Motivo</label>
                  <input className="input" value={ajusteMotivo} onChange={e => setAjusteMotivo(e.target.value)} placeholder="Razón del ajuste..." />
                </div>
                <button className="btn-primary btn-sm" onClick={ajustar} disabled={loading}>Aplicar</button>
              </div>
            </div>

            {/* Historial */}
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>{['Fecha','Tipo','Cantidad','Antes','Despues','Motivo','Usuario'].map(h => (
                  <th key={h} style={thS}>{h}</th>
                ))}</tr>
              </thead>
              <tbody>
                {kardex.length === 0 ? (
                  <tr><td colSpan={7} style={{ textAlign: 'center', padding: 30, color: '#94a3b8' }}>Sin movimientos</td></tr>
                ) : kardex.map(k => (
                  <tr key={k.id}>
                    <td style={{ ...tdS, fontSize: 11, color: '#64748b', whiteSpace: 'nowrap' }}>{new Date(k.fecha).toLocaleString('es-GT')}</td>
                    <td style={tdS}><span className={k.tipo === 'entrada' ? 'badge-green' : k.tipo === 'salida' ? 'badge-red' : 'badge-blue'} style={{ fontSize: 10, textTransform: 'capitalize' }}>{k.tipo}</span></td>
                    <td style={{ ...tdS, fontWeight: 700, textAlign: 'center' }}>{k.cantidad}</td>
                    <td style={{ ...tdS, color: '#64748b', textAlign: 'center' }}>{k.stockAntes}</td>
                    <td style={{ ...tdS, fontWeight: 700, color: '#2563eb', textAlign: 'center' }}>{k.stockDespues}</td>
                    <td style={{ ...tdS, color: '#475569', fontSize: 12 }}>{k.motivo || '—'}</td>
                    <td style={{ ...tdS, color: '#64748b', fontSize: 11 }}>{k.usuarioNombre || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}

'use client'
import { useState, useEffect } from 'react'
import { toast } from 'sonner'
import { fmtDateTime } from '@/lib/utils'

interface Cliente { id: number; nombre: string; nit: string | null; telefono: string | null; email: string | null; direccion: string | null; notas: string | null; tipo?: string; createdAt: string }
const empty = { id: 0, nombre: '', nit: '', telefono: '', email: '', direccion: '', notas: '' }

const WA_PREFIX = '502'

export default function ClientesPage() {
  const [clientes, setClientes] = useState<Cliente[]>([])
  const [buscar, setBuscar] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState<any>(empty)
  const [loading, setLoading] = useState(false)

  const load = async () => {
    const res = await fetch(`/api/clientes?buscar=${encodeURIComponent(buscar)}`)
    setClientes(await res.json())
  }

  useEffect(() => { load() }, [buscar])

  const openNew = () => { setForm(empty); setShowModal(true) }
  const openEdit = (c: Cliente) => { setForm({ id: c.id, nombre: c.nombre, nit: c.nit || '', telefono: c.telefono || '', email: c.email || '', direccion: c.direccion || '', notas: c.notas || '' }); setShowModal(true) }

  const save = async () => {
    if (!form.nombre) { toast.error('Nombre requerido'); return }
    setLoading(true)
    const res = await fetch('/api/clientes', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) })
    const data = await res.json()
    setLoading(false)
    if (data.ok) { toast.success('Guardado'); setShowModal(false); load() }
    else toast.error(data.error || 'Error')
  }

  const del = async (c: Cliente) => {
    if (!confirm(`¿Eliminar cliente "${c.nombre}"?`)) return
    const res = await fetch(`/api/clientes?id=${c.id}`, { method: 'DELETE' })
    if ((await res.json()).ok) { toast.success('Eliminado'); load() }
  }

  const abrirWA = (tel: string) => {
    const num = tel.replace(/\D/g, '')
    const prefixed = num.startsWith('502') ? num : WA_PREFIX + num
    window.open(`https://wa.me/${prefixed}`, '_blank')
  }

  const lbl: React.CSSProperties = { display: 'block', fontSize: 11, fontWeight: 700, color: '#8a887e', textTransform: 'uppercase', letterSpacing: '.5px', marginBottom: 4 }

  return (
    <div className="page-wrap" style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 16 }}>

      {/* Header */}
      <div className="page-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 700, color: '#18181b' }}>Clientes</h1>
          <p style={{ fontSize: 12, color: '#8a887e', marginTop: 2 }}>{clientes.length} registrados</p>
        </div>
        <div className="page-header-actions">
          <button className="btn-primary" onClick={openNew}>+ Nuevo cliente</button>
        </div>
      </div>

      {/* Búsqueda */}
      <div className="filter-bar" style={{ display: 'flex', gap: 10 }}>
        <input className="input" style={{ flex: 1 }} placeholder="Buscar por nombre, NIT o teléfono..." value={buscar} onChange={e => setBuscar(e.target.value)} />
      </div>

      {/* Tabla desktop / Cards móvil */}
      <div className="card">
        {/* Tabla — visible en desktop */}
        <div className="table-responsive" style={{ display: 'block' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 600 }}>
            <thead>
              <tr>
                {['Nombre', 'Teléfono', 'NIT', 'Email', 'Tipo', ''].map(h => (
                  <th key={h} className="ws-th">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {clientes.length === 0 ? (
                <tr><td colSpan={6} style={{ textAlign: 'center', padding: 40, color: '#8a887e', fontSize: 13 }}>Sin clientes registrados</td></tr>
              ) : clientes.map(c => (
                <tr key={c.id} style={{ cursor: 'default' }}>
                  <td className="ws-td" style={{ fontWeight: 600, color: '#18181b' }}>{c.nombre}</td>
                  <td className="ws-td">
                    {c.telefono
                      ? <button onClick={() => abrirWA(c.telefono!)} style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5, color: '#25D366', fontWeight: 600, fontSize: 13, padding: 0, fontFamily: 'inherit' }}>
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                          {c.telefono}
                        </button>
                      : <span style={{ color: '#8a887e', fontSize: 13 }}>—</span>
                    }
                  </td>
                  <td className="ws-td" style={{ color: '#52524d', fontSize: 12 }}>{c.nit || '—'}</td>
                  <td className="ws-td" style={{ color: '#52524d', fontSize: 12 }}>{c.email || '—'}</td>
                  <td className="ws-td">
                    <span style={{ fontSize: 10, padding: '2px 8px', borderRadius: 3, fontWeight: 700, textTransform: 'uppercase', letterSpacing: .4, background: c.tipo === 'cliente' ? '#eef5ee' : '#faf1e3', color: c.tipo === 'cliente' ? '#2f6b3a' : '#b87410', border: `1px solid ${c.tipo === 'cliente' ? '#c7dcc9' : '#e8cfa0'}` }}>
                      {c.tipo || 'prospecto'}
                    </span>
                  </td>
                  <td className="ws-td">
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button className="btn-ghost btn-sm" onClick={() => openEdit(c)}>Editar</button>
                      <button className="btn-danger btn-sm" onClick={() => del(c)}>Eliminar</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="modal-overlay" style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.5)', zIndex: 999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
          <div className="modal-box" style={{ background: '#fff', borderRadius: 10, padding: 24, width: '100%', maxWidth: 500, boxShadow: '0 20px 60px rgba(0,0,0,.2)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18, paddingBottom: 14, borderBottom: '1px solid #e3e1d8' }}>
              <h3 style={{ fontSize: 16, fontWeight: 700, color: '#18181b' }}>{form.id ? 'Editar' : 'Nuevo'} cliente</h3>
              <button onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', fontSize: 22, cursor: 'pointer', color: '#8a887e' }}>×</button>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }} className="grid-2col">
              {[
                { label: 'Nombre *', key: 'nombre', full: true },
                { label: 'NIT', key: 'nit' },
                { label: 'Teléfono (WhatsApp)', key: 'telefono' },
                { label: 'Email', key: 'email', full: true },
                { label: 'Dirección', key: 'direccion', full: true },
                { label: 'Notas', key: 'notas', full: true },
              ].map(f => (
                <div key={f.key} style={{ gridColumn: f.full ? '1/-1' : 'auto' }}>
                  <label style={lbl}>{f.label}</label>
                  <input className="input" value={form[f.key]} onChange={e => setForm((p: any) => ({ ...p, [f.key]: e.target.value }))} />
                </div>
              ))}
            </div>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 20 }}>
              <button className="btn-ghost" onClick={() => setShowModal(false)}>Cancelar</button>
              <button className="btn-primary" onClick={save} disabled={loading}>{loading ? 'Guardando...' : 'Guardar'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

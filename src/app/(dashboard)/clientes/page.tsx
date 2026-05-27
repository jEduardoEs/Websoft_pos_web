'use client'
import { useState, useEffect } from 'react'
import { toast } from 'sonner'
import { fmtDateTime } from '@/lib/utils'

interface Cliente { id: number; nombre: string; nit: string | null; telefono: string | null; email: string | null; direccion: string | null; notas: string | null; createdAt: string }
const empty = { id: 0, nombre: '', nit: '', telefono: '', email: '', direccion: '', notas: '' }

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

  return (
    <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 18 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: '#1a1f36' }}>Clientes</h1>
          <p style={{ fontSize: 13, color: '#4a5568', marginTop: 3 }}>{clientes.length} registrados</p>
        </div>
        <button className="btn-primary" onClick={openNew}>+ Nuevo Cliente</button>
      </div>

      <div className="card" style={{ padding: 14 }}>
        <input className="input" placeholder="Buscar por nombre, NIT o teléfono..." value={buscar} onChange={e => setBuscar(e.target.value)} />
      </div>

      <div className="card">
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>{['Nombre', 'NIT', 'Teléfono', 'Email', 'Dirección', 'Registrado', ''].map(h => (
                <th key={h} style={{ background: '#f4f7fb', fontSize: 11, fontWeight: 700, color: '#4a5568', textTransform: 'uppercase', letterSpacing: '.5px', padding: '9px 13px', textAlign: 'left', borderBottom: '1px solid #e2eaf4' }}>{h}</th>
              ))}</tr>
            </thead>
            <tbody>
              {clientes.length === 0 ? (
                <tr><td colSpan={7} style={{ textAlign: 'center', padding: 40, color: '#9ca3af' }}>Sin clientes</td></tr>
              ) : clientes.map(c => (
                <tr key={c.id}>
                  <td style={{ padding: '10px 13px', fontSize: 13, fontWeight: 600, borderBottom: '1px solid #f4f7fb', color: '#1a1f36' }}>{c.nombre}</td>
                  <td style={{ padding: '10px 13px', fontSize: 12, borderBottom: '1px solid #f4f7fb', color: '#4a5568' }}>{c.nit || '—'}</td>
                  <td style={{ padding: '10px 13px', fontSize: 12, borderBottom: '1px solid #f4f7fb', color: '#4a5568' }}>{c.telefono || '—'}</td>
                  <td style={{ padding: '10px 13px', fontSize: 12, borderBottom: '1px solid #f4f7fb', color: '#4a5568' }}>{c.email || '—'}</td>
                  <td style={{ padding: '10px 13px', fontSize: 12, borderBottom: '1px solid #f4f7fb', color: '#4a5568' }}>{c.direccion || '—'}</td>
                  <td style={{ padding: '10px 13px', fontSize: 12, borderBottom: '1px solid #f4f7fb', color: '#4a5568', whiteSpace: 'nowrap' }}>{fmtDateTime(c.createdAt)}</td>
                  <td style={{ padding: '10px 13px', borderBottom: '1px solid #f4f7fb' }}>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button className="btn-ghost btn-sm" onClick={() => openEdit(c)}>✏️</button>
                      <button className="btn-danger btn-sm" onClick={() => del(c)}>🗑️</button>
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
          <div style={{ background: '#fff', borderRadius: 14, padding: 28, width: '100%', maxWidth: 500 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
              <h3 style={{ fontSize: 17, fontWeight: 700, color: '#1a1f36' }}>{form.id ? 'Editar' : 'Nuevo'} Cliente</h3>
              <button onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', fontSize: 22, cursor: 'pointer', color: '#9ca3af' }}>×</button>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              {[{ label: 'Nombre *', key: 'nombre', full: true }, { label: 'NIT', key: 'nit' }, { label: 'Teléfono', key: 'telefono' }, { label: 'Email', key: 'email', full: true }, { label: 'Dirección', key: 'direccion', full: true }, { label: 'Notas', key: 'notas', full: true }].map(f => (
                <div key={f.key} style={{ gridColumn: f.full ? '1/-1' : 'auto' }}>
                  <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#4a5568', textTransform: 'uppercase', marginBottom: 4 }}>{f.label}</label>
                  <input className="input" value={form[f.key]} onChange={e => setForm((p: any) => ({ ...p, [f.key]: e.target.value }))} />
                </div>
              ))}
            </div>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 24 }}>
              <button className="btn-ghost" onClick={() => setShowModal(false)}>Cancelar</button>
              <button className="btn-primary" onClick={save} disabled={loading}>{loading ? 'Guardando...' : 'Guardar'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

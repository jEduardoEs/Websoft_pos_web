'use client'
import { useState, useEffect } from 'react'
import { toast } from 'sonner'

interface Proveedor { id: number; nombre: string; nit: string | null; telefono: string | null; email: string | null; direccion: string | null; contacto: string | null; notas: string | null }
const empty = { id: 0, nombre: '', nit: '', telefono: '', email: '', direccion: '', contacto: '', notas: '' }

export default function ProveedoresPage() {
  const [proveedores, setProveedores] = useState<Proveedor[]>([])
  const [buscar, setBuscar] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState<any>(empty)
  const [loading, setLoading] = useState(false)

  const load = async () => { setProveedores(await (await fetch(`/api/proveedores?buscar=${encodeURIComponent(buscar)}`)).json()) }
  useEffect(() => { load() }, [buscar])

  const save = async () => {
    if (!form.nombre) { toast.error('Nombre requerido'); return }
    setLoading(true)
    const res = await fetch('/api/proveedores', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) })
    setLoading(false)
    if ((await res.json()).ok) { toast.success('Guardado'); setShowModal(false); load() }
  }

  const del = async (p: Proveedor) => {
    if (!confirm(`¿Eliminar proveedor "${p.nombre}"?`)) return
    if ((await (await fetch(`/api/proveedores?id=${p.id}`, { method: 'DELETE' })).json()).ok) { toast.success('Eliminado'); load() }
  }

  const fields = [
    { label: 'Nombre *', key: 'nombre', full: true },
    { label: 'NIT', key: 'nit' }, { label: 'Teléfono', key: 'telefono' },
    { label: 'Email', key: 'email', full: true }, { label: 'Contacto', key: 'contacto' },
    { label: 'Dirección', key: 'direccion', full: true }, { label: 'Notas', key: 'notas', full: true },
  ]

  return (
    <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 18 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: '#1a1f36' }}>Proveedores</h1>
          <p style={{ fontSize: 13, color: '#4a5568', marginTop: 3 }}>{proveedores.length} registrados</p>
        </div>
        <button className="btn-primary" onClick={() => { setForm(empty); setShowModal(true) }}>+ Nuevo Proveedor</button>
      </div>

      <div className="card" style={{ padding: 14 }}>
        <input className="input" placeholder="Buscar por nombre o NIT..." value={buscar} onChange={e => setBuscar(e.target.value)} />
      </div>

      <div className="card">
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>{['Nombre', 'NIT', 'Teléfono', 'Email', 'Contacto', ''].map(h => (
                <th key={h} style={{ background: '#f4f7fb', fontSize: 11, fontWeight: 700, color: '#4a5568', textTransform: 'uppercase', padding: '9px 13px', textAlign: 'left', borderBottom: '1px solid #e2eaf4' }}>{h}</th>
              ))}</tr>
            </thead>
            <tbody>
              {proveedores.length === 0 ? <tr><td colSpan={6} style={{ textAlign: 'center', padding: 40, color: '#9ca3af' }}>Sin proveedores</td></tr>
              : proveedores.map(p => (
                <tr key={p.id}>
                  <td style={{ padding: '10px 13px', fontWeight: 600, fontSize: 13, borderBottom: '1px solid #f4f7fb' }}>{p.nombre}</td>
                  <td style={{ padding: '10px 13px', fontSize: 12, borderBottom: '1px solid #f4f7fb', color: '#4a5568' }}>{p.nit || '—'}</td>
                  <td style={{ padding: '10px 13px', fontSize: 12, borderBottom: '1px solid #f4f7fb', color: '#4a5568' }}>{p.telefono || '—'}</td>
                  <td style={{ padding: '10px 13px', fontSize: 12, borderBottom: '1px solid #f4f7fb', color: '#4a5568' }}>{p.email || '—'}</td>
                  <td style={{ padding: '10px 13px', fontSize: 12, borderBottom: '1px solid #f4f7fb', color: '#4a5568' }}>{p.contacto || '—'}</td>
                  <td style={{ padding: '10px 13px', borderBottom: '1px solid #f4f7fb' }}>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button className="btn-ghost btn-sm" onClick={() => { setForm({ id: p.id, nombre: p.nombre, nit: p.nit || '', telefono: p.telefono || '', email: p.email || '', direccion: p.direccion || '', contacto: p.contacto || '', notas: p.notas || '' }); setShowModal(true) }}>✏️</button>
                      <button className="btn-danger btn-sm" onClick={() => del(p)}>🗑️</button>
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
          <div style={{ background: '#fff', borderRadius: 14, padding: 28, width: '100%', maxWidth: 520 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
              <h3 style={{ fontSize: 17, fontWeight: 700, color: '#1a1f36' }}>{form.id ? 'Editar' : 'Nuevo'} Proveedor</h3>
              <button onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', fontSize: 22, cursor: 'pointer', color: '#9ca3af' }}>×</button>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              {fields.map(f => (
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

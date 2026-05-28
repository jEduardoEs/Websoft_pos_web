'use client'
import { useState, useEffect } from 'react'
import { toast } from 'sonner'
import { fmtDateTime } from '@/lib/utils'

interface Usuario { id: number; nombre: string; usuario: string; rol: string; activo: boolean; createdAt: string }
const empty = { id: 0, nombre: '', usuario: '', password: '', rol: 'cajero' }

export default function UsuariosPage() {
  const [usuarios, setUsuarios] = useState<Usuario[]>([])
  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState<any>(empty)
  const [loading, setLoading] = useState(false)

  const load = async () => { setUsuarios(await (await fetch('/api/usuarios')).json()) }
  useEffect(() => { load() }, [])

  const openNew = () => { setForm(empty); setShowModal(true) }
  const openEdit = (u: Usuario) => { setForm({ id: u.id, nombre: u.nombre, usuario: u.usuario, password: '', rol: u.rol }); setShowModal(true) }

  const save = async () => {
    if (!form.nombre || !form.usuario) { toast.error('Nombre y usuario son requeridos'); return }
    if (!form.id && !form.password) { toast.error('Contraseña requerida para nuevo usuario'); return }
    setLoading(true)
    const res = await fetch('/api/usuarios', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) })
    const data = await res.json()
    setLoading(false)
    if (data.ok) { toast.success('Guardado'); setShowModal(false); load() }
    else toast.error(data.error || 'Error')
  }

  const del = async (u: Usuario) => {
    if (!confirm(`¿Desactivar usuario "${u.nombre}"?`)) return
    const res = await fetch(`/api/usuarios?id=${u.id}`, { method: 'DELETE' })
    if ((await res.json()).ok) { toast.success('Usuario desactivado'); load() }
  }

  return (
    <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 18 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: '#0f172a' }}>Usuarios</h1>
          <p style={{ fontSize: 13, color: '#64748b', marginTop: 3 }}>Gestión de accesos al sistema</p>
        </div>
        <button className="btn-primary" onClick={openNew}>+ Nuevo Usuario</button>
      </div>

      <div className="card">
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>{['Nombre', 'Usuario', 'Rol', 'Estado', 'Creado', ''].map(h => (
                <th key={h} style={{ background: '#f8fafc', fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', padding: '9px 13px', textAlign: 'left', borderBottom: '1px solid #f1f5f9' }}>{h}</th>
              ))}</tr>
            </thead>
            <tbody>
              {usuarios.map(u => (
                <tr key={u.id}>
                  <td style={{ padding: '10px 13px', fontSize: 13, fontWeight: 600, borderBottom: '1px solid #f1f5f9', color: '#0f172a' }}>{u.nombre}</td>
                  <td style={{ padding: '10px 13px', fontSize: 13, borderBottom: '1px solid #f1f5f9', color: '#64748b', fontFamily: 'monospace' }}>{u.usuario}</td>
                  <td style={{ padding: '10px 13px', borderBottom: '1px solid #f1f5f9' }}><span className={u.rol === 'admin' ? 'badge-blue' : 'badge-gray'} style={{ textTransform: 'capitalize' }}>{u.rol}</span></td>
                  <td style={{ padding: '10px 13px', borderBottom: '1px solid #f1f5f9' }}><span className={u.activo ? 'badge-green' : 'badge-red'}>{u.activo ? 'Activo' : 'Inactivo'}</span></td>
                  <td style={{ padding: '10px 13px', fontSize: 12, borderBottom: '1px solid #f1f5f9', color: '#64748b', whiteSpace: 'nowrap' }}>{fmtDateTime(u.createdAt)}</td>
                  <td style={{ padding: '10px 13px', borderBottom: '1px solid #f1f5f9' }}>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button className="btn-ghost btn-sm" onClick={() => openEdit(u)}>✏️ Editar</button>
                      <button className="btn-danger btn-sm" onClick={() => del(u)}>Desactivar</button>
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
          <div style={{ background: '#ffffff', borderRadius: 14, padding: 28, width: '100%', maxWidth: 440 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
              <h3 style={{ fontSize: 17, fontWeight: 700, color: '#0f172a' }}>{form.id ? 'Editar' : 'Nuevo'} Usuario</h3>
              <button onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', fontSize: 22, cursor: 'pointer', color: '#475569' }}>×</button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {[{ label: 'Nombre completo', key: 'nombre' }, { label: 'Usuario (login)', key: 'usuario' }, { label: `Contraseña${form.id ? ' (dejar vacío para no cambiar)' : ''}`, key: 'password', type: 'password' }].map(f => (
                <div key={f.key}>
                  <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', marginBottom: 4 }}>{f.label}</label>
                  <input className="input" type={f.type || 'text'} value={form[f.key]} onChange={e => setForm((p: any) => ({ ...p, [f.key]: e.target.value }))} />
                </div>
              ))}
              <div>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', marginBottom: 4 }}>Rol</label>
                <select className="input" value={form.rol} onChange={e => setForm((p: any) => ({ ...p, rol: e.target.value }))}>
                  <option value="cajero">Cajero</option>
                  <option value="admin">Administrador</option>
                </select>
              </div>
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

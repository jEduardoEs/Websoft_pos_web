'use client'
import { useState, useEffect } from 'react'
import { toast } from 'sonner'
import { fmtDateTime } from '@/lib/utils'
import { MODULOS, PERMISOS_CAJERO_DEFAULT, parsePermisos } from '@/lib/permisos'

interface Usuario {
  id: number; nombre: string; usuario: string; rol: string
  permisos: string; activo: boolean; createdAt: string; metaMensual: number
}

const emptyForm = { id: 0, nombre: '', usuario: '', password: '', rol: 'cajero', permisos: [] as string[], metaMensual: '' }

const GROUPS = Array.from(new Set(MODULOS.map(m => m.group)))

export default function UsuariosPage() {
  const [usuarios, setUsuarios] = useState<Usuario[]>([])
  const [showModal, setShowModal] = useState(false)
  const [showPermisos, setShowPermisos] = useState(false)
  const [form, setForm] = useState(emptyForm)
  const [loading, setLoading] = useState(false)

  const load = async () => {
    const res = await fetch('/api/usuarios')
    if (res.ok) setUsuarios(await res.json())
  }
  useEffect(() => { load() }, [])

  const openNew = () => {
    setForm({ ...emptyForm, permisos: [...PERMISOS_CAJERO_DEFAULT] })
    setShowModal(true)
    setShowPermisos(false)
  }

  const openEdit = (u: Usuario) => {
    const perms = parsePermisos(u.permisos)
    setForm({
      id: u.id, nombre: u.nombre, usuario: u.usuario,
      password: '', rol: u.rol,
      permisos: perms.length > 0 ? perms : [...PERMISOS_CAJERO_DEFAULT],
      metaMensual: String(u.metaMensual || ''),
    })
    setShowModal(true)
    setShowPermisos(false)
  }

  const togglePermiso = (modulo: string) => {
    setForm(prev => ({
      ...prev,
      permisos: prev.permisos.includes(modulo)
        ? prev.permisos.filter(p => p !== modulo)
        : [...prev.permisos, modulo],
    }))
  }

  const selectAll = () => setForm(p => ({ ...p, permisos: MODULOS.map(m => m.id) }))
  const selectDefault = () => {
    const defaults: Record<string, string[]> = {
      cajero: ['dashboard', 'pos', 'ventas', 'clientes', 'cotizaciones', 'devoluciones', 'caja', 'garantias', 'servicio'],
      contador: ['dashboard', 'contabilidad', 'cuentas'],
      supervisor: ['dashboard', 'pos', 'ventas', 'pedidos', 'clientes', 'inventario', 'cotizaciones', 'devoluciones', 'caja', 'garantias', 'servicio', 'descuentos', 'cierres', 'reportes'],
      bodega: ['dashboard', 'inventario', 'compras', 'proveedores'],
    }
    const perms = defaults[form.rol] ?? [] // rol personalizado: empieza sin permisos, el admin los asigna manualmente
    setForm(p => ({ ...p, permisos: perms }))
  }
  const clearAll = () => setForm(p => ({ ...p, permisos: [] }))

  const save = async () => {
    if (!form.nombre || !form.usuario) { toast.error('Nombre y usuario son requeridos'); return }
    if (!form.id && !form.password) { toast.error('Contraseña requerida para nuevo usuario'); return }
    setLoading(true)
    const res = await fetch('/api/usuarios', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...form, permisos: form.rol === 'admin' ? [] : form.permisos, metaMensual: form.metaMensual }),
    })
    const data = await res.json()
    setLoading(false)
    if (data.ok) { toast.success('Usuario guardado'); setShowModal(false); load() }
    else toast.error(data.error || 'Error')
  }

  const del = async (u: Usuario) => {
    if (!confirm(`¿Desactivar usuario "${u.nombre}"?`)) return
    const res = await fetch(`/api/usuarios?id=${u.id}`, { method: 'DELETE' })
    if ((await res.json()).ok) { toast.success('Desactivado'); load() }
  }

  const thS = { background: '#f8fafc', fontSize: 11, fontWeight: 700 as const, color: '#64748b', textTransform: 'uppercase' as const, padding: '10px 14px', textAlign: 'left' as const, borderBottom: '1px solid #e2e8f0' }
  const tdS = { padding: '11px 14px', fontSize: 13, borderBottom: '1px solid #f1f5f9', color: '#0f172a' }
  const lbl = { display: 'block' as const, fontSize: 11, fontWeight: 700 as const, color: '#64748b', textTransform: 'uppercase' as const, marginBottom: 4 }

  return (
    <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 18 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 700, color: '#0f172a' }}>Usuarios y Permisos</h1>
          <p style={{ fontSize: 12, color: '#64748b', marginTop: 3 }}>Gestiona accesos y permisos por módulo</p>
        </div>
        <button className="btn-primary" onClick={openNew}>+ Nuevo Usuario</button>
      </div>

      <div className="card">
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>{['Nombre', 'Usuario', 'Rol', 'Módulos con acceso', 'Estado', ''].map(h => <th key={h} style={thS}>{h}</th>)}</tr>
            </thead>
            <tbody>
              {usuarios.map(u => {
                const perms = parsePermisos(u.permisos)
                const isAdmin = u.rol === 'admin'
                const modulosActivos = isAdmin ? MODULOS.length : (perms.length > 0 ? perms.length : PERMISOS_CAJERO_DEFAULT.length)
                return (
                  <tr key={u.id}>
                    <td style={{ ...tdS, fontWeight: 600 }}>{u.nombre}{u.metaMensual > 0 && <div style={{ fontSize: 10, color: '#2563eb' }}>Meta: Q {u.metaMensual.toLocaleString('es-GT')}/mes</div>}</td>
                    <td style={{ ...tdS, fontFamily: 'monospace', fontSize: 12, color: '#475569' }}>{u.usuario}</td>
                    <td style={tdS}>
                      <span className={
                        u.rol === 'admin' ? 'badge-blue' :
                        u.rol === 'contador' ? 'badge-green' :
                        u.rol === 'supervisor' ? 'badge-orange' :
                        u.rol === 'bodega' ? 'badge-purple' :
                        'badge-gray'
                      } style={{ textTransform: 'capitalize' }}>{u.rol}</span>
                    </td>
                    <td style={tdS}>
                      {isAdmin ? (
                        <span style={{ fontSize: 12, color: '#16a34a', fontWeight: 600 }}> Acceso total ({MODULOS.length} módulos)</span>
                      ) : (
                        <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                          <span style={{ fontSize: 12, color: '#2563eb', fontWeight: 600 }}>{modulosActivos} módulos</span>
                          <span style={{ fontSize: 11, color: '#94a3b8' }}>
                            {(perms.length > 0 ? perms : PERMISOS_CAJERO_DEFAULT).slice(0, 3).map(p => MODULOS.find(m => m.id === p)?.label || p).join(', ')}
                            {modulosActivos > 3 ? ` +${modulosActivos - 3} más` : ''}
                          </span>
                        </div>
                      )}
                    </td>
                    <td style={tdS}>
                      <span className={u.activo ? 'badge-green' : 'badge-red'}>{u.activo ? 'Activo' : 'Inactivo'}</span>
                    </td>
                    <td style={tdS}>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button className="btn-ghost btn-sm" onClick={() => openEdit(u)}> Editar</button>
                        <button className="btn-danger btn-sm" onClick={() => del(u)}>Desactivar</button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL */}
      {showModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.5)', zIndex: 999, display: 'flex', alignItems: 'flex-start', justifyContent: 'center', padding: 20, overflowY: 'auto' }}>
          <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 14, padding: 28, width: '100%', maxWidth: 680, margin: 'auto', boxShadow: '0 20px 60px rgba(0,0,0,.15)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 20, paddingBottom: 14, borderBottom: '1px solid #e2e8f0' }}>
              <h3 style={{ fontSize: 16, fontWeight: 700, color: '#0f172a' }}>{form.id ? 'Editar' : 'Nuevo'} Usuario</h3>
              <button onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', fontSize: 22, cursor: 'pointer', color: '#94a3b8' }}>×</button>
            </div>

            {/* Basic info */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 20 }}>
              <div style={{ gridColumn: '1/-1' }}>
                <label style={lbl}>Nombre completo</label>
                <input className="input" value={form.nombre} onChange={e => setForm(p => ({ ...p, nombre: e.target.value }))} />
              </div>
              <div>
                <label style={lbl}>Usuario (para login)</label>
                <input className="input" value={form.usuario} onChange={e => setForm(p => ({ ...p, usuario: e.target.value }))} />
              </div>
              <div>
                <label style={lbl}>{form.id ? 'Nueva contraseña (dejar vacío = no cambia)' : 'Contraseña *'}</label>
                <input className="input" type="password" value={form.password} onChange={e => setForm(p => ({ ...p, password: e.target.value }))} placeholder="••••••••" />
              </div>
              <div>
                <label style={lbl}>Rol</label>
                <input className="input" value={form.rol}
                  onChange={e => {
                    const r = e.target.value
                    const defaults: Record<string, string[]> = {
                      cajero: ['dashboard', 'pos', 'ventas', 'clientes', 'cotizaciones', 'devoluciones', 'caja', 'garantias', 'servicio'],
                      contador: ['dashboard', 'contabilidad', 'cuentas'],
                      supervisor: ['dashboard', 'pos', 'ventas', 'pedidos', 'clientes', 'inventario', 'cotizaciones', 'devoluciones', 'caja', 'garantias', 'servicio', 'descuentos', 'cierres', 'reportes'],
                      bodega: ['dashboard', 'inventario', 'compras', 'proveedores'],
                    }
                    setForm(p => ({ ...p, rol: r, permisos: defaults[r] || p.permisos }))
                  }}
                  placeholder="Ej: cajero, contador, supervisor..." />
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 6 }}>
                  {['admin','cajero','contador','supervisor','bodega'].map(r => (
                    <button key={r} type="button"
                      onClick={() => setForm(p => ({ ...p, rol: r }))}
                      style={{ fontSize: 11, padding: '3px 10px', borderRadius: 20, border: `1.5px solid ${form.rol === r ? '#2563eb' : '#e2e8f0'}`, background: form.rol === r ? '#eff6ff' : '#fff', color: form.rol === r ? '#2563eb' : '#64748b', cursor: 'pointer', fontFamily: 'inherit', fontWeight: 600 }}>
                      {r}
                    </button>
                  ))}
                </div>
                <div style={{ fontSize: 10, color: '#94a3b8', marginTop: 4 }}>Escribe el rol que quieras o selecciona uno de los predefinidos</div>
              </div>
              {!['admin','contador'].includes(form.rol) && (
                <div>
                  <label style={lbl}>Meta mensual de ventas (Q)</label>
                  <input className="input" type="number" min="0" value={form.metaMensual} onChange={e => setForm(p => ({ ...p, metaMensual: e.target.value }))} placeholder="0.00" />
                  <div style={{ fontSize: 10, color: '#94a3b8', marginTop: 3 }}>Aparece en el dashboard como objetivo del mes</div>
                </div>
              )}
            </div>

            {/* Permisos — for all non-admin roles */}
            {form.rol !== 'admin' && (
              <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 10, padding: 16, marginBottom: 20 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12, cursor: 'pointer' }}
                  onClick={() => setShowPermisos(!showPermisos)}>
                  <div>
                    <span style={{ fontWeight: 700, fontSize: 13, color: '#0f172a' }}>
                       Permisos por módulo
                    </span>
                    <span style={{ fontSize: 12, color: '#64748b', marginLeft: 8 }}>
                      {form.permisos.length} módulos activos
                    </span>
                  </div>
                  <span style={{ color: '#2563eb', fontSize: 12, fontWeight: 600 }}>{showPermisos ? '▲ Ocultar' : '▼ Configurar'}</span>
                </div>

                {showPermisos && (
                  <>
                    <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
                      <button className="btn-ghost btn-sm" onClick={selectAll}> Todos</button>
                      <button className="btn-ghost btn-sm" onClick={selectDefault}>↺ Por defecto</button>
                      <button className="btn-ghost btn-sm" onClick={clearAll}> Ninguno</button>
                    </div>
                    {GROUPS.map(group => (
                      <div key={group} style={{ marginBottom: 12 }}>
                        <div style={{ fontSize: 10, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6 }}>{group}</div>
                        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                          {MODULOS.filter(m => m.group === group).map(m => {
                            const active = form.permisos.includes(m.id)
                            return (
                              <button key={m.id} onClick={() => togglePermiso(m.id)}
                                style={{
                                  padding: '5px 12px', borderRadius: 20, fontSize: 12, fontWeight: 600,
                                  cursor: 'pointer', fontFamily: 'inherit', transition: 'all .15s',
                                  background: active ? '#2563eb' : '#fff',
                                  color: active ? '#fff' : '#475569',
                                  border: `1.5px solid ${active ? '#2563eb' : '#e2e8f0'}`,
                                }}>
                                {active ? ' ' : ''}{m.label}
                              </button>
                            )
                          })}
                        </div>
                      </div>
                    ))}
                  </>
                )}
              </div>
            )}

            {form.rol === 'admin' && (
              <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 8, padding: 12, marginBottom: 20, fontSize: 13, color: '#166534' }}>
                El administrador tiene acceso completo a todos los módulos del sistema.
              </div>
            )}

            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button className="btn-ghost" onClick={() => setShowModal(false)}>Cancelar</button>
              <button className="btn-primary" onClick={save} disabled={loading}>{loading ? 'Guardando...' : 'Guardar'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

'use client'
import { useState, useEffect } from 'react'
import { toast } from 'sonner'
import { MODULOS, PERMISOS_CAJERO_DEFAULT, parsePermisos } from '@/lib/permisos'

interface Usuario {
  id: number; nombre: string; usuario: string; rol: string
  permisos: string; activo: boolean; createdAt: string; metaMensual: number
}
interface RolDef { id: string; nombre: string; color: string; permisos: string[] }

const ROLES_BASE: RolDef[] = [
  { id: 'admin',      nombre: 'Administrador', color: '#1581E3', permisos: MODULOS.map(m => m.id) },
  { id: 'cajero',     nombre: 'Cajero',        color: '#16a34a', permisos: PERMISOS_CAJERO_DEFAULT },
  { id: 'supervisor', nombre: 'Supervisor',    color: '#d97706', permisos: ['dashboard','pos','ventas','pedidos','clientes','inventario','cotizaciones','devoluciones','caja','garantias','servicio','descuentos','cierres','reportes'] },
  { id: 'contador',   nombre: 'Contador',      color: '#9333ea', permisos: ['dashboard','contabilidad','cuentas'] },
  { id: 'bodega',     nombre: 'Bodega',        color: '#0891b2', permisos: ['dashboard','inventario','compras','proveedores'] },
]

const GROUPS = Array.from(new Set(MODULOS.map(m => m.group)))
const emptyForm = { id: 0, nombre: '', usuario: '', password: '', rol: 'cajero', permisos: [] as string[], metaMensual: '' }

export default function UsuariosPage() {
  const [usuarios, setUsuarios] = useState<Usuario[]>([])
  const [showModal, setShowModal] = useState(false)
  const [showPermisos, setShowPermisos] = useState(false)
  const [form, setForm] = useState(emptyForm)
  const [loading, setLoading] = useState(false)
  const [roles, setRoles] = useState<RolDef[]>(ROLES_BASE)

  const load = async () => {
    const [usersRes, cfgRes] = await Promise.all([fetch('/api/usuarios'), fetch('/api/config')])
    if (usersRes.ok) setUsuarios(await usersRes.json())
    try {
      const cfg = await cfgRes.json()
      let custom: RolDef[] = []
      try { custom = JSON.parse(cfg.roles_personalizados || '[]') } catch {}
      const merged = [...ROLES_BASE]
      custom.forEach((c: RolDef) => {
        const idx = merged.findIndex(r => r.id === c.id)
        if (idx >= 0) merged[idx] = c; else merged.push(c)
      })
      setRoles(merged)
    } catch {}
  }

  useEffect(() => { load() }, [])

  const openNew = () => { setForm({ ...emptyForm, permisos: [...PERMISOS_CAJERO_DEFAULT] }); setShowModal(true); setShowPermisos(false) }

  const openEdit = (u: Usuario) => {
    const perms = parsePermisos(u.permisos)
    setForm({ id: u.id, nombre: u.nombre, usuario: u.usuario, password: '', rol: u.rol, permisos: perms.length > 0 ? perms : [...PERMISOS_CAJERO_DEFAULT], metaMensual: String(u.metaMensual || '') })
    setShowModal(true); setShowPermisos(false)
  }

  const applyRol = (rolId: string) => {
    const rolDef = roles.find(r => r.id === rolId)
    const perms = (rolDef?.permisos?.length ? rolDef.permisos : [])
    setForm(p => ({ ...p, rol: rolId, permisos: perms }))
  }

  const togglePermiso = (modulo: string) => setForm(prev => ({
    ...prev,
    permisos: prev.permisos.includes(modulo) ? prev.permisos.filter(p => p !== modulo) : [...prev.permisos, modulo],
  }))

  const save = async () => {
    if (!form.nombre || !form.usuario) { toast.error('Nombre y usuario requeridos'); return }
    if (!form.id && !form.password) { toast.error('Contraseña requerida'); return }
    setLoading(true)
    const res = await fetch('/api/usuarios', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...form, permisos: form.rol === 'admin' ? [] : form.permisos }) })
    const data = await res.json()
    setLoading(false)
    if (data.ok) { toast.success('Usuario guardado'); setShowModal(false); load() }
    else toast.error(data.error || 'Error')
  }

  const del = async (u: Usuario) => {
    if (!confirm(`¿Desactivar "${u.nombre}"?`)) return
    const res = await fetch(`/api/usuarios?id=${u.id}`, { method: 'DELETE' })
    if ((await res.json()).ok) { toast.success('Usuario desactivado'); load() }
  }

  const activar = async (u: Usuario) => {
    const res = await fetch('/api/usuarios', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: u.id, accion: 'activar' }) })
    if ((await res.json()).ok) { toast.success('Usuario reactivado'); load() }
  }

  const cerrarSesion = async (u: Usuario) => {
    if (!confirm(`¿Forzar cierre de sesión de "${u.nombre}"?`)) return
    const res = await fetch('/api/usuarios', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: u.id, accion: 'cerrar_sesion' }) })
    if ((await res.json()).ok) { toast.success(`Sesión de ${u.nombre} cerrada`); load() }
    else toast.error('Error al cerrar sesión')
  }

  const rolDef = roles.find(r => r.id === form.rol)
  const rolColor = rolDef?.color || '#64748b'

  const thS = { background: '#f8fafc', fontSize: 11, fontWeight: 700 as const, color: '#64748b', textTransform: 'uppercase' as const, padding: '10px 16px', textAlign: 'left' as const, borderBottom: '1px solid #e2e8f0' }
  const tdS = { padding: '13px 16px', fontSize: 13, borderBottom: '1px solid #f1f5f9', color: '#0f172a', verticalAlign: 'middle' as const }

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
                const uRolDef = roles.find(r => r.id === u.rol)
                const uColor = uRolDef?.color || '#64748b'
                return (
                  <tr key={u.id}>
                    <td style={{ ...tdS, fontWeight: 600 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{ width: 34, height: 34, borderRadius: '50%', background: `${uColor}22`, border: `2px solid ${uColor}44`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 800, color: uColor, flexShrink: 0 }}>
                          {u.nombre[0]?.toUpperCase()}
                        </div>
                        <div>
                          <div>{u.nombre}</div>
                          {u.metaMensual > 0 && <div style={{ fontSize: 10, color: '#1581E3' }}>Meta: Q {u.metaMensual.toLocaleString('es-GT')}/mes</div>}
                        </div>
                      </div>
                    </td>
                    <td style={{ ...tdS, fontFamily: 'monospace', fontSize: 12, color: '#475569' }}>{u.usuario}</td>
                    <td style={tdS}>
                      <span style={{ padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700, background: `${uColor}18`, color: uColor, textTransform: 'capitalize', border: `1px solid ${uColor}40` }}>
                        {uRolDef?.nombre || u.rol}
                      </span>
                    </td>
                    <td style={tdS}>
                      {isAdmin
                        ? <span style={{ fontSize: 12, color: '#16a34a', fontWeight: 600 }}>Acceso total ({MODULOS.length} módulos)</span>
                        : <div>
                            <span style={{ fontSize: 12, color: '#1581E3', fontWeight: 700 }}>{modulosActivos} módulos</span>
                            <span style={{ fontSize: 11, color: '#94a3b8', marginLeft: 6 }}>
                              {(perms.length > 0 ? perms : PERMISOS_CAJERO_DEFAULT).slice(0, 3).map(p => MODULOS.find(m => m.id === p)?.label || p).join(', ')}
                              {modulosActivos > 3 ? ` +${modulosActivos - 3} más` : ''}
                            </span>
                          </div>
                      }
                    </td>
                    <td style={tdS}><span className={u.activo ? 'badge-green' : 'badge-red'}>{u.activo ? 'Activo' : 'Inactivo'}</span></td>
                    <td style={tdS}>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button className="btn-ghost btn-sm" onClick={() => openEdit(u)}>Editar</button>
                        {u.activo
                          ? <button className="btn-danger btn-sm" onClick={() => del(u)}>Desactivar</button>
                          : <button className="btn-success btn-sm" onClick={() => activar(u)}>Activar</button>
                        }
                        <button onClick={() => cerrarSesion(u)}
                          style={{ fontSize: 11, padding: '4px 9px', borderRadius: 4, border: '1.5px solid #d8d6cd', background: '#fff', cursor: 'pointer', color: '#52524d', fontFamily: 'inherit', fontWeight: 600 }}
                          title="Forzar cierre de sesión activa">
                          Cerrar sesión
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,.6)', zIndex: 999, display: 'flex', alignItems: 'flex-start', justifyContent: 'center', padding: '20px 16px', overflowY: 'auto', backdropFilter: 'blur(2px)' }}>
          <div style={{ background: '#fff', borderRadius: 16, width: '100%', maxWidth: 700, margin: 'auto', boxShadow: '0 25px 80px rgba(0,0,0,.25)', overflow: 'hidden' }}>

            {/* Header */}
            <div style={{ background: `linear-gradient(135deg, ${rolColor}, ${rolColor}bb)`, padding: '20px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                <div style={{ width: 44, height: 44, borderRadius: '50%', background: 'rgba(255,255,255,.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, fontWeight: 800, color: '#fff' }}>
                  {form.nombre ? form.nombre[0]?.toUpperCase() : (form.id ? 'E' : 'N')}
                </div>
                <div>
                  <div style={{ fontSize: 17, fontWeight: 700, color: '#fff' }}>{form.id ? 'Editar Usuario' : 'Nuevo Usuario'}</div>
                  <div style={{ fontSize: 12, color: 'rgba(255,255,255,.75)', marginTop: 1 }}>{form.nombre || 'Completa los campos'}</div>
                </div>
              </div>
              <button onClick={() => setShowModal(false)} style={{ background: 'rgba(255,255,255,.2)', border: 'none', borderRadius: 8, width: 32, height: 32, fontSize: 20, cursor: 'pointer', color: '#fff', lineHeight: 1 }}>×</button>
            </div>

            <div style={{ padding: 24 }}>
              {/* Sección info */}
              <div style={{ fontSize: 10, fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 1, display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
                <div style={{ flex: 1, height: 1, background: '#e2e8f0' }} />Información de la cuenta<div style={{ flex: 1, height: 1, background: '#e2e8f0' }} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 20 }}>
                <div style={{ gridColumn: '1/-1' }}>
                  <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#475569', marginBottom: 5 }}>Nombre completo</label>
                  <input className="input" value={form.nombre} onChange={e => setForm(p => ({ ...p, nombre: e.target.value }))} placeholder="Ej: Juan Pérez García" />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#475569', marginBottom: 5 }}>Usuario (login)</label>
                  <input className="input" value={form.usuario} onChange={e => setForm(p => ({ ...p, usuario: e.target.value }))} placeholder="ej: jperez" />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#475569', marginBottom: 5 }}>{form.id ? 'Nueva contraseña (vacío = no cambia)' : 'Contraseña *'}</label>
                  <input className="input" type="password" value={form.password} onChange={e => setForm(p => ({ ...p, password: e.target.value }))} placeholder="••••••••" />
                </div>
              </div>

              {/* Sección rol */}
              <div style={{ fontSize: 10, fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 1, display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
                <div style={{ flex: 1, height: 1, background: '#e2e8f0' }} />Rol y acceso<div style={{ flex: 1, height: 1, background: '#e2e8f0' }} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(110px, 1fr))', gap: 8, marginBottom: 12 }}>
                {roles.map(r => {
                  const active = form.rol === r.id
                  return (
                    <button key={r.id} type="button" onClick={() => applyRol(r.id)}
                      style={{ padding: '10px 8px', borderRadius: 10, border: `2px solid ${active ? r.color : '#e2e8f0'}`, background: active ? `${r.color}12` : '#fafafa', cursor: 'pointer', fontFamily: 'inherit', textAlign: 'center' }}>
                      <div style={{ width: 10, height: 10, borderRadius: '50%', background: r.color, margin: '0 auto 5px' }} />
                      <div style={{ fontSize: 12, fontWeight: active ? 700 : 600, color: active ? r.color : '#475569' }}>{r.nombre}</div>
                      <div style={{ fontSize: 10, color: '#94a3b8', marginTop: 1 }}>{r.permisos?.length || 0} módulos</div>
                    </button>
                  )
                })}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                <input className="input" value={form.rol} onChange={e => setForm(p => ({ ...p, rol: e.target.value }))} placeholder="O escribe un rol personalizado..." style={{ flex: 1 }} />
                <span style={{ fontSize: 11, color: '#94a3b8', whiteSpace: 'nowrap' }}>Activo: <strong style={{ color: rolColor }}>{rolDef?.nombre || form.rol}</strong></span>
              </div>
              {!['admin','contador'].includes(form.rol) && (
                <div style={{ marginBottom: 16 }}>
                  <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#475569', marginBottom: 5 }}>Meta mensual de ventas (Q)</label>
                  <input className="input" type="number" min="0" value={form.metaMensual} onChange={e => setForm(p => ({ ...p, metaMensual: e.target.value }))} placeholder="0.00" style={{ maxWidth: 200 }} />
                </div>
              )}

              {/* Sección permisos */}
              {form.rol !== 'admin' && (
                <>
                  <div style={{ fontSize: 10, fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 1, display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
                    <div style={{ flex: 1, height: 1, background: '#e2e8f0' }} />Permisos por módulo<div style={{ flex: 1, height: 1, background: '#e2e8f0' }} />
                  </div>
                  <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 12, overflow: 'hidden', marginBottom: 20 }}>
                    <div style={{ padding: '12px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer', borderBottom: showPermisos ? '1px solid #e2e8f0' : 'none' }} onClick={() => setShowPermisos(!showPermisos)}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{ display: 'flex', gap: 2 }}>
                          {form.permisos.slice(0, 10).map((_, i) => <div key={i} style={{ width: 7, height: 7, borderRadius: 2, background: rolColor, opacity: 0.5 + i * 0.05 }} />)}
                          {form.permisos.length > 10 && <span style={{ fontSize: 10, color: '#94a3b8' }}>+{form.permisos.length - 10}</span>}
                        </div>
                        <span style={{ fontSize: 13, fontWeight: 600, color: '#0f172a' }}>{form.permisos.length} módulos habilitados</span>
                      </div>
                      <span style={{ color: rolColor, fontSize: 12, fontWeight: 700 }}>{showPermisos ? '▲ Ocultar' : '▼ Configurar'}</span>
                    </div>
                    {showPermisos && (
                      <div style={{ padding: 16 }}>
                        <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
                          <button className="btn-ghost btn-sm" onClick={() => setForm(p => ({ ...p, permisos: MODULOS.map(m => m.id) }))}>Todos</button>
                          <button className="btn-ghost btn-sm" onClick={() => setForm(p => ({ ...p, permisos: [] }))}>Ninguno</button>
                        </div>
                        {GROUPS.map(group => (
                          <div key={group} style={{ marginBottom: 12 }}>
                            <div style={{ fontSize: 10, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6 }}>{group}</div>
                            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                              {MODULOS.filter(m => m.group === group).map(m => {
                                const active = form.permisos.includes(m.id)
                                return (
                                  <button key={m.id} onClick={() => togglePermiso(m.id)}
                                    style={{ padding: '5px 12px', borderRadius: 20, fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', background: active ? rolColor : '#fff', color: active ? '#fff' : '#475569', border: `1.5px solid ${active ? rolColor : '#e2e8f0'}` }}>
                                    {m.label}
                                  </button>
                                )
                              })}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </>
              )}

              {form.rol === 'admin' && (
                <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 10, padding: '12px 16px', marginBottom: 20, fontSize: 13, color: '#166534', fontWeight: 600 }}>
                  El administrador tiene acceso completo a todos los módulos.
                </div>
              )}

              <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', paddingTop: 8, borderTop: '1px solid #f1f5f9' }}>
                <button className="btn-ghost" onClick={() => setShowModal(false)}>Cancelar</button>
                <button onClick={save} disabled={loading}
                  style={{ padding: '10px 24px', borderRadius: 10, border: 'none', background: `linear-gradient(135deg, ${rolColor}, ${rolColor}bb)`, color: '#fff', fontWeight: 700, fontSize: 14, cursor: 'pointer', fontFamily: 'inherit', boxShadow: `0 4px 14px ${rolColor}44`, opacity: loading ? 0.7 : 1 }}>
                  {loading ? 'Guardando...' : 'Guardar Usuario'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

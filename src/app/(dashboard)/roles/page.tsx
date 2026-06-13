'use client'
import { useState, useEffect } from 'react'
import { toast } from 'sonner'
import { MODULOS, parsePermisos } from '@/lib/permisos'

interface RolDef {
  id: string          // identificador interno (usado en usuarios.rol)
  nombre: string       // nombre visible
  color: string        // color hex para el badge
  permisos: string[]   // módulos habilitados
}

const COLORES = ['#1581E3', '#16a34a', '#dc2626', '#d97706', '#9333ea', '#0891b2', '#64748b', '#db2777']

const ROLES_BASE: RolDef[] = [
  { id: 'admin',      nombre: 'Administrador', color: '#1581E3', permisos: MODULOS.map(m => m.id) },
  { id: 'cajero',     nombre: 'Cajero',        color: '#16a34a', permisos: ['dashboard','pos','ventas','clientes','cotizaciones','devoluciones','caja','garantias','servicio'] },
  { id: 'supervisor', nombre: 'Supervisor',    color: '#d97706', permisos: ['dashboard','pos','ventas','pedidos','clientes','inventario','cotizaciones','devoluciones','caja','garantias','servicio','descuentos','cierres','reportes'] },
  { id: 'contador',   nombre: 'Contador',      color: '#9333ea', permisos: ['dashboard','contabilidad','cuentas'] },
  { id: 'bodega',     nombre: 'Bodega',        color: '#0891b2', permisos: ['dashboard','inventario','compras','proveedores'] },
]

const GROUPS = Array.from(new Set(MODULOS.map(m => m.group)))

const emptyForm: RolDef = { id: '', nombre: '', color: COLORES[0], permisos: [] }

export default function RolesPage() {
  const [roles, setRoles] = useState<RolDef[]>(ROLES_BASE)
  const [usuariosPorRol, setUsuariosPorRol] = useState<Record<string, number>>({})
  const [loading, setLoading] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState<RolDef>(emptyForm)
  const [editingId, setEditingId] = useState<string | null>(null)

  const load = async () => {
    try {
      const [cfgRes, usersRes] = await Promise.all([
        fetch('/api/config'),
        fetch('/api/usuarios'),
      ])
      const cfg = await cfgRes.json()
      const usuarios = await usersRes.json()

      // Custom roles guardados en config como JSON
      let custom: RolDef[] = []
      try { custom = JSON.parse(cfg.roles_personalizados || '[]') } catch { custom = [] }

      // Merge: base + custom (custom puede sobreescribir base por id)
      const merged = [...ROLES_BASE]
      custom.forEach(c => {
        const idx = merged.findIndex(r => r.id === c.id)
        if (idx >= 0) merged[idx] = c
        else merged.push(c)
      })
      setRoles(merged)

      // Conteo de usuarios por rol
      const counts: Record<string, number> = {}
      if (Array.isArray(usuarios)) {
        usuarios.forEach((u: any) => { counts[u.rol] = (counts[u.rol] || 0) + 1 })
      }
      setUsuariosPorRol(counts)
    } catch {
      toast.error('Error al cargar roles')
    }
  }

  useEffect(() => { load() }, [])

  const persist = async (nuevaLista: RolDef[]) => {
    setLoading(true)
    // Solo guardamos los roles que NO son los 5 predefinidos base sin modificar,
    // pero si un base fue editado (color/permisos distintos), también se guarda.
    const toSave = nuevaLista.filter(r => {
      const base = ROLES_BASE.find(b => b.id === r.id)
      if (!base) return true // rol nuevo (personalizado)
      // rol base modificado
      return base.color !== r.color || JSON.stringify(base.permisos) !== JSON.stringify(r.permisos) || base.nombre !== r.nombre
    })
    const res = await fetch('/api/config', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ roles_personalizados: JSON.stringify(toSave) }),
    })
    setLoading(false)
    if ((await res.json()).ok) { toast.success('Roles actualizados'); setRoles(nuevaLista) }
    else toast.error('Error al guardar roles')
  }

  const openNew = () => {
    setForm({ ...emptyForm, color: COLORES[roles.length % COLORES.length] })
    setEditingId(null)
    setShowModal(true)
  }

  const openEdit = (r: RolDef) => {
    setForm({ ...r, permisos: [...r.permisos] })
    setEditingId(r.id)
    setShowModal(true)
  }

  const togglePermiso = (modulo: string) => {
    setForm(prev => ({
      ...prev,
      permisos: prev.permisos.includes(modulo)
        ? prev.permisos.filter(p => p !== modulo)
        : [...prev.permisos, modulo],
    }))
  }

  const slugify = (s: string) => s
    .toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')

  const save = () => {
    if (!form.nombre.trim()) { toast.error('El nombre del rol es requerido'); return }
    const id = editingId || slugify(form.nombre)
    if (!id) { toast.error('Nombre inválido'); return }
    if (!editingId && roles.some(r => r.id === id)) { toast.error('Ya existe un rol con ese identificador'); return }

    const nuevo: RolDef = { ...form, id }
    let nuevaLista: RolDef[]
    if (editingId) {
      nuevaLista = roles.map(r => r.id === editingId ? nuevo : r)
    } else {
      nuevaLista = [...roles, nuevo]
    }
    setShowModal(false)
    persist(nuevaLista)
  }

  const eliminar = async (r: RolDef) => {
    if (ROLES_BASE.some(b => b.id === r.id)) { toast.error('No se pueden eliminar los roles base, solo personalizarlos'); return }
    if ((usuariosPorRol[r.id] || 0) > 0) { toast.error(`No se puede eliminar: ${usuariosPorRol[r.id]} usuario(s) tienen este rol`); return }
    if (!confirm(`¿Eliminar el rol "${r.nombre}"?`)) return
    const nuevaLista = roles.filter(x => x.id !== r.id)
    persist(nuevaLista)
  }

  const lbl = { display: 'block' as const, fontSize: 11, fontWeight: 700 as const, color: '#64748b', textTransform: 'uppercase' as const, marginBottom: 4 }

  return (
    <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 18 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 700, color: '#0f172a' }}>Roles del Sistema</h1>
          <p style={{ fontSize: 12, color: '#64748b', marginTop: 3 }}>Crea roles 100% personalizados: nombre, color y módulos a los que tienen acceso</p>
        </div>
        <button className="btn-primary" onClick={openNew}>+ Nuevo Rol</button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 14 }}>
        {roles.map(r => (
          <div key={r.id} className="card" style={{ padding: 18, borderLeft: `4px solid ${r.color}` }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ width: 12, height: 12, borderRadius: '50%', background: r.color, display: 'inline-block' }} />
                <span style={{ fontWeight: 700, fontSize: 15, color: '#0f172a' }}>{r.nombre}</span>
              </div>
              {ROLES_BASE.some(b => b.id === r.id) && (
                <span style={{ fontSize: 10, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase' }}>Base</span>
              )}
            </div>
            <div style={{ fontSize: 11, color: '#94a3b8', marginBottom: 4 }}>id: <code>{r.id}</code></div>
            <div style={{ fontSize: 12, color: '#64748b', marginBottom: 4 }}>
              {r.id === 'admin' ? 'Acceso total (todos los módulos)' : `${r.permisos.length} módulo(s) habilitados`}
            </div>
            <div style={{ fontSize: 12, color: '#475569', marginBottom: 12 }}>
              {usuariosPorRol[r.id] || 0} usuario(s) con este rol
            </div>
            <div style={{ display: 'flex', gap: 6 }}>
              <button className="btn-ghost btn-sm" onClick={() => openEdit(r)}>Editar</button>
              {!ROLES_BASE.some(b => b.id === r.id) && (
                <button className="btn-danger btn-sm" onClick={() => eliminar(r)}>Eliminar</button>
              )}
            </div>
          </div>
        ))}
      </div>

      <div style={{ background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: 10, padding: '12px 16px', fontSize: 12, color: '#1e40af' }}>
        ℹ Al asignar un rol a un usuario en la sección "Usuarios", podrás personalizar sus permisos individualmente además de los definidos aquí.
      </div>

      {/* MODAL */}
      {showModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.5)', zIndex: 999, display: 'flex', alignItems: 'flex-start', justifyContent: 'center', padding: 20, overflowY: 'auto' }}>
          <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 14, padding: 28, width: '100%', maxWidth: 680, margin: 'auto', boxShadow: '0 20px 60px rgba(0,0,0,.15)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 20, paddingBottom: 14, borderBottom: '1px solid #e2e8f0' }}>
              <h3 style={{ fontSize: 16, fontWeight: 700, color: '#0f172a' }}>{editingId ? 'Editar' : 'Nuevo'} Rol</h3>
              <button onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', fontSize: 22, cursor: 'pointer', color: '#94a3b8' }}>×</button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 14, marginBottom: 16 }}>
              <div>
                <label style={lbl}>Nombre del rol</label>
                <input className="input" value={form.nombre} onChange={e => setForm(p => ({ ...p, nombre: e.target.value }))} placeholder="Ej: Encargado de Sucursal" disabled={!!editingId && ROLES_BASE.some(b => b.id === editingId) === false ? false : false} />
                {!editingId && <div style={{ fontSize: 10, color: '#94a3b8', marginTop: 3 }}>Identificador: <code>{slugify(form.nombre) || '...'}</code></div>}
              </div>
              <div>
                <label style={lbl}>Color identificativo</label>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 6 }}>
                  {COLORES.map(c => (
                    <button key={c} type="button" onClick={() => setForm(p => ({ ...p, color: c }))}
                      style={{ width: 26, height: 26, borderRadius: '50%', background: c, border: form.color === c ? '3px solid #0f172a' : '2px solid #fff', boxShadow: '0 0 0 1px #e2e8f0', cursor: 'pointer' }} />
                  ))}
                </div>
              </div>
            </div>

            <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 10, padding: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                <span style={{ fontWeight: 700, fontSize: 13, color: '#0f172a' }}>Permisos por módulo</span>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button className="btn-ghost btn-sm" onClick={() => setForm(p => ({ ...p, permisos: MODULOS.map(m => m.id) }))}>Todos</button>
                  <button className="btn-ghost btn-sm" onClick={() => setForm(p => ({ ...p, permisos: [] }))}>Ninguno</button>
                </div>
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
                            background: active ? form.color : '#fff',
                            color: active ? '#fff' : '#475569',
                            border: `1.5px solid ${active ? form.color : '#e2e8f0'}`,
                          }}>
                          {m.label}
                        </button>
                      )
                    })}
                  </div>
                </div>
              ))}
            </div>

            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 20 }}>
              <button className="btn-ghost" onClick={() => setShowModal(false)}>Cancelar</button>
              <button className="btn-primary" onClick={save} disabled={loading}>{loading ? 'Guardando...' : 'Guardar Rol'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

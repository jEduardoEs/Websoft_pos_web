'use client'
import { useState, useEffect, useCallback } from 'react'
import { toast } from 'sonner'
import { fmt } from '@/lib/utils'

interface UsuarioMeta {
  id: number
  nombre: string
  usuario: string
  rol: string
  metaMensual: number
  realMes?: number
  pct?: number
}

const ROLES_SIN_META = ['admin', 'contador', 'bodega']

export default function MetasPage() {
  const [usuarios, setUsuarios] = useState<UsuarioMeta[]>([])
  const [loading, setLoading] = useState(false)
  const [editando, setEditando] = useState<Record<number, string>>({})

  const load = useCallback(async () => {
    const [usersRes, dashRes] = await Promise.all([
      fetch('/api/usuarios'),
      fetch('/api/dashboard'),
    ])
    const users: any[] = await usersRes.json()
    const dash = await dashRes.json()

    const statsMap: Record<number, { realMes: number; pct: number }> = {}
    ;(dash.usuariosStats || []).forEach((s: any) => {
      statsMap[s.id] = { realMes: s.realMes, pct: s.cumplimiento ?? 0 }
    })

    setUsuarios(
      users
        .filter((u: any) => u.activo)
        .map((u: any) => ({
          id: u.id,
          nombre: u.nombre,
          usuario: u.usuario,
          rol: u.rol,
          metaMensual: u.metaMensual || 0,
          realMes: statsMap[u.id]?.realMes ?? 0,
          pct: statsMap[u.id]?.pct ?? 0,
        }))
    )
  }, [])

  useEffect(() => { load() }, [load])

  const guardarMeta = async (id: number) => {
    const valor = parseFloat(editando[id] ?? '')
    if (isNaN(valor) || valor < 0) { toast.error('Valor inválido'); return }
    setLoading(true)
    const u = usuarios.find(x => x.id === id)
    if (!u) return
    const res = await fetch('/api/usuarios', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, nombre: u.nombre, usuario: u.usuario, rol: u.rol, password: '', permisos: [], metaMensual: String(valor) }),
    })
    const data = await res.json()
    setLoading(false)
    if (data.ok) {
      toast.success(`Meta de ${u.nombre} actualizada`)
      setEditando(p => { const n = { ...p }; delete n[id]; return n })
      load()
    } else toast.error(data.error || 'Error')
  }

  const quitarMeta = async (id: number) => {
    const u = usuarios.find(x => x.id === id)
    if (!u || !confirm(`¿Quitar meta de ${u.nombre}?`)) return
    setLoading(true)
    const res = await fetch('/api/usuarios', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, nombre: u.nombre, usuario: u.usuario, rol: u.rol, password: '', permisos: [], metaMensual: '0' }),
    })
    const data = await res.json()
    setLoading(false)
    if (data.ok) { toast.success('Meta removida'); load() }
    else toast.error(data.error || 'Error')
  }

  const conMeta = usuarios.filter(u => !ROLES_SIN_META.includes(u.rol))
  const sinMeta = usuarios.filter(u => !ROLES_SIN_META.includes(u.rol) && u.metaMensual === 0)

  const thS = { background: '#f8fafc', fontSize: 11, fontWeight: 700 as const, color: '#64748b', textTransform: 'uppercase' as const, padding: '10px 16px', textAlign: 'left' as const, borderBottom: '1px solid #e2e8f0' }
  const tdS = { padding: '13px 16px', fontSize: 13, borderBottom: '1px solid #f1f5f9', verticalAlign: 'middle' as const }

  return (
    <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 18 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 700, color: '#0f172a' }}>Metas de Ventas</h1>
          <p style={{ fontSize: 12, color: '#64748b', marginTop: 3 }}>Asigna metas mensuales a cajeros y vendedores. Admin, Contador y Bodega no aparecen en el Dashboard.</p>
        </div>
      </div>

      {sinMeta.length > 0 && (
        <div style={{ background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 10, padding: '12px 16px', fontSize: 13, color: '#92400e' }}>
          {sinMeta.length} usuario(s) sin meta asignada: <strong>{sinMeta.map(u => u.nombre).join(', ')}</strong>
        </div>
      )}

      <div className="card">
        <div style={{ padding: '14px 18px', borderBottom: '1px solid #e2e8f0', fontWeight: 700, fontSize: 15, color: '#0f172a' }}>
          Vendedores y Cajeros
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                {['Usuario', 'Rol', 'Meta mensual (Q)', 'Vendido este mes', 'Avance', ''].map(h => (
                  <th key={h} style={thS}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {conMeta.length === 0 ? (
                <tr><td colSpan={6} style={{ textAlign: 'center', padding: 40, color: '#94a3b8' }}>Sin usuarios vendedores activos</td></tr>
              ) : conMeta.map(u => {
                const enEdicion = editando[u.id] !== undefined
                const pct = u.metaMensual > 0 ? Math.min(100, Math.round(((u.realMes || 0) / u.metaMensual) * 100)) : 0
                const barColor = pct >= 100 ? '#16a34a' : pct >= 70 ? '#1581E3' : pct >= 40 ? '#d97706' : '#dc2626'

                return (
                  <tr key={u.id}>
                    <td style={{ ...tdS, fontWeight: 600, color: '#0f172a' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{ width: 32, height: 32, borderRadius: '50%', background: '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 800, color: '#1581E3' }}>
                          {u.nombre[0]?.toUpperCase()}
                        </div>
                        <div>
                          <div>{u.nombre}</div>
                          <div style={{ fontSize: 11, color: '#94a3b8' }}>{u.usuario}</div>
                        </div>
                      </div>
                    </td>
                    <td style={tdS}>
                      <span style={{ padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700, background: '#eff6ff', color: '#1581E3', textTransform: 'capitalize' }}>{u.rol}</span>
                    </td>
                    <td style={tdS}>
                      {enEdicion ? (
                        <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                          <input
                            type="number" min="0" step="100"
                            value={editando[u.id]}
                            onChange={e => setEditando(p => ({ ...p, [u.id]: e.target.value }))}
                            style={{ width: 120, padding: '5px 8px', border: '2px solid #1581E3', borderRadius: 8, fontSize: 13, fontFamily: 'inherit', outline: 'none' }}
                            autoFocus
                            onKeyDown={e => { if (e.key === 'Enter') guardarMeta(u.id); if (e.key === 'Escape') setEditando(p => { const n = { ...p }; delete n[u.id]; return n }) }}
                          />
                          <button onClick={() => guardarMeta(u.id)} disabled={loading}
                            style={{ padding: '5px 12px', background: '#1581E3', color: '#fff', border: 'none', borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>
                            OK
                          </button>
                          <button onClick={() => setEditando(p => { const n = { ...p }; delete n[u.id]; return n })}
                            style={{ padding: '5px 10px', background: '#f1f5f9', color: '#64748b', border: 'none', borderRadius: 8, fontSize: 12, cursor: 'pointer', fontFamily: 'inherit' }}>
                            ×
                          </button>
                        </div>
                      ) : (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span style={{ fontSize: 15, fontWeight: 700, color: u.metaMensual > 0 ? '#0f172a' : '#94a3b8' }}>
                            {u.metaMensual > 0 ? fmt(u.metaMensual) : 'Sin meta'}
                          </span>
                          <button onClick={() => setEditando(p => ({ ...p, [u.id]: String(u.metaMensual || '') }))}
                            style={{ fontSize: 11, padding: '3px 8px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 6, cursor: 'pointer', color: '#475569', fontFamily: 'inherit', fontWeight: 600 }}>
                            Editar
                          </button>
                        </div>
                      )}
                    </td>
                    <td style={{ ...tdS, fontWeight: 600, color: '#0f172a' }}>
                      {fmt(u.realMes || 0)}
                    </td>
                    <td style={{ ...tdS, minWidth: 160 }}>
                      {u.metaMensual > 0 ? (
                        <div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, marginBottom: 4 }}>
                            <span style={{ color: '#64748b' }}>{pct}%</span>
                            <span style={{ color: barColor, fontWeight: 700 }}>
                              {pct >= 100 ? 'Cumplida' : `Faltan ${fmt(u.metaMensual - (u.realMes || 0))}`}
                            </span>
                          </div>
                          <div style={{ height: 8, background: '#e2e8f0', borderRadius: 4, overflow: 'hidden' }}>
                            <div style={{ width: `${pct}%`, height: '100%', background: barColor, borderRadius: 4, transition: 'width .3s' }} />
                          </div>
                        </div>
                      ) : (
                        <span style={{ fontSize: 12, color: '#94a3b8' }}>—</span>
                      )}
                    </td>
                    <td style={tdS}>
                      {u.metaMensual > 0 && (
                        <button onClick={() => quitarMeta(u.id)}
                          style={{ fontSize: 11, padding: '3px 8px', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 6, cursor: 'pointer', color: '#dc2626', fontFamily: 'inherit', fontWeight: 600 }}>
                          Quitar meta
                        </button>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 10, padding: '12px 16px', fontSize: 12, color: '#166534' }}>
        Solo aparecen en el Dashboard los usuarios con rol de ventas (cajero, supervisor, etc.) que tengan una meta asignada mayor a Q0.
      </div>
    </div>
  )
}

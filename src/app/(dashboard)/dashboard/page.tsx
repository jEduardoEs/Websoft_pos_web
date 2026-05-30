'use client'
import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { fmt } from '@/lib/utils'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'

function MetaBar({ meta, real, nombre, hoy }: { meta: number; real: number; nombre?: string; hoy?: number }) {
  const pct = meta > 0 ? Math.min(100, Math.round((real / meta) * 100)) : 0
  const color = pct >= 100 ? '#16a34a' : pct >= 70 ? '#d97706' : '#dc2626'
  return (
    <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 10, padding: '14px 18px' }}>
      {nombre && <div style={{ fontWeight: 700, fontSize: 13, color: '#0f172a', marginBottom: 8 }}>{nombre}</div>}
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
        <div>
          <div style={{ fontSize: 11, color: '#64748b', textTransform: 'uppercase', letterSpacing: .5 }}>Ventas del mes</div>
          <div style={{ fontSize: 20, fontWeight: 800, color: '#0f172a' }}>{fmt(real)}</div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: 11, color: '#64748b', textTransform: 'uppercase', letterSpacing: .5 }}>Meta</div>
          <div style={{ fontSize: 20, fontWeight: 800, color: '#475569' }}>{meta > 0 ? fmt(meta) : '—'}</div>
        </div>
      </div>
      {meta > 0 && (
        <>
          <div style={{ height: 10, background: '#f1f5f9', borderRadius: 5, overflow: 'hidden', marginBottom: 6 }}>
            <div style={{ height: '100%', width: `${pct}%`, background: color, borderRadius: 5, transition: 'width .5s' }} />
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
            <span style={{ fontWeight: 700, color }}>{pct}% completado</span>
            <span style={{ color: '#94a3b8' }}>Faltan {fmt(Math.max(0, meta - real))}</span>
          </div>
        </>
      )}
      {hoy !== undefined && (
        <div style={{ marginTop: 8, paddingTop: 8, borderTop: '1px solid #f1f5f9', fontSize: 12, color: '#64748b' }}>
          Hoy: <strong style={{ color: '#2563eb' }}>{fmt(hoy)}</strong>
        </div>
      )}
    </div>
  )
}

export default function DashboardPage() {
  const { data: session } = useSession()
  const [data, setData] = useState<any>(null)
  const isAdmin = session?.user?.role === 'admin'

  useEffect(() => {
    fetch('/api/dashboard').then(r => r.json()).then(setData)
  }, [])

  if (!data) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh', flexDirection: 'column', gap: 12 }}>
      <div style={{ width: 40, height: 40, border: '3px solid #e2e8f0', borderTopColor: '#2563eb', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
      <span style={{ color: '#94a3b8', fontSize: 14 }}>Cargando dashboard...</span>
    </div>
  )

  const now = new Date()
  const mesNombre = now.toLocaleString('es-GT', { month: 'long', year: 'numeric' })

  return (
    <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 18 }}>
      <div>
        <h1 style={{ fontSize: 20, fontWeight: 700, color: '#0f172a' }}>
          {isAdmin ? 'Dashboard — Administrador' : `Hola, ${session?.user?.name}`}
        </h1>
        <p style={{ fontSize: 12, color: '#64748b', marginTop: 3, textTransform: 'capitalize' }}>{mesNombre}</p>
      </div>

      {/* KPIs generales */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 14 }}>
        {[
          { label: 'Ventas hoy', value: fmt(data.ventasHoy.total), sub: `${data.ventasHoy.count} transacciones`, color: '#2563eb', bg: '#eff6ff' },
          { label: 'Ventas esta semana', value: fmt(data.ventasSemana.total), sub: `${data.ventasSemana.count} transacciones`, color: '#7c3aed', bg: '#f5f3ff' },
          { label: 'Ventas este mes', value: fmt(data.ventasMes.total), sub: `${data.ventasMes.count} transacciones`, color: '#16a34a', bg: '#f0fdf4' },
          { label: 'Clientes registrados', value: String(data.totalClientes), sub: `${data.productosbajostock} productos con stock bajo`, color: '#d97706', bg: '#fffbeb' },
        ].map(s => (
          <div key={s.label} className="card" style={{ padding: '16px 18px', borderTop: `3px solid ${s.color}` }}>
            <div style={{ fontSize: 11, color: '#64748b', textTransform: 'uppercase', letterSpacing: .5, marginBottom: 6 }}>{s.label}</div>
            <div style={{ fontSize: 24, fontWeight: 800, color: s.color }}>{s.value}</div>
            <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 4 }}>{s.sub}</div>
          </div>
        ))}
      </div>

      {/* META — Cajero ve su propia */}
      {!isAdmin && data.miMeta && (
        <div>
          <div style={{ fontSize: 13, fontWeight: 700, color: '#0f172a', marginBottom: 10 }}>📊 Mi Meta — {mesNombre}</div>
          <MetaBar
            meta={data.miMeta.meta}
            real={data.miMeta.realMes}
            hoy={data.miMeta.realHoy}
          />
          {!data.miMeta.meta && (
            <div style={{ marginTop: 8, fontSize: 12, color: '#94a3b8', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 8, padding: '10px 14px' }}>
              No tienes una meta mensual asignada. Pide al administrador que la configure en Usuarios.
            </div>
          )}
        </div>
      )}

      {/* META GENERAL — Admin ve el total + barra */}
      {isAdmin && (
        <div>
          <div style={{ fontSize: 13, fontWeight: 700, color: '#0f172a', marginBottom: 10 }}>📊 Meta del negocio — {mesNombre}</div>
          <MetaBar meta={data.metaMes} real={data.ventasMes.total} hoy={data.ventasHoy.total} />
        </div>
      )}

      {/* ADMIN: meta individual por usuario */}
      {isAdmin && data.usuariosStats?.length > 0 && (
        <div>
          <div style={{ fontSize: 13, fontWeight: 700, color: '#0f172a', marginBottom: 10 }}>👥 Meta por usuario</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px,1fr))', gap: 12 }}>
            {data.usuariosStats.map((u: any) => (
              <MetaBar key={u.id} nombre={`${u.nombre} (${u.rol})`} meta={u.meta} real={u.realMes} hoy={u.realHoy} />
            ))}
          </div>
        </div>
      )}

      {/* Gráfica 7 días */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 14 }}>
        <div className="card" style={{ padding: 18 }}>
          <div style={{ fontWeight: 700, fontSize: 14, color: '#0f172a', marginBottom: 16 }}>Ventas últimos 7 días</div>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={data.ventasDia}>
              <XAxis dataKey="dia" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} tickFormatter={v => `Q${(v/1000).toFixed(0)}k`} />
              <Tooltip formatter={(v: any) => fmt(v)} />
              <Bar dataKey="total" fill="#2563eb" radius={[4, 4, 0, 0]} name="Total" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Alertas rápidas */}
        <div className="card" style={{ padding: 18 }}>
          <div style={{ fontWeight: 700, fontSize: 14, color: '#0f172a', marginBottom: 14 }}>⚡ Pendientes</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {[
              { label: 'Órdenes de servicio activas', value: data.ordenesPendientes, href: '/servicio', accentColor: '#2563eb' },
              { label: 'Cotizaciones pendientes', value: data.cotizacionesPendientes, href: '/cotizaciones', accentColor: '#d97706' },
              { label: 'Garantías por vencer (30 días)', value: data.garantiasPorVencer, href: '/garantias', accentColor: '#dc2626' },
              { label: 'Productos stock bajo', value: data.productosbajostock, href: '/inventario', accentColor: '#7c3aed' },
            ].map(item => (
              <a key={item.label} href={item.href} style={{ textDecoration: 'none', display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 12px', background: '#f8fafc', borderRadius: 8, border: '1px solid #e2e8f0', transition: 'all .15s' }}>
                <span style={{ fontSize: 12, color: '#475569' }}>{item.label}</span>
                <span style={{ fontWeight: 800, fontSize: 16, color: item.value > 0 ? item.accentColor : '#94a3b8' }}>{item.value}</span>
              </a>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

'use client'
import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { fmt } from '@/lib/utils'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'

function MetaBar({ meta, real, nombre, hoy }: { meta: number; real: number; nombre?: string; hoy?: number }) {
  const pct = meta > 0 ? Math.min(100, Math.round((real / meta) * 100)) : 0
  const color = pct >= 100 ? '#2f6b3a' : pct >= 70 ? '#b87410' : '#b13a2e'
  return (
    <div style={{ background: '#fff', border: '1.5px solid #d8d6cd', borderRadius: 6, padding: '14px 18px' }}>
      {nombre && <div style={{ fontWeight: 700, fontSize: 13, color: '#18181b', marginBottom: 8 }}>{nombre}</div>}
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
        <div>
          <div style={{ fontSize: 10, color: '#8a887e', textTransform: 'uppercase', letterSpacing: .6, fontWeight: 700 }}>Ventas del mes</div>
          <div className="num-display" style={{ fontSize: 20, color: '#18181b' }}>{fmt(real)}</div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: 10, color: '#8a887e', textTransform: 'uppercase', letterSpacing: .6, fontWeight: 700 }}>Meta</div>
          <div className="num-display" style={{ fontSize: 20, color: '#52524d' }}>{meta > 0 ? fmt(meta) : '—'}</div>
        </div>
      </div>
      {meta > 0 && (
        <>
          <div style={{ height: 8, background: '#f4f3ef', border: '1px solid #e3e1d8', borderRadius: 3, overflow: 'hidden', marginBottom: 6 }}>
            <div style={{ height: '100%', width: `${pct}%`, background: color, transition: 'width .5s' }} />
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
            <span style={{ fontWeight: 700, color }}>{pct}% completado</span>
            <span style={{ color: '#8a887e' }}>Faltan {fmt(Math.max(0, meta - real))}</span>
          </div>
        </>
      )}
      {hoy !== undefined && (
        <div style={{ marginTop: 8, paddingTop: 8, borderTop: '1px solid #e3e1d8', fontSize: 12, color: '#52524d' }}>
          Hoy: <strong className="num-display" style={{ color: '#1581E3', fontWeight: 700 }}>{fmt(hoy)}</strong>
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
      <div style={{ width: 32, height: 32, border: '2.5px solid #e3e1d8', borderTopColor: '#1581E3', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
      <span style={{ color: '#8a887e', fontSize: 14 }}>Cargando dashboard...</span>
    </div>
  )

  const now = new Date()
  const mesNombre = now.toLocaleString('es-GT', { month: 'long', year: 'numeric' })

  return (
    <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 18 }}>
      <div>
        <h1 style={{ fontSize: 20, fontWeight: 700, color: '#18181b' }}>
          {isAdmin ? 'Dashboard — Administrador' : `Hola, ${session?.user?.name}`}
        </h1>
        <p style={{ fontSize: 12, color: '#8a887e', marginTop: 3, textTransform: 'capitalize' }}>{mesNombre}</p>
      </div>

      {/* KPIs generales */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 14 }} className="dash-kpis">
        {[
          { label: 'Ventas hoy', value: fmt(data.ventasHoy.total), sub: `${data.ventasHoy.count} transacciones`, accent: false },
          { label: 'Ventas esta semana', value: fmt(data.ventasSemana.total), sub: `${data.ventasSemana.count} transacciones`, accent: false },
          { label: 'Ventas este mes', value: fmt(data.ventasMes.total), sub: `${data.ventasMes.count} transacciones`, accent: true },
          { label: 'Clientes registrados', value: String(data.totalClientes), sub: `${data.productosbajostock} productos con stock bajo`, accent: false },
        ].map(s => (
          <div key={s.label} className="card" style={{ padding: '16px 18px' }}>
            <div style={{ fontSize: 10, color: '#8a887e', textTransform: 'uppercase', letterSpacing: .6, fontWeight: 700, marginBottom: 8 }}>{s.label}</div>
            <div className="num-display" style={{ fontSize: 26, color: s.accent ? '#1581E3' : '#18181b' }}>{s.value}</div>
            <div style={{ fontSize: 11, color: '#8a887e', marginTop: 5 }}>{s.sub}</div>
          </div>
        ))}
      </div>

      {/* META — Cajero ve su propia */}
      {!isAdmin && data.miMeta && (
        <div>
          <div style={{ fontSize: 13, fontWeight: 700, color: '#18181b', marginBottom: 10 }}>Mi meta — {mesNombre}</div>
          <MetaBar
            meta={data.miMeta.meta}
            real={data.miMeta.realMes}
            hoy={data.miMeta.realHoy}
          />
          {!data.miMeta.meta && (
            <div style={{ marginTop: 8, fontSize: 12, color: '#8a887e', background: '#f4f3ef', border: '1.5px solid #d8d6cd', borderRadius: 4, padding: '10px 14px' }}>
              No tienes una meta mensual asignada. Pide al administrador que la configure en Usuarios.
            </div>
          )}
        </div>
      )}

      {/* META GENERAL — Admin ve el total + barra */}
      {isAdmin && (
        <div>
          <div style={{ fontSize: 13, fontWeight: 700, color: '#18181b', marginBottom: 10 }}>Meta del negocio — {mesNombre}</div>
          <MetaBar meta={data.metaMes} real={data.ventasMes.total} hoy={data.ventasHoy.total} />
        </div>
      )}

      {/* ADMIN: meta individual por usuario */}
      {isAdmin && data.usuariosStats?.length > 0 && (
        <div>
          <div style={{ fontSize: 13, fontWeight: 700, color: '#18181b', marginBottom: 10 }}>Meta por usuario</div>
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
          <div style={{ fontWeight: 700, fontSize: 14, color: '#18181b', marginBottom: 16 }}>Ventas últimos 7 días</div>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={data.ventasDia}>
              <XAxis dataKey="dia" tick={{ fontSize: 11 }} stroke="#d8d6cd" />
              <YAxis tick={{ fontSize: 11 }} tickFormatter={v => `Q${(v/1000).toFixed(0)}k`} stroke="#d8d6cd" />
              <Tooltip formatter={(v: any) => fmt(v)} />
              <Bar dataKey="total" fill="#18181b" radius={[2, 2, 0, 0]} name="Total" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Alertas rápidas */}
        <div className="card" style={{ padding: 18 }}>
          <div style={{ fontWeight: 700, fontSize: 14, color: '#18181b', marginBottom: 14 }}>Pendientes</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {[
              { label: 'Órdenes de servicio activas', value: data.ordenesPendientes, href: '/servicio' },
              { label: 'Cotizaciones pendientes', value: data.cotizacionesPendientes, href: '/cotizaciones' },
              { label: 'Garantías por vencer (30 días)', value: data.garantiasPorVencer, href: '/garantias' },
              { label: 'Productos stock bajo', value: data.productosbajostock, href: '/inventario' },
            ].map(item => (
              <a key={item.label} href={item.href} style={{ textDecoration: 'none', display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 12px', background: '#f4f3ef', borderRadius: 4, border: '1px solid #e3e1d8' }}>
                <span style={{ fontSize: 12, color: '#52524d' }}>{item.label}</span>
                <span className="num-display" style={{ fontSize: 16, color: item.value > 0 ? '#18181b' : '#8a887e' }}>{item.value}</span>
              </a>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

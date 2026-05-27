import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { fmt, fmtDateTime } from '@/lib/utils'

export const dynamic = 'force-dynamic'

async function getDashboardData() {
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const [ventasHoy, totalHoy, ventasMes, productosLow, topProductos, ultimasVentas] = await Promise.all([
    prisma.venta.count({ where: { fecha: { gte: today }, estado: 'completada' } }),
    prisma.venta.aggregate({ where: { fecha: { gte: today }, estado: 'completada' }, _sum: { total: true } }),
    prisma.venta.aggregate({
      where: { fecha: { gte: new Date(today.getFullYear(), today.getMonth(), 1) }, estado: 'completada' },
      _sum: { total: true },
    }),
    prisma.producto.count({ where: { activo: true, stock: { lte: prisma.producto.fields.stockMinimo } } }),
    prisma.ventaItem.groupBy({
      by: ['nombre'],
      where: { venta: { fecha: { gte: today }, estado: 'completada' } },
      _sum: { cantidad: true, subtotal: true },
      orderBy: { _sum: { cantidad: 'desc' } },
      take: 5,
    }),
    prisma.venta.findMany({ where: { estado: 'completada' }, orderBy: { fecha: 'desc' }, take: 8 }),
  ])

  const lowProds = await prisma.producto.findMany({
    where: { activo: true, stock: { lte: 5 } },
    orderBy: { stock: 'asc' },
    take: 8,
    select: { nombre: true, stock: true, stockMinimo: true, categoria: true },
  })

  return {
    ventasHoy, totalHoy: totalHoy._sum.total || 0,
    totalMes: ventasMes._sum.total || 0,
    productosLow, topProductos, ultimasVentas, lowProds,
  }
}

export default async function DashboardPage() {
  const session = await auth()
  const d = await getDashboardData()

  const stats = [
    { label: 'Ventas hoy', value: String(d.ventasHoy), color: '#2B7FD4', bg: '#e8f3fd', icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2' },
    { label: 'Total hoy', value: fmt(d.totalHoy), color: '#22c55e', bg: '#dcfce7', icon: 'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 8v1m0 4a9 9 0 110-18 9 9 0 010 18z' },
    { label: 'Total mes', value: fmt(d.totalMes), color: '#f59e0b', bg: '#fff7ed', icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z' },
    { label: 'Stock bajo', value: String(d.productosLow), color: '#ef4444', bg: '#fef2f2', icon: 'M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z' },
  ]

  return (
    <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 18 }}>
      <div>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: '#1a1f36' }}>Dashboard</h1>
        <p style={{ fontSize: 13, color: '#4a5568', marginTop: 3 }}>Bienvenido, {session?.user?.name}</p>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 14 }}>
        {stats.map(s => (
          <div key={s.label} className="card" style={{ padding: '16px 18px', display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 44, height: 44, borderRadius: 12, background: s.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <svg width="20" height="20" fill="none" stroke={s.color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                <path d={s.icon} />
              </svg>
            </div>
            <div>
              <div style={{ fontSize: 22, fontWeight: 700, color: '#1a1f36', lineHeight: 1 }}>{s.value}</div>
              <div style={{ fontSize: 11, color: '#4a5568', marginTop: 3 }}>{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
        {/* Top productos */}
        <div className="card">
          <div style={{ padding: '14px 18px', borderBottom: '1px solid #e2eaf4', fontWeight: 700, fontSize: 14, color: '#1a1f36' }}>
            Top Productos Hoy
          </div>
          <div style={{ padding: '0 18px' }}>
            {d.topProductos.length === 0 ? (
              <p style={{ color: '#9ca3af', fontSize: 13, padding: '20px 0', textAlign: 'center' }}>Sin ventas hoy</p>
            ) : d.topProductos.map((p, i) => (
              <div key={p.nombre} style={{ display: 'flex', alignItems: 'center', padding: '10px 0', borderBottom: i < d.topProductos.length - 1 ? '1px solid #f4f7fb' : 'none' }}>
                <span style={{ width: 22, height: 22, background: '#e8f3fd', borderRadius: '50%', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, color: '#2B7FD4', marginRight: 10, flexShrink: 0 }}>{i + 1}</span>
                <span style={{ flex: 1, fontSize: 13, color: '#1a1f36' }}>{p.nombre}</span>
                <span style={{ fontSize: 12, color: '#4a5568' }}>{p._sum.cantidad} uds — {fmt(p._sum.subtotal || 0)}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Stock bajo */}
        <div className="card">
          <div style={{ padding: '14px 18px', borderBottom: '1px solid #e2eaf4', fontWeight: 700, fontSize: 14, color: '#1a1f36' }}>
            Productos con Stock Bajo
          </div>
          <div style={{ padding: '0 18px' }}>
            {d.lowProds.length === 0 ? (
              <p style={{ color: '#9ca3af', fontSize: 13, padding: '20px 0', textAlign: 'center' }}>Todo en orden ✓</p>
            ) : d.lowProds.map((p, i) => (
              <div key={p.nombre} style={{ display: 'flex', alignItems: 'center', padding: '10px 0', borderBottom: i < d.lowProds.length - 1 ? '1px solid #f4f7fb' : 'none' }}>
                <span style={{ flex: 1, fontSize: 13, color: '#1a1f36' }}>{p.nombre}</span>
                <span className={p.stock <= 0 ? 'badge-red' : 'badge-orange'} style={{ marginLeft: 8 }}>
                  {p.stock <= 0 ? 'Sin stock' : `${p.stock} uds`}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Últimas ventas */}
      <div className="card">
        <div style={{ padding: '14px 18px', borderBottom: '1px solid #e2eaf4', fontWeight: 700, fontSize: 14, color: '#1a1f36' }}>
          Últimas Ventas
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                {['#', 'Fecha', 'Cliente', 'Método', 'Total', 'Estado'].map(h => (
                  <th key={h} style={{ background: '#f4f7fb', fontSize: 11, fontWeight: 700, color: '#4a5568', textTransform: 'uppercase', letterSpacing: '.5px', padding: '9px 13px', textAlign: 'left', borderBottom: '1px solid #e2eaf4' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {d.ultimasVentas.map(v => (
                <tr key={v.id} style={{ cursor: 'pointer' }}>
                  <td style={{ padding: '10px 13px', fontSize: 13, color: '#1a1f36', borderBottom: '1px solid #f4f7fb', fontWeight: 600, color: '#2B7FD4' }}>{v.numero}</td>
                  <td style={{ padding: '10px 13px', fontSize: 13, color: '#1a1f36', borderBottom: '1px solid #f4f7fb' }}>{fmtDateTime(v.fecha)}</td>
                  <td style={{ padding: '10px 13px', fontSize: 13, color: '#1a1f36', borderBottom: '1px solid #f4f7fb' }}>{v.clienteNombre}</td>
                  <td style={{ padding: '10px 13px', fontSize: 13, borderBottom: '1px solid #f4f7fb' }}><span className="badge-blue" style={{ textTransform: 'capitalize' }}>{v.metodoPago}</span></td>
                  <td style={{ padding: '10px 13px', fontSize: 13, fontWeight: 700, color: '#1a1f36', borderBottom: '1px solid #f4f7fb' }}>{fmt(v.total)}</td>
                  <td style={{ padding: '10px 13px', fontSize: 13, borderBottom: '1px solid #f4f7fb' }}><span className={v.estado === 'completada' ? 'badge-green' : 'badge-red'} style={{ textTransform: 'capitalize' }}>{v.estado}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

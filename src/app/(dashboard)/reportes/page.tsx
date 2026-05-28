'use client'
import { useState } from 'react'
import { toast } from 'sonner'
import { fmt, fmtDate } from '@/lib/utils'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts'

const COLORS = ['#2B7FD4', '#22c55e', '#f59e0b', '#8b5cf6', '#ef4444']

export default function ReportesPage() {
  const today = new Date().toISOString().slice(0, 10)
  const firstDay = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().slice(0, 10)
  const [fi, setFi] = useState(firstDay)
  const [ff, setFf] = useState(today)
  const [reporte, setReporte] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  const generar = async () => {
    setLoading(true)
    const res = await fetch(`/api/reportes?fecha_ini=${fi}&fecha_fin=${ff}`)
    if (!res.ok) { toast.error('Error al generar reporte'); setLoading(false); return }
    setReporte(await res.json())
    setLoading(false)
  }

  const preset = (days: number) => {
    const end = new Date()
    const start = new Date()
    start.setDate(start.getDate() - days)
    setFi(start.toISOString().slice(0, 10))
    setFf(end.toISOString().slice(0, 10))
  }

  const diasData = reporte ? Object.entries(reporte.porDia).sort(([a], [b]) => a.localeCompare(b)).slice(-14).map(([dia, v]: any) => ({ dia: dia.slice(5), total: v.total })) : []
  const metodosData = reporte ? Object.entries(reporte.porMetodo).map(([met, v]: any) => ({ name: met, value: v.total })) : []

  return (
    <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 18 }}>
      <div>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: '#0f172a' }}>Reportes</h1>
        <p style={{ fontSize: 13, color: '#64748b', marginTop: 3 }}>Análisis detallado de ventas</p>
      </div>

      <div className="card" style={{ padding: 16 }}>
        <div style={{ display: 'flex', gap: 10, alignItems: 'flex-end', flexWrap: 'wrap' }}>
          <div>
            <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', marginBottom: 4 }}>Desde</label>
            <input className="input" type="date" value={fi} onChange={e => setFi(e.target.value)} />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', marginBottom: 4 }}>Hasta</label>
            <input className="input" type="date" value={ff} onChange={e => setFf(e.target.value)} />
          </div>
          <button className="btn-primary" onClick={generar} disabled={loading}>{loading ? 'Generando...' : 'Generar'}</button>
          {[['Hoy', 0], ['7 días', 7], ['30 días', 30], ['90 días', 90]].map(([label, days]) => (
            <button key={label as string} className="btn-ghost btn-sm" onClick={() => preset(days as number)}>{label}</button>
          ))}
        </div>
      </div>

      {reporte && (
        <>
          {/* KPIs */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 14 }}>
            {[
              { label: 'Total ventas', value: String(reporte.totalVentas), color: '#2563eb' },
              { label: 'Ingresos totales', value: fmt(reporte.granTotal), color: '#16a34a' },
              { label: 'Total descuentos', value: fmt(reporte.totalDescuento), color: '#f59e0b' },
              { label: 'Total impuestos', value: fmt(reporte.totalImpuesto), color: '#8b5cf6' },
            ].map(s => (
              <div key={s.label} className="card" style={{ padding: '16px 18px', textAlign: 'center' }}>
                <div style={{ fontSize: 24, fontWeight: 700, color: s.color }}>{s.value}</div>
                <div style={{ fontSize: 11, color: '#64748b', marginTop: 4 }}>{s.label}</div>
              </div>
            ))}
          </div>

          {/* Charts */}
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 14 }}>
            <div className="card" style={{ padding: 18 }}>
              <div style={{ fontWeight: 700, fontSize: 14, color: '#0f172a', marginBottom: 16 }}>Ventas por día</div>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={diasData}>
                  <XAxis dataKey="dia" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} tickFormatter={v => `Q${v.toFixed(0)}`} />
                  <Tooltip formatter={(v: any) => fmt(v)} />
                  <Bar dataKey="total" fill="#2B7FD4" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="card" style={{ padding: 18 }}>
              <div style={{ fontWeight: 700, fontSize: 14, color: '#0f172a', marginBottom: 16 }}>Métodos de pago</div>
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie data={metodosData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label={({ name, percent }: any) => `${name} ${(percent * 100).toFixed(0)}%`}>
                    {metodosData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip formatter={(v: any) => fmt(v)} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Top productos */}
          <div className="card">
            <div style={{ padding: '14px 18px', borderBottom: '1px solid #f1f5f9', fontWeight: 700, fontSize: 14, color: '#0f172a' }}>Top 10 Productos</div>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr>{['#', 'Producto', 'Unidades', 'Total'].map(h => (
                    <th key={h} style={{ background: '#f8fafc', fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', padding: '9px 13px', textAlign: 'left', borderBottom: '1px solid #f1f5f9' }}>{h}</th>
                  ))}</tr>
                </thead>
                <tbody>
                  {reporte.topProductos.map((p: any, i: number) => (
                    <tr key={i}>
                      <td style={{ padding: '10px 13px', fontSize: 13, borderBottom: '1px solid #f1f5f9', color: '#64748b' }}>{i + 1}</td>
                      <td style={{ padding: '10px 13px', fontSize: 13, fontWeight: 600, borderBottom: '1px solid #f1f5f9' }}>{p.nombre}</td>
                      <td style={{ padding: '10px 13px', fontSize: 13, borderBottom: '1px solid #f1f5f9' }}>{p.qty}</td>
                      <td style={{ padding: '10px 13px', fontSize: 13, fontWeight: 700, borderBottom: '1px solid #f1f5f9', color: '#16a34a' }}>{fmt(p.total)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Por cajero */}
          <div className="card">
            <div style={{ padding: '14px 18px', borderBottom: '1px solid #f1f5f9', fontWeight: 700, fontSize: 14, color: '#0f172a' }}>Ventas por Cajero</div>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr>{['Cajero', 'Ventas', 'Total'].map(h => (
                    <th key={h} style={{ background: '#f8fafc', fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', padding: '9px 13px', textAlign: 'left', borderBottom: '1px solid #f1f5f9' }}>{h}</th>
                  ))}</tr>
                </thead>
                <tbody>
                  {reporte.porCajero.sort((a: any, b: any) => b.total - a.total).map((c: any, i: number) => (
                    <tr key={i}>
                      <td style={{ padding: '10px 13px', fontSize: 13, fontWeight: 600, borderBottom: '1px solid #f1f5f9' }}>{c.nombre}</td>
                      <td style={{ padding: '10px 13px', fontSize: 13, borderBottom: '1px solid #f1f5f9' }}>{c.ventas}</td>
                      <td style={{ padding: '10px 13px', fontSize: 13, fontWeight: 700, borderBottom: '1px solid #f1f5f9', color: '#2563eb' }}>{fmt(c.total)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  )
}

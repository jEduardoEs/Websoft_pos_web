'use client'
import { useState, useEffect } from 'react'
import { toast } from 'sonner'
import { fmt } from '@/lib/utils'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine, Cell, Legend } from 'recharts'

const MESES = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre']

export default function PresupuestoPage() {
  const [anio, setAnio] = useState(new Date().getFullYear())
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [editMes, setEditMes] = useState<number | null>(null)
  const [metaInput, setMetaInput] = useState('')

  const load = async () => {
    const res = await fetch(`/api/presupuesto?anio=${anio}`)
    setData(await res.json())
  }

  useEffect(() => { load() }, [anio])

  const saveMeta = async (mes: number) => {
    setLoading(true)
    const res = await fetch('/api/presupuesto', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ anio, mes, meta: parseFloat(metaInput) || 0 }),
    })
    setLoading(false)
    if ((await res.json()).ok) { toast.success('Meta guardada'); setEditMes(null); load() }
  }

  if (!data) return <div style={{ padding: 40, textAlign: 'center', color: '#64748b' }}>Cargando...</div>

  const mesCurrent = new Date().getMonth() + 1
  const chartData = data.meses.map((m: any) => ({
    name: m.mesNombre.slice(0, 3),
    Meta: m.meta,
    Real: m.real,
    cumplimiento: m.cumplimiento,
  }))

  return (
    <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 18 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 700, color: '#0f172a' }}>Presupuesto vs Real</h1>
          <p style={{ fontSize: 12, color: '#64748b', marginTop: 3 }}>Compara tus metas de ventas con los resultados reales</p>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <button className="btn-ghost btn-sm" onClick={() => setAnio(a => a - 1)}>← {anio - 1}</button>
          <span style={{ fontWeight: 700, fontSize: 16, color: '#0f172a', padding: '0 8px' }}>{anio}</span>
          <button className="btn-ghost btn-sm" onClick={() => setAnio(a => a + 1)}>{anio + 1} →</button>
        </div>
      </div>

      {/* KPIs anuales */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 14 }}>
        {[
          { label: 'Meta anual', value: fmt(data.totalMeta), color: '#2563eb' },
          { label: 'Ventas reales', value: fmt(data.totalReal), color: '#16a34a' },
          { label: 'Diferencia', value: fmt(Math.abs(data.diferencia)), color: data.diferencia >= 0 ? '#16a34a' : '#dc2626', prefix: data.diferencia >= 0 ? '↑ ' : '↓ ' },
          { label: 'Cumplimiento', value: data.totalMeta > 0 ? `${Math.round((data.totalReal / data.totalMeta) * 100)}%` : '—', color: data.totalReal >= data.totalMeta ? '#16a34a' : '#d97706' },
        ].map(s => (
          <div key={s.label} className="card" style={{ padding: '16px 18px' }}>
            <div style={{ fontSize: 11, color: '#64748b', textTransform: 'uppercase', letterSpacing: .5, marginBottom: 6 }}>{s.label}</div>
            <div style={{ fontSize: 22, fontWeight: 800, color: s.color }}>{(s.prefix || '')}{s.value}</div>
          </div>
        ))}
      </div>

      {/* Chart */}
      <div className="card" style={{ padding: 18 }}>
        <div style={{ fontWeight: 700, fontSize: 14, color: '#0f172a', marginBottom: 16 }}>Meta vs Real por mes</div>
        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={chartData} barGap={4}>
            <XAxis dataKey="name" tick={{ fontSize: 11 }} />
            <YAxis tick={{ fontSize: 11 }} tickFormatter={v => `Q${(v/1000).toFixed(0)}k`} />
            <Tooltip formatter={(v: any) => fmt(v)} />
            <Legend />
            <Bar dataKey="Meta" fill="#bfdbfe" radius={[4,4,0,0]} />
            <Bar dataKey="Real" radius={[4,4,0,0]}>
              {chartData.map((entry: any, i: number) => (
                <Cell key={i} fill={entry.Real >= entry.Meta ? '#16a34a' : entry.Real >= entry.Meta * 0.7 ? '#d97706' : '#dc2626'} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Tabla mensual */}
      <div className="card">
        <div style={{ padding: '14px 18px', borderBottom: '1px solid #e2e8f0', fontWeight: 700, fontSize: 14, color: '#0f172a' }}>
          Detalle por mes — clic en meta para editar
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>{['Mes', 'Meta', 'Real', 'Diferencia', 'Cumplimiento', 'Ventas', ''].map(h => (
                <th key={h} style={{ background: '#f8fafc', fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', padding: '10px 14px', textAlign: 'left', borderBottom: '1px solid #e2e8f0' }}>{h}</th>
              ))}</tr>
            </thead>
            <tbody>
              {data.meses.map((m: any) => {
                const isCurrent = m.mes === mesCurrent && anio === new Date().getFullYear()
                const pct = m.cumplimiento
                return (
                  <tr key={m.mes} style={{ background: isCurrent ? '#fffbeb' : 'transparent' }}>
                    <td style={{ padding: '11px 14px', fontWeight: isCurrent ? 700 : 400, fontSize: 13, borderBottom: '1px solid #f1f5f9', color: '#0f172a' }}>
                      {m.mesNombre} {isCurrent && <span style={{ fontSize: 10, background: '#fef3c7', color: '#d97706', padding: '2px 6px', borderRadius: 10, marginLeft: 6 }}>Actual</span>}
                    </td>
                    <td style={{ padding: '11px 14px', borderBottom: '1px solid #f1f5f9' }}>
                      {editMes === m.mes ? (
                        <div style={{ display: 'flex', gap: 6 }}>
                          <input className="input" type="number" value={metaInput} onChange={e => setMetaInput(e.target.value)} style={{ width: 120, fontSize: 12 }} autoFocus onKeyDown={e => e.key === 'Enter' && saveMeta(m.mes)} />
                          <button className="btn-primary btn-sm" onClick={() => saveMeta(m.mes)} disabled={loading}></button>
                          <button className="btn-ghost btn-sm" onClick={() => setEditMes(null)}><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg></button>
                        </div>
                      ) : (
                        <span onClick={() => { setEditMes(m.mes); setMetaInput(String(m.meta)) }}
                          style={{ cursor: 'pointer', fontWeight: 600, color: '#2563eb', textDecoration: 'underline dotted' }}>
                          {m.meta > 0 ? fmt(m.meta) : '+ Agregar meta'}
                        </span>
                      )}
                    </td>
                    <td style={{ padding: '11px 14px', fontWeight: 700, fontSize: 13, borderBottom: '1px solid #f1f5f9', color: '#0f172a' }}>{fmt(m.real)}</td>
                    <td style={{ padding: '11px 14px', fontWeight: 700, fontSize: 13, borderBottom: '1px solid #f1f5f9', color: m.diferencia >= 0 ? '#16a34a' : '#dc2626' }}>
                      {m.diferencia >= 0 ? '+' : ''}{fmt(m.diferencia)}
                    </td>
                    <td style={{ padding: '11px 14px', borderBottom: '1px solid #f1f5f9' }}>
                      {m.meta > 0 ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <div style={{ width: 80, height: 8, background: '#f1f5f9', borderRadius: 4, overflow: 'hidden' }}>
                            <div style={{ width: `${Math.min(100, pct)}%`, height: '100%', background: pct >= 100 ? '#16a34a' : pct >= 70 ? '#d97706' : '#dc2626', transition: 'width .3s' }} />
                          </div>
                          <span style={{ fontSize: 12, fontWeight: 700, color: pct >= 100 ? '#16a34a' : pct >= 70 ? '#d97706' : '#dc2626' }}>{pct}%</span>
                        </div>
                      ) : <span style={{ color: '#94a3b8', fontSize: 12 }}>Sin meta</span>}
                    </td>
                    <td style={{ padding: '11px 14px', fontSize: 13, borderBottom: '1px solid #f1f5f9', color: '#64748b' }}>{m.numVentas}</td>
                    <td style={{ padding: '11px 14px', borderBottom: '1px solid #f1f5f9' }}>
                      <button className="btn-ghost btn-sm" onClick={() => { setEditMes(m.mes); setMetaInput(String(m.meta)) }} style={{ fontSize: 10 }}> Meta</button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

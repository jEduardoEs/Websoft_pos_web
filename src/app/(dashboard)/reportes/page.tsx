'use client'
import { useState } from 'react'
import { toast } from 'sonner'
import { fmt, fmtDate, fmtDateTime } from '@/lib/utils'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'

const COLORS = ['#2563eb', '#16a34a', '#d97706', '#8b5cf6', '#dc2626']

export default function ReportesPage() {
  const today = new Date().toISOString().slice(0, 10)
  const firstDay = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().slice(0, 10)
  const [fi, setFi] = useState(firstDay)
  const [ff, setFf] = useState(today)
  const [reporte, setReporte] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [pdfLoading, setPdfLoading] = useState(false)

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

  const exportarPDF = () => {
    if (!reporte) { toast.error('Genera el reporte primero'); return }
    setPdfLoading(true)

    const ivaPct = 5
    const ivaRecaudado = reporte.granTotal * (ivaPct / (100 + ivaPct))

    const diasRows = Object.entries(reporte.porDia)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([dia, v]: any) => `
        <tr>
          <td>${new Date(dia).toLocaleDateString('es-GT')}</td>
          <td class="center">${v.ventas}</td>
          <td class="right">Q ${v.total.toFixed(2)}</td>
          <td class="right">Q ${(v.total / v.ventas).toFixed(2)}</td>
          <td class="center">0</td>
        </tr>`).join('')

    const metodosRows = Object.entries(reporte.porMetodo)
      .map(([met, v]: any) => `
        <tr>
          <td style="text-transform:capitalize">${met}</td>
          <td class="center">${v.ventas}</td>
          <td class="right">Q ${v.total.toFixed(2)}</td>
        </tr>`).join('')

    const topRows = reporte.topProductos.slice(0, 10)
      .map((p: any, i: number) => `
        <tr>
          <td class="center">${i + 1}</td>
          <td>${p.nombre}</td>
          <td class="center">${p.qty}</td>
          <td class="right">Q ${p.total.toFixed(2)}</td>
        </tr>`).join('')

    const cajeroRows = reporte.porCajero
      .sort((a: any, b: any) => b.total - a.total)
      .map((c: any) => `
        <tr>
          <td>${c.nombre}</td>
          <td class="center">${c.ventas}</td>
          <td class="right">Q ${c.total.toFixed(2)}</td>
        </tr>`).join('')

    const detalleRows = reporte.detalle.slice(0, 50)
      .map((v: any) => `
        <tr>
          <td class="mono">${v.numero}</td>
          <td>${new Date(v.fecha).toLocaleString('es-GT')}</td>
          <td>${v.clienteNombre}</td>
          <td class="right">Q ${v.total.toFixed(2)}</td>
          <td style="text-transform:capitalize">${v.metodoPago}</td>
          <td class="green">completada</td>
          <td>${v.usuarioNombre || ''}</td>
        </tr>`).join('')

    const w = window.open('', '_blank', 'width=1000,height=800')
    if (!w) { setPdfLoading(false); return }

    w.document.write(`<!DOCTYPE html>
<html><head><meta charset="UTF-8">
<style>
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
  *{margin:0;padding:0;box-sizing:border-box}
  body{font-family:'Inter',sans-serif;font-size:11px;color:#0f172a;background:#fff;padding:28px 32px}
  .header{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:20px;padding-bottom:16px;border-bottom:2px solid #2563eb}
  .logo-area{display:flex;align-items:center;gap:12px}
  .logo-img{width:52px;height:52px;border-radius:10px;object-fit:contain}
  .brand{font-size:20px;font-weight:700;color:#0f172a}
  .brand span{color:#2563eb}
  .brand-sub{font-size:9px;color:#64748b;letter-spacing:1px;margin-top:2px}
  .report-info{text-align:right}
  .report-title{font-size:18px;font-weight:700;color:#2563eb}
  .report-meta{font-size:10px;color:#64748b;line-height:1.7;margin-top:3px}
  .kpis{display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin-bottom:20px}
  .kpi{background:#f8fafc;border:1px solid #e2e8f0;border-radius:10px;padding:14px 16px;text-align:center}
  .kpi-val{font-size:20px;font-weight:700;color:#2563eb;margin-bottom:3px}
  .kpi-lbl{font-size:9px;color:#64748b;text-transform:uppercase;letter-spacing:.5px}
  h3{font-size:13px;font-weight:700;color:#1e40af;margin:18px 0 8px;padding-bottom:5px;border-bottom:1px solid #e0f2fe}
  table{width:100%;border-collapse:collapse;margin-bottom:14px}
  thead tr{background:#eff6ff}
  thead th{padding:7px 10px;font-size:10px;font-weight:700;text-align:left;color:#1e40af;text-transform:uppercase;letter-spacing:.3px;border-bottom:2px solid #bfdbfe}
  tbody tr:nth-child(even){background:#f8fafc}
  tbody td{padding:7px 10px;font-size:10px;border-bottom:1px solid #f1f5f9;color:#374151}
  .center{text-align:center}.right{text-align:right}.mono{font-family:monospace;font-size:9px;color:#2563eb;font-weight:700}
  .green{color:#16a34a;font-weight:600}
  .footer{margin-top:24px;padding-top:12px;border-top:1px solid #e2e8f0;display:flex;justify-content:space-between;font-size:9px;color:#94a3b8}
  @media print{body{padding:14px}@page{margin:8mm;size:A4}}
</style>
</head><body>

<div class="header">
  <div class="logo-area">
    <img class="logo-img" src="https://websoft-solutions.vercel.app/logo.png" alt="Logo" onerror="this.style.display='none'"/>
    <div>
      <div class="brand">Web<span>Soft</span> Solutions</div>
      <div class="brand-sub">GUASTATOYA · EL PROGRESO · GUATEMALA</div>
    </div>
  </div>
  <div class="report-info">
    <div class="report-title">Reporte de Ventas</div>
    <div class="report-meta">
      Periodo: ${fi} al ${ff}<br>
      Generado: ${new Date().toLocaleString('es-GT')}<br>
      Sistema POS WebSoft Solutions
    </div>
  </div>
</div>

<div class="kpis">
  <div class="kpi">
    <div class="kpi-val">${reporte.totalVentas}</div>
    <div class="kpi-lbl">Ventas completadas</div>
  </div>
  <div class="kpi">
    <div class="kpi-val">Q ${reporte.granTotal.toFixed(2)}</div>
    <div class="kpi-lbl">Monto total</div>
  </div>
  <div class="kpi">
    <div class="kpi-val">Q ${ivaRecaudado.toFixed(2)}</div>
    <div class="kpi-lbl">IVA recaudado (5%)</div>
  </div>
  <div class="kpi">
    <div class="kpi-val">0</div>
    <div class="kpi-lbl">Anuladas</div>
  </div>
</div>

<h3>Ventas por dia</h3>
<table>
  <thead><tr><th>Fecha</th><th class="center">Ventas</th><th class="right">Total</th><th class="right">Promedio</th><th class="center">Anuladas</th></tr></thead>
  <tbody>${diasRows}</tbody>
</table>

<h3>Por metodo de pago</h3>
<table>
  <thead><tr><th>Metodo</th><th class="center">Cantidad</th><th class="right">Total</th></tr></thead>
  <tbody>${metodosRows}</tbody>
</table>

<h3>Top 10 Productos</h3>
<table>
  <thead><tr><th class="center">#</th><th>Producto</th><th class="center">Unidades</th><th class="right">Total</th></tr></thead>
  <tbody>${topRows}</tbody>
</table>

<h3>Por cajero</h3>
<table>
  <thead><tr><th>Cajero</th><th class="center">Ventas</th><th class="right">Total</th></tr></thead>
  <tbody>${cajeroRows}</tbody>
</table>

<h3>Detalle de ventas</h3>
<table>
  <thead><tr><th>N°</th><th>Fecha</th><th>Cliente</th><th class="right">Total</th><th>Metodo</th><th>Estado</th><th>Cajero</th></tr></thead>
  <tbody>${detalleRows}</tbody>
</table>

<div class="footer">
  <span>WebSoft Solutions POS · Reporte generado el ${new Date().toLocaleString('es-GT')}</span>
  <span>Guastatoya, El Progreso, Guatemala · Tel: 3836-1044</span>
</div>

</body></html>`)
    w.document.close()
    setTimeout(() => {
      w.print()
      setPdfLoading(false)
    }, 800)
  }

  const diasData = reporte ? Object.entries(reporte.porDia).sort(([a], [b]) => a.localeCompare(b)).slice(-14).map(([dia, v]: any) => ({ dia: dia.slice(5), total: v.total })) : []
  const metodosData = reporte ? Object.entries(reporte.porMetodo).map(([met, v]: any) => ({ name: met, value: v.total })) : []

  const thStyle = { background: '#f8fafc', fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase' as const, letterSpacing: '.5px', padding: '10px 14px', textAlign: 'left' as const, borderBottom: '1px solid #e2e8f0' }
  const tdStyle = { padding: '10px 14px', fontSize: 13, borderBottom: '1px solid #f1f5f9', color: '#0f172a' }

  return (
    <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 18 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 700, color: '#0f172a' }}>Reportes</h1>
          <p style={{ fontSize: 12, color: '#64748b', marginTop: 3 }}>Analisis detallado de ventas</p>
        </div>
        {reporte && (
          <button
            className="btn-primary"
            onClick={exportarPDF}
            disabled={pdfLoading}
            style={{ display: 'flex', alignItems: 'center', gap: 8 }}
          >
            <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
              <path d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
            </svg>
            {pdfLoading ? 'Generando...' : 'Exportar PDF'}
          </button>
        )}
      </div>

      {/* Filters */}
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
          {[['Hoy', 0], ['7 dias', 7], ['30 dias', 30], ['Este mes', -1]].map(([label, days]) => (
            <button key={label as string} className="btn-ghost btn-sm" onClick={() => {
              if (days === -1) {
                setFi(firstDay); setFf(today)
              } else {
                preset(days as number)
              }
            }}>{label}</button>
          ))}
        </div>
      </div>

      {reporte && (
        <>
          {/* KPIs */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 14 }}>
            {[
              { label: 'Ventas completadas', value: String(reporte.totalVentas), color: '#2563eb', bg: '#eff6ff' },
              { label: 'Monto total', value: fmt(reporte.granTotal), color: '#16a34a', bg: '#f0fdf4' },
              { label: 'IVA recaudado (5%)', value: fmt(reporte.granTotal * (5/105)), color: '#d97706', bg: '#fffbeb' },
              { label: 'Descuentos dados', value: fmt(reporte.totalDescuento), color: '#dc2626', bg: '#fef2f2' },
            ].map(s => (
              <div key={s.label} className="card" style={{ padding: '16px 18px', display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 24, fontWeight: 700, color: s.color, lineHeight: 1 }}>{s.value}</div>
                  <div style={{ fontSize: 11, color: '#64748b', marginTop: 4 }}>{s.label}</div>
                </div>
              </div>
            ))}
          </div>

          {/* Charts */}
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 14 }}>
            <div className="card" style={{ padding: 18 }}>
              <div style={{ fontWeight: 700, fontSize: 14, color: '#0f172a', marginBottom: 16 }}>Ventas por dia</div>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={diasData}>
                  <XAxis dataKey="dia" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} tickFormatter={v => `Q${v.toFixed(0)}`} />
                  <Tooltip formatter={(v: any) => fmt(v)} />
                  <Bar dataKey="total" fill="#2563eb" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="card" style={{ padding: 18 }}>
              <div style={{ fontWeight: 700, fontSize: 14, color: '#0f172a', marginBottom: 16 }}>Metodos de pago</div>
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie data={metodosData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80}
                    label={({ name, percent }: any) => `${name} ${(percent * 100).toFixed(0)}%`}>
                    {metodosData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip formatter={(v: any) => fmt(v)} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Top productos */}
          <div className="card">
            <div style={{ padding: '14px 18px', borderBottom: '1px solid #e2e8f0', fontWeight: 700, fontSize: 14, color: '#0f172a' }}>Top 10 Productos</div>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead><tr>{['#', 'Producto', 'Unidades', 'Total'].map(h => <th key={h} style={thStyle}>{h}</th>)}</tr></thead>
                <tbody>
                  {reporte.topProductos.map((p: any, i: number) => (
                    <tr key={i}>
                      <td style={{ ...tdStyle, color: '#64748b' }}>{i + 1}</td>
                      <td style={{ ...tdStyle, fontWeight: 600 }}>{p.nombre}</td>
                      <td style={tdStyle}>{p.qty}</td>
                      <td style={{ ...tdStyle, fontWeight: 700, color: '#16a34a' }}>{fmt(p.total)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Por cajero */}
          <div className="card">
            <div style={{ padding: '14px 18px', borderBottom: '1px solid #e2e8f0', fontWeight: 700, fontSize: 14, color: '#0f172a' }}>Ventas por Cajero</div>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead><tr>{['Cajero', 'Ventas', 'Total'].map(h => <th key={h} style={thStyle}>{h}</th>)}</tr></thead>
                <tbody>
                  {reporte.porCajero.sort((a: any, b: any) => b.total - a.total).map((c: any, i: number) => (
                    <tr key={i}>
                      <td style={{ ...tdStyle, fontWeight: 600 }}>{c.nombre}</td>
                      <td style={tdStyle}>{c.ventas}</td>
                      <td style={{ ...tdStyle, fontWeight: 700, color: '#2563eb' }}>{fmt(c.total)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Detalle */}
          <div className="card">
            <div style={{ padding: '14px 18px', borderBottom: '1px solid #e2e8f0', fontWeight: 700, fontSize: 14, color: '#0f172a' }}>
              Detalle de Ventas ({reporte.detalle.length})
            </div>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr>{['N°', 'Fecha', 'Cliente', 'Total', 'Metodo', 'Estado', 'Cajero'].map(h => <th key={h} style={thStyle}>{h}</th>)}</tr>
                </thead>
                <tbody>
                  {reporte.detalle.map((v: any) => (
                    <tr key={v.id}>
                      <td style={{ ...tdStyle, fontWeight: 700, color: '#2563eb', fontFamily: 'monospace', fontSize: 12 }}>{v.numero}</td>
                      <td style={{ ...tdStyle, color: '#64748b', fontSize: 12, whiteSpace: 'nowrap' }}>{fmtDateTime(v.fecha)}</td>
                      <td style={tdStyle}>{v.clienteNombre}</td>
                      <td style={{ ...tdStyle, fontWeight: 700 }}>{fmt(v.total)}</td>
                      <td style={tdStyle}><span className="badge-blue" style={{ textTransform: 'capitalize' }}>{v.metodoPago}</span></td>
                      <td style={tdStyle}><span className="badge-green">completada</span></td>
                      <td style={{ ...tdStyle, color: '#64748b' }}>{v.usuarioNombre}</td>
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

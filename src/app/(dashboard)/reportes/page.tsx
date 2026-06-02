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
  const [tabReporte, setTabReporte] = useState<'ventas' | 'inventario'>('ventas')
  const [invReporte, setInvReporte] = useState<any>(null)
  const [invLoading, setInvLoading] = useState(false)

  const generar = async () => {
    setLoading(true)
    const res = await fetch(`/api/reportes?fecha_ini=${fi}&fecha_fin=${ff}`)
    if (!res.ok) { toast.error('Error al generar reporte'); setLoading(false); return }
    setReporte(await res.json())
    setLoading(false)
  }

  const exportarInventarioPDF = () => {
    if (!invReporte) return
    const { resumen, porCategoria } = invReporte
    const html = `<!DOCTYPE html><html><head><meta charset="UTF-8"/><style>
      *{margin:0;padding:0;box-sizing:border-box}
      body{font-family:Arial,sans-serif;font-size:11px;color:#0f172a;padding:20px}
      .header{display:flex;justify-content:space-between;align-items:flex-start;padding-bottom:12px;border-bottom:2px solid #2563eb;margin-bottom:16px}
      .logo{font-size:18px;font-weight:700}.logo span{color:#2563eb}
      .badge{font-size:9px;font-weight:700;background:#2563eb;color:#fff;padding:3px 10px;border-radius:20px}
      .kpis{display:grid;grid-template-columns:repeat(4,1fr);gap:10px;margin-bottom:16px}
      .kpi{border:1px solid #e2e8f0;border-radius:6px;padding:10px 12px;border-top:3px solid}
      .kpi-label{font-size:9px;color:#64748b;text-transform:uppercase;margin-bottom:4px}
      .kpi-value{font-size:16px;font-weight:700}
      table{width:100%;border-collapse:collapse;margin-bottom:14px}
      th{background:#f8fafc;font-size:10px;font-weight:700;color:#64748b;text-transform:uppercase;padding:7px 10px;text-align:left;border-bottom:1px solid #e2e8f0}
      td{padding:7px 10px;font-size:11px;border-bottom:1px solid #f1f5f9}
      .right{text-align:right}.center{text-align:center}
      .total-row td{font-weight:700;background:#f8fafc;border-top:2px solid #e2e8f0}
      .footer{margin-top:16px;padding-top:10px;border-top:1px solid #e2e8f0;display:flex;justify-content:space-between;font-size:9px;color:#94a3b8}
      @media print{@page{margin:8mm;size:A4}}
    </style></head><body>
    <div class="header">
      <div><div class="logo">Web<span>Soft</span> Solutions</div><div style="font-size:9px;color:#64748b;margin-top:2px">Guastatoya, El Progreso</div></div>
      <div style="text-align:right"><div class="badge">VALORACION DE INVENTARIO</div><div style="font-size:9px;color:#64748b;margin-top:5px">Generado: ${new Date().toLocaleDateString('es-GT')}</div></div>
    </div>
    <div class="kpis">
      <div class="kpi" style="border-top-color:#2563eb"><div class="kpi-label">Total productos</div><div class="kpi-value" style="color:#2563eb">${resumen.totalProductos}</div></div>
      <div class="kpi" style="border-top-color:#d97706"><div class="kpi-label">Inversion total</div><div class="kpi-value" style="color:#d97706">Q ${resumen.totalInversion.toFixed(2)}</div></div>
      <div class="kpi" style="border-top-color:#16a34a"><div class="kpi-label">Valor de venta</div><div class="kpi-value" style="color:#16a34a">Q ${resumen.totalValorVenta.toFixed(2)}</div></div>
      <div class="kpi" style="border-top-color:#7c3aed"><div class="kpi-label">Ganancia proyectada</div><div class="kpi-value" style="color:#7c3aed">Q ${resumen.gananciaProyectada.toFixed(2)}</div></div>
    </div>
    <table>
      <thead><tr><th>Categoria</th><th class="center">Productos</th><th class="center">Unidades</th><th class="right">Inversion (costo)</th><th class="right">Valor venta</th><th class="right">Ganancia</th><th class="right">Margen</th></tr></thead>
      <tbody>
        ${porCategoria.map((cat: any) => {
          const gan = cat.valorVenta - cat.inversion
          const mar = cat.inversion > 0 ? Math.round((gan/cat.inversion)*100) : 0
          return `<tr><td style="font-weight:600">${cat.categoria}</td><td class="center">${cat.items}</td><td class="center">${cat.stock}</td><td class="right">Q ${cat.inversion.toFixed(2)}</td><td class="right">Q ${cat.valorVenta.toFixed(2)}</td><td class="right" style="color:#7c3aed">Q ${gan.toFixed(2)}</td><td class="right" style="font-weight:700;color:${mar>=30?'#16a34a':mar>=15?'#d97706':'#dc2626'}">${mar}%</td></tr>`
        }).join('')}
        <tr class="total-row"><td>TOTALES</td><td class="center">${resumen.totalProductos}</td><td class="center">${resumen.totalUnidades}</td><td class="right">Q ${resumen.totalInversion.toFixed(2)}</td><td class="right">Q ${resumen.totalValorVenta.toFixed(2)}</td><td class="right">Q ${resumen.gananciaProyectada.toFixed(2)}</td><td class="right">${resumen.margenProyectado}%</td></tr>
      </tbody>
    </table>
    <div style="margin-top:10px;padding:10px;background:#fef3c7;border-radius:6px;font-size:10px;color:#92400e"><strong>Alertas:</strong> ${resumen.productosStockBajo} productos con stock bajo · ${resumen.productosAgotados} productos agotados</div>
    <div class="footer"><span>WebSoft Solutions · Guastatoya, El Progreso</span><span>Este reporte es confidencial</span></div>
    <script>window.onload=function(){window.print()}</script></body></html>`
    const w = window.open('', '_blank')
    if (w) { w.document.write(html); w.document.close() }
  }

  const loadInventario = async () => {
    setInvLoading(true)
    const res = await fetch('/api/reportes/inventario')
    setInvReporte(await res.json())
    setInvLoading(false)
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
      .map(([dia, v]: any) => `<tr><td>${new Date(dia).toLocaleDateString('es-GT')}</td><td class="center">${v.ventas}</td><td class="right">Q ${v.total.toFixed(2)}</td><td class="right">Q ${(v.total / v.ventas).toFixed(2)}</td><td class="center">0</td></tr>`).join('')
    const prodRows = (reporte.topProductos || []).slice(0, 15).map((p: any) =>
      `<tr><td>${p.nombre}</td><td class="center">${p.cantidad}</td><td class="right">Q ${p.total.toFixed(2)}</td><td class="center">${Math.round((p.total / reporte.granTotal) * 100)}%</td></tr>`).join('')
    const html = `<!DOCTYPE html><html><head><meta charset="UTF-8"/><style>
      *{margin:0;padding:0;box-sizing:border-box}body{font-family:Arial,sans-serif;font-size:11px;color:#0f172a;padding:20px}
      .header{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:20px;padding-bottom:14px;border-bottom:2px solid #2563eb}
      .logo{font-size:20px;font-weight:800;color:#0f172a}.logo span{color:#2563eb}
      .badge{font-size:9px;font-weight:700;background:#2563eb;color:#fff;padding:3px 10px;border-radius:20px;letter-spacing:1px}
      .kpis{display:grid;grid-template-columns:repeat(4,1fr);gap:10px;margin-bottom:18px}
      .kpi{border:1px solid #e2e8f0;border-radius:8px;padding:12px;border-top:3px solid}
      .kpi-label{font-size:9px;color:#64748b;text-transform:uppercase;letter-spacing:.5px;margin-bottom:5px}
      .kpi-value{font-size:18px;font-weight:800}.kpi-sub{font-size:9px;color:#94a3b8;margin-top:3px}
      table{width:100%;border-collapse:collapse;margin-bottom:14px}
      th{background:#f8fafc;font-size:10px;font-weight:700;color:#64748b;text-transform:uppercase;padding:7px 10px;text-align:left;border-bottom:1px solid #e2e8f0}
      td{padding:7px 10px;font-size:11px;border-bottom:1px solid #f1f5f9}.center{text-align:center}.right{text-align:right}
      .section-title{font-size:13px;font-weight:700;color:#0f172a;margin:18px 0 10px;border-left:3px solid #2563eb;padding-left:10px}
      .footer{margin-top:20px;padding-top:12px;border-top:1px solid #e2e8f0;display:flex;justify-content:space-between;font-size:9px;color:#94a3b8}
      @media print{body{padding:14px}@page{margin:8mm;size:A4}}
    </style></head><body>
    <div class="header">
      <div><div class="logo">Web<span>Soft</span> Solutions</div><div style="font-size:9px;color:#64748b;margin-top:3px">Guastatoya, El Progreso</div></div>
      <div style="text-align:right"><div class="badge">REPORTE DE VENTAS</div><div style="font-size:9px;color:#64748b;margin-top:6px">Periodo: ${new Date(fi).toLocaleDateString('es-GT')} – ${new Date(ff).toLocaleDateString('es-GT')}</div></div>
    </div>
    <div class="kpis">
      <div class="kpi" style="border-top-color:#2563eb"><div class="kpi-label">Total ventas</div><div class="kpi-value" style="color:#2563eb">${reporte.totalVentas}</div></div>
      <div class="kpi" style="border-top-color:#16a34a"><div class="kpi-label">Ingresos</div><div class="kpi-value" style="color:#16a34a">Q ${reporte.granTotal.toFixed(2)}</div></div>
      <div class="kpi" style="border-top-color:#d97706"><div class="kpi-label">IVA recaudado</div><div class="kpi-value" style="color:#d97706">Q ${ivaRecaudado.toFixed(2)}</div></div>
      <div class="kpi" style="border-top-color:#7c3aed"><div class="kpi-label">Ticket prom.</div><div class="kpi-value" style="color:#7c3aed">Q ${reporte.totalVentas > 0 ? (reporte.granTotal / reporte.totalVentas).toFixed(2) : '0.00'}</div></div>
    </div>
    <div class="section-title">Ventas por dia</div>
    <table><thead><tr><th>Fecha</th><th class="center">Ventas</th><th class="right">Total</th><th class="right">Ticket prom.</th><th class="center">Dev.</th></tr></thead><tbody>${diasRows}</tbody></table>
    <div class="section-title">Productos mas vendidos</div>
    <table><thead><tr><th>Producto</th><th class="center">Cantidad</th><th class="right">Total</th><th class="center">% ingresos</th></tr></thead><tbody>${prodRows}</tbody></table>
    <div class="footer"><span>WebSoft Solutions · Guastatoya, El Progreso</span><span>Generado el ${new Date().toLocaleDateString('es-GT')}</span></div>
    <script>window.onload=function(){window.print()}</script></body></html>`
    const w = window.open('', '_blank')
    if (w) { w.document.write(html); w.document.close() }
    setTimeout(() => setPdfLoading(false), 800)
  }

  const diasData = reporte ? Object.entries(reporte.porDia).sort(([a], [b]) => a.localeCompare(b)).slice(-14).map(([dia, v]: any) => ({ dia: dia.slice(5), total: v.total })) : []
  const metodosData = reporte ? Object.entries(reporte.porMetodo).map(([met, v]: any) => ({ name: met, value: v.total })) : []

  const thS = { background: '#f8fafc', fontSize: 11, fontWeight: 700 as const, color: '#64748b', textTransform: 'uppercase' as const, padding: '10px 14px', textAlign: 'left' as const, borderBottom: '1px solid #e2e8f0' }
  const tdS = { padding: '10px 14px', fontSize: 13, borderBottom: '1px solid #f1f5f9', color: '#0f172a' }

  return (
    <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 18 }}>

      {/* Tab switcher */}
      <div style={{ display: 'flex', gap: 4, background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 10, padding: 4, width: 'fit-content' }}>
        {([['ventas', 'Reporte de Ventas'], ['inventario', 'Valoracion de Inventario']] as const).map(([id, label]) => (
          <button key={id} onClick={() => { setTabReporte(id); if (id === 'inventario') loadInventario() }}
            style={{ padding: '8px 18px', border: 'none', borderRadius: 8, cursor: 'pointer', fontSize: 13, fontWeight: 600, fontFamily: 'inherit', background: tabReporte === id ? '#2563eb' : 'transparent', color: tabReporte === id ? '#fff' : '#64748b', transition: 'all .15s' }}>
            {label}
          </button>
        ))}
      </div>

      {/* ── INVENTARIO TAB ─────────────────────────────────── */}
      {tabReporte === 'inventario' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {invLoading && (
            <div style={{ textAlign: 'center', padding: 60, color: '#64748b' }}>Cargando valoracion...</div>
          )}
          {!invReporte && !invLoading && (
            <div style={{ textAlign: 'center', padding: 60 }}>
              <p style={{ fontSize: 14, color: '#94a3b8', marginBottom: 16 }}>Haz clic para generar la valoracion del inventario</p>
              <button className="btn-primary" onClick={loadInventario}>Generar valoracion</button>
            </div>
          )}
          {invReporte && (
            <>
              {/* Export button */}
              <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <button className="btn-ghost" onClick={exportarInventarioPDF} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/>
                  </svg>
                  Exportar PDF
                </button>
              </div>
              {/* KPIs */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 14 }}>
                {[
                  { label: 'Total productos', value: String(invReporte.resumen.totalProductos), color: '#2563eb', sub: `${invReporte.resumen.totalUnidades} unidades en stock` },
                  { label: 'Inversion total', value: fmt(invReporte.resumen.totalInversion), color: '#d97706', sub: 'Costo total del inventario' },
                  { label: 'Valor de venta', value: fmt(invReporte.resumen.totalValorVenta), color: '#16a34a', sub: `Margen proyectado ${invReporte.resumen.margenProyectado}%` },
                  { label: 'Ganancia proyectada', value: fmt(invReporte.resumen.gananciaProyectada), color: '#7c3aed', sub: `${invReporte.resumen.productosStockBajo} stock bajo · ${invReporte.resumen.productosAgotados} agotados` },
                ].map(k => (
                  <div key={k.label} className="card" style={{ padding: '16px 18px', borderTop: `3px solid ${k.color}` }}>
                    <div style={{ fontSize: 11, color: '#64748b', textTransform: 'uppercase', marginBottom: 6 }}>{k.label}</div>
                    <div style={{ fontSize: 22, fontWeight: 800, color: k.color }}>{k.value}</div>
                    <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 4 }}>{k.sub}</div>
                  </div>
                ))}
              </div>

              {/* Por categoria */}
              <div className="card" style={{ padding: 18 }}>
                <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 14 }}>Inversion por categoria</h3>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr>{['Categoria', 'Productos', 'Unidades', 'Inversion', 'Valor venta', 'Ganancia', 'Margen'].map(h => (
                      <th key={h} style={thS}>{h}</th>
                    ))}</tr>
                  </thead>
                  <tbody>
                    {invReporte.porCategoria.map((cat: any) => {
                      const gan = cat.valorVenta - cat.inversion
                      const mar = cat.inversion > 0 ? Math.round((gan / cat.inversion) * 100) : 0
                      return (
                        <tr key={cat.categoria}>
                          <td style={{ ...tdS, fontWeight: 700 }}>{cat.categoria}</td>
                          <td style={{ ...tdS, textAlign: 'center' }}>{cat.items}</td>
                          <td style={{ ...tdS, textAlign: 'center' }}>{cat.stock}</td>
                          <td style={{ ...tdS, fontWeight: 700, color: '#d97706' }}>{fmt(cat.inversion)}</td>
                          <td style={{ ...tdS, fontWeight: 700, color: '#16a34a' }}>{fmt(cat.valorVenta)}</td>
                          <td style={{ ...tdS, fontWeight: 700, color: '#7c3aed' }}>{fmt(gan)}</td>
                          <td style={tdS}><span style={{ fontWeight: 700, color: mar >= 30 ? '#16a34a' : mar >= 15 ? '#d97706' : '#dc2626' }}>{mar}%</span></td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>

              {/* Detalle productos */}
              <div className="card" style={{ padding: 18 }}>
                <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 14 }}>Detalle por producto</h3>
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 800 }}>
                    <thead>
                      <tr>{['Codigo', 'Producto', 'Categoria', 'Stock', 'Costo', 'Precio', 'Inversion', 'Valor venta', 'Margen'].map(h => (
                        <th key={h} style={{ ...thS, fontSize: 10 }}>{h}</th>
                      ))}</tr>
                    </thead>
                    <tbody>
                      {invReporte.productos.map((p: any) => {
                        const inv = p.stock * p.costo
                        const val = p.stock * p.precio
                        const mar = p.costo > 0 ? Math.round(((p.precio - p.costo) / p.costo) * 100) : 0
                        return (
                          <tr key={p.id}>
                            <td style={{ ...tdS, fontSize: 11, fontFamily: 'monospace', color: '#64748b' }}>{p.codigo || '—'}</td>
                            <td style={{ ...tdS, fontWeight: 600, fontSize: 12 }}>{p.nombre}</td>
                            <td style={tdS}><span style={{ fontSize: 10, background: '#eff6ff', color: '#2563eb', padding: '2px 7px', borderRadius: 10, fontWeight: 700 }}>{p.categoria}</span></td>
                            <td style={{ ...tdS, textAlign: 'center', fontWeight: 700, color: p.stock <= p.stockMinimo ? '#dc2626' : '#0f172a' }}>{p.stock}</td>
                            <td style={{ ...tdS, color: '#64748b' }}>{fmt(p.costo)}</td>
                            <td style={{ ...tdS, color: '#2563eb', fontWeight: 600 }}>{fmt(p.precio)}</td>
                            <td style={{ ...tdS, fontWeight: 700, color: '#d97706' }}>{fmt(inv)}</td>
                            <td style={{ ...tdS, fontWeight: 700, color: '#16a34a' }}>{fmt(val)}</td>
                            <td style={tdS}><span style={{ fontWeight: 700, color: mar >= 30 ? '#16a34a' : mar >= 15 ? '#d97706' : '#dc2626' }}>{mar}%</span></td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {/* ── VENTAS TAB ─────────────────────────────────────── */}
      {tabReporte === 'ventas' && (
        <>
          {/* Header + controls */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <h1 style={{ fontSize: 20, fontWeight: 700, color: '#0f172a' }}>Reportes</h1>
              <p style={{ fontSize: 12, color: '#64748b', marginTop: 3 }}>Analisis detallado de ventas</p>
            </div>
            {reporte && (
              <button className="btn-ghost" onClick={exportarPDF} disabled={pdfLoading}>
                {pdfLoading ? 'Generando...' : 'Exportar PDF'}
              </button>
            )}
          </div>

          {/* Date controls */}
          <div className="card" style={{ padding: 16 }}>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'flex-end' }}>
              <div>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', marginBottom: 4 }}>Desde</label>
                <input className="input" type="date" value={fi} onChange={e => setFi(e.target.value)} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', marginBottom: 4 }}>Hasta</label>
                <input className="input" type="date" value={ff} onChange={e => setFf(e.target.value)} />
              </div>
              <button className="btn-primary" onClick={generar} disabled={loading}>{loading ? 'Generando...' : 'Generar reporte'}</button>
              <div style={{ display: 'flex', gap: 6 }}>
                {[[7, 'Ultimos 7 dias'], [30, 'Ultimos 30 dias'], [90, 'Ultimos 90 dias']].map(([d, l]) => (
                  <button key={d} className="btn-ghost btn-sm" onClick={() => preset(Number(d))}>{l}</button>
                ))}
              </div>
            </div>
          </div>

          {reporte && (
            <>
              {/* KPIs ventas */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 14 }}>
                {[
                  { label: 'Total ventas', value: String(reporte.totalVentas), color: '#2563eb', sub: 'Transacciones completadas' },
                  { label: 'Ingresos', value: fmt(reporte.granTotal), color: '#16a34a', sub: 'Total facturado' },
                  { label: 'Ticket promedio', value: fmt(reporte.totalVentas > 0 ? reporte.granTotal / reporte.totalVentas : 0), color: '#d97706', sub: 'Por venta' },
                  { label: 'Items vendidos', value: String(reporte.totalItems || 0), color: '#7c3aed', sub: 'Unidades' },
                ].map(k => (
                  <div key={k.label} className="card" style={{ padding: '16px 18px', borderTop: `3px solid ${k.color}` }}>
                    <div style={{ fontSize: 11, color: '#64748b', textTransform: 'uppercase', marginBottom: 6 }}>{k.label}</div>
                    <div style={{ fontSize: 22, fontWeight: 800, color: k.color }}>{k.value}</div>
                    <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 4 }}>{k.sub}</div>
                  </div>
                ))}
              </div>

              {/* Charts */}
              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 16 }}>
                <div className="card" style={{ padding: 18 }}>
                  <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 14 }}>Ventas por dia</h3>
                  <ResponsiveContainer width="100%" height={200}>
                    <BarChart data={diasData}>
                      <XAxis dataKey="dia" tick={{ fontSize: 10 }} />
                      <YAxis tick={{ fontSize: 10 }} />
                      <Tooltip formatter={(v: any) => `Q ${Number(v).toFixed(2)}`} />
                      <Bar dataKey="total" fill="#2563eb" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                <div className="card" style={{ padding: 18 }}>
                  <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 14 }}>Por metodo de pago</h3>
                  {metodosData.length > 0 ? (
                    <ResponsiveContainer width="100%" height={200}>
                      <PieChart>
                        <Pie data={metodosData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={70} label={({ name, percent }) => `${name} ${Math.round(percent * 100)}%`} labelLine={false} style={{ fontSize: 10 }}>
                          {metodosData.map((_: any, i: number) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                        </Pie>
                        <Tooltip formatter={(v: any) => `Q ${Number(v).toFixed(2)}`} />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : (
                    <div style={{ textAlign: 'center', padding: 60, color: '#94a3b8', fontSize: 12 }}>Sin datos</div>
                  )}
                </div>
              </div>

              {/* Top productos */}
              <div className="card" style={{ padding: 18 }}>
                <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 14 }}>Productos mas vendidos</h3>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr>{['Producto', 'Cantidad', 'Total', '% ingresos'].map(h => <th key={h} style={thS}>{h}</th>)}</tr>
                  </thead>
                  <tbody>
                    {(reporte.topProductos || []).slice(0, 10).map((p: any) => (
                      <tr key={p.nombre}>
                        <td style={{ ...tdS, fontWeight: 600 }}>{p.nombre}</td>
                        <td style={{ ...tdS, textAlign: 'center' }}>{p.cantidad}</td>
                        <td style={{ ...tdS, fontWeight: 700, color: '#16a34a' }}>{fmt(p.total)}</td>
                        <td style={tdS}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <div style={{ flex: 1, height: 6, background: '#f1f5f9', borderRadius: 3 }}>
                              <div style={{ width: `${Math.round((p.total / reporte.granTotal) * 100)}%`, height: '100%', background: '#2563eb', borderRadius: 3 }} />
                            </div>
                            <span style={{ fontSize: 11, color: '#64748b', minWidth: 32 }}>{Math.round((p.total / reporte.granTotal) * 100)}%</span>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Ventas detalle */}
              <div className="card" style={{ padding: 18 }}>
                <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 14 }}>Detalle de ventas</h3>
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr>{['#', 'Fecha', 'Cliente', 'Total', 'Metodo', 'Estado', 'Usuario'].map(h => <th key={h} style={thS}>{h}</th>)}</tr>
                    </thead>
                    <tbody>
                      {(reporte.ventas || []).map((v: any) => (
                        <tr key={v.id}>
                          <td style={{ ...tdS, fontWeight: 700, color: '#2563eb', fontFamily: 'monospace', fontSize: 12 }}>{v.numero}</td>
                          <td style={{ ...tdS, color: '#64748b', fontSize: 12, whiteSpace: 'nowrap' }}>{fmtDateTime(v.fecha)}</td>
                          <td style={tdS}>{v.clienteNombre}</td>
                          <td style={{ ...tdS, fontWeight: 700 }}>{fmt(v.total)}</td>
                          <td style={tdS}><span className="badge-blue" style={{ textTransform: 'capitalize' }}>{v.metodoPago}</span></td>
                          <td style={tdS}><span className="badge-green">completada</span></td>
                          <td style={{ ...tdS, color: '#64748b' }}>{v.usuarioNombre}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}

          {!reporte && !loading && (
            <div style={{ textAlign: 'center', padding: 80, color: '#94a3b8' }}>
              <p style={{ fontSize: 14, marginBottom: 16 }}>Selecciona el rango de fechas y genera el reporte</p>
              <button className="btn-primary" onClick={generar}>Generar reporte</button>
            </div>
          )}
        </>
      )}

    </div>
  )
}

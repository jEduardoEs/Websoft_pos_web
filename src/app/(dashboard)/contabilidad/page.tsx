'use client'
import { useState, useEffect } from 'react'
import { toast } from 'sonner'
import { fmt, fmtDate } from '@/lib/utils'

type TabType = 'diario' | 'iva' | 'pyg' | 'balance' | 'activos' | 'cuentas' | 'periodos'

export default function ContabilidadPage() {
  const [tab, setTab] = useState<TabType>('diario')
  const [loading, setLoading] = useState(false)
  const [setupDone, setSetupDone] = useState<boolean | null>(null)

  // Diario
  const [asientos, setAsientos] = useState<any[]>([])
  const [cuentas, setCuentas] = useState<any[]>([])
  const [showAsientoModal, setShowAsientoModal] = useState(false)
  const [asientoForm, setAsientoForm] = useState({ concepto: '', tipo: 'manual', fecha: new Date().toISOString().slice(0,10) })
  const [partidas, setPartidas] = useState([{ cuentaId: '', debe: '', haber: '', descripcion: '' }, { cuentaId: '', debe: '', haber: '', descripcion: '' }])
  const [fi, setFi] = useState(new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().slice(0,10))
  const [ff, setFf] = useState(new Date().toISOString().slice(0,10))

  // IVA
  const [ivaData, setIvaData] = useState<any>(null)
  const [ivaMes, setIvaMes] = useState(new Date().toISOString().slice(0,7))

  // P&G
  const [pygData, setPygData] = useState<any>(null)

  // Balance
  const [balanceData, setBalanceData] = useState<any>(null)

  // Activos
  const [activos, setActivos] = useState<any[]>([])
  const [activosRes, setActivosRes] = useState<any>(null)
  const [showActivoModal, setShowActivoModal] = useState(false)
  const [activoForm, setActivoForm] = useState({ nombre: '', descripcion: '', fechaAdquisicion: new Date().toISOString().slice(0,10), costoOriginal: '', vidaUtilAnios: '5', valorResidual: '0' })

  // Periodos
  const [periodos, setPeriodos] = useState<any[]>([])

  useEffect(() => { checkSetup() }, [])

  const checkSetup = async () => {
    const res = await fetch('/api/contabilidad/cuentas')
    const data = await res.json()
    setSetupDone(Array.isArray(data) && data.length > 0)
    if (Array.isArray(data)) setCuentas(data)
  }

  const runSetup = async () => {
    setLoading(true)
    const res = await fetch('/api/contabilidad/setup', { method: 'POST' })
    const data = await res.json()
    setLoading(false)
    if (data.ok) { toast.success(data.msg); setSetupDone(true); checkSetup() }
    else toast.error(data.error)
  }

  const loadDiario = async () => {
    setLoading(true)
    const res = await fetch(`/api/contabilidad/asientos?fi=${fi}&ff=${ff}`)
    const data = await res.json()
    setLoading(false)
    setAsientos(data.asientos || [])
  }

  const loadIva = async () => {
    setLoading(true)
    const primerDia = ivaMes + '-01'
    const ultimoDia = new Date(+ivaMes.slice(0,4), +ivaMes.slice(5,7), 0).toISOString().slice(0,10)
    const res = await fetch(`/api/contabilidad/iva?fi=${primerDia}&ff=${ultimoDia}`)
    setIvaData(await res.json())
    setLoading(false)
  }

  const loadPyg = async () => {
    setLoading(true)
    const res = await fetch(`/api/contabilidad/estados?tipo=pyg&fi=${fi}&ff=${ff}`)
    setPygData(await res.json())
    setLoading(false)
  }

  const loadBalance = async () => {
    setLoading(true)
    const res = await fetch(`/api/contabilidad/estados?tipo=balance&ff=${ff}`)
    setBalanceData(await res.json())
    setLoading(false)
  }

  const loadActivos = async () => {
    setLoading(true)
    const res = await fetch('/api/contabilidad/activos')
    const data = await res.json()
    setActivos(data.activos || [])
    setActivosRes(data.resumen)
    setLoading(false)
  }

  const loadPeriodos = async () => {
    setLoading(true)
    const res = await fetch('/api/contabilidad/periodos')
    setPeriodos(await res.json())
    setLoading(false)
  }

  const saveAsiento = async () => {
    if (!asientoForm.concepto) { toast.error('Escribe el concepto'); return }
    const totalDebe = partidas.reduce((s, p) => s + (+p.debe || 0), 0)
    const totalHaber = partidas.reduce((s, p) => s + (+p.haber || 0), 0)
    if (Math.abs(totalDebe - totalHaber) > 0.01) { toast.error(`No cuadra. Debe: Q${totalDebe.toFixed(2)} | Haber: Q${totalHaber.toFixed(2)}`); return }
    setLoading(true)
    const res = await fetch('/api/contabilidad/asientos', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...asientoForm, partidas }) })
    const data = await res.json()
    setLoading(false)
    if (data.ok) { toast.success('Asiento guardado'); setShowAsientoModal(false); loadDiario() }
    else toast.error(data.error)
  }

  const saveActivo = async () => {
    setLoading(true)
    const res = await fetch('/api/contabilidad/activos', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(activoForm) })
    const data = await res.json()
    setLoading(false)
    if (data.ok) { toast.success('Activo registrado'); setShowActivoModal(false); loadActivos() }
    else toast.error(data.error)
  }

  const cerrarPeriodo = async (id: number) => {
    if (!confirm('Cerrar este periodo? No se podrán modificar los asientos.')) return
    const res = await fetch('/api/contabilidad/periodos', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id, accion: 'cerrar' }) })
    const data = await res.json()
    if (data.ok) { toast.success('Periodo cerrado'); loadPeriodos() }
    else toast.error(data.error)
  }

  const imprimirIVA = () => {
    if (!ivaData) return
    const html = `<!DOCTYPE html><html><head><meta charset="UTF-8"/><style>body{font-family:Arial,sans-serif;font-size:12px;padding:24px;color:#0f172a}h1{font-size:18px;font-weight:700;margin-bottom:4px}h2{font-size:14px;font-weight:700;margin:16px 0 8px;border-bottom:1px solid #e2e8f0;padding-bottom:4px}.row{display:flex;justify-content:space-between;padding:6px 0;border-bottom:1px solid #f1f5f9}.total{font-weight:700;font-size:14px;background:#eff6ff;padding:10px;border-radius:6px;display:flex;justify-content:space-between;margin-top:12px}@media print{@page{margin:10mm;size:A4}}</style></head><body>
    <h1>Declaración IVA</h1><p>Periodo: ${ivaData.periodo.fi} — ${ivaData.periodo.ff}</p><p>WebSoft Solutions</p>
    <h2>IVA Débito (Ventas)</h2>
    <div class="row"><span>Facturas emitidas</span><span>${ivaData.ventas.count}</span></div>
    <div class="row"><span>Total ventas</span><span>Q ${ivaData.ventas.total.toFixed(2)}</span></div>
    <div class="row"><span>Base imponible</span><span>Q ${ivaData.ventas.base.toFixed(2)}</span></div>
    <div class="row"><span style="font-weight:700">IVA débito (5%)</span><span style="font-weight:700;color:#dc2626">Q ${ivaData.ventas.iva.toFixed(2)}</span></div>
    <h2>IVA Crédito (Compras)</h2>
    <div class="row"><span>Facturas recibidas</span><span>${ivaData.compras.count}</span></div>
    <div class="row"><span>Total compras</span><span>Q ${ivaData.compras.total.toFixed(2)}</span></div>
    <div class="row"><span>Base imponible</span><span>Q ${ivaData.compras.base.toFixed(2)}</span></div>
    <div class="row"><span style="font-weight:700">IVA crédito (5%)</span><span style="font-weight:700;color:#16a34a">Q ${ivaData.compras.iva.toFixed(2)}</span></div>
    <div class="total"><span>IVA LÍQUIDO A PAGAR</span><span style="color:#2563eb">Q ${ivaData.liquidacion.aPagar.toFixed(2)}</span></div>
    <script>window.onload=function(){window.print()}</script></body></html>`
    const w = window.open('', '_blank')
    if (w) { w.document.write(html); w.document.close() }
  }

  const thS = { background: '#f8fafc', fontSize: 11, fontWeight: 700 as const, color: '#64748b', textTransform: 'uppercase' as const, padding: '9px 13px', textAlign: 'left' as const, borderBottom: '1px solid #e2e8f0' }
  const tdS = { padding: '10px 13px', fontSize: 13, borderBottom: '1px solid #f1f5f9' }
  const lbl = { display: 'block' as const, fontSize: 11, fontWeight: 700 as const, color: '#64748b', textTransform: 'uppercase' as const, marginBottom: 4 }
  const TABS: [TabType, string][] = [['diario','Libro diario'],['iva','IVA'],['pyg','P & G'],['balance','Balance'],['activos','Activos fijos'],['cuentas','Plan de cuentas'],['periodos','Periodos']]

  // Setup screen
  if (setupDone === false) return (
    <div style={{ padding: 24, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: 400, gap: 16 }}>
      <div style={{ fontSize: 20, fontWeight: 700 }}>Módulo contable</div>
      <p style={{ color: '#64748b', textAlign: 'center', maxWidth: 420 }}>Primero necesitas inicializar el plan de cuentas contable. Esto creará las cuentas estándar para Guatemala (activos, pasivos, capital, ingresos, costos y gastos).</p>
      <button className="btn-primary" onClick={runSetup} disabled={loading}>{loading ? 'Inicializando...' : 'Inicializar plan de cuentas'}</button>
    </div>
  )

  return (
    <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 700, color: '#0f172a' }}>Contabilidad</h1>
          <p style={{ fontSize: 12, color: '#64748b', marginTop: 3 }}>Libros contables · IVA · Estados financieros</p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          {tab === 'diario' && <button className="btn-primary" onClick={() => setShowAsientoModal(true)}>+ Asiento manual</button>}
          {tab === 'activos' && <button className="btn-primary" onClick={() => setShowActivoModal(true)}>+ Activo fijo</button>}
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 4, background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 10, padding: 4, flexWrap: 'wrap' }}>
        {TABS.map(([id, label]) => (
          <button key={id} onClick={() => setTab(id)}
            style={{ padding: '7px 14px', border: 'none', borderRadius: 8, cursor: 'pointer', fontSize: 13, fontWeight: 600, fontFamily: 'inherit', background: tab === id ? '#2563eb' : 'transparent', color: tab === id ? '#fff' : '#64748b', transition: 'all .15s', whiteSpace: 'nowrap' }}>
            {label}
          </button>
        ))}
      </div>

      {/* ── LIBRO DIARIO ── */}
      {tab === 'diario' && (
        <>
          <div className="card" style={{ padding: 14 }}>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'flex-end' }}>
              <div><label style={lbl}>Desde</label><input className="input" type="date" value={fi} onChange={e => setFi(e.target.value)} /></div>
              <div><label style={lbl}>Hasta</label><input className="input" type="date" value={ff} onChange={e => setFf(e.target.value)} /></div>
              <button className="btn-primary" onClick={loadDiario} disabled={loading}>Cargar asientos</button>
            </div>
          </div>
          {asientos.length > 0 && (
            <div className="card">
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead><tr>{['#','Fecha','Concepto','Tipo','Cuenta','Debe','Haber'].map(h => <th key={h} style={thS}>{h}</th>)}</tr></thead>
                  <tbody>
                    {asientos.flatMap(a => a.partidas.map((p: any, i: number) => (
                      <tr key={`${a.id}-${p.id}`} style={{ background: i === 0 ? '#fafafa' : '#fff' }}>
                        {i === 0 ? <>
                          <td style={{ ...tdS, fontWeight: 700, color: '#2563eb', fontSize: 11 }} rowSpan={a.partidas.length}>{a.numero}</td>
                          <td style={{ ...tdS, fontSize: 11, color: '#64748b', whiteSpace: 'nowrap' }} rowSpan={a.partidas.length}>{new Date(a.fecha).toLocaleDateString('es-GT')}</td>
                          <td style={{ ...tdS, fontWeight: 600 }} rowSpan={a.partidas.length}>{a.concepto}</td>
                          <td style={tdS} rowSpan={a.partidas.length}><span style={{ fontSize: 10, background: '#eff6ff', color: '#2563eb', padding: '2px 7px', borderRadius: 10, fontWeight: 700 }}>{a.tipo}</span></td>
                        </> : null}
                        <td style={{ ...tdS, fontSize: 12 }}>{p.cuenta?.codigo} — {p.cuenta?.nombre}</td>
                        <td style={{ ...tdS, color: '#16a34a', fontWeight: p.debe > 0 ? 700 : 400 }}>{p.debe > 0 ? fmt(p.debe) : '—'}</td>
                        <td style={{ ...tdS, color: '#dc2626', fontWeight: p.haber > 0 ? 700 : 400 }}>{p.haber > 0 ? fmt(p.haber) : '—'}</td>
                      </tr>
                    )))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
          {asientos.length === 0 && !loading && (
            <div style={{ textAlign: 'center', padding: 60, color: '#94a3b8' }}>
              <p style={{ fontSize: 14 }}>Selecciona un rango de fechas y carga los asientos</p>
            </div>
          )}
        </>
      )}

      {/* ── IVA ── */}
      {tab === 'iva' && (
        <>
          <div className="card" style={{ padding: 14 }}>
            <div style={{ display: 'flex', gap: 10, alignItems: 'flex-end', flexWrap: 'wrap' }}>
              <div><label style={lbl}>Mes</label><input className="input" type="month" value={ivaMes} onChange={e => setIvaMes(e.target.value)} /></div>
              <button className="btn-primary" onClick={loadIva} disabled={loading}>Calcular IVA</button>
              {ivaData && <button className="btn-ghost" onClick={imprimirIVA}>Imprimir / PDF</button>}
            </div>
          </div>
          {ivaData && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div className="card" style={{ padding: 18 }}>
                <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 14, color: '#dc2626' }}>IVA Débito — Ventas</h3>
                {[['Facturas emitidas', ivaData.ventas.count, false],['Total ventas', fmt(ivaData.ventas.total), false],['Base imponible', fmt(ivaData.ventas.base), false],['IVA débito (5%)', fmt(ivaData.ventas.iva), true]].map(([l,v,b]) => (
                  <div key={String(l)} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #f1f5f9', fontWeight: b ? 700 : 400 }}>
                    <span style={{ fontSize: 13, color: '#475569' }}>{l}</span>
                    <span style={{ fontSize: 13, color: b ? '#dc2626' : '#0f172a' }}>{v}</span>
                  </div>
                ))}
              </div>
              <div className="card" style={{ padding: 18 }}>
                <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 14, color: '#16a34a' }}>IVA Crédito — Compras</h3>
                {[['Facturas recibidas', ivaData.compras.count, false],['Total compras', fmt(ivaData.compras.total), false],['Base imponible', fmt(ivaData.compras.base), false],['IVA crédito (5%)', fmt(ivaData.compras.iva), true]].map(([l,v,b]) => (
                  <div key={String(l)} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #f1f5f9', fontWeight: b ? 700 : 400 }}>
                    <span style={{ fontSize: 13, color: '#475569' }}>{l}</span>
                    <span style={{ fontSize: 13, color: b ? '#16a34a' : '#0f172a' }}>{v}</span>
                  </div>
                ))}
              </div>
              <div className="card" style={{ padding: 18, gridColumn: '1/-1', border: '2px solid #2563eb' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontSize: 15, fontWeight: 700 }}>IVA líquido a pagar al SAT</div>
                    <div style={{ fontSize: 12, color: '#64748b', marginTop: 4 }}>Débito Q {ivaData.liquidacion.ivaDebito.toFixed(2)} — Crédito Q {ivaData.liquidacion.ivaCredito.toFixed(2)}</div>
                  </div>
                  <div style={{ fontSize: 28, fontWeight: 800, color: '#2563eb' }}>{fmt(ivaData.liquidacion.aPagar)}</div>
                </div>
                {ivaData.liquidacion.saldoFavor > 0 && <div style={{ marginTop: 10, fontSize: 12, color: '#16a34a', fontWeight: 700 }}>Saldo a favor: {fmt(ivaData.liquidacion.saldoFavor)}</div>}
              </div>
            </div>
          )}
          {!ivaData && <div style={{ textAlign: 'center', padding: 60, color: '#94a3b8' }}><p>Selecciona el mes y calcula el IVA</p></div>}
        </>
      )}

      {/* ── P&G ── */}
      {tab === 'pyg' && (
        <>
          <div className="card" style={{ padding: 14 }}>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'flex-end' }}>
              <div><label style={lbl}>Desde</label><input className="input" type="date" value={fi} onChange={e => setFi(e.target.value)} /></div>
              <div><label style={lbl}>Hasta</label><input className="input" type="date" value={ff} onChange={e => setFf(e.target.value)} /></div>
              <button className="btn-primary" onClick={loadPyg} disabled={loading}>Generar P & G</button>
            </div>
          </div>
          {pygData && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div className="card" style={{ padding: 18 }}>
                <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 14 }}>Estado de Resultados</h3>
                {[
                  { l: 'Ingresos por ventas', v: pygData.ingresos.ventas, color: '#16a34a', bold: false },
                  { l: 'Costo de ventas', v: -pygData.costos.costoVentas, color: '#dc2626', bold: false },
                  { l: 'Utilidad bruta', v: pygData.utilidadBruta, color: pygData.utilidadBruta >= 0 ? '#16a34a' : '#dc2626', bold: true },
                  { l: 'Gastos operativos', v: -pygData.gastos.total, color: '#dc2626', bold: false },
                  { l: 'Utilidad operativa', v: pygData.utilidadOperativa, color: pygData.utilidadOperativa >= 0 ? '#16a34a' : '#dc2626', bold: true },
                  { l: 'ISR (5%)', v: -pygData.impuestos.isr, color: '#dc2626', bold: false },
                  { l: 'UTILIDAD NETA', v: pygData.utilidadNeta, color: pygData.utilidadNeta >= 0 ? '#16a34a' : '#dc2626', bold: true },
                ].map(row => (
                  <div key={row.l} style={{ display: 'flex', justifyContent: 'space-between', padding: '9px 0', borderBottom: row.bold ? 'none' : '1px solid #f1f5f9', borderTop: row.bold ? '2px solid #e2e8f0' : 'none', marginTop: row.bold ? 4 : 0, fontWeight: row.bold ? 700 : 400 }}>
                    <span style={{ fontSize: 13, color: row.bold ? '#0f172a' : '#475569' }}>{row.l}</span>
                    <span style={{ fontSize: row.bold ? 15 : 13, color: row.color }}>{row.v >= 0 ? fmt(row.v) : `(${fmt(-row.v)})`}</span>
                  </div>
                ))}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {[
                  { label: 'Ingresos totales', value: fmt(pygData.ingresos.ventas), color: '#16a34a' },
                  { label: 'Utilidad neta', value: fmt(pygData.utilidadNeta), color: pygData.utilidadNeta >= 0 ? '#16a34a' : '#dc2626' },
                  { label: 'Margen neto', value: `${pygData.margen}%`, color: '#7c3aed' },
                  { label: 'Transacciones', value: String(pygData.ingresos.count), color: '#2563eb' },
                ].map(k => (
                  <div key={k.label} className="card" style={{ padding: '14px 18px', borderTop: `3px solid ${k.color}` }}>
                    <div style={{ fontSize: 11, color: '#64748b', textTransform: 'uppercase', marginBottom: 5 }}>{k.label}</div>
                    <div style={{ fontSize: 22, fontWeight: 800, color: k.color }}>{k.value}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
          {!pygData && <div style={{ textAlign: 'center', padding: 60, color: '#94a3b8' }}><p>Selecciona el rango y genera el P & G</p></div>}
        </>
      )}

      {/* ── BALANCE ── */}
      {tab === 'balance' && (
        <>
          <div className="card" style={{ padding: 14 }}>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'flex-end' }}>
              <div><label style={lbl}>Al corte de fecha</label><input className="input" type="date" value={ff} onChange={e => setFf(e.target.value)} /></div>
              <button className="btn-primary" onClick={loadBalance} disabled={loading}>Generar Balance</button>
            </div>
          </div>
          {balanceData && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div className="card" style={{ padding: 18 }}>
                <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 14, color: '#16a34a' }}>ACTIVOS</h3>
                {balanceData.activos.map((a: any) => (
                  <div key={a.cuenta.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '7px 0', borderBottom: '1px solid #f8fafc', fontSize: 13 }}>
                    <span style={{ color: '#475569' }}>{a.cuenta.codigo} — {a.cuenta.nombre}</span>
                    <span style={{ fontWeight: 600 }}>{fmt(a.saldo)}</span>
                  </div>
                ))}
                {balanceData.valorInventario > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '7px 0', borderBottom: '1px solid #f8fafc', fontSize: 13 }}>
                    <span style={{ color: '#475569' }}>1120 — Inventario (valoración)</span>
                    <span style={{ fontWeight: 600 }}>{fmt(balanceData.valorInventario)}</span>
                  </div>
                )}
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderTop: '2px solid #e2e8f0', marginTop: 6, fontWeight: 700, fontSize: 14 }}>
                  <span>TOTAL ACTIVOS</span><span style={{ color: '#16a34a' }}>{fmt(balanceData.totales.activos)}</span>
                </div>
              </div>
              <div className="card" style={{ padding: 18 }}>
                <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 14, color: '#dc2626' }}>PASIVOS Y CAPITAL</h3>
                {balanceData.pasivos.map((p: any) => (
                  <div key={p.cuenta.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '7px 0', borderBottom: '1px solid #f8fafc', fontSize: 13 }}>
                    <span style={{ color: '#475569' }}>{p.cuenta.codigo} — {p.cuenta.nombre}</span>
                    <span style={{ fontWeight: 600 }}>{fmt(p.saldo)}</span>
                  </div>
                ))}
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderTop: '1px solid #e2e8f0', marginTop: 4, fontWeight: 700, fontSize: 13 }}>
                  <span>Total Pasivos</span><span style={{ color: '#dc2626' }}>{fmt(balanceData.totales.pasivos)}</span>
                </div>
                {balanceData.capital.map((c: any) => (
                  <div key={c.cuenta.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '7px 0', borderBottom: '1px solid #f8fafc', fontSize: 13, marginTop: 8 }}>
                    <span style={{ color: '#475569' }}>{c.cuenta.codigo} — {c.cuenta.nombre}</span>
                    <span style={{ fontWeight: 600 }}>{fmt(c.saldo)}</span>
                  </div>
                ))}
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderTop: '2px solid #e2e8f0', marginTop: 6, fontWeight: 700, fontSize: 14 }}>
                  <span>TOTAL PAS. + CAP.</span><span style={{ color: '#dc2626' }}>{fmt(balanceData.totales.pasivos + balanceData.totales.capital)}</span>
                </div>
                {balanceData.cuadra && <div style={{ marginTop: 10, fontSize: 12, color: '#16a34a', fontWeight: 700, textAlign: 'center' }}>Balance cuadrado</div>}
              </div>
            </div>
          )}
          {!balanceData && <div style={{ textAlign: 'center', padding: 60, color: '#94a3b8' }}><p>Selecciona la fecha de corte y genera el balance</p></div>}
        </>
      )}

      {/* ── ACTIVOS FIJOS ── */}
      {tab === 'activos' && (
        <>
          <button className="btn-primary" style={{ width: 'fit-content' }} onClick={loadActivos} disabled={loading}>Cargar activos</button>
          {activosRes && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 14 }}>
              {[['Total activos', String(activosRes.total), '#2563eb'],['Valor bruto', fmt(activosRes.valorBruto), '#d97706'],['Depreciación acum.', fmt(activosRes.depreciacionAcum), '#dc2626'],['Valor neto', fmt(activosRes.valorNeto), '#16a34a']].map(([l,v,c]) => (
                <div key={String(l)} className="card" style={{ padding: '14px 18px', borderTop: `3px solid ${c}` }}>
                  <div style={{ fontSize: 11, color: '#64748b', textTransform: 'uppercase', marginBottom: 5 }}>{l}</div>
                  <div style={{ fontSize: 20, fontWeight: 800, color: c as string }}>{v}</div>
                </div>
              ))}
            </div>
          )}
          {activos.length > 0 && (
            <div className="card">
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead><tr>{['Codigo','Activo','Costo original','Dep. mensual','Dep. acum.','Valor neto','Estado'].map(h => <th key={h} style={thS}>{h}</th>)}</tr></thead>
                <tbody>
                  {activos.map(a => (
                    <tr key={a.id}>
                      <td style={{ ...tdS, fontFamily: 'monospace', fontSize: 11, color: '#64748b' }}>{a.codigo}</td>
                      <td style={{ ...tdS, fontWeight: 600 }}>{a.nombre}<div style={{ fontSize: 11, color: '#94a3b8' }}>{a.vidaUtilAnios} años vida útil</div></td>
                      <td style={tdS}>{fmt(a.costoOriginal)}</td>
                      <td style={{ ...tdS, color: '#d97706', fontWeight: 600 }}>{fmt(a.depreciacionMensual)}/mes</td>
                      <td style={{ ...tdS, color: '#dc2626' }}>{fmt(a.depreciacionAcum)}</td>
                      <td style={{ ...tdS, fontWeight: 700, color: '#16a34a' }}>{fmt(a.valorNeto)}</td>
                      <td style={tdS}><span style={{ fontSize: 10, background: a.estado === 'activo' ? '#f0fdf4' : '#fef2f2', color: a.estado === 'activo' ? '#166534' : '#991b1b', padding: '2px 8px', borderRadius: 10, fontWeight: 700 }}>{a.estado}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}

      {/* ── PLAN DE CUENTAS ── */}
      {tab === 'cuentas' && (
        <div className="card">
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead><tr>{['Codigo','Cuenta','Tipo','Naturaleza'].map(h => <th key={h} style={thS}>{h}</th>)}</tr></thead>
            <tbody>
              {cuentas.map(c => (
                <tr key={c.id} style={{ background: c.nivel === 1 ? '#f8fafc' : '#fff' }}>
                  <td style={{ ...tdS, fontFamily: 'monospace', fontSize: 12, color: '#2563eb', fontWeight: 700 }}>{c.codigo}</td>
                  <td style={{ ...tdS, fontWeight: c.nivel <= 2 ? 700 : 400, paddingLeft: `${(c.nivel - 1) * 20 + 13}px` }}>{c.nombre}</td>
                  <td style={tdS}><span style={{ fontSize: 10, background: '#eff6ff', color: '#2563eb', padding: '2px 7px', borderRadius: 10, fontWeight: 700, textTransform: 'capitalize' }}>{c.tipo}</span></td>
                  <td style={{ ...tdS, fontSize: 12, color: '#64748b', textTransform: 'capitalize' }}>{c.naturaleza}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ── PERIODOS ── */}
      {tab === 'periodos' && (
        <>
          <button className="btn-primary" style={{ width: 'fit-content' }} onClick={loadPeriodos}>Cargar periodos</button>
          {periodos.length > 0 && (
            <div className="card">
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead><tr>{['Periodo','Desde','Hasta','Estado','Cerrado por',''].map(h => <th key={h} style={thS}>{h}</th>)}</tr></thead>
                <tbody>
                  {periodos.map(p => (
                    <tr key={p.id}>
                      <td style={{ ...tdS, fontWeight: 600 }}>{p.nombre}</td>
                      <td style={{ ...tdS, color: '#64748b', fontSize: 12 }}>{fmtDate(p.fechaInicio)}</td>
                      <td style={{ ...tdS, color: '#64748b', fontSize: 12 }}>{fmtDate(p.fechaFin)}</td>
                      <td style={tdS}><span style={{ fontSize: 10, background: p.estado === 'abierto' ? '#f0fdf4' : '#fef2f2', color: p.estado === 'abierto' ? '#166534' : '#991b1b', padding: '2px 8px', borderRadius: 10, fontWeight: 700 }}>{p.estado}</span></td>
                      <td style={{ ...tdS, fontSize: 12, color: '#64748b' }}>{p.cerradoPor || '—'}</td>
                      <td style={tdS}>
                        {p.estado === 'abierto'
                          ? <button onClick={() => cerrarPeriodo(p.id)} style={{ fontSize: 11, padding: '4px 10px', background: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca', borderRadius: 6, cursor: 'pointer', fontFamily: 'inherit', fontWeight: 700 }}>Cerrar</button>
                          : <button onClick={async () => { const r = await fetch('/api/contabilidad/periodos', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: p.id, accion: 'reabrir' }) }); const d = await r.json(); if (d.ok) { toast.success('Periodo reabierto'); loadPeriodos() } }} style={{ fontSize: 11, padding: '4px 10px', background: '#eff6ff', color: '#2563eb', border: '1px solid #bfdbfe', borderRadius: 6, cursor: 'pointer', fontFamily: 'inherit', fontWeight: 700 }}>Reabrir</button>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}

      {/* ── MODAL ASIENTO ── */}
      {showAsientoModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.5)', zIndex: 999, display: 'flex', alignItems: 'flex-start', justifyContent: 'center', padding: 20, overflowY: 'auto' }}>
          <div style={{ background: '#fff', borderRadius: 14, padding: 28, width: '100%', maxWidth: 700, margin: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 20 }}>
              <h3 style={{ fontSize: 16, fontWeight: 700 }}>Nuevo asiento contable</h3>
              <button onClick={() => setShowAsientoModal(false)} style={{ background: 'none', border: 'none', fontSize: 22, cursor: 'pointer', color: '#94a3b8' }}>×</button>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: 12, marginBottom: 16 }}>
              <div><label style={lbl}>Concepto *</label><input className="input" value={asientoForm.concepto} onChange={e => setAsientoForm(p => ({ ...p, concepto: e.target.value }))} placeholder="Descripcion del asiento" /></div>
              <div><label style={lbl}>Tipo</label><select className="input" value={asientoForm.tipo} onChange={e => setAsientoForm(p => ({ ...p, tipo: e.target.value }))}><option value="manual">Manual</option><option value="ajuste">Ajuste</option><option value="depreciacion">Depreciacion</option><option value="cierre">Cierre</option></select></div>
              <div><label style={lbl}>Fecha</label><input className="input" type="date" value={asientoForm.fecha} onChange={e => setAsientoForm(p => ({ ...p, fecha: e.target.value }))} /></div>
            </div>
            <div style={{ marginBottom: 14 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr auto', gap: 8, marginBottom: 6 }}>
                <span style={lbl}>Cuenta</span><span style={lbl}>Debe Q</span><span style={lbl}>Haber Q</span><span />
              </div>
              {partidas.map((p, i) => (
                <div key={i} style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr auto', gap: 8, marginBottom: 8 }}>
                  <select className="input" value={p.cuentaId} onChange={e => setPartidas(prev => prev.map((x, j) => j === i ? { ...x, cuentaId: e.target.value } : x))}>
                    <option value="">Seleccionar cuenta...</option>
                    {cuentas.filter(c => c.nivel >= 2).map(c => <option key={c.id} value={c.id}>{c.codigo} — {c.nombre}</option>)}
                  </select>
                  <input className="input" type="number" placeholder="0.00" value={p.debe} onChange={e => setPartidas(prev => prev.map((x, j) => j === i ? { ...x, debe: e.target.value, haber: '' } : x))} />
                  <input className="input" type="number" placeholder="0.00" value={p.haber} onChange={e => setPartidas(prev => prev.map((x, j) => j === i ? { ...x, haber: e.target.value, debe: '' } : x))} />
                  {partidas.length > 2 && <button onClick={() => setPartidas(prev => prev.filter((_, j) => j !== i))} style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 6, color: '#dc2626', cursor: 'pointer', padding: '0 10px', fontFamily: 'inherit', fontWeight: 700 }}>×</button>}
                </div>
              ))}
              <button onClick={() => setPartidas(prev => [...prev, { cuentaId: '', debe: '', haber: '', descripcion: '' }])} style={{ fontSize: 12, color: '#2563eb', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit', fontWeight: 700 }}>+ Agregar línea</button>
            </div>
            <div style={{ background: '#f8fafc', borderRadius: 8, padding: '10px 14px', marginBottom: 16, display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
              <span>Debe: <strong style={{ color: '#16a34a' }}>{fmt(partidas.reduce((s, p) => s + (+p.debe || 0), 0))}</strong></span>
              <span>Haber: <strong style={{ color: '#dc2626' }}>{fmt(partidas.reduce((s, p) => s + (+p.haber || 0), 0))}</strong></span>
              <span style={{ fontWeight: 700, color: Math.abs(partidas.reduce((s, p) => s + (+p.debe || 0), 0) - partidas.reduce((s, p) => s + (+p.haber || 0), 0)) < 0.01 ? '#16a34a' : '#dc2626' }}>
                {Math.abs(partidas.reduce((s, p) => s + (+p.debe || 0), 0) - partidas.reduce((s, p) => s + (+p.haber || 0), 0)) < 0.01 ? 'Cuadrado' : 'No cuadra'}
              </span>
            </div>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button className="btn-ghost" onClick={() => setShowAsientoModal(false)}>Cancelar</button>
              <button className="btn-primary" onClick={saveAsiento} disabled={loading}>{loading ? 'Guardando...' : 'Guardar asiento'}</button>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL ACTIVO FIJO ── */}
      {showActivoModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.5)', zIndex: 999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <div style={{ background: '#fff', borderRadius: 14, padding: 28, width: '100%', maxWidth: 560 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 20 }}>
              <h3 style={{ fontSize: 16, fontWeight: 700 }}>Nuevo activo fijo</h3>
              <button onClick={() => setShowActivoModal(false)} style={{ background: 'none', border: 'none', fontSize: 22, cursor: 'pointer', color: '#94a3b8' }}>×</button>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div style={{ gridColumn: '1/-1' }}><label style={lbl}>Nombre *</label><input className="input" value={activoForm.nombre} onChange={e => setActivoForm(p => ({ ...p, nombre: e.target.value }))} placeholder="Laptop Dell, Camioneta, etc." /></div>
              <div style={{ gridColumn: '1/-1' }}><label style={lbl}>Descripcion</label><input className="input" value={activoForm.descripcion} onChange={e => setActivoForm(p => ({ ...p, descripcion: e.target.value }))} /></div>
              <div><label style={lbl}>Fecha de adquisicion *</label><input className="input" type="date" value={activoForm.fechaAdquisicion} onChange={e => setActivoForm(p => ({ ...p, fechaAdquisicion: e.target.value }))} /></div>
              <div><label style={lbl}>Costo original Q *</label><input className="input" type="number" value={activoForm.costoOriginal} onChange={e => setActivoForm(p => ({ ...p, costoOriginal: e.target.value }))} /></div>
              <div><label style={lbl}>Vida util (años)</label><input className="input" type="number" value={activoForm.vidaUtilAnios} onChange={e => setActivoForm(p => ({ ...p, vidaUtilAnios: e.target.value }))} /></div>
              <div><label style={lbl}>Valor residual Q</label><input className="input" type="number" value={activoForm.valorResidual} onChange={e => setActivoForm(p => ({ ...p, valorResidual: e.target.value }))} /></div>
            </div>
            {activoForm.costoOriginal && activoForm.vidaUtilAnios && (
              <div style={{ background: '#eff6ff', borderRadius: 8, padding: '10px 14px', marginTop: 12, fontSize: 13, color: '#1e40af' }}>
                Depreciacion mensual: <strong>Q {(((+activoForm.costoOriginal) - (+activoForm.valorResidual)) / ((+activoForm.vidaUtilAnios) * 12)).toFixed(2)}</strong>
              </div>
            )}
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 20 }}>
              <button className="btn-ghost" onClick={() => setShowActivoModal(false)}>Cancelar</button>
              <button className="btn-primary" onClick={saveActivo} disabled={loading}>{loading ? 'Guardando...' : 'Guardar activo'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

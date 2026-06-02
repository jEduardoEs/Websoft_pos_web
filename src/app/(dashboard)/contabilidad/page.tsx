'use client'
import { useState, useEffect, useCallback } from 'react'
import { toast } from 'sonner'
import { fmt, fmtDate } from '@/lib/utils'

type TabType = 'resumen'|'diario'|'mayor'|'iva'|'pyg'|'balance'|'cobrar'|'pagar'|'activos'|'consolidacion'|'cuentas'|'periodos'

const TODAY = new Date().toISOString().slice(0,10)
const FIRST_DAY = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().slice(0,10)
const THIS_MONTH = new Date().toISOString().slice(0,7)

export default function ContabilidadPage() {
  const [tab, setTab] = useState<TabType>('resumen')
  const [loading, setLoading] = useState(false)
  const [setupDone, setSetupDone] = useState<boolean|null>(null)
  const [cuentas, setCuentas] = useState<any[]>([])
  const [periodos, setPeriodos] = useState<any[]>([])
  const [fi, setFi] = useState(FIRST_DAY)
  const [ff, setFf] = useState(TODAY)

  // Resumen
  const [resumen, setResumen] = useState<any>(null)

  // Diario
  const [asientos, setAsientos] = useState<any[]>([])
  const [diarioMeta, setDiarioMeta] = useState<any>(null)
  const [showAsientoModal, setShowAsientoModal] = useState(false)
  const [editAsiento, setEditAsiento] = useState<any>(null)
  const [asientoForm, setAsientoForm] = useState({ concepto: '', tipo: 'manual', fecha: TODAY })
  const [partidas, setPartidas] = useState([{ cuentaId: '', debe: '', haber: '' },{ cuentaId: '', debe: '', haber: '' }])

  // Mayor
  const [mayorData, setMayorData] = useState<any[]>([])
  const [mayorCuentaId, setMayorCuentaId] = useState('')
  const [mayorExpanded, setMayorExpanded] = useState<Record<number,boolean>>({})

  // IVA
  const [ivaData, setIvaData] = useState<any>(null)
  const [ivaMes, setIvaMes] = useState(THIS_MONTH)

  // P&G / Balance
  const [pygData, setPygData] = useState<any>(null)
  const [balanceData, setBalanceData] = useState<any>(null)

  // Cuentas C/P
  const [cobrar, setCobrar] = useState<any[]>([])
  const [pagar, setPagar] = useState<any[]>([])
  const [resCC, setResCC] = useState<any>(null)
  const [resCP, setResCP] = useState<any>(null)
  const [showCuentaModal, setShowCuentaModal] = useState<'cobrar'|'pagar'|null>(null)
  const [showPagoModal, setShowPagoModal] = useState<any>(null)
  const [cuentaTab, setCuentaTab] = useState<'cobrar'|'pagar'>('cobrar')
  const [montoPago, setMontoPago] = useState('')
  const [formCC, setFormCC] = useState({ clienteNombre:'', clienteNit:'', clienteTelefono:'', ventaNumero:'', concepto:'', monto:'', fechaVencimiento:'', notas:'' })
  const [formCP, setFormCP] = useState({ proveedorNombre:'', compraNumero:'', concepto:'', monto:'', fechaVencimiento:'', notas:'' })

  // Plan de cuentas — add/remove
  const [showCuentaForm, setShowCuentaForm] = useState(false)
  const [nuevaCuenta, setNuevaCuenta] = useState({ codigo:'', nombre:'', tipo:'gasto', naturaleza:'deudora', nivel:'3' })

  // Consolidacion
  const [consolData, setConsolData] = useState<any>(null)
  const [consolLoading, setConsolLoading] = useState(false)

  // Activos
  const [activos, setActivos] = useState<any[]>([])
  const [activosRes, setActivosRes] = useState<any>(null)
  const [showActivoModal, setShowActivoModal] = useState(false)
  const [activoForm, setActivoForm] = useState({ nombre:'', descripcion:'', fechaAdquisicion:TODAY, costoOriginal:'', vidaUtilAnios:'5', valorResidual:'0' })

  // ─── Init ───────────────────────────────────────────────────────────────────
  useEffect(() => { checkSetup() }, [])

  const checkSetup = async () => {
    const res = await fetch('/api/contabilidad/cuentas')
    const data = await res.json()
    const ok = Array.isArray(data) && data.length > 0
    setSetupDone(ok)
    if (ok) {
      setCuentas(data)
      loadResumen()
      loadCuentasCP()
      loadPeriodos()
    }
  }

  const runSetup = async () => {
    setLoading(true)
    const res = await fetch('/api/contabilidad/setup', { method: 'POST' })
    const data = await res.json()
    setLoading(false)
    if (data.ok) { toast.success(data.msg); checkSetup() }
    else toast.error(data.error)
  }

  // ─── Loaders ─────────────────────────────────────────────────────────────────
  const loadResumen = async () => {
    const [ivaRes, pygRes, cobrarRes, pagarRes] = await Promise.all([
      fetch(`/api/contabilidad/iva?fi=${FIRST_DAY}&ff=${TODAY}`).then(r => r.json()),
      fetch(`/api/contabilidad/estados?tipo=pyg&fi=${FIRST_DAY}&ff=${TODAY}`).then(r => r.json()),
      fetch('/api/cuentas-cobrar').then(r => r.json()),
      fetch('/api/cuentas-pagar').then(r => r.json()),
    ])
    setResumen({ iva: ivaRes, pyg: pygRes, cobrar: cobrarRes?.resumen, pagar: pagarRes?.resumen })
  }

  const loadDiario = async () => {
    setLoading(true)
    const res = await fetch(`/api/contabilidad/asientos?fi=${fi}&ff=${ff}`)
    const data = await res.json()
    setLoading(false)
    setAsientos(data.asientos || [])
    setDiarioMeta({ totalDebe: data.totalDebe, totalHaber: data.totalHaber, cuadrado: data.cuadrado })
  }

  const loadMayor = async () => {
    setLoading(true)
    const params = new URLSearchParams({ fi, ff })
    if (mayorCuentaId) params.set('cuentaId', mayorCuentaId)
    const res = await fetch(`/api/contabilidad/mayor?${params}`)
    const data = await res.json()
    setMayorData(data.cuentas || [])
    setLoading(false)
  }

  const loadIva = async () => {
    setLoading(true)
    const ini = ivaMes + '-01'
    const fin = new Date(+ivaMes.slice(0,4), +ivaMes.slice(5,7), 0).toISOString().slice(0,10)
    const res = await fetch(`/api/contabilidad/iva?fi=${ini}&ff=${fin}`)
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

  const loadCuentasCP = async () => {
    const [rCC, rCP] = await Promise.all([
      fetch('/api/cuentas-cobrar').then(r => r.json()),
      fetch('/api/cuentas-pagar').then(r => r.json()),
    ])
    setCobrar(rCC.cuentas || [])
    setPagar(rCP.cuentas || [])
    setResCC(rCC.resumen)
    setResCP(rCP.resumen)
  }

  const saveCuenta = async () => {
    if (!nuevaCuenta.codigo || !nuevaCuenta.nombre) { toast.error('Codigo y nombre son requeridos'); return }
    const res = await fetch('/api/contabilidad/cuentas', { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify(nuevaCuenta) })
    const data = await res.json()
    if (data.ok) { toast.success('Cuenta agregada'); setShowCuentaForm(false); setNuevaCuenta({codigo:'',nombre:'',tipo:'gasto',naturaleza:'deudora',nivel:'3'}); checkSetup() }
    else toast.error(data.error)
  }

  const toggleCuenta = async (id: number, activa: boolean) => {
    const res = await fetch(`/api/contabilidad/cuentas?id=${id}`, { method:'PATCH', headers:{'Content-Type':'application/json'}, body:JSON.stringify({ activa: !activa }) })
    const data = await res.json()
    if (data.ok) { toast.success(activa ? 'Cuenta desactivada' : 'Cuenta activada'); checkSetup() }
    else toast.error(data.error)
  }

  const loadConsolidacion = async () => {
    setConsolLoading(true)
    const [invRes, activosRes2, cobrarRes2, pagarRes2, pygRes2, ventasRes] = await Promise.all([
      fetch('/api/reportes/inventario').then(r => r.json()),
      fetch('/api/contabilidad/activos').then(r => r.json()),
      fetch('/api/cuentas-cobrar').then(r => r.json()),
      fetch('/api/cuentas-pagar').then(r => r.json()),
      fetch(`/api/contabilidad/estados?tipo=pyg&fi=${new Date(new Date().getFullYear(),0,1).toISOString().slice(0,10)}&ff=${TODAY}`).then(r => r.json()),
      fetch(`/api/reportes?fecha_ini=${new Date(new Date().getFullYear(),0,1).toISOString().slice(0,10)}&fecha_fin=${TODAY}`).then(r => r.json()),
    ])
    setConsolData({ inv: invRes, activos: activosRes2, cobrar: cobrarRes2, pagar: pagarRes2, pyg: pygRes2, ventas: ventasRes })
    setConsolLoading(false)
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
    const res = await fetch('/api/contabilidad/periodos')
    setPeriodos(await res.json())
  }

  // ─── Actions ─────────────────────────────────────────────────────────────────
  const openEditAsiento = (a: any) => {
    setEditAsiento(a)
    setAsientoForm({ concepto: a.concepto, tipo: a.tipo, fecha: new Date(a.fecha).toISOString().slice(0,10) })
    setPartidas(a.partidas.map((p: any) => ({ cuentaId: String(p.cuentaId), debe: p.debe > 0 ? String(p.debe) : '', haber: p.haber > 0 ? String(p.haber) : '' })))
    setShowAsientoModal(true)
  }

  const deleteAsiento = async (a: any) => {
    if (!confirm(`Eliminar asiento ${a.numero}? Esta acción no se puede deshacer.`)) return
    const res = await fetch(`/api/contabilidad/asientos?id=${a.id}`, { method: 'DELETE' })
    const data = await res.json()
    if (data.ok) { toast.success('Asiento eliminado'); loadDiario() }
    else toast.error(data.error)
  }

  const saveAsiento = async () => {
    if (!asientoForm.concepto) { toast.error('Escribe el concepto'); return }
    const td = partidas.reduce((s, p) => s + (+p.debe||0), 0)
    const th = partidas.reduce((s, p) => s + (+p.haber||0), 0)
    if (Math.abs(td - th) > 0.01) { toast.error(`No cuadra — Debe Q${td.toFixed(2)} | Haber Q${th.toFixed(2)}`); return }
    setLoading(true)
    const isEdit = !!editAsiento
    const res = await fetch('/api/contabilidad/asientos', {
      method: isEdit ? 'PATCH' : 'POST',
      headers: {'Content-Type':'application/json'},
      body: JSON.stringify(isEdit ? { id: editAsiento.id, ...asientoForm, partidas } : { ...asientoForm, partidas })
    })
    const data = await res.json()
    setLoading(false)
    if (data.ok) {
      toast.success(isEdit ? 'Asiento actualizado' : 'Asiento guardado')
      setShowAsientoModal(false)
      setEditAsiento(null)
      setPartidas([{cuentaId:'',debe:'',haber:''},{cuentaId:'',debe:'',haber:''}])
      loadDiario()
    } else toast.error(data.error)
  }

  const saveCC = async () => {
    if (!formCC.clienteNombre || !formCC.monto || !formCC.fechaVencimiento) { toast.error('Completa los campos requeridos'); return }
    setLoading(true)
    const res = await fetch('/api/cuentas-cobrar', { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify(formCC) })
    const data = await res.json()
    setLoading(false)
    if (data.ok) { toast.success(`${data.cuenta.numero} creada`); setShowCuentaModal(null); loadCuentasCP() }
    else toast.error(data.error)
  }

  const saveCP = async () => {
    if (!formCP.proveedorNombre || !formCP.monto || !formCP.fechaVencimiento) { toast.error('Completa los campos requeridos'); return }
    setLoading(true)
    const res = await fetch('/api/cuentas-pagar', { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify(formCP) })
    const data = await res.json()
    setLoading(false)
    if (data.ok) { toast.success(`${data.cuenta.numero} creada`); setShowCuentaModal(null); loadCuentasCP() }
    else toast.error(data.error)
  }

  const registrarPago = async () => {
    if (!montoPago || !showPagoModal) return
    setLoading(true)
    const url = cuentaTab === 'cobrar' ? '/api/cuentas-cobrar' : '/api/cuentas-pagar'
    const res = await fetch(url, { method:'PATCH', headers:{'Content-Type':'application/json'}, body:JSON.stringify({ id: showPagoModal.id, montoPago: +montoPago }) })
    const data = await res.json()
    setLoading(false)
    if (data.ok) { toast.success('Pago registrado'); setShowPagoModal(null); setMontoPago(''); loadCuentasCP() }
    else toast.error(data.error)
  }

  const saveActivo = async () => {
    setLoading(true)
    const res = await fetch('/api/contabilidad/activos', { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify(activoForm) })
    const data = await res.json()
    setLoading(false)
    if (data.ok) { toast.success('Activo registrado'); setShowActivoModal(false); setActivoForm({ nombre:'', descripcion:'', fechaAdquisicion:TODAY, costoOriginal:'', vidaUtilAnios:'5', valorResidual:'0' }); loadActivos() }
    else toast.error(data.error)
  }

  const imprimirIVA = () => {
    if (!ivaData) return
    const html = `<!DOCTYPE html><html><head><meta charset="UTF-8"/><style>body{font-family:Arial,sans-serif;font-size:12px;padding:24px;color:#0f172a}.header{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:20px;padding-bottom:14px;border-bottom:2px solid #2563eb}.logo{font-size:18px;font-weight:700}.logo span{color:#2563eb}h2{font-size:13px;font-weight:700;margin:16px 0 8px;border-left:3px solid #2563eb;padding-left:8px}.row{display:flex;justify-content:space-between;padding:6px 0;border-bottom:1px solid #f1f5f9;font-size:12px}.total-box{background:#eff6ff;border:1px solid #bfdbfe;border-radius:8px;padding:14px;margin-top:14px;display:flex;justify-content:space-between;align-items:center}.total-label{font-size:13px;font-weight:700}.total-value{font-size:22px;font-weight:800;color:#2563eb}@media print{@page{margin:10mm;size:A4}}</style></head><body>
    <div class="header"><div><div class="logo">Web<span>Soft</span> Solutions</div><div style="font-size:10px;color:#64748b;margin-top:2px">Guastatoya, El Progreso, Guatemala</div></div><div style="text-align:right"><div style="font-size:11px;font-weight:700;background:#2563eb;color:#fff;padding:3px 10px;border-radius:20px;display:inline-block">DECLARACIÓN IVA</div><div style="font-size:10px;color:#64748b;margin-top:6px">Periodo: ${ivaData.periodo.fi} — ${ivaData.periodo.ff}</div></div></div>
    <h2>IVA Débito — Ventas</h2>
    <div class="row"><span>Facturas emitidas</span><span>${ivaData.ventas.count}</span></div>
    <div class="row"><span>Total ventas (con IVA)</span><span>Q ${ivaData.ventas.total.toFixed(2)}</span></div>
    <div class="row"><span>Base imponible</span><span>Q ${ivaData.ventas.base.toFixed(2)}</span></div>
    <div class="row" style="font-weight:700"><span>IVA débito (5%)</span><span style="color:#dc2626">Q ${ivaData.ventas.iva.toFixed(2)}</span></div>
    <h2>IVA Crédito — Compras</h2>
    <div class="row"><span>Facturas recibidas</span><span>${ivaData.compras.count}</span></div>
    <div class="row"><span>Total compras (con IVA)</span><span>Q ${ivaData.compras.total.toFixed(2)}</span></div>
    <div class="row"><span>Base imponible</span><span>Q ${ivaData.compras.base.toFixed(2)}</span></div>
    <div class="row" style="font-weight:700"><span>IVA crédito (5%)</span><span style="color:#16a34a">Q ${ivaData.compras.iva.toFixed(2)}</span></div>
    <div class="total-box"><div><div class="total-label">IVA líquido a pagar al SAT</div><div style="font-size:10px;color:#64748b;margin-top:3px">Formulario SAT 2046 · Vence día 15</div></div><div class="total-value">Q ${ivaData.liquidacion.aPagar.toFixed(2)}</div></div>
    ${ivaData.liquidacion.saldoFavor > 0 ? `<div style="margin-top:10px;font-size:12px;color:#16a34a;font-weight:700">Saldo a favor: Q ${ivaData.liquidacion.saldoFavor.toFixed(2)}</div>` : ''}
    <div style="margin-top:24px;border-top:1px solid #e2e8f0;padding-top:14px;display:grid;grid-template-columns:1fr 1fr;gap:20px">
      <div style="border-top:2px solid #0f172a;padding-top:8px"><div style="font-size:10px;color:#64748b">Firma del Contador</div></div>
      <div style="border-top:2px solid #0f172a;padding-top:8px"><div style="font-size:10px;color:#64748b">Sello y firma del Representante Legal</div></div>
    </div>
    <div style="margin-top:16px;font-size:9px;color:#94a3b8;text-align:center">Generado el ${new Date().toLocaleDateString('es-GT')} · WebSoft Solutions</div>
    <script>window.onload=function(){window.print()}</script></body></html>`
    const w = window.open('', '_blank')
    if (w) { w.document.write(html); w.document.close() }
  }

  const cerrarPeriodo = async (id: number) => {
    if (!confirm('Cerrar periodo? No se podrán modificar los asientos.')) return
    const res = await fetch('/api/contabilidad/periodos', { method:'PATCH', headers:{'Content-Type':'application/json'}, body:JSON.stringify({id, accion:'cerrar'}) })
    const data = await res.json()
    if (data.ok) { toast.success('Periodo cerrado'); loadPeriodos() }
    else toast.error(data.error)
  }

  // ─── Styles ──────────────────────────────────────────────────────────────────
  const thS = { background:'#f8fafc', fontSize:11, fontWeight:700 as const, color:'#64748b', textTransform:'uppercase' as const, padding:'9px 13px', textAlign:'left' as const, borderBottom:'1px solid #e2e8f0' }
  const tdS = { padding:'10px 13px', fontSize:13, borderBottom:'1px solid #f1f5f9' }
  const lbl = { display:'block' as const, fontSize:11, fontWeight:700 as const, color:'#64748b', textTransform:'uppercase' as const, marginBottom:4 }
  const inp = { width:'100%', padding:'9px 12px', border:'1.5px solid #e2e8f0', borderRadius:8, fontFamily:'inherit', fontSize:13, color:'#0f172a', outline:'none' }
  const kpiColor = ['#2563eb','#16a34a','#d97706','#7c3aed','#dc2626']
  const TABS: [TabType, string][] = [['resumen','Resumen'],['diario','Libro diario'],['mayor','Libro mayor'],['iva','IVA'],['pyg','P & G'],['balance','Balance'],['cobrar','C. por cobrar'],['pagar','C. por pagar'],['activos','Activos fijos'],['consolidacion','Consolidacion'],['cuentas','Plan de cuentas'],['periodos','Periodos']]

  const diasVenc = (f: string) => Math.ceil((new Date(f).getTime() - Date.now()) / 86400000)
  const estadoBadge: any = { pendiente:'badge-orange', parcial:'badge-blue', pagado:'badge-green', vencido:'badge-red' }
  const totalDebe = partidas.reduce((s,p) => s+(+p.debe||0), 0)
  const totalHaber = partidas.reduce((s,p) => s+(+p.haber||0), 0)
  const cuadra = Math.abs(totalDebe - totalHaber) < 0.01

  // ─── Setup screen ─────────────────────────────────────────────────────────────
  if (setupDone === false) return (
    <div style={{ padding:24, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', minHeight:400, gap:16 }}>
      <div style={{ fontSize:20, fontWeight:700 }}>Inicializar módulo contable</div>
      <p style={{ color:'#64748b', textAlign:'center', maxWidth:440 }}>Crea el plan de cuentas estándar de Guatemala con 38 cuentas contables (activos, pasivos, capital, ingresos, costos y gastos) y el periodo contable actual.</p>
      <button className="btn-primary" onClick={runSetup} disabled={loading}>{loading ? 'Inicializando...' : 'Inicializar ahora'}</button>
    </div>
  )
  if (setupDone === null) return <div style={{ padding:40, textAlign:'center', color:'#64748b' }}>Cargando...</div>

  return (
    <div style={{ padding:24, display:'flex', flexDirection:'column', gap:16 }}>
      {/* Header */}
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
        <div>
          <h1 style={{ fontSize:20, fontWeight:700, color:'#0f172a' }}>Contabilidad</h1>
          <p style={{ fontSize:12, color:'#64748b', marginTop:3 }}>Libros · IVA · Estados financieros · Cuentas por cobrar/pagar</p>
        </div>
        <div style={{ display:'flex', gap:8 }}>
          {tab === 'diario' && <button className="btn-primary" onClick={() => setShowAsientoModal(true)}>+ Asiento manual</button>}
          {tab === 'cobrar' && <button className="btn-primary" onClick={() => setShowCuentaModal('cobrar')}>+ Cuenta por cobrar</button>}
          {tab === 'pagar' && <button className="btn-primary" onClick={() => setShowCuentaModal('pagar')}>+ Cuenta por pagar</button>}
          {tab === 'activos' && <button className="btn-primary" onClick={() => { setShowActivoModal(true); loadActivos() }}>+ Activo fijo</button>}
          {tab === 'consolidacion' && <button className="btn-ghost" onClick={loadConsolidacion} disabled={consolLoading}>{consolLoading ? 'Actualizando...' : 'Actualizar datos'}</button>}
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display:'flex', gap:3, flexWrap:'wrap', borderBottom:'1px solid #e2e8f0', paddingBottom:0 }}>
        {TABS.map(([id, label]) => (
          <button key={id} onClick={() => { setTab(id); if (id==='activos') loadActivos(); if (id==='cobrar'||id==='pagar') loadCuentasCP(); if (id==='periodos') loadPeriodos() }}
            style={{ padding:'8px 14px', border:'none', borderBottom: tab===id ? '2px solid #2563eb' : '2px solid transparent', cursor:'pointer', fontSize:12, fontWeight:600, fontFamily:'inherit', background:'transparent', color:tab===id?'#2563eb':'#64748b', marginBottom:-1, transition:'all .15s', whiteSpace:'nowrap' }}>
            {label}
          </button>
        ))}
      </div>

      {/* Date range picker (shared) */}
      {['diario','mayor','pyg'].includes(tab) && (
        <div className="card" style={{ padding:14 }}>
          <div style={{ display:'flex', gap:10, flexWrap:'wrap', alignItems:'flex-end' }}>
            <div><label style={lbl}>Desde</label><input className="input" type="date" value={fi} onChange={e => setFi(e.target.value)} /></div>
            <div><label style={lbl}>Hasta</label><input className="input" type="date" value={ff} onChange={e => setFf(e.target.value)} /></div>
            {tab==='diario' && <button className="btn-primary" onClick={loadDiario} disabled={loading}>Cargar asientos</button>}
            {tab==='mayor' && <button className="btn-primary" onClick={loadMayor} disabled={loading}>Ver mayor</button>}
            {tab==='pyg' && <button className="btn-primary" onClick={loadPyg} disabled={loading}>Generar P & G</button>}
            {[['7','7 dias'],['30','30 dias'],['90','90 dias']].map(([d,l]) => (
              <button key={d} className="btn-ghost btn-sm" onClick={() => { const e=new Date(); const s=new Date(); s.setDate(s.getDate()-(+d)); setFi(s.toISOString().slice(0,10)); setFf(e.toISOString().slice(0,10)) }}>{l}</button>
            ))}
          </div>
        </div>
      )}
      {tab==='balance' && (
        <div className="card" style={{ padding:14 }}>
          <div style={{ display:'flex', gap:10, alignItems:'flex-end' }}>
            <div><label style={lbl}>Corte al</label><input className="input" type="date" value={ff} onChange={e => setFf(e.target.value)} /></div>
            <button className="btn-primary" onClick={loadBalance} disabled={loading}>Generar balance</button>
          </div>
        </div>
      )}

      {/* ── RESUMEN ──────────────────────────────────────────────────── */}
      {tab === 'resumen' && (
        <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:14 }}>
            {[
              { l:'Ingresos del mes', v: resumen?.pyg?.ingresos?.ventas != null ? fmt(resumen.pyg.ingresos.ventas) : '—', c:'#16a34a', s:'Sin IVA' },
              { l:'Utilidad neta', v: resumen?.pyg?.utilidadNeta != null ? fmt(resumen.pyg.utilidadNeta) : '—', c:resumen?.pyg?.utilidadNeta>=0?'#16a34a':'#dc2626', s:`Margen ${resumen?.pyg?.margen||0}%` },
              { l:'IVA a pagar SAT', v: resumen?.iva?.liquidacion?.aPagar != null ? fmt(resumen.iva.liquidacion.aPagar) : '—', c:'#2563eb', s:'Mes actual' },
              { l:'Por cobrar', v: resumen?.cobrar ? fmt((resumen.cobrar._sum?.monto||0)-(resumen.cobrar._sum?.montoPagado||0)) : '—', c:'#d97706', s:'Cartera activa' },
            ].map(k => (
              <div key={k.l} className="card" style={{ padding:'16px 18px', borderTop:`3px solid ${k.c}` }}>
                <div style={{ fontSize:11, color:'#64748b', textTransform:'uppercase', marginBottom:6 }}>{k.l}</div>
                <div style={{ fontSize:22, fontWeight:800, color:k.c }}>{k.v}</div>
                <div style={{ fontSize:11, color:'#94a3b8', marginTop:4 }}>{k.s}</div>
              </div>
            ))}
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14 }}>
            <div className="card" style={{ padding:18 }}>
              <h3 style={{ fontSize:14, fontWeight:700, marginBottom:14 }}>Estado del periodo actual</h3>
              {[
                ['Ventas del mes', fmt(resumen?.pyg?.ingresos?.ventas||0),'#0f172a'],
                ['Costo de ventas', fmt(resumen?.pyg?.costos?.costoVentas||0),'#dc2626'],
                ['Utilidad bruta', fmt(resumen?.pyg?.utilidadBruta||0),(resumen?.pyg?.utilidadBruta||0)>=0?'#16a34a':'#dc2626'],
                ['Gastos operativos', fmt(resumen?.pyg?.gastos?.total||0),'#d97706'],
                ['Utilidad neta', fmt(resumen?.pyg?.utilidadNeta||0),(resumen?.pyg?.utilidadNeta||0)>=0?'#16a34a':'#dc2626'],
              ].map(([l,v,c]) => (
                <div key={String(l)} style={{ display:'flex', justifyContent:'space-between', padding:'8px 0', borderBottom:'1px solid #f1f5f9', fontSize:13 }}>
                  <span style={{ color:'#475569' }}>{l}</span>
                  <span style={{ fontWeight:600, color:c as string }}>{v}</span>
                </div>
              ))}
            </div>
            <div className="card" style={{ padding:18 }}>
              <h3 style={{ fontSize:14, fontWeight:700, marginBottom:14 }}>Cuentas por cobrar — vencimientos</h3>
              {cobrar.filter(c => c.estado !== 'pagado').slice(0,6).map(c => {
                const dias = diasVenc(c.fechaVencimiento)
                const saldo = c.monto - c.montoPagado
                return (
                  <div key={c.id} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'7px 0', borderBottom:'1px solid #f8fafc', fontSize:12 }}>
                    <div>
                      <div style={{ fontWeight:600, color:'#0f172a' }}>{c.clienteNombre}</div>
                      <div style={{ fontSize:11, color:dias<0?'#dc2626':dias<=7?'#d97706':'#94a3b8' }}>
                        {dias<0?`Vencida ${Math.abs(dias)}d`:dias===0?'Vence hoy':`${dias}d`}
                      </div>
                    </div>
                    <span style={{ fontWeight:700, color:'#0f172a' }}>{fmt(saldo)}</span>
                  </div>
                )
              })}
              {cobrar.filter(c=>c.estado!=='pagado').length === 0 && <p style={{ color:'#94a3b8', fontSize:13 }}>Sin cuentas pendientes</p>}
            </div>
          </div>
        </div>
      )}

      {/* ── LIBRO DIARIO ─────────────────────────────────────────────── */}
      {tab === 'diario' && (
        <>
          {diarioMeta && (
            <div style={{ display:'flex', gap:10, padding:'10px 14px', background:'#f8fafc', borderRadius:8, fontSize:13 }}>
              <span>{asientos.length} asientos</span>
              <span style={{ color:'#16a34a', fontWeight:700 }}>Total debe: {fmt(diarioMeta.totalDebe)}</span>
              <span style={{ color:'#dc2626', fontWeight:700 }}>Total haber: {fmt(diarioMeta.totalHaber)}</span>
              <span style={{ fontWeight:700, color:diarioMeta.cuadrado?'#16a34a':'#dc2626' }}>{diarioMeta.cuadrado?'Periodo cuadrado':'Descuadre detectado'}</span>
            </div>
          )}
          {asientos.length > 0 ? (
            <div className="card" style={{ padding:0, overflow:'hidden' }}>
              <div style={{ overflowX:'auto' }}>
                <table style={{ width:'100%', borderCollapse:'collapse' }}>
                  <thead><tr>{['Asiento','Fecha','Concepto','Tipo','Cuenta','Debe','Haber',''].map(h=><th key={h} style={thS}>{h}</th>)}</tr></thead>
                  <tbody>
                    {asientos.flatMap(a => a.partidas.map((p: any, i: number) => (
                      <tr key={`${a.id}-${p.id}`} style={{ background:i===0?'#fafafa':'#fff' }}>
                        {i===0 ? <>
                          <td style={{ ...tdS, fontWeight:700, color:'#2563eb', fontSize:11, whiteSpace:'nowrap' }} rowSpan={a.partidas.length}>{a.numero}</td>
                          <td style={{ ...tdS, fontSize:11, color:'#64748b', whiteSpace:'nowrap' }} rowSpan={a.partidas.length}>{new Date(a.fecha).toLocaleDateString('es-GT')}</td>
                          <td style={{ ...tdS, fontWeight:600, maxWidth:180, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }} rowSpan={a.partidas.length}>{a.concepto}</td>
                          <td style={tdS} rowSpan={a.partidas.length}><span style={{ fontSize:10, background:'#eff6ff', color:'#2563eb', padding:'2px 7px', borderRadius:10, fontWeight:700 }}>{a.tipo}</span></td>
                          {['manual','ajuste'].includes(a.tipo) ? (
                            <td style={{ ...tdS, whiteSpace:'nowrap' }} rowSpan={a.partidas.length}>
                              <div style={{ display:'flex', gap:5 }}>
                                <button onClick={()=>openEditAsiento(a)} style={{ fontSize:11, fontWeight:700, padding:'3px 9px', background:'#eff6ff', color:'#2563eb', border:'1px solid #bfdbfe', borderRadius:6, cursor:'pointer', fontFamily:'inherit' }}>Editar</button>
                                <button onClick={()=>deleteAsiento(a)} style={{ fontSize:11, fontWeight:700, padding:'3px 9px', background:'#fef2f2', color:'#dc2626', border:'1px solid #fecaca', borderRadius:6, cursor:'pointer', fontFamily:'inherit' }}>Eliminar</button>
                              </div>
                            </td>
                          ) : <td style={tdS} rowSpan={a.partidas.length} />}
                        </> : null}
                        <td style={{ ...tdS, fontSize:12, color:'#475569' }}>{p.cuenta?.codigo} — {p.cuenta?.nombre}</td>
                        <td style={{ ...tdS, color:'#16a34a', fontWeight:p.debe>0?700:400 }}>{p.debe>0?fmt(p.debe):'—'}</td>
                        <td style={{ ...tdS, color:'#dc2626', fontWeight:p.haber>0?700:400 }}>{p.haber>0?fmt(p.haber):'—'}</td>
                      </tr>
                    )))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : <div style={{ textAlign:'center', padding:60, color:'#94a3b8' }}><p>Carga los asientos para ver el libro diario</p></div>}
        </>
      )}

      {/* ── LIBRO MAYOR ──────────────────────────────────────────────── */}
      {tab === 'mayor' && (
        <>
          <div className="card" style={{ padding:14 }}>
            <label style={lbl}>Filtrar por cuenta (opcional)</label>
            <select style={{ ...inp, maxWidth:320 }} value={mayorCuentaId} onChange={e => setMayorCuentaId(e.target.value)}>
              <option value="">Todas las cuentas</option>
              {cuentas.filter(c=>c.nivel>=2).map(c=><option key={c.id} value={c.id}>{c.codigo} — {c.nombre}</option>)}
            </select>
          </div>
          {mayorData.length > 0 && mayorData.map((mc: any) => (
            <div key={mc.cuenta.id} className="card" style={{ padding:0, overflow:'hidden' }}>
              <div onClick={() => setMayorExpanded(p=>({...p,[mc.cuenta.id]:!p[mc.cuenta.id]}))}
                style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'12px 16px', cursor:'pointer', background:'#f8fafc', borderBottom:'1px solid #e2e8f0' }}>
                <div style={{ display:'flex', gap:12, alignItems:'center' }}>
                  <span style={{ fontFamily:'monospace', fontSize:12, color:'#2563eb', fontWeight:700 }}>{mc.cuenta.codigo}</span>
                  <span style={{ fontWeight:600 }}>{mc.cuenta.nombre}</span>
                  <span style={{ fontSize:10, background:'#eff6ff', color:'#2563eb', padding:'2px 7px', borderRadius:10, fontWeight:700, textTransform:'capitalize' }}>{mc.cuenta.tipo}</span>
                </div>
                <div style={{ display:'flex', gap:20, alignItems:'center', fontSize:13 }}>
                  <span style={{ color:'#16a34a' }}>Debe: {fmt(mc.totalDebe)}</span>
                  <span style={{ color:'#dc2626' }}>Haber: {fmt(mc.totalHaber)}</span>
                  <span style={{ fontWeight:800, color:mc.saldo>=0?'#2563eb':'#dc2626' }}>Saldo: {fmt(Math.abs(mc.saldo))}</span>
                  <span style={{ color:'#94a3b8', fontSize:16 }}>{mayorExpanded[mc.cuenta.id]?'▲':'▼'}</span>
                </div>
              </div>
              {mayorExpanded[mc.cuenta.id] && (
                <table style={{ width:'100%', borderCollapse:'collapse' }}>
                  <thead><tr>{['Fecha','Asiento','Concepto','Debe','Haber','Saldo'].map(h=><th key={h} style={thS}>{h}</th>)}</tr></thead>
                  <tbody>
                    {mc.movimientos.map((m: any, idx: number) => {
                      const saldoAcum = mc.movimientos.slice(0,idx+1).reduce((s: number,x: any)=> mc.cuenta.naturaleza==='deudora'?s+x.debe-x.haber:s+x.haber-x.debe, 0)
                      return (
                        <tr key={m.id}>
                          <td style={{ ...tdS, fontSize:11, color:'#64748b' }}>{new Date(m.asiento.fecha).toLocaleDateString('es-GT')}</td>
                          <td style={{ ...tdS, fontWeight:700, color:'#2563eb', fontSize:11 }}>{m.asiento.numero}</td>
                          <td style={{ ...tdS, fontSize:12, color:'#475569' }}>{m.asiento.concepto}</td>
                          <td style={{ ...tdS, color:'#16a34a', fontWeight:m.debe>0?700:400 }}>{m.debe>0?fmt(m.debe):'—'}</td>
                          <td style={{ ...tdS, color:'#dc2626', fontWeight:m.haber>0?700:400 }}>{m.haber>0?fmt(m.haber):'—'}</td>
                          <td style={{ ...tdS, fontWeight:700, color:saldoAcum>=0?'#2563eb':'#dc2626' }}>{fmt(Math.abs(saldoAcum))}</td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              )}
            </div>
          ))}
          {mayorData.length===0 && !loading && <div style={{ textAlign:'center', padding:60, color:'#94a3b8' }}><p>Configura el rango y carga el libro mayor</p></div>}
        </>
      )}

      {/* ── IVA ──────────────────────────────────────────────────────── */}
      {tab === 'iva' && (
        <>
          <div className="card" style={{ padding:14 }}>
            <div style={{ display:'flex', gap:10, alignItems:'flex-end', flexWrap:'wrap' }}>
              <div><label style={lbl}>Mes de declaración</label><input className="input" type="month" value={ivaMes} onChange={e => setIvaMes(e.target.value)} /></div>
              <button className="btn-primary" onClick={loadIva} disabled={loading}>Calcular</button>
              {ivaData && <button className="btn-ghost" onClick={imprimirIVA}><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/></svg> Imprimir PDF</button>}
            </div>
          </div>
          {ivaData && (
            <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14 }}>
                {[
                  { title:'IVA Débito — Ventas', color:'#dc2626', rows:[['Facturas emitidas', String(ivaData.ventas.count)],['Total ventas', fmt(ivaData.ventas.total)],['Base imponible', fmt(ivaData.ventas.base)],['IVA débito 5%', fmt(ivaData.ventas.iva)]] },
                  { title:'IVA Crédito — Compras', color:'#16a34a', rows:[['Facturas recibidas', String(ivaData.compras.count)],['Total compras', fmt(ivaData.compras.total)],['Base imponible', fmt(ivaData.compras.base)],['IVA crédito 5%', fmt(ivaData.compras.iva)]] },
                ].map(sec => (
                  <div key={sec.title} className="card" style={{ padding:18 }}>
                    <h3 style={{ fontSize:14, fontWeight:700, marginBottom:14, color:sec.color }}>{sec.title}</h3>
                    {sec.rows.map(([l,v],i) => (
                      <div key={String(l)} style={{ display:'flex', justifyContent:'space-between', padding:'8px 0', borderBottom:'1px solid #f1f5f9', fontWeight:i===sec.rows.length-1?700:400 }}>
                        <span style={{ fontSize:13, color:'#475569' }}>{l}</span>
                        <span style={{ fontSize:13, color:i===sec.rows.length-1?sec.color:'#0f172a' }}>{v}</span>
                      </div>
                    ))}
                  </div>
                ))}
              </div>
              <div className="card" style={{ padding:20, border:'2px solid #2563eb' }}>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                  <div>
                    <div style={{ fontSize:15, fontWeight:700 }}>IVA líquido a pagar al SAT</div>
                    <div style={{ fontSize:12, color:'#64748b', marginTop:4 }}>Formulario SAT 2046 · Vence día 15 del mes siguiente</div>
                    <div style={{ fontSize:12, color:'#64748b', marginTop:2 }}>Débito Q{ivaData.liquidacion.ivaDebito.toFixed(2)} — Crédito Q{ivaData.liquidacion.ivaCredito.toFixed(2)}</div>
                  </div>
                  <div style={{ fontSize:32, fontWeight:800, color:'#2563eb' }}>{fmt(ivaData.liquidacion.aPagar)}</div>
                </div>
                {ivaData.liquidacion.saldoFavor > 0 && <div style={{ marginTop:10, fontSize:13, color:'#16a34a', fontWeight:700 }}>Saldo a favor para el próximo mes: {fmt(ivaData.liquidacion.saldoFavor)}</div>}
              </div>
            </div>
          )}
          {!ivaData && <div style={{ textAlign:'center', padding:60, color:'#94a3b8' }}><p>Selecciona el mes y calcula el IVA</p></div>}
        </>
      )}

      {/* ── P&G ──────────────────────────────────────────────────────── */}
      {tab === 'pyg' && (
        <>
          {pygData && (
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16 }}>
              <div className="card" style={{ padding:20 }}>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:16 }}>
                  <h3 style={{ fontSize:15, fontWeight:700 }}>Estado de Resultados</h3>
                  <span style={{ fontSize:11, color:'#64748b' }}>{fi} — {ff}</span>
                </div>
                {[
                  { l:'(+) Ventas netas', v:pygData.ingresos.ventas, c:'#16a34a', sep:false },
                  { l:'(−) Costo de ventas', v:pygData.costos.costoVentas, c:'#dc2626', sep:false },
                  { l:'= Utilidad bruta', v:pygData.utilidadBruta, c:pygData.utilidadBruta>=0?'#16a34a':'#dc2626', sep:true },
                  { l:'(−) Gastos operativos', v:pygData.gastos.total, c:'#d97706', sep:false },
                  { l:'= Utilidad operativa', v:pygData.utilidadOperativa, c:pygData.utilidadOperativa>=0?'#16a34a':'#dc2626', sep:true },
                  { l:'(−) ISR 5%', v:pygData.impuestos.isr, c:'#64748b', sep:false },
                  { l:'= UTILIDAD NETA', v:pygData.utilidadNeta, c:pygData.utilidadNeta>=0?'#16a34a':'#dc2626', sep:true },
                ].map(row => (
                  <div key={row.l} style={{ display:'flex', justifyContent:'space-between', padding:`${row.sep?'10px':'7px'} 0`, borderTop:row.sep?'2px solid #e2e8f0':'none', borderBottom:row.sep?'2px solid #e2e8f0':'1px solid #f8fafc', marginTop:row.sep?4:0, fontWeight:row.sep?700:400 }}>
                    <span style={{ fontSize:row.sep?14:13, color:row.sep?'#0f172a':'#475569' }}>{row.l}</span>
                    <span style={{ fontSize:row.sep?15:13, color:row.c }}>{row.v>=0?fmt(row.v):`(${fmt(row.v*-1)})`}</span>
                  </div>
                ))}
              </div>
              <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
                {[
                  { l:'Ingresos', v:fmt(pygData.ingresos.ventas), c:'#16a34a', s:`${pygData.ingresos.count} ventas` },
                  { l:'Utilidad neta', v:fmt(pygData.utilidadNeta), c:pygData.utilidadNeta>=0?'#16a34a':'#dc2626', s:'Resultado final' },
                  { l:'Margen neto', v:`${pygData.margen}%`, c:'#7c3aed', s:'Sobre ingresos' },
                  { l:'ISR estimado', v:fmt(pygData.impuestos.isr), c:'#64748b', s:'Regimen 5%' },
                ].map(k => (
                  <div key={k.l} className="card" style={{ padding:'14px 18px', borderLeft:`4px solid ${k.c}`, borderRadius:8 }}>
                    <div style={{ fontSize:11, color:'#64748b', textTransform:'uppercase', marginBottom:4 }}>{k.l}</div>
                    <div style={{ fontSize:22, fontWeight:800, color:k.c }}>{k.v}</div>
                    <div style={{ fontSize:11, color:'#94a3b8', marginTop:3 }}>{k.s}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
          {!pygData && <div style={{ textAlign:'center', padding:60, color:'#94a3b8' }}><p>Configura el periodo y genera el P & G</p></div>}
        </>
      )}

      {/* ── BALANCE ──────────────────────────────────────────────────── */}
      {tab === 'balance' && (
        <>
          {balanceData && (
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16 }}>
              <div className="card" style={{ padding:18 }}>
                <div style={{ display:'flex', justifyContent:'space-between', marginBottom:14 }}>
                  <h3 style={{ fontSize:14, fontWeight:700, color:'#16a34a' }}>ACTIVOS</h3>
                  <span style={{ fontSize:11, color:'#64748b' }}>Al {ff}</span>
                </div>
                {balanceData.activos.map((a: any) => (
                  <div key={a.cuenta.id} style={{ display:'flex', justifyContent:'space-between', padding:'7px 0', borderBottom:'1px solid #f8fafc', fontSize:13 }}>
                    <span style={{ color:'#475569' }}>{a.cuenta.codigo} — {a.cuenta.nombre}</span>
                    <span style={{ fontWeight:600 }}>{fmt(a.saldo)}</span>
                  </div>
                ))}
                {balanceData.valorInventario > 0 && (
                  <div style={{ display:'flex', justifyContent:'space-between', padding:'7px 0', borderBottom:'1px solid #f8fafc', fontSize:13 }}>
                    <span style={{ color:'#475569' }}>1120 — Inventario</span>
                    <span style={{ fontWeight:600 }}>{fmt(balanceData.valorInventario)}</span>
                  </div>
                )}
                <div style={{ display:'flex', justifyContent:'space-between', padding:'10px 0', borderTop:'2px solid #e2e8f0', marginTop:6, fontWeight:700, fontSize:14, color:'#16a34a' }}>
                  <span>TOTAL ACTIVOS</span><span>{fmt(balanceData.totales.activos)}</span>
                </div>
              </div>
              <div className="card" style={{ padding:18 }}>
                <h3 style={{ fontSize:14, fontWeight:700, color:'#dc2626', marginBottom:14 }}>PASIVOS Y CAPITAL</h3>
                <div style={{ fontSize:11, fontWeight:700, color:'#64748b', textTransform:'uppercase', marginBottom:6 }}>Pasivos</div>
                {balanceData.pasivos.map((p: any) => (
                  <div key={p.cuenta.id} style={{ display:'flex', justifyContent:'space-between', padding:'7px 0', borderBottom:'1px solid #f8fafc', fontSize:13 }}>
                    <span style={{ color:'#475569' }}>{p.cuenta.codigo} — {p.cuenta.nombre}</span>
                    <span style={{ fontWeight:600 }}>{fmt(p.saldo)}</span>
                  </div>
                ))}
                <div style={{ display:'flex', justifyContent:'space-between', padding:'8px 0', borderTop:'1px solid #e2e8f0', fontWeight:700, fontSize:13, marginTop:4, marginBottom:10 }}>
                  <span>Total Pasivos</span><span style={{ color:'#dc2626' }}>{fmt(balanceData.totales.pasivos)}</span>
                </div>
                <div style={{ fontSize:11, fontWeight:700, color:'#64748b', textTransform:'uppercase', marginBottom:6 }}>Capital</div>
                {balanceData.capital.map((c: any) => (
                  <div key={c.cuenta.id} style={{ display:'flex', justifyContent:'space-between', padding:'7px 0', borderBottom:'1px solid #f8fafc', fontSize:13 }}>
                    <span style={{ color:'#475569' }}>{c.cuenta.codigo} — {c.cuenta.nombre}</span>
                    <span style={{ fontWeight:600 }}>{fmt(c.saldo)}</span>
                  </div>
                ))}
                <div style={{ display:'flex', justifyContent:'space-between', padding:'10px 0', borderTop:'2px solid #e2e8f0', marginTop:6, fontWeight:700, fontSize:14 }}>
                  <span>TOTAL PAS. + CAP.</span><span style={{ color:'#dc2626' }}>{fmt(balanceData.totales.pasivos+balanceData.totales.capital)}</span>
                </div>
                <div style={{ marginTop:8, textAlign:'center', fontSize:12, fontWeight:700, color:balanceData.cuadra?'#16a34a':'#dc2626' }}>
                  {balanceData.cuadra ? 'Balance cuadrado' : 'Revisar — balance no cuadra'}
                </div>
              </div>
            </div>
          )}
          {!balanceData && <div style={{ textAlign:'center', padding:60, color:'#94a3b8' }}><p>Selecciona la fecha de corte y genera el balance</p></div>}
        </>
      )}

      {/* ── CUENTAS POR COBRAR ────────────────────────────────────────── */}
      {tab === 'cobrar' && (
        <>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:14 }}>
            {[
              { l:'Por cobrar', v:fmt((resCC?._sum?.monto||0)-(resCC?._sum?.montoPagado||0)), c:'#16a34a', s:`${cobrar.filter(c=>c.estado!=='pagado').length} cuentas activas` },
              { l:'Vencidas', v:fmt(cobrar.filter(c=>c.estado==='vencido').reduce((s,c)=>s+(c.monto-c.montoPagado),0)), c:'#dc2626', s:`${cobrar.filter(c=>c.estado==='vencido').length} vencidas` },
              { l:'Cobrado', v:fmt(resCC?._sum?.montoPagado||0), c:'#2563eb', s:'Total recuperado' },
            ].map(k=>(
              <div key={k.l} className="card" style={{ padding:'14px 18px', borderTop:`3px solid ${k.c}` }}>
                <div style={{ fontSize:11, color:'#64748b', textTransform:'uppercase', marginBottom:5 }}>{k.l}</div>
                <div style={{ fontSize:22, fontWeight:800, color:k.c }}>{k.v}</div>
                <div style={{ fontSize:11, color:'#94a3b8', marginTop:3 }}>{k.s}</div>
              </div>
            ))}
          </div>
          <div className="card" style={{ padding:0, overflow:'hidden' }}>
            <table style={{ width:'100%', borderCollapse:'collapse' }}>
              <thead><tr>{['#','Cliente','Concepto','Vencimiento','Monto','Pagado','Saldo','Estado',''].map(h=><th key={h} style={thS}>{h}</th>)}</tr></thead>
              <tbody>
                {cobrar.length===0
                  ? <tr><td colSpan={9} style={{ textAlign:'center', padding:50, color:'#94a3b8' }}>Sin cuentas por cobrar</td></tr>
                  : cobrar.map(c => {
                    const saldo = c.monto-c.montoPagado
                    const dias = diasVenc(c.fechaVencimiento)
                    return (
                      <tr key={c.id}>
                        <td style={{ ...tdS, fontWeight:700, color:'#2563eb', fontSize:11 }}>{c.numero}</td>
                        <td style={{ ...tdS, fontWeight:600 }}>{c.clienteNombre}</td>
                        <td style={{ ...tdS, fontSize:12, color:'#475569', maxWidth:160, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{c.concepto}</td>
                        <td style={tdS}>
                          <div style={{ fontSize:12 }}>{fmtDate(c.fechaVencimiento)}</div>
                          {c.estado!=='pagado' && <div style={{ fontSize:10, color:dias<0?'#dc2626':dias<=7?'#d97706':'#94a3b8' }}>{dias<0?`Vencida ${Math.abs(dias)}d`:dias===0?'Hoy':`${dias}d`}</div>}
                        </td>
                        <td style={{ ...tdS, fontWeight:700 }}>{fmt(c.monto)}</td>
                        <td style={{ ...tdS, color:'#16a34a', fontWeight:600 }}>{fmt(c.montoPagado)}</td>
                        <td style={{ ...tdS, fontWeight:700, color:saldo>0?'#dc2626':'#16a34a' }}>{fmt(saldo)}</td>
                        <td style={tdS}><span className={estadoBadge[c.estado]||'badge-gray'} style={{ fontSize:10, textTransform:'capitalize' }}>{c.estado}</span></td>
                        <td style={tdS}>
                          {c.estado!=='pagado' && <button onClick={()=>{ setShowPagoModal(c); setCuentaTab('cobrar'); setMontoPago(saldo.toFixed(2)) }} style={{ fontSize:11, fontWeight:700, padding:'4px 10px', background:'#eff6ff', color:'#2563eb', border:'1px solid #bfdbfe', borderRadius:6, cursor:'pointer', fontFamily:'inherit', whiteSpace:'nowrap' }}>Registrar pago</button>}
                        </td>
                      </tr>
                    )
                  })}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* ── CUENTAS POR PAGAR ─────────────────────────────────────────── */}
      {tab === 'pagar' && (
        <>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:14 }}>
            {[
              { l:'Por pagar', v:fmt((resCP?._sum?.monto||0)-(resCP?._sum?.montoPagado||0)), c:'#d97706', s:`${pagar.filter(p=>p.estado!=='pagado').length} cuentas activas` },
              { l:'Vencidas', v:fmt(pagar.filter(p=>p.estado==='vencido').reduce((s,p)=>s+(p.monto-p.montoPagado),0)), c:'#dc2626', s:`${pagar.filter(p=>p.estado==='vencido').length} vencidas` },
              { l:'Pagado', v:fmt(resCP?._sum?.montoPagado||0), c:'#16a34a', s:'Total cancelado' },
            ].map(k=>(
              <div key={k.l} className="card" style={{ padding:'14px 18px', borderTop:`3px solid ${k.c}` }}>
                <div style={{ fontSize:11, color:'#64748b', textTransform:'uppercase', marginBottom:5 }}>{k.l}</div>
                <div style={{ fontSize:22, fontWeight:800, color:k.c }}>{k.v}</div>
                <div style={{ fontSize:11, color:'#94a3b8', marginTop:3 }}>{k.s}</div>
              </div>
            ))}
          </div>
          <div className="card" style={{ padding:0, overflow:'hidden' }}>
            <table style={{ width:'100%', borderCollapse:'collapse' }}>
              <thead><tr>{['#','Proveedor','Concepto','Vencimiento','Monto','Pagado','Saldo','Estado',''].map(h=><th key={h} style={thS}>{h}</th>)}</tr></thead>
              <tbody>
                {pagar.length===0
                  ? <tr><td colSpan={9} style={{ textAlign:'center', padding:50, color:'#94a3b8' }}>Sin cuentas por pagar</td></tr>
                  : pagar.map(p => {
                    const saldo = p.monto-p.montoPagado
                    const dias = diasVenc(p.fechaVencimiento)
                    return (
                      <tr key={p.id}>
                        <td style={{ ...tdS, fontWeight:700, color:'#d97706', fontSize:11 }}>{p.numero}</td>
                        <td style={{ ...tdS, fontWeight:600 }}>{p.proveedorNombre}</td>
                        <td style={{ ...tdS, fontSize:12, color:'#475569', maxWidth:160, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{p.concepto}</td>
                        <td style={tdS}>
                          <div style={{ fontSize:12 }}>{fmtDate(p.fechaVencimiento)}</div>
                          {p.estado!=='pagado' && <div style={{ fontSize:10, color:dias<0?'#dc2626':dias<=7?'#d97706':'#94a3b8' }}>{dias<0?`Vencida ${Math.abs(dias)}d`:dias===0?'Hoy':`${dias}d`}</div>}
                        </td>
                        <td style={{ ...tdS, fontWeight:700 }}>{fmt(p.monto)}</td>
                        <td style={{ ...tdS, color:'#16a34a', fontWeight:600 }}>{fmt(p.montoPagado)}</td>
                        <td style={{ ...tdS, fontWeight:700, color:saldo>0?'#dc2626':'#16a34a' }}>{fmt(saldo)}</td>
                        <td style={tdS}><span className={estadoBadge[p.estado]||'badge-gray'} style={{ fontSize:10, textTransform:'capitalize' }}>{p.estado}</span></td>
                        <td style={tdS}>
                          {p.estado!=='pagado' && <button onClick={()=>{ setShowPagoModal(p); setCuentaTab('pagar'); setMontoPago(saldo.toFixed(2)) }} style={{ fontSize:11, fontWeight:700, padding:'4px 10px', background:'#fef3c7', color:'#d97706', border:'1px solid #fde68a', borderRadius:6, cursor:'pointer', fontFamily:'inherit', whiteSpace:'nowrap' }}>Registrar pago</button>}
                        </td>
                      </tr>
                    )
                  })}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* ── ACTIVOS FIJOS ─────────────────────────────────────────────── */}
      {tab === 'activos' && (
        <>
          {activosRes && (
            <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:14 }}>
              {[['Activos',String(activosRes.total),'#2563eb'],['Valor bruto',fmt(activosRes.valorBruto),'#d97706'],['Dep. acum.',fmt(activosRes.depreciacionAcum),'#dc2626'],['Valor neto',fmt(activosRes.valorNeto),'#16a34a']].map(([l,v,c])=>(
                <div key={String(l)} className="card" style={{ padding:'14px 18px', borderTop:`3px solid ${c}` }}>
                  <div style={{ fontSize:11, color:'#64748b', textTransform:'uppercase', marginBottom:5 }}>{l}</div>
                  <div style={{ fontSize:20, fontWeight:800, color:c as string }}>{v}</div>
                </div>
              ))}
            </div>
          )}
          {activos.length > 0 && (
            <div className="card" style={{ padding:0, overflow:'hidden' }}>
              <table style={{ width:'100%', borderCollapse:'collapse' }}>
                <thead><tr>{['Cod.','Activo','Costo orig.','Dep. mensual','Dep. acum.','Valor neto','Estado'].map(h=><th key={h} style={thS}>{h}</th>)}</tr></thead>
                <tbody>
                  {activos.map(a=>(
                    <tr key={a.id}>
                      <td style={{ ...tdS, fontFamily:'monospace', fontSize:11, color:'#64748b' }}>{a.codigo}</td>
                      <td style={{ ...tdS, fontWeight:600 }}>{a.nombre}<div style={{ fontSize:11, color:'#94a3b8', marginTop:2 }}>{a.vidaUtilAnios} años · {a.descripcion}</div></td>
                      <td style={tdS}>{fmt(a.costoOriginal)}</td>
                      <td style={{ ...tdS, color:'#d97706', fontWeight:600 }}>{fmt(a.depreciacionMensual)}/mes</td>
                      <td style={{ ...tdS, color:'#dc2626' }}>{fmt(a.depreciacionAcum)}</td>
                      <td style={{ ...tdS, fontWeight:700, color:'#16a34a' }}>{fmt(a.valorNeto)}</td>
                      <td style={tdS}><span style={{ fontSize:10, background:a.estado==='activo'?'#f0fdf4':'#fef2f2', color:a.estado==='activo'?'#166534':'#991b1b', padding:'2px 8px', borderRadius:10, fontWeight:700 }}>{a.estado}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          {activos.length===0 && !loading && <div style={{ textAlign:'center', padding:60, color:'#94a3b8' }}><p>No hay activos registrados. Haz clic en "+ Activo fijo" para agregar.</p></div>}
        </>
      )}

      {/* ── CONSOLIDACION ───────────────────────────────────────────────── */}
      {tab === 'consolidacion' && (
        <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
          {!consolData && !consolLoading && (
            <div style={{ textAlign:'center', padding:60 }}>
              <p style={{ fontSize:14, color:'#94a3b8', marginBottom:16 }}>Vista consolidada de todos los activos y pasivos de la empresa</p>
              <button className="btn-primary" onClick={loadConsolidacion}>Generar consolidacion</button>
            </div>
          )}
          {consolLoading && <div style={{ textAlign:'center', padding:60, color:'#64748b' }}>Calculando...</div>}
          {consolData && (
            <>
              {/* Header KPIs */}
              <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:14 }}>
                {[
                  { l:'Inventario', v:fmt(consolData.inv?.resumen?.totalInversion||0), c:'#d97706', s:`${consolData.inv?.resumen?.totalProductos||0} productos · ${consolData.inv?.resumen?.totalUnidades||0} uds` },
                  { l:'Activos fijos', v:fmt(consolData.activos?.resumen?.valorNeto||0), c:'#2563eb', s:`${consolData.activos?.resumen?.total||0} activos registrados` },
                  { l:'Cuentas por cobrar', v:fmt((consolData.cobrar?.resumen?._sum?.monto||0)-(consolData.cobrar?.resumen?._sum?.montoPagado||0)), c:'#16a34a', s:'Cartera activa' },
                  { l:'Cuentas por pagar', v:fmt((consolData.pagar?.resumen?._sum?.monto||0)-(consolData.pagar?.resumen?._sum?.montoPagado||0)), c:'#dc2626', s:'Deuda pendiente' },
                ].map(k=>(
                  <div key={k.l} className="card" style={{ padding:'16px 18px', borderTop:`3px solid ${k.c}` }}>
                    <div style={{ fontSize:11, color:'#64748b', textTransform:'uppercase', marginBottom:5 }}>{k.l}</div>
                    <div style={{ fontSize:22, fontWeight:800, color:k.c }}>{k.v}</div>
                    <div style={{ fontSize:11, color:'#94a3b8', marginTop:4 }}>{k.s}</div>
                  </div>
                ))}
              </div>

              {/* Dos columnas: ACTIVOS vs PASIVOS */}
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16 }}>
                <div className="card" style={{ padding:18 }}>
                  <h3 style={{ fontSize:14, fontWeight:700, marginBottom:14, color:'#16a34a' }}>LO QUE TIENE LA EMPRESA</h3>
                  {[
                    { l:'Inventario (al costo)', v:consolData.inv?.resumen?.totalInversion||0, c:'#d97706' },
                    { l:'Valor de venta del inventario', v:consolData.inv?.resumen?.totalValorVenta||0, c:'#16a34a' },
                    { l:'Activos fijos (valor neto)', v:consolData.activos?.resumen?.valorNeto||0, c:'#2563eb' },
                    { l:'Cuentas por cobrar', v:(consolData.cobrar?.resumen?._sum?.monto||0)-(consolData.cobrar?.resumen?._sum?.montoPagado||0), c:'#16a34a' },
                  ].map(row=>(
                    <div key={row.l} style={{ display:'flex', justifyContent:'space-between', padding:'9px 0', borderBottom:'1px solid #f8fafc', fontSize:13 }}>
                      <span style={{ color:'#475569' }}>{row.l}</span>
                      <span style={{ fontWeight:700, color:row.c }}>{fmt(row.v)}</span>
                    </div>
                  ))}
                  <div style={{ display:'flex', justifyContent:'space-between', padding:'10px 0', borderTop:'2px solid #e2e8f0', marginTop:6, fontWeight:700, fontSize:14, color:'#16a34a' }}>
                    <span>TOTAL ACTIVOS</span>
                    <span>{fmt((consolData.inv?.resumen?.totalInversion||0)+(consolData.activos?.resumen?.valorNeto||0)+((consolData.cobrar?.resumen?._sum?.monto||0)-(consolData.cobrar?.resumen?._sum?.montoPagado||0)))}</span>
                  </div>
                </div>

                <div className="card" style={{ padding:18 }}>
                  <h3 style={{ fontSize:14, fontWeight:700, marginBottom:14, color:'#dc2626' }}>LO QUE DEBE LA EMPRESA</h3>
                  {[
                    { l:'Cuentas por pagar', v:(consolData.pagar?.resumen?._sum?.monto||0)-(consolData.pagar?.resumen?._sum?.montoPagado||0), c:'#dc2626' },
                    { l:'Depreciacion acumulada', v:consolData.activos?.resumen?.depreciacionAcum||0, c:'#d97706' },
                  ].map(row=>(
                    <div key={row.l} style={{ display:'flex', justifyContent:'space-between', padding:'9px 0', borderBottom:'1px solid #f8fafc', fontSize:13 }}>
                      <span style={{ color:'#475569' }}>{row.l}</span>
                      <span style={{ fontWeight:700, color:row.c }}>{fmt(row.v)}</span>
                    </div>
                  ))}
                  <div style={{ display:'flex', justifyContent:'space-between', padding:'10px 0', borderTop:'2px solid #e2e8f0', marginTop:6, fontWeight:700, fontSize:14 }}>
                    <span>Patrimonio neto estimado</span>
                    <span style={{ color:'#7c3aed' }}>{fmt(
                      (consolData.inv?.resumen?.totalInversion||0)+
                      (consolData.activos?.resumen?.valorNeto||0)+
                      ((consolData.cobrar?.resumen?._sum?.monto||0)-(consolData.cobrar?.resumen?._sum?.montoPagado||0))-
                      ((consolData.pagar?.resumen?._sum?.monto||0)-(consolData.pagar?.resumen?._sum?.montoPagado||0))
                    )}</span>
                  </div>
                </div>
              </div>

              {/* Rendimiento del año */}
              <div className="card" style={{ padding:18 }}>
                <h3 style={{ fontSize:14, fontWeight:700, marginBottom:14 }}>Rendimiento del año en curso</h3>
                <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:14 }}>
                  {[
                    { l:'Ventas del año', v:consolData.pyg?.ingresos?.ventas||0, c:'#16a34a' },
                    { l:'Costo de ventas', v:consolData.pyg?.costos?.costoVentas||0, c:'#d97706' },
                    { l:'Gastos operativos', v:consolData.pyg?.gastos?.total||0, c:'#dc2626' },
                    { l:'Utilidad neta', v:consolData.pyg?.utilidadNeta||0, c:consolData.pyg?.utilidadNeta>=0?'#7c3aed':'#dc2626' },
                  ].map(k=>(
                    <div key={k.l} style={{ textAlign:'center', padding:'14px', background:'#f8fafc', borderRadius:8 }}>
                      <div style={{ fontSize:11, color:'#64748b', marginBottom:5 }}>{k.l}</div>
                      <div style={{ fontSize:18, fontWeight:800, color:k.c }}>{fmt(k.v)}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Activos fijos detalle */}
              {(consolData.activos?.activos||[]).length > 0 && (
                <div className="card" style={{ padding:18 }}>
                  <h3 style={{ fontSize:14, fontWeight:700, marginBottom:14 }}>Detalle de activos fijos</h3>
                  <table style={{ width:'100%', borderCollapse:'collapse' }}>
                    <thead><tr>{['Activo','Costo orig.','Dep. mensual','Dep. acum.','Valor neto'].map(h=><th key={h} style={{ background:'#f8fafc', fontSize:11, fontWeight:700, color:'#64748b', textTransform:'uppercase' as const, padding:'8px 12px', textAlign:'left' as const, borderBottom:'1px solid #e2e8f0' }}>{h}</th>)}</tr></thead>
                    <tbody>
                      {(consolData.activos?.activos||[]).map((a: any)=>(
                        <tr key={a.id}>
                          <td style={{ padding:'9px 12px', fontSize:13, borderBottom:'1px solid #f1f5f9', fontWeight:600 }}>{a.nombre}</td>
                          <td style={{ padding:'9px 12px', fontSize:13, borderBottom:'1px solid #f1f5f9' }}>{fmt(a.costoOriginal)}</td>
                          <td style={{ padding:'9px 12px', fontSize:13, borderBottom:'1px solid #f1f5f9', color:'#d97706' }}>{fmt(a.depreciacionMensual)}/mes</td>
                          <td style={{ padding:'9px 12px', fontSize:13, borderBottom:'1px solid #f1f5f9', color:'#dc2626' }}>{fmt(a.depreciacionAcum)}</td>
                          <td style={{ padding:'9px 12px', fontSize:13, borderBottom:'1px solid #f1f5f9', fontWeight:700, color:'#16a34a' }}>{fmt(a.valorNeto)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* ── PLAN DE CUENTAS ────────────────────────────────────────────── */}
      {tab === 'cuentas' && (
        <>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
            <p style={{ fontSize:12, color:'#64748b' }}>{cuentas.length} cuentas activas · Para agregar una cuenta nueva el codigo debe ser unico (no tiene que ser correlativo)</p>
            <button className="btn-primary" onClick={()=>setShowCuentaForm(!showCuentaForm)}>
              {showCuentaForm ? 'Cancelar' : '+ Nueva cuenta'}
            </button>
          </div>

          {showCuentaForm && (
            <div className="card" style={{ padding:16 }}>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 2fr 1fr 1fr 1fr auto', gap:10, alignItems:'flex-end' }}>
                <div>
                  <label style={lbl}>Codigo *</label>
                  <input style={inp} value={nuevaCuenta.codigo} onChange={e=>setNuevaCuenta(p=>({...p,codigo:e.target.value}))} placeholder="Ej: 6800" />
                  <div style={{ fontSize:9, color:'#94a3b8', marginTop:2 }}>No tiene que ser correlativo</div>
                </div>
                <div>
                  <label style={lbl}>Nombre *</label>
                  <input style={inp} value={nuevaCuenta.nombre} onChange={e=>setNuevaCuenta(p=>({...p,nombre:e.target.value}))} placeholder="Nombre de la cuenta" />
                </div>
                <div>
                  <label style={lbl}>Tipo</label>
                  <select style={inp} value={nuevaCuenta.tipo} onChange={e=>setNuevaCuenta(p=>({...p,tipo:e.target.value}))}>
                    <option value="activo">Activo</option>
                    <option value="pasivo">Pasivo</option>
                    <option value="capital">Capital</option>
                    <option value="ingreso">Ingreso</option>
                    <option value="costo">Costo</option>
                    <option value="gasto">Gasto</option>
                  </select>
                </div>
                <div>
                  <label style={lbl}>Naturaleza</label>
                  <select style={inp} value={nuevaCuenta.naturaleza} onChange={e=>setNuevaCuenta(p=>({...p,naturaleza:e.target.value}))}>
                    <option value="deudora">Deudora</option>
                    <option value="acreedora">Acreedora</option>
                  </select>
                </div>
                <div>
                  <label style={lbl}>Nivel</label>
                  <select style={inp} value={nuevaCuenta.nivel} onChange={e=>setNuevaCuenta(p=>({...p,nivel:e.target.value}))}>
                    <option value="1">1 — Grupo</option>
                    <option value="2">2 — Subgrupo</option>
                    <option value="3">3 — Cuenta</option>
                  </select>
                </div>
                <button className="btn-primary" onClick={saveCuenta} style={{ marginBottom:0, alignSelf:'flex-end', height:38 }}>Agregar</button>
              </div>
            </div>
          )}

          <div className="card" style={{ padding:0, overflow:'hidden' }}>
            <table style={{ width:'100%', borderCollapse:'collapse' }}>
              <thead><tr>{['Codigo','Nombre','Tipo','Naturaleza','Estado',''].map(h=><th key={h} style={thS}>{h}</th>)}</tr></thead>
              <tbody>
                {cuentas.map(cuenta=>(
                  <tr key={cuenta.id} style={{ background:cuenta.nivel===1?'#f8fafc':cuenta.nivel===2?'#fafafa':'#fff', opacity:cuenta.activa?1:0.5 }}>
                    <td style={{ ...tdS, fontFamily:'monospace', fontSize:12, color:'#2563eb', fontWeight:700 }}>{cuenta.codigo}</td>
                    <td style={{ ...tdS, fontWeight:cuenta.nivel<=2?700:400, paddingLeft:`${(cuenta.nivel-1)*18+13}px` }}>{cuenta.nombre}</td>
                    <td style={tdS}><span style={{ fontSize:10, background:'#eff6ff', color:'#2563eb', padding:'2px 7px', borderRadius:10, fontWeight:700, textTransform:'capitalize' }}>{cuenta.tipo}</span></td>
                    <td style={{ ...tdS, fontSize:12, color:'#64748b', textTransform:'capitalize' }}>{cuenta.naturaleza}</td>
                    <td style={tdS}><span style={{ fontSize:10, background:cuenta.activa?'#f0fdf4':'#f8fafc', color:cuenta.activa?'#166534':'#94a3b8', padding:'2px 8px', borderRadius:10, fontWeight:700 }}>{cuenta.activa?'Activa':'Inactiva'}</span></td>
                    <td style={tdS}>
                      <button onClick={()=>toggleCuenta(cuenta.id, cuenta.activa)} style={{ fontSize:11, fontWeight:700, padding:'3px 9px', background:cuenta.activa?'#fef2f2':'#f0fdf4', color:cuenta.activa?'#dc2626':'#16a34a', border:`1px solid ${cuenta.activa?'#fecaca':'#bbf7d0'}`, borderRadius:6, cursor:'pointer', fontFamily:'inherit' }}>
                        {cuenta.activa ? 'Desactivar' : 'Activar'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* ── PERIODOS ────────────────────────────────────────────────────── */}
      {tab === 'periodos' && (
        <div className="card" style={{ padding:0, overflow:'hidden' }}>
          <table style={{ width:'100%', borderCollapse:'collapse' }}>
            <thead><tr>{['Periodo','Desde','Hasta','Estado','Cerrado por',''].map(h=><th key={h} style={thS}>{h}</th>)}</tr></thead>
            <tbody>
              {periodos.length===0
                ? <tr><td colSpan={6} style={{ textAlign:'center', padding:50, color:'#94a3b8' }}>Sin periodos</td></tr>
                : periodos.map(p=>(
                  <tr key={p.id}>
                    <td style={{ ...tdS, fontWeight:600 }}>{p.nombre}</td>
                    <td style={{ ...tdS, fontSize:12, color:'#64748b' }}>{fmtDate(p.fechaInicio)}</td>
                    <td style={{ ...tdS, fontSize:12, color:'#64748b' }}>{fmtDate(p.fechaFin)}</td>
                    <td style={tdS}><span style={{ fontSize:10, background:p.estado==='abierto'?'#f0fdf4':'#fef2f2', color:p.estado==='abierto'?'#166534':'#991b1b', padding:'2px 8px', borderRadius:10, fontWeight:700 }}>{p.estado}</span></td>
                    <td style={{ ...tdS, fontSize:12, color:'#64748b' }}>{p.cerradoPor||'—'}</td>
                    <td style={tdS}>
                      {p.estado==='abierto'
                        ? <button onClick={()=>cerrarPeriodo(p.id)} style={{ fontSize:11, fontWeight:700, padding:'4px 10px', background:'#fef2f2', color:'#dc2626', border:'1px solid #fecaca', borderRadius:6, cursor:'pointer', fontFamily:'inherit' }}>Cerrar</button>
                        : <button onClick={async()=>{ const r=await fetch('/api/contabilidad/periodos',{method:'PATCH',headers:{'Content-Type':'application/json'},body:JSON.stringify({id:p.id,accion:'reabrir'})}); const d=await r.json(); if(d.ok){toast.success('Reabierto');loadPeriodos()} }} style={{ fontSize:11, fontWeight:700, padding:'4px 10px', background:'#eff6ff', color:'#2563eb', border:'1px solid #bfdbfe', borderRadius:6, cursor:'pointer', fontFamily:'inherit' }}>Reabrir</button>}
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ── MODAL: Nuevo asiento ───────────────────────────────────────── */}
      {showAsientoModal && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,.5)', zIndex:999, display:'flex', alignItems:'flex-start', justifyContent:'center', padding:20, overflowY:'auto' }}>
          <div style={{ background:'#fff', borderRadius:14, padding:28, width:'100%', maxWidth:680, margin:'auto' }}>
            <div style={{ display:'flex', justifyContent:'space-between', marginBottom:20 }}>
              <h3 style={{ fontSize:16, fontWeight:700 }}>{editAsiento ? `Editar ${editAsiento.numero}` : 'Nuevo asiento contable'}</h3>
              <button onClick={()=>{setShowAsientoModal(false);setEditAsiento(null);setPartidas([{cuentaId:'',debe:'',haber:''},{cuentaId:'',debe:'',haber:''}])}} style={{ background:'none', border:'none', fontSize:22, cursor:'pointer', color:'#94a3b8' }}>×</button>
            </div>
            <div style={{ display:'grid', gridTemplateColumns:'2fr 1fr 1fr', gap:12, marginBottom:16 }}>
              <div><label style={lbl}>Concepto *</label><input style={inp} value={asientoForm.concepto} onChange={e=>setAsientoForm(p=>({...p,concepto:e.target.value}))} placeholder="Descripcion del asiento" /></div>
              <div><label style={lbl}>Tipo</label><select style={inp} value={asientoForm.tipo} onChange={e=>setAsientoForm(p=>({...p,tipo:e.target.value}))}><option value="manual">Manual</option><option value="ajuste">Ajuste</option><option value="depreciacion">Depreciacion</option><option value="cierre">Cierre</option></select></div>
              <div><label style={lbl}>Fecha</label><input style={inp} type="date" value={asientoForm.fecha} onChange={e=>setAsientoForm(p=>({...p,fecha:e.target.value}))} /></div>
            </div>
            <div style={{ marginBottom:14 }}>
              <div style={{ display:'grid', gridTemplateColumns:'2fr 1fr 1fr auto', gap:8, marginBottom:6 }}>
                <span style={lbl}>Cuenta</span><span style={lbl}>Debe Q</span><span style={lbl}>Haber Q</span><span/>
              </div>
              {partidas.map((p,i)=>(
                <div key={i} style={{ display:'grid', gridTemplateColumns:'2fr 1fr 1fr auto', gap:8, marginBottom:8, alignItems:'center' }}>
                  <select style={inp} value={p.cuentaId} onChange={e=>setPartidas(prev=>prev.map((x,j)=>j===i?{...x,cuentaId:e.target.value}:x))}>
                    <option value="">Seleccionar cuenta...</option>
                    {cuentas.filter(c=>c.nivel>=2).map(c=><option key={c.id} value={c.id}>{c.codigo} — {c.nombre}</option>)}
                  </select>
                  <input style={inp} type="number" placeholder="0.00" value={p.debe} onChange={e=>setPartidas(prev=>prev.map((x,j)=>j===i?{...x,debe:e.target.value,haber:''}:x))} />
                  <input style={inp} type="number" placeholder="0.00" value={p.haber} onChange={e=>setPartidas(prev=>prev.map((x,j)=>j===i?{...x,haber:e.target.value,debe:''}:x))} />
                  {partidas.length>2 && <button onClick={()=>setPartidas(prev=>prev.filter((_,j)=>j!==i))} style={{ background:'#fef2f2', border:'1px solid #fecaca', borderRadius:6, color:'#dc2626', cursor:'pointer', padding:'6px 10px', fontFamily:'inherit', fontWeight:700 }}>×</button>}
                </div>
              ))}
              <button onClick={()=>setPartidas(prev=>[...prev,{cuentaId:'',debe:'',haber:''}])} style={{ fontSize:12, color:'#2563eb', background:'none', border:'none', cursor:'pointer', fontFamily:'inherit', fontWeight:700 }}>+ Agregar línea</button>
            </div>
            <div style={{ background:'#f8fafc', borderRadius:8, padding:'10px 14px', marginBottom:16, display:'flex', gap:24, fontSize:13 }}>
              <span>Debe: <strong style={{ color:'#16a34a' }}>{fmt(totalDebe)}</strong></span>
              <span>Haber: <strong style={{ color:'#dc2626' }}>{fmt(totalHaber)}</strong></span>
              <span style={{ fontWeight:700, color:cuadra?'#16a34a':'#dc2626' }}>{cuadra?'Cuadrado':'No cuadra — diferencia: '+fmt(Math.abs(totalDebe-totalHaber))}</span>
            </div>
            <div style={{ display:'flex', gap:10, justifyContent:'flex-end' }}>
              <button className="btn-ghost" onClick={()=>setShowAsientoModal(false)}>Cancelar</button>
              <button className="btn-primary" onClick={saveAsiento} disabled={loading||!cuadra}>{loading ? 'Guardando...' : editAsiento ? 'Actualizar asiento' : 'Guardar asiento'}</button>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL: Nueva cuenta cobrar ─────────────────────────────────── */}
      {showCuentaModal === 'cobrar' && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,.5)', zIndex:999, display:'flex', alignItems:'center', justifyContent:'center', padding:20 }}>
          <div style={{ background:'#fff', borderRadius:14, padding:28, width:'100%', maxWidth:520 }}>
            <div style={{ display:'flex', justifyContent:'space-between', marginBottom:18 }}>
              <h3 style={{ fontSize:15, fontWeight:700 }}>Nueva cuenta por cobrar</h3>
              <button onClick={()=>setShowCuentaModal(null)} style={{ background:'none', border:'none', fontSize:22, cursor:'pointer', color:'#94a3b8' }}>×</button>
            </div>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
              <div style={{ gridColumn:'1/-1' }}><label style={lbl}>Cliente *</label><input style={inp} value={formCC.clienteNombre} onChange={e=>setFormCC(p=>({...p,clienteNombre:e.target.value}))} placeholder="Nombre del cliente" /></div>
              <div><label style={lbl}>NIT</label><input style={inp} value={formCC.clienteNit} onChange={e=>setFormCC(p=>({...p,clienteNit:e.target.value}))} placeholder="CF" /></div>
              <div><label style={lbl}>Telefono</label><input style={inp} value={formCC.clienteTelefono} onChange={e=>setFormCC(p=>({...p,clienteTelefono:e.target.value}))} /></div>
              <div><label style={lbl}>No. Factura</label><input style={inp} value={formCC.ventaNumero} onChange={e=>setFormCC(p=>({...p,ventaNumero:e.target.value}))} placeholder="FAC-000001" /></div>
              <div><label style={lbl}>Monto Q *</label><input style={inp} type="number" value={formCC.monto} onChange={e=>setFormCC(p=>({...p,monto:e.target.value}))} /></div>
              <div style={{ gridColumn:'1/-1' }}><label style={lbl}>Concepto *</label><input style={inp} value={formCC.concepto} onChange={e=>setFormCC(p=>({...p,concepto:e.target.value}))} /></div>
              <div><label style={lbl}>Fecha vencimiento *</label><input style={inp} type="date" value={formCC.fechaVencimiento} onChange={e=>setFormCC(p=>({...p,fechaVencimiento:e.target.value}))} /></div>
              <div><label style={lbl}>Notas</label><input style={inp} value={formCC.notas} onChange={e=>setFormCC(p=>({...p,notas:e.target.value}))} /></div>
            </div>
            <div style={{ display:'flex', gap:10, justifyContent:'flex-end', marginTop:18 }}>
              <button className="btn-ghost" onClick={()=>setShowCuentaModal(null)}>Cancelar</button>
              <button className="btn-primary" onClick={saveCC} disabled={loading}>{loading?'Guardando...':'Guardar'}</button>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL: Nueva cuenta pagar ──────────────────────────────────── */}
      {showCuentaModal === 'pagar' && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,.5)', zIndex:999, display:'flex', alignItems:'center', justifyContent:'center', padding:20 }}>
          <div style={{ background:'#fff', borderRadius:14, padding:28, width:'100%', maxWidth:520 }}>
            <div style={{ display:'flex', justifyContent:'space-between', marginBottom:18 }}>
              <h3 style={{ fontSize:15, fontWeight:700 }}>Nueva cuenta por pagar</h3>
              <button onClick={()=>setShowCuentaModal(null)} style={{ background:'none', border:'none', fontSize:22, cursor:'pointer', color:'#94a3b8' }}>×</button>
            </div>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
              <div style={{ gridColumn:'1/-1' }}><label style={lbl}>Proveedor *</label><input style={inp} value={formCP.proveedorNombre} onChange={e=>setFormCP(p=>({...p,proveedorNombre:e.target.value}))} placeholder="Nombre del proveedor" /></div>
              <div><label style={lbl}>No. Compra</label><input style={inp} value={formCP.compraNumero} onChange={e=>setFormCP(p=>({...p,compraNumero:e.target.value}))} placeholder="CMP-000001" /></div>
              <div><label style={lbl}>Monto Q *</label><input style={inp} type="number" value={formCP.monto} onChange={e=>setFormCP(p=>({...p,monto:e.target.value}))} /></div>
              <div style={{ gridColumn:'1/-1' }}><label style={lbl}>Concepto *</label><input style={inp} value={formCP.concepto} onChange={e=>setFormCP(p=>({...p,concepto:e.target.value}))} /></div>
              <div><label style={lbl}>Fecha vencimiento *</label><input style={inp} type="date" value={formCP.fechaVencimiento} onChange={e=>setFormCP(p=>({...p,fechaVencimiento:e.target.value}))} /></div>
              <div><label style={lbl}>Notas</label><input style={inp} value={formCP.notas} onChange={e=>setFormCP(p=>({...p,notas:e.target.value}))} /></div>
            </div>
            <div style={{ display:'flex', gap:10, justifyContent:'flex-end', marginTop:18 }}>
              <button className="btn-ghost" onClick={()=>setShowCuentaModal(null)}>Cancelar</button>
              <button className="btn-primary" onClick={saveCP} disabled={loading}>{loading?'Guardando...':'Guardar'}</button>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL: Registrar pago ──────────────────────────────────────── */}
      {showPagoModal && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,.5)', zIndex:999, display:'flex', alignItems:'center', justifyContent:'center', padding:20 }}>
          <div style={{ background:'#fff', borderRadius:14, padding:28, width:'100%', maxWidth:420 }}>
            <div style={{ display:'flex', justifyContent:'space-between', marginBottom:16 }}>
              <h3 style={{ fontSize:15, fontWeight:700 }}>Registrar pago</h3>
              <button onClick={()=>setShowPagoModal(null)} style={{ background:'none', border:'none', fontSize:22, cursor:'pointer', color:'#94a3b8' }}>×</button>
            </div>
            <div style={{ background:'#f8fafc', borderRadius:8, padding:12, marginBottom:16, fontSize:13 }}>
              <div style={{ fontWeight:600 }}>{showPagoModal.clienteNombre||showPagoModal.proveedorNombre}</div>
              <div style={{ color:'#64748b', marginTop:3 }}>{showPagoModal.concepto}</div>
              <div style={{ display:'flex', gap:16, marginTop:8, fontSize:12 }}>
                <span>Total: <strong>{fmt(showPagoModal.monto)}</strong></span>
                <span>Pagado: <strong style={{ color:'#16a34a' }}>{fmt(showPagoModal.montoPagado)}</strong></span>
                <span>Saldo: <strong style={{ color:'#dc2626' }}>{fmt(showPagoModal.monto-showPagoModal.montoPagado)}</strong></span>
              </div>
            </div>
            <div style={{ marginBottom:16 }}>
              <label style={lbl}>Monto a pagar Q *</label>
              <input style={{ ...inp, fontSize:18, fontWeight:700 }} type="number" value={montoPago} onChange={e=>setMontoPago(e.target.value)} />
            </div>
            <div style={{ display:'flex', gap:10, justifyContent:'flex-end' }}>
              <button className="btn-ghost" onClick={()=>setShowPagoModal(null)}>Cancelar</button>
              <button className="btn-primary" onClick={registrarPago} disabled={loading}>{loading?'Guardando...':'Registrar pago'}</button>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL: Nuevo activo fijo ───────────────────────────────────── */}
      {showActivoModal && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,.5)', zIndex:999, display:'flex', alignItems:'center', justifyContent:'center', padding:20 }}>
          <div style={{ background:'#fff', borderRadius:14, padding:28, width:'100%', maxWidth:520 }}>
            <div style={{ display:'flex', justifyContent:'space-between', marginBottom:18 }}>
              <h3 style={{ fontSize:15, fontWeight:700 }}>Nuevo activo fijo</h3>
              <button onClick={()=>setShowActivoModal(false)} style={{ background:'none', border:'none', fontSize:22, cursor:'pointer', color:'#94a3b8' }}>×</button>
            </div>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
              <div style={{ gridColumn:'1/-1' }}><label style={lbl}>Nombre *</label><input style={inp} value={activoForm.nombre} onChange={e=>setActivoForm(p=>({...p,nombre:e.target.value}))} placeholder="Laptop, Camioneta, Herramientas..." /></div>
              <div style={{ gridColumn:'1/-1' }}><label style={lbl}>Descripcion</label><input style={inp} value={activoForm.descripcion} onChange={e=>setActivoForm(p=>({...p,descripcion:e.target.value}))} /></div>
              <div><label style={lbl}>Fecha adquisicion *</label><input style={inp} type="date" value={activoForm.fechaAdquisicion} onChange={e=>setActivoForm(p=>({...p,fechaAdquisicion:e.target.value}))} /></div>
              <div><label style={lbl}>Costo original Q *</label><input style={inp} type="number" value={activoForm.costoOriginal} onChange={e=>setActivoForm(p=>({...p,costoOriginal:e.target.value}))} /></div>
              <div><label style={lbl}>Vida util (años)</label><input style={inp} type="number" value={activoForm.vidaUtilAnios} onChange={e=>setActivoForm(p=>({...p,vidaUtilAnios:e.target.value}))} /></div>
              <div><label style={lbl}>Valor residual Q</label><input style={inp} type="number" value={activoForm.valorResidual} onChange={e=>setActivoForm(p=>({...p,valorResidual:e.target.value}))} /></div>
            </div>
            {activoForm.costoOriginal && activoForm.vidaUtilAnios && (
              <div style={{ background:'#eff6ff', borderRadius:8, padding:'10px 14px', marginTop:12, fontSize:13, color:'#1e40af' }}>
                Depreciacion mensual: <strong>Q {(((+activoForm.costoOriginal)-(+activoForm.valorResidual))/((+activoForm.vidaUtilAnios)*12)).toFixed(2)}</strong> · Linea recta por {activoForm.vidaUtilAnios} años
              </div>
            )}
            <div style={{ display:'flex', gap:10, justifyContent:'flex-end', marginTop:18 }}>
              <button className="btn-ghost" onClick={()=>setShowActivoModal(false)}>Cancelar</button>
              <button className="btn-primary" onClick={saveActivo} disabled={loading}>{loading?'Guardando...':'Guardar activo'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

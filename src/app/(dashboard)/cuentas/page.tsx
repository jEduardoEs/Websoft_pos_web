'use client'
import { useState, useEffect } from 'react'
import { toast } from 'sonner'
import { fmt, fmtDate } from '@/lib/utils'

interface Cuenta {
  id: number; numero: string; fecha: string; fechaVencimiento: string
  clienteNombre?: string; proveedorNombre?: string; ventaNumero?: string; compraNumero?: string
  concepto: string; monto: number; montoPagado: number; estado: string; notas: string | null
}

const emptyCC = { clienteNombre: '', clienteNit: '', clienteTelefono: '', ventaNumero: '', concepto: '', monto: '', fechaVencimiento: '', notas: '' }
const emptyCP = { proveedorNombre: '', compraNumero: '', concepto: '', monto: '', fechaVencimiento: '', notas: '' }

export default function CuentasPage() {
  const [tab, setTab] = useState<'cobrar'|'pagar'>('cobrar')
  const [cobrar, setCobrar] = useState<Cuenta[]>([])
  const [pagar, setPagar] = useState<Cuenta[]>([])
  const [resCC, setResCC] = useState<any>(null)
  const [resCP, setResCP] = useState<any>(null)
  const [showModal, setShowModal] = useState(false)
  const [showPago, setShowPago] = useState<Cuenta | null>(null)
  const [formCC, setFormCC] = useState(emptyCC)
  const [formCP, setFormCP] = useState(emptyCP)
  const [montoPago, setMontoPago] = useState('')
  const [loading, setLoading] = useState(false)
  const [proveedores, setProveedores] = useState<any[]>([])

  const loadCobrar = async () => {
    const res = await fetch('/api/cuentas-cobrar')
    const data = await res.json()
    setCobrar(data.cuentas || []); setResCC(data.resumen)
  }

  const loadPagar = async () => {
    const res = await fetch('/api/cuentas-pagar')
    const data = await res.json()
    setPagar(data.cuentas || []); setResCP(data.resumen)
    fetch('/api/proveedores').then(r => r.json()).then(setProveedores)
  }

  useEffect(() => { loadCobrar(); loadPagar() }, [])

  const saveCC = async () => {
    if (!formCC.clienteNombre || !formCC.monto || !formCC.fechaVencimiento) { toast.error('Completa los campos requeridos'); return }
    setLoading(true)
    const res = await fetch('/api/cuentas-cobrar', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(formCC) })
    const data = await res.json()
    setLoading(false)
    if (data.ok) { toast.success(`Cuenta ${data.cuenta.numero} creada`); setShowModal(false); setFormCC(emptyCC); loadCobrar() }
    else toast.error(data.error || 'Error')
  }

  const saveCP = async () => {
    if (!formCP.proveedorNombre || !formCP.monto || !formCP.fechaVencimiento) { toast.error('Completa los campos requeridos'); return }
    setLoading(true)
    const res = await fetch('/api/cuentas-pagar', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(formCP) })
    const data = await res.json()
    setLoading(false)
    if (data.ok) { toast.success(`Cuenta ${data.cuenta.numero} creada`); setShowModal(false); setFormCP(emptyCP); loadPagar() }
    else toast.error(data.error || 'Error')
  }

  const registrarPago = async () => {
    if (!montoPago || !showPago) return
    setLoading(true)
    const url = tab === 'cobrar' ? '/api/cuentas-cobrar' : '/api/cuentas-pagar'
    const res = await fetch(url, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: showPago.id, montoPago: +montoPago }) })
    const data = await res.json()
    setLoading(false)
    if (data.ok) { toast.success('Pago registrado'); setShowPago(null); setMontoPago(''); tab === 'cobrar' ? loadCobrar() : loadPagar() }
    else toast.error(data.error || 'Error')
  }

  const pendienteCC = (resCC?._sum?.monto || 0) - (resCC?._sum?.montoPagado || 0)
  const pendienteCP = (resCP?._sum?.monto || 0) - (resCP?._sum?.montoPagado || 0)

  const estadoBadge: any = { pendiente: 'badge-orange', parcial: 'badge-blue', pagado: 'badge-green', vencido: 'badge-red' }
  const thS = { background: '#f8fafc', fontSize: 11, fontWeight: 700 as const, color: '#64748b', textTransform: 'uppercase' as const, padding: '10px 14px', textAlign: 'left' as const, borderBottom: '1px solid #e2e8f0' }
  const tdS = { padding: '11px 14px', fontSize: 13, borderBottom: '1px solid #f1f5f9' }
  const lbl = { display: 'block' as const, fontSize: 11, fontWeight: 700 as const, color: '#64748b', textTransform: 'uppercase' as const, marginBottom: 4 }

  const diasVencimiento = (fecha: string) => Math.ceil((new Date(fecha).getTime() - Date.now()) / 86400000)

  return (
    <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 18 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 700, color: '#0f172a' }}>Cuentas</h1>
          <p style={{ fontSize: 12, color: '#64748b', marginTop: 3 }}>Cuentas por cobrar y por pagar</p>
        </div>
        <button className="btn-primary" onClick={() => setShowModal(true)}>+ Nueva cuenta</button>
      </div>

      {/* KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 14 }}>
        {[
          { label: 'Por cobrar', value: fmt(pendienteCC), color: '#16a34a', sub: `${cobrar.filter(c => c.estado !== 'pagado').length} cuentas activas` },
          { label: 'Vencidas cobrar', value: fmt(cobrar.filter(c => c.estado === 'vencido').reduce((s, c) => s + (c.monto - c.montoPagado), 0)), color: '#dc2626', sub: `${cobrar.filter(c => c.estado === 'vencido').length} vencidas` },
          { label: 'Por pagar', value: fmt(pendienteCP), color: '#d97706', sub: `${pagar.filter(c => c.estado !== 'pagado').length} cuentas activas` },
          { label: 'Vencidas pagar', value: fmt(pagar.filter(c => c.estado === 'vencido').reduce((s, c) => s + (c.monto - c.montoPagado), 0)), color: '#dc2626', sub: `${pagar.filter(c => c.estado === 'vencido').length} vencidas` },
        ].map(k => (
          <div key={k.label} className="card" style={{ padding: '16px 18px', borderTop: `3px solid ${k.color}` }}>
            <div style={{ fontSize: 11, color: '#64748b', textTransform: 'uppercase', marginBottom: 6 }}>{k.label}</div>
            <div style={{ fontSize: 22, fontWeight: 800, color: k.color }}>{k.value}</div>
            <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 4 }}>{k.sub}</div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 4, background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 10, padding: 4, width: 'fit-content' }}>
        {[['cobrar','Cuentas por cobrar'],['pagar','Cuentas por pagar']].map(([id, label]) => (
          <button key={id} onClick={() => setTab(id as any)} style={{ padding: '8px 18px', border: 'none', borderRadius: 8, cursor: 'pointer', fontSize: 13, fontWeight: 600, fontFamily: 'inherit', background: tab === id ? '#2563eb' : 'transparent', color: tab === id ? '#fff' : '#64748b', transition: 'all .15s' }}>{label}</button>
        ))}
      </div>

      {/* Table */}
      <div className="card">
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              {['#', tab === 'cobrar' ? 'Cliente' : 'Proveedor', 'Concepto', 'Referencia', 'Vencimiento', 'Monto', 'Pagado', 'Saldo', 'Estado', ''].map(h => (
                <th key={h} style={thS}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {(tab === 'cobrar' ? cobrar : pagar).length === 0
              ? <tr><td colSpan={10} style={{ textAlign: 'center', padding: 50, color: '#94a3b8' }}>Sin cuentas registradas</td></tr>
              : (tab === 'cobrar' ? cobrar : pagar).map(c => {
                const saldo = c.monto - c.montoPagado
                const dias = diasVencimiento(c.fechaVencimiento)
                return (
                  <tr key={c.id}>
                    <td style={{ ...tdS, fontWeight: 700, color: '#2563eb', fontSize: 11 }}>{c.numero}</td>
                    <td style={{ ...tdS, fontWeight: 600 }}>{c.clienteNombre || c.proveedorNombre}</td>
                    <td style={{ ...tdS, color: '#475569', maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.concepto}</td>
                    <td style={{ ...tdS, fontSize: 11, color: '#64748b' }}>{c.ventaNumero || c.compraNumero || '—'}</td>
                    <td style={tdS}>
                      <div style={{ fontSize: 12, color: '#0f172a' }}>{fmtDate(c.fechaVencimiento)}</div>
                      {c.estado !== 'pagado' && (
                        <div style={{ fontSize: 10, color: dias < 0 ? '#dc2626' : dias <= 7 ? '#d97706' : '#64748b' }}>
                          {dias < 0 ? `Vencida hace ${Math.abs(dias)}d` : dias === 0 ? 'Vence hoy' : `${dias}d restantes`}
                        </div>
                      )}
                    </td>
                    <td style={{ ...tdS, fontWeight: 700 }}>{fmt(c.monto)}</td>
                    <td style={{ ...tdS, color: '#16a34a', fontWeight: 600 }}>{fmt(c.montoPagado)}</td>
                    <td style={{ ...tdS, fontWeight: 700, color: saldo > 0 ? '#dc2626' : '#16a34a' }}>{fmt(saldo)}</td>
                    <td style={tdS}><span className={estadoBadge[c.estado] || 'badge-gray'} style={{ textTransform: 'capitalize', fontSize: 10 }}>{c.estado}</span></td>
                    <td style={tdS}>
                      {c.estado !== 'pagado' && (
                        <button onClick={() => { setShowPago(c); setMontoPago(String(saldo.toFixed(2))) }}
                          style={{ fontSize: 11, fontWeight: 700, padding: '4px 10px', background: '#eff6ff', color: '#2563eb', border: '1px solid #bfdbfe', borderRadius: 6, cursor: 'pointer', fontFamily: 'inherit', whiteSpace: 'nowrap' }}>
                          Registrar pago
                        </button>
                      )}
                    </td>
                  </tr>
                )
              })}
          </tbody>
        </table>
      </div>

      {/* MODAL NUEVA CUENTA */}
      {showModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.5)', zIndex: 999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <div style={{ background: '#fff', borderRadius: 14, padding: 28, width: '100%', maxWidth: 560 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 20 }}>
              <h3 style={{ fontSize: 16, fontWeight: 700 }}>Nueva cuenta por {tab === 'cobrar' ? 'cobrar' : 'pagar'}</h3>
              <button onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', fontSize: 22, cursor: 'pointer', color: '#94a3b8' }}>×</button>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              {tab === 'cobrar' ? (
                <>
                  <div style={{ gridColumn: '1/-1' }}><label style={lbl}>Cliente *</label><input className="input" value={formCC.clienteNombre} onChange={e => setFormCC(p => ({ ...p, clienteNombre: e.target.value }))} placeholder="Nombre del cliente" /></div>
                  <div><label style={lbl}>NIT</label><input className="input" value={formCC.clienteNit} onChange={e => setFormCC(p => ({ ...p, clienteNit: e.target.value }))} placeholder="CF" /></div>
                  <div><label style={lbl}>Telefono</label><input className="input" value={formCC.clienteTelefono} onChange={e => setFormCC(p => ({ ...p, clienteTelefono: e.target.value }))} /></div>
                  <div><label style={lbl}>No. Factura / venta</label><input className="input" value={formCC.ventaNumero} onChange={e => setFormCC(p => ({ ...p, ventaNumero: e.target.value }))} placeholder="FAC-000001" /></div>
                  <div><label style={lbl}>Monto Q *</label><input className="input" type="number" value={formCC.monto} onChange={e => setFormCC(p => ({ ...p, monto: e.target.value }))} /></div>
                  <div style={{ gridColumn: '1/-1' }}><label style={lbl}>Concepto *</label><input className="input" value={formCC.concepto} onChange={e => setFormCC(p => ({ ...p, concepto: e.target.value }))} placeholder="Descripcion de la deuda" /></div>
                  <div><label style={lbl}>Fecha de vencimiento *</label><input className="input" type="date" value={formCC.fechaVencimiento} onChange={e => setFormCC(p => ({ ...p, fechaVencimiento: e.target.value }))} /></div>
                  <div><label style={lbl}>Notas</label><input className="input" value={formCC.notas} onChange={e => setFormCC(p => ({ ...p, notas: e.target.value }))} /></div>
                </>
              ) : (
                <>
                  <div style={{ gridColumn: '1/-1' }}>
                    <label style={lbl}>Proveedor *</label>
                    <select className="input" value={formCP.proveedorNombre} onChange={e => setFormCP(p => ({ ...p, proveedorNombre: e.target.value }))}>
                      <option value="">Seleccionar...</option>
                      {proveedores.map((p: any) => <option key={p.id} value={p.nombre}>{p.nombre}</option>)}
                      <option value="__otro">Otro proveedor</option>
                    </select>
                    {formCP.proveedorNombre === '__otro' && <input className="input" style={{ marginTop: 6 }} placeholder="Nombre del proveedor" onChange={e => setFormCP(p => ({ ...p, proveedorNombre: e.target.value }))} />}
                  </div>
                  <div><label style={lbl}>No. Compra</label><input className="input" value={formCP.compraNumero} onChange={e => setFormCP(p => ({ ...p, compraNumero: e.target.value }))} placeholder="CMP-000001" /></div>
                  <div><label style={lbl}>Monto Q *</label><input className="input" type="number" value={formCP.monto} onChange={e => setFormCP(p => ({ ...p, monto: e.target.value }))} /></div>
                  <div style={{ gridColumn: '1/-1' }}><label style={lbl}>Concepto *</label><input className="input" value={formCP.concepto} onChange={e => setFormCP(p => ({ ...p, concepto: e.target.value }))} placeholder="Descripcion de la deuda" /></div>
                  <div><label style={lbl}>Fecha de vencimiento *</label><input className="input" type="date" value={formCP.fechaVencimiento} onChange={e => setFormCP(p => ({ ...p, fechaVencimiento: e.target.value }))} /></div>
                  <div><label style={lbl}>Notas</label><input className="input" value={formCP.notas} onChange={e => setFormCP(p => ({ ...p, notas: e.target.value }))} /></div>
                </>
              )}
            </div>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 20 }}>
              <button className="btn-ghost" onClick={() => setShowModal(false)}>Cancelar</button>
              <button className="btn-primary" onClick={tab === 'cobrar' ? saveCC : saveCP} disabled={loading}>{loading ? 'Guardando...' : 'Guardar'}</button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL REGISTRAR PAGO */}
      {showPago && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.5)', zIndex: 999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <div style={{ background: '#fff', borderRadius: 14, padding: 28, width: '100%', maxWidth: 420 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
              <h3 style={{ fontSize: 16, fontWeight: 700 }}>Registrar pago</h3>
              <button onClick={() => setShowPago(null)} style={{ background: 'none', border: 'none', fontSize: 22, cursor: 'pointer', color: '#94a3b8' }}>×</button>
            </div>
            <div style={{ background: '#f8fafc', borderRadius: 8, padding: 12, marginBottom: 16, fontSize: 13 }}>
              <div style={{ fontWeight: 600 }}>{showPago.clienteNombre || showPago.proveedorNombre}</div>
              <div style={{ color: '#64748b', marginTop: 4 }}>{showPago.concepto}</div>
              <div style={{ display: 'flex', gap: 16, marginTop: 8, fontSize: 12 }}>
                <span>Total: <strong>{fmt(showPago.monto)}</strong></span>
                <span>Pagado: <strong style={{ color: '#16a34a' }}>{fmt(showPago.montoPagado)}</strong></span>
                <span>Saldo: <strong style={{ color: '#dc2626' }}>{fmt(showPago.monto - showPago.montoPagado)}</strong></span>
              </div>
            </div>
            <div style={{ marginBottom: 16 }}>
              <label style={lbl}>Monto a pagar Q *</label>
              <input className="input" type="number" value={montoPago} onChange={e => setMontoPago(e.target.value)} style={{ fontSize: 18, fontWeight: 700 }} />
            </div>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button className="btn-ghost" onClick={() => setShowPago(null)}>Cancelar</button>
              <button className="btn-primary" onClick={registrarPago} disabled={loading}>{loading ? 'Guardando...' : 'Registrar pago'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

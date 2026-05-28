'use client'
import { useState, useEffect, useCallback } from 'react'
import { toast } from 'sonner'
import { fmt, fmtDateTime } from '@/lib/utils'

interface CajaData {
  activa: any
  movimientos: any[]
  ventasEfectivo: number
  ventasTarjeta: number
  ventasTransferencia: number
  totalVentas: number
  numVentas: number
  totalInyecciones: number
  totalRetiros: number
  debeHaber: number
}

interface ActiveSession {
  id: number
  usuarioId: number
  lastActivity: string
  createdAt: string
  usuario: { nombre: string; rol: string; usuario: string }
}

export default function CajaPage() {
  const [data, setData] = useState<CajaData | null>(null)
  const [sessions, setSessions] = useState<ActiveSession[]>([])
  const [loading, setLoading] = useState(false)
  const [tab, setTab] = useState<'resumen'|'movimientos'|'cerrar'|'sesiones'>('resumen')

  const [fondoInicial, setFondoInicial] = useState('')
  const [notasApertura, setNotasApertura] = useState('')
  const [montoMov, setMontoMov] = useState('')
  const [motivoMov, setMotivoMov] = useState('')
  const [efectivoContado, setEfectivoContado] = useState('')
  const [tarjetaBaucher, setTarjetaBaucher] = useState('')
  const [transferenciaContada, setTransferenciaContada] = useState('')
  const [notasCierre, setNotasCierre] = useState('')
  const [cierreResult, setCierreResult] = useState<any>(null)

  const load = useCallback(async () => {
    try {
      const res = await fetch('/api/caja')
      setData(await res.json())
    } catch { toast.error('Error al cargar caja') }
  }, [])

  const [sessionError, setSessionError] = useState('')

  const loadSessions = useCallback(async () => {
    try {
      const res = await fetch('/api/sesion')
      const data = await res.json()
      if (data.error) {
        setSessionError(data.error)
        setSessions([])
      } else {
        setSessionError('')
        setSessions(Array.isArray(data) ? data : [])
      }
    } catch (e: any) {
      setSessionError('Error al cargar sesiones')
    }
  }, [])

  useEffect(() => { load() }, [load])
  useEffect(() => {
    if (tab === 'sesiones') {
      loadSessions()
      const interval = setInterval(loadSessions, 30000) // auto-refresh every 30s
      return () => clearInterval(interval)
    }
  }, [tab, loadSessions])

  const abrir = async () => {
    setLoading(true)
    const res = await fetch('/api/caja', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ accion: 'abrir', fondo: parseFloat(fondoInicial) || 0, notas: notasApertura }) })
    const d = await res.json()
    setLoading(false)
    if (d.ok) { toast.success('Caja abierta'); setFondoInicial(''); load() }
    else toast.error(d.error || 'Error')
  }

  const movimiento = async (tipo: 'inyeccion' | 'retiro') => {
    if (!montoMov || parseFloat(montoMov) <= 0) { toast.error('Monto invalido'); return }
    setLoading(true)
    const res = await fetch('/api/caja', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ accion: tipo, monto: parseFloat(montoMov), motivo: motivoMov }) })
    const d = await res.json()
    setLoading(false)
    if (d.ok) { toast.success(tipo === 'inyeccion' ? 'Capital agregado' : 'Retiro registrado'); setMontoMov(''); setMotivoMov(''); load() }
    else toast.error(d.error || 'Error')
  }

  const cerrar = async () => {
    if (!efectivoContado) { toast.error('Ingresa el efectivo contado'); return }
    if (!confirm('Confirmar cierre de caja?')) return
    setLoading(true)
    const res = await fetch('/api/caja', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        accion: 'cerrar',
        efectivoContado: parseFloat(efectivoContado),
        tarjetaBaucher: parseFloat(tarjetaBaucher || '0'),
        transferenciaContada: parseFloat(transferenciaContada || '0'),
        notas: notasCierre,
      }),
    })
    const d = await res.json()
    setLoading(false)
    if (d.ok) { toast.success('Caja cerrada'); setCierreResult(d); setEfectivoContado(''); load() }
    else toast.error(d.error || 'Error')
  }

  const forzarCerrarSesion = async (usuarioId: number, nombre: string) => {
    if (!confirm(`Cerrar sesion de ${nombre}?`)) return
    const res = await fetch(`/api/sesion?usuario_id=${usuarioId}`, { method: 'DELETE' })
    if ((await res.json()).ok) { toast.success(`Sesion de ${nombre} cerrada`); loadSessions() }
  }

  // Real-time calcs for cierre
  const contado = parseFloat(efectivoContado || '0')
  const baucher = parseFloat(tarjetaBaucher || '0')
  const transf = parseFloat(transferenciaContada || '0')
  const difEfectivo = data ? contado - data.debeHaber : 0
  const difTarjeta = data ? baucher - data.ventasTarjeta : 0
  const difTransferencia = data ? transf - data.ventasTransferencia : 0

  const lbl = { display: 'block' as const, fontSize: 11, fontWeight: 700 as const, color: '#64748b', textTransform: 'uppercase' as const, letterSpacing: '.5px' as const, marginBottom: 4 }

  const DifBadge = ({ dif, label }: { dif: number; label: string }) => (
    <div style={{ padding: '6px 10px', borderRadius: 8, background: dif === 0 ? '#f0fdf4' : dif > 0 ? '#eff6ff' : '#fef2f2', border: `1px solid ${dif === 0 ? '#bbf7d0' : dif > 0 ? '#bfdbfe' : '#fecaca'}`, marginTop: 4 }}>
      <div style={{ fontSize: 11, color: dif === 0 ? '#16a34a' : dif > 0 ? '#2563eb' : '#dc2626', fontWeight: 700 }}>
        {label}: {dif === 0 ? '✓ Cuadrado' : dif > 0 ? `+${fmt(dif)} sobrante` : `${fmt(dif)} FALTANTE`}
      </div>
    </div>
  )

  return (
    <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 18 }}>
      <div>
        <h1 style={{ fontSize: 20, fontWeight: 700, color: '#0f172a' }}>Control de Caja</h1>
        <p style={{ fontSize: 12, color: '#64748b', marginTop: 3 }}>Apertura, movimientos, validacion y cierre de turno</p>
      </div>

      {/* ─── CAJA CERRADA ─── */}
      {!data?.activa ? (
        <div className="card" style={{ padding: 28, maxWidth: 440 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
            <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#dc2626' }} />
            <span style={{ fontSize: 15, fontWeight: 700, color: '#dc2626' }}>Caja Cerrada</span>
          </div>
          <div style={{ marginBottom: 12 }}>
            <label style={lbl}>Fondo inicial (efectivo con que abre la caja)</label>
            <input className="input" type="number" min="0" step="0.01" value={fondoInicial} onChange={e => setFondoInicial(e.target.value)} placeholder="Q 0.00" style={{ fontSize: 16 }} />
          </div>
          <div style={{ marginBottom: 18 }}>
            <label style={lbl}>Notas</label>
            <input className="input" value={notasApertura} onChange={e => setNotasApertura(e.target.value)} placeholder="Opcional" />
          </div>
          <button className="btn-success" style={{ width: '100%', padding: 13, fontSize: 15 }} onClick={abrir} disabled={loading}>
            {loading ? 'Abriendo...' : 'Abrir Caja'}
          </button>
        </div>
      ) : (
        <>
          {/* Status bar */}
          <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 10, padding: '12px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#16a34a', boxShadow: '0 0 0 3px rgba(22,163,74,.2)' }} />
              <span style={{ fontWeight: 700, color: '#16a34a', fontSize: 14 }}>Caja Abierta</span>
              <span style={{ fontSize: 12, color: '#64748b' }}>· desde {fmtDateTime(data.activa.fecha)} · {data.activa.usuarioNombre}</span>
            </div>
            <span style={{ fontWeight: 700, color: '#16a34a' }}>Fondo inicial: {fmt(data.activa.fondoInicial)}</span>
          </div>

          {/* Tabs */}
          <div style={{ display: 'flex', gap: 2, background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 10, padding: 4, width: 'fit-content' }}>
            {([
              ['resumen', '📊 Resumen'],
              ['movimientos', '↕ Movimientos'],
              ['cerrar', '🔒 Cerrar Caja'],
              ['sesiones', '👥 Sesiones'],
            ] as const).map(([id, label]) => (
              <button key={id} onClick={() => setTab(id)} style={{
                padding: '8px 16px', border: 'none', borderRadius: 8, cursor: 'pointer', fontSize: 12, fontWeight: 600, fontFamily: 'inherit',
                background: tab === id ? '#2563eb' : 'transparent',
                color: tab === id ? '#fff' : '#64748b',
                transition: 'all .15s',
              }}>{label}</button>
            ))}
          </div>

          {/* ─── RESUMEN ─── */}
          {tab === 'resumen' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {/* KPIs */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12 }}>
                {[
                  { label: 'Num. ventas', value: String(data.numVentas), color: '#2563eb', sub: 'En este turno' },
                  { label: 'Total ventas', value: fmt(data.totalVentas), color: '#16a34a', sub: 'Todos los metodos' },
                  { label: 'Efectivo en caja', value: fmt(data.debeHaber), color: '#0f172a', sub: 'Debe haber' },
                  { label: 'Retiros a bodega', value: fmt(data.totalRetiros), color: '#d97706', sub: 'Enviado fuera' },
                ].map(s => (
                  <div key={s.label} className="card" style={{ padding: '14px 18px' }}>
                    <div style={{ fontSize: 11, color: '#64748b', textTransform: 'uppercase', letterSpacing: .5, marginBottom: 6 }}>{s.label}</div>
                    <div style={{ fontSize: 22, fontWeight: 800, color: s.color }}>{s.value}</div>
                    <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 3 }}>{s.sub}</div>
                  </div>
                ))}
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                {/* Ventas por metodo */}
                <div className="card" style={{ padding: 18 }}>
                  <div style={{ fontWeight: 700, fontSize: 14, color: '#0f172a', marginBottom: 14 }}>Ventas por metodo de pago</div>
                  {[
                    { label: 'Efectivo', value: data.ventasEfectivo, color: '#16a34a', badge: 'badge-green' },
                    { label: 'Tarjeta', value: data.ventasTarjeta, color: '#2563eb', badge: 'badge-blue' },
                    { label: 'Transferencia', value: data.ventasTransferencia, color: '#8b5cf6', badge: 'badge-gray' },
                  ].map(r => (
                    <div key={r.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '9px 0', borderBottom: '1px solid #f1f5f9' }}>
                      <span className={r.badge}>{r.label}</span>
                      <span style={{ fontWeight: 700, color: r.color, fontSize: 15 }}>{fmt(r.value)}</span>
                    </div>
                  ))}
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0 0', fontWeight: 800, fontSize: 16, color: '#0f172a' }}>
                    <span>TOTAL</span><span style={{ color: '#2563eb' }}>{fmt(data.totalVentas)}</span>
                  </div>
                </div>

                {/* Formula efectivo */}
                <div className="card" style={{ padding: 18 }}>
                  <div style={{ fontWeight: 700, fontSize: 14, color: '#0f172a', marginBottom: 14 }}>Efectivo esperado en caja</div>
                  {[
                    { label: 'Fondo inicial', value: data.activa.fondoInicial, prefix: '' },
                    { label: '+ Ventas efectivo', value: data.ventasEfectivo, prefix: '+' },
                    { label: '+ Inyecciones', value: data.totalInyecciones, prefix: '+' },
                    { label: '- Retiros a bodega', value: data.totalRetiros, prefix: '-', red: true },
                  ].map(r => (
                    <div key={r.label} style={{ display: 'flex', justifyContent: 'space-between', padding: '7px 0', borderBottom: '1px solid #f1f5f9', fontSize: 13 }}>
                      <span style={{ color: '#475569' }}>{r.label}</span>
                      <span style={{ color: r.red ? '#dc2626' : '#0f172a' }}>{fmt(r.value)}</span>
                    </div>
                  ))}
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 0 0', fontWeight: 800, fontSize: 17, borderTop: '2px solid #e2e8f0', marginTop: 4 }}>
                    <span>DEBE HABER EN CAJA</span>
                    <span style={{ color: '#2563eb' }}>{fmt(data.debeHaber)}</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ─── MOVIMIENTOS ─── */}
          {tab === 'movimientos' && (
            <div style={{ display: 'grid', gridTemplateColumns: '360px 1fr', gap: 14 }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div className="card" style={{ padding: 18, borderLeft: '4px solid #2563eb' }}>
                  <div style={{ fontWeight: 700, fontSize: 14, color: '#2563eb', marginBottom: 4 }}>↓ Inyeccion de capital</div>
                  <div style={{ fontSize: 12, color: '#64748b', marginBottom: 12 }}>Agrega efectivo a la caja (cambio extra, fondo adicional)</div>
                  <div style={{ marginBottom: 10 }}><label style={lbl}>Monto (Q)</label><input className="input" type="number" min="0" step="0.01" value={montoMov} onChange={e => setMontoMov(e.target.value)} placeholder="0.00" /></div>
                  <div style={{ marginBottom: 12 }}><label style={lbl}>Motivo</label><input className="input" value={motivoMov} onChange={e => setMotivoMov(e.target.value)} placeholder="Ej: Fondo de cambio adicional" /></div>
                  <button className="btn-primary" style={{ width: '100%' }} onClick={() => movimiento('inyeccion')} disabled={loading}>Registrar Inyeccion</button>
                </div>

                <div className="card" style={{ padding: 18, borderLeft: '4px solid #d97706' }}>
                  <div style={{ fontWeight: 700, fontSize: 14, color: '#d97706', marginBottom: 4 }}>↑ Retiro a bodega</div>
                  <div style={{ fontSize: 12, color: '#64748b', marginBottom: 12 }}>Saca efectivo para guardar en bodega o depositar al banco</div>
                  <div style={{ marginBottom: 10 }}><label style={lbl}>Monto (Q)</label><input className="input" type="number" min="0" step="0.01" value={montoMov} onChange={e => setMontoMov(e.target.value)} placeholder="0.00" /></div>
                  <div style={{ marginBottom: 12 }}><label style={lbl}>Motivo</label><input className="input" value={motivoMov} onChange={e => setMotivoMov(e.target.value)} placeholder="Ej: Deposito bancario del dia" /></div>
                  <button className="btn-warning" style={{ width: '100%' }} onClick={() => movimiento('retiro')} disabled={loading}>Registrar Retiro</button>
                </div>
              </div>

              <div className="card">
                <div style={{ padding: '14px 18px', borderBottom: '1px solid #e2e8f0', fontWeight: 700, fontSize: 14, color: '#0f172a' }}>
                  Movimientos del turno ({data.movimientos.length})
                </div>
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr>{['Hora', 'Tipo', 'Monto', 'Motivo', 'Usuario'].map(h => (
                        <th key={h} style={{ background: '#f8fafc', fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', padding: '9px 14px', textAlign: 'left', borderBottom: '1px solid #e2e8f0' }}>{h}</th>
                      ))}</tr>
                    </thead>
                    <tbody>
                      {data.movimientos.length === 0
                        ? <tr><td colSpan={5} style={{ textAlign: 'center', padding: 40, color: '#94a3b8' }}>Sin movimientos en este turno</td></tr>
                        : data.movimientos.map((m, i) => (
                          <tr key={i}>
                            <td style={{ padding: '9px 14px', fontSize: 12, borderBottom: '1px solid #f1f5f9', color: '#64748b', whiteSpace: 'nowrap' }}>{fmtDateTime(m.fecha)}</td>
                            <td style={{ padding: '9px 14px', borderBottom: '1px solid #f1f5f9' }}>
                              <span className={m.tipo === 'inyeccion' ? 'badge-blue' : 'badge-orange'}>{m.tipo === 'inyeccion' ? '↓ Inyeccion' : '↑ Retiro'}</span>
                            </td>
                            <td style={{ padding: '9px 14px', fontWeight: 700, fontSize: 13, borderBottom: '1px solid #f1f5f9', color: m.tipo === 'inyeccion' ? '#2563eb' : '#d97706' }}>
                              {m.tipo === 'retiro' ? '-' : '+'}{fmt(m.monto)}
                            </td>
                            <td style={{ padding: '9px 14px', fontSize: 12, borderBottom: '1px solid #f1f5f9', color: '#475569' }}>{m.motivo || '—'}</td>
                            <td style={{ padding: '9px 14px', fontSize: 12, borderBottom: '1px solid #f1f5f9', color: '#64748b' }}>{m.usuarioNombre}</td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ─── CERRAR ─── */}
          {tab === 'cerrar' && (
            <div style={{ display: 'grid', gridTemplateColumns: '420px 1fr', gap: 14 }}>
              <div className="card" style={{ padding: 24, borderTop: '3px solid #dc2626' }}>
                <div style={{ fontWeight: 800, fontSize: 16, color: '#0f172a', marginBottom: 4 }}>Cierre de Caja</div>
                <div style={{ fontSize: 12, color: '#64748b', marginBottom: 18 }}>Cuenta el dinero fisicamente y registra el cierre del turno.</div>

                {/* Resumen esperado */}
                <div style={{ background: '#f8fafc', borderRadius: 8, padding: 12, marginBottom: 18, fontSize: 12 }}>
                  <div style={{ fontWeight: 700, color: '#374151', marginBottom: 8, fontSize: 13 }}>Resumen del turno</div>
                  {[
                    [`Ventas (${data.numVentas} transacciones)`, fmt(data.totalVentas)],
                    ['Ventas en efectivo', fmt(data.ventasEfectivo)],
                    ['Ventas con tarjeta', fmt(data.ventasTarjeta)],
                    ['Ventas por transferencia', fmt(data.ventasTransferencia)],
                    ['Inyecciones de capital', fmt(data.totalInyecciones)],
                    ['Retiros a bodega', fmt(-data.totalRetiros)],
                  ].map(([l, v]) => (
                    <div key={l} style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', color: '#475569' }}>
                      <span>{l}</span><span style={{ fontWeight: 600 }}>{v}</span>
                    </div>
                  ))}
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 800, fontSize: 14, borderTop: '1px solid #e2e8f0', paddingTop: 8, marginTop: 6, color: '#2563eb' }}>
                    <span>Debe haber en caja</span><span>{fmt(data.debeHaber)}</span>
                  </div>
                </div>

                {/* Efectivo */}
                <div style={{ marginBottom: 12 }}>
                  <label style={lbl}>💵 Efectivo contado fisicamente (Q)</label>
                  <input className="input" type="number" min="0" step="0.01" value={efectivoContado} onChange={e => setEfectivoContado(e.target.value)} placeholder="Cuenta los billetes y monedas" style={{ fontSize: 15, fontWeight: 700 }} />
                  {efectivoContado && <DifBadge dif={difEfectivo} label="Efectivo" />}
                </div>

                {/* Tarjeta baucher */}
                <div style={{ marginBottom: 12 }}>
                  <label style={lbl}>💳 Total bauchers de tarjeta (Q)</label>
                  <input className="input" type="number" min="0" step="0.01" value={tarjetaBaucher} onChange={e => setTarjetaBaucher(e.target.value)} placeholder={`POS registro: ${fmt(data.ventasTarjeta)}`} />
                  <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 3 }}>POS registro: <strong>{fmt(data.ventasTarjeta)}</strong></div>
                  {tarjetaBaucher && <DifBadge dif={difTarjeta} label="Tarjeta" />}
                </div>

                {/* Transferencia */}
                <div style={{ marginBottom: 16 }}>
                  <label style={lbl}>🏦 Transferencias verificadas (Q)</label>
                  <input className="input" type="number" min="0" step="0.01" value={transferenciaContada} onChange={e => setTransferenciaContada(e.target.value)} placeholder={`POS registro: ${fmt(data.ventasTransferencia)}`} />
                  <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 3 }}>POS registro: <strong>{fmt(data.ventasTransferencia)}</strong></div>
                  {transferenciaContada && <DifBadge dif={difTransferencia} label="Transferencia" />}
                </div>

                <div style={{ marginBottom: 16 }}>
                  <label style={lbl}>Notas del cierre</label>
                  <textarea className="input" rows={2} value={notasCierre} onChange={e => setNotasCierre(e.target.value)} placeholder="Irregularidades, observaciones..." />
                </div>

                <button className="btn-danger" style={{ width: '100%', padding: 13, fontSize: 15 }} onClick={cerrar} disabled={loading}>
                  {loading ? 'Cerrando...' : 'Confirmar Cierre de Caja'}
                </button>
              </div>

              {/* Right panel - movimientos resumen */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div className="card" style={{ padding: 18 }}>
                  <div style={{ fontWeight: 700, fontSize: 14, color: '#0f172a', marginBottom: 14 }}>Ventas del turno por metodo</div>
                  {[
                    { label: '💵 Efectivo', sistema: data.ventasEfectivo, contado: contado !== 0 ? contado : null },
                    { label: '💳 Tarjeta', sistema: data.ventasTarjeta, contado: baucher !== 0 ? baucher : null },
                    { label: '🏦 Transferencia', sistema: data.ventasTransferencia, contado: transf !== 0 ? transf : null },
                  ].map(r => (
                    <div key={r.label} style={{ padding: '10px 0', borderBottom: '1px solid #f1f5f9' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
                        <span style={{ fontSize: 13, fontWeight: 600, color: '#0f172a' }}>{r.label}</span>
                        <span style={{ fontSize: 13, fontWeight: 700, color: '#2563eb' }}>Sistema: {fmt(r.sistema)}</span>
                      </div>
                      {r.contado !== null && (
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                          <span style={{ fontSize: 12, color: '#64748b' }}>Contado:</span>
                          <span style={{ fontSize: 12, fontWeight: 700, color: r.contado - r.sistema === 0 ? '#16a34a' : r.contado - r.sistema > 0 ? '#2563eb' : '#dc2626' }}>
                            {fmt(r.contado)} {r.contado - r.sistema !== 0 ? `(${r.contado - r.sistema > 0 ? '+' : ''}${fmt(r.contado - r.sistema)})` : '✓'}
                          </span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ─── SESIONES ─── */}
          {tab === 'sesiones' && (
            <div className="card">
              <div style={{ padding: '14px 18px', borderBottom: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ fontWeight: 700, fontSize: 14, color: '#0f172a' }}>Sesiones activas ({sessions.length})</div>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <span style={{ fontSize: 11, color: '#94a3b8' }}>Se actualiza cada 30s</span>
                <button className="btn-ghost btn-sm" onClick={loadSessions}>↺ Actualizar</button>
              </div>
              </div>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr>{['Usuario', 'Rol', 'Login', 'Ultima actividad', 'Estado', ''].map(h => (
                      <th key={h} style={{ background: '#f8fafc', fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', padding: '9px 14px', textAlign: 'left', borderBottom: '1px solid #e2e8f0' }}>{h}</th>
                    ))}</tr>
                  </thead>
                  <tbody>
                    {sessions.length === 0
                      ? <tr><td colSpan={6} style={{ textAlign: 'center', padding: 40, color: '#94a3b8' }}>Sin sesiones activas</td></tr>
                      : sessions.map(s => {
                        const lastAct = new Date(s.lastActivity)
                        const minutesAgo = Math.floor((Date.now() - lastAct.getTime()) / 60000)
                        const isActive = minutesAgo < 10
                        return (
                          <tr key={s.id}>
                            <td style={{ padding: '10px 14px', fontWeight: 600, fontSize: 13, borderBottom: '1px solid #f1f5f9', color: '#0f172a' }}>{s.usuario?.nombre}</td>
                            <td style={{ padding: '10px 14px', borderBottom: '1px solid #f1f5f9' }}><span className={s.usuario?.rol === 'admin' ? 'badge-blue' : 'badge-gray'} style={{ textTransform: 'capitalize' }}>{s.usuario?.rol}</span></td>
                            <td style={{ padding: '10px 14px', fontSize: 12, borderBottom: '1px solid #f1f5f9', color: '#64748b', whiteSpace: 'nowrap' }}>{fmtDateTime(s.createdAt)}</td>
                            <td style={{ padding: '10px 14px', fontSize: 12, borderBottom: '1px solid #f1f5f9', color: '#64748b' }}>
                              {minutesAgo === 0 ? 'Ahora mismo' : `Hace ${minutesAgo} min`}
                            </td>
                            <td style={{ padding: '10px 14px', borderBottom: '1px solid #f1f5f9' }}>
                              <span className={isActive ? 'badge-green' : 'badge-gray'}>{isActive ? '● Activa' : '○ Inactiva'}</span>
                            </td>
                            <td style={{ padding: '10px 14px', borderBottom: '1px solid #f1f5f9' }}>
                              <button className="btn-danger btn-sm" onClick={() => forzarCerrarSesion(s.usuarioId, s.usuario?.nombre)}>
                                Cerrar sesion
                              </button>
                            </td>
                          </tr>
                        )
                      })}
                  </tbody>
                </table>
              </div>
              {sessionError && (
                <div style={{ padding: '12px 18px', background: '#fef2f2', borderTop: '1px solid #fecaca', fontSize: 12, color: '#dc2626', fontWeight: 600 }}>
                  ⚠ {sessionError}
                </div>
              )}
              <div style={{ padding: '12px 18px', background: '#fffbeb', borderTop: '1px solid #fef3c7', fontSize: 12, color: '#92400e' }}>
                ℹ Los cajeros no pueden iniciar sesion si ya tienen una sesion activa en otro equipo. La sesion expira tras 8 horas. Admin tiene timeout de 30 min por inactividad.
              </div>
            </div>
          )}
        </>
      )}

      {/* ─── RESULTADO CIERRE ─── */}
      {cierreResult && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.5)', zIndex: 999, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: '#fff', borderRadius: 16, padding: 32, width: 440, boxShadow: '0 20px 60px rgba(0,0,0,.2)' }}>
            <h3 style={{ fontSize: 20, fontWeight: 800, textAlign: 'center', color: '#0f172a', marginBottom: 20 }}>Resumen de Cierre</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, background: '#f8fafc', borderRadius: 10, padding: 16, marginBottom: 20 }}>
              {[
                ['Ventas del turno', fmt(cierreResult.totalVentas || 0)],
                ['Efectivo — Sistema', fmt(cierreResult.debeHaber)],
                ['Efectivo — Contado', fmt(cierreResult.contado)],
                ['Diferencia efectivo', fmt(cierreResult.diferencia)],
              ].map(([l, v]) => (
                <div key={l} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14 }}>
                  <span style={{ color: '#475569' }}>{l}</span>
                  <span style={{ fontWeight: 700, color: l.includes('Diferencia') ? (cierreResult.diferencia === 0 ? '#16a34a' : cierreResult.diferencia > 0 ? '#2563eb' : '#dc2626') : '#0f172a' }}>{v}</span>
                </div>
              ))}
            </div>
            <div style={{ textAlign: 'center', fontSize: 22, fontWeight: 800, color: cierreResult.diferencia === 0 ? '#16a34a' : cierreResult.diferencia > 0 ? '#2563eb' : '#dc2626', marginBottom: 20 }}>
              {cierreResult.diferencia === 0 ? '✓ Caja cuadrada' : cierreResult.diferencia > 0 ? `Sobrante: ${fmt(cierreResult.diferencia)}` : `Faltante: ${fmt(Math.abs(cierreResult.diferencia))}`}
            </div>
            <button className="btn-primary" style={{ width: '100%' }} onClick={() => setCierreResult(null)}>Listo</button>
          </div>
        </div>
      )}
    </div>
  )
}

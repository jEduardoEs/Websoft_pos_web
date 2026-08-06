'use client'

import { fmtDate } from '@/lib/utils'
import { useGarantias } from '../hooks/use-garantias'
import { printGarantia } from '../utils/pdfGenerators'

export default function GarantiasModule() {
  const { state, actions } = useGarantias()
  const {
    garantias, buscar, filtroEstado, showModal, showReclamo, selectedGarantia,
    todosReclamos, form, reclamoForm, loading, ventas, tab
  } = state
  const {
    setBuscar, setFiltroEstado, setShowModal, setShowReclamo, setTab,
    setForm, setF, setRF, selVenta,
    saveGarantia, abrirReclamo, saveReclamo, resolverReclamo, emptyForm
  } = actions

  const diasRestantes = (g: any) => Math.ceil((new Date(g.fechaVencimiento).getTime() - Date.now()) / 86400000)

  const estadoBadge: any = { vigente: 'badge-green', vencida: 'badge-red', reclamada: 'badge-orange', anulada: 'badge-gray', facturada: 'badge-blue' }
  const estadoReclamoBadge: any = { recibido: 'badge-blue', en_revision: 'badge-orange', aprobado: 'badge-green', rechazado: 'badge-red', resuelto: 'badge-gray' }

  const thS = { background: '#f4f3ef', fontSize: 11, fontWeight: 700 as const, color: '#8a887e', textTransform: 'uppercase' as const, padding: '10px 14px', textAlign: 'left' as const, borderBottom: '1.5px solid #d8d6cd' }
  const tdS = { padding: '11px 14px', fontSize: 13, borderBottom: '1px solid #e3e1d8' }
  const lbl = { display: 'block' as const, fontSize: 11, fontWeight: 700 as const, color: '#8a887e', textTransform: 'uppercase' as const, marginBottom: 4 }
  const MOTIVOS = ['Producto defectuoso de fábrica', 'Falla de funcionamiento', 'Daño en transporte', 'Problema de instalación', 'No enciende / no funciona', 'Pantalla dañada', 'Problema de conectividad', 'Otro']

  return (
    <div className="page-wrap" style={{ padding: 24, display: "flex", flexDirection: "column", gap: 16 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 700, color: '#18181b' }}>Garantías</h1>
          <p style={{ fontSize: 12, color: '#8a887e', marginTop: 3 }}>Certificados y reclamos de garantía</p>
        </div>
        <button className="btn-primary" onClick={() => { setForm(emptyForm); setShowModal(true) }}>+ Nueva Garantía</button>
      </div>

      <div style={{ display: 'flex', gap: 2, background: '#f4f3ef', border: '1.5px solid #d8d6cd', borderRadius: 6, padding: 4, width: 'fit-content' }}>
        {([['garantias', ' Garantías'], ['reclamos', ' Reclamos']] as const).map(([id, label]) => (
          <button key={id} onClick={() => setTab(id)} style={{ padding: '8px 16px', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 12, fontWeight: 600, fontFamily: 'inherit', background: tab === id ? '#2563eb' : 'transparent', color: tab === id ? '#fff' : '#64748b', transition: 'all .15s' }}>{label}</button>
        ))}
      </div>

      {tab === 'garantias' && (
        <>
          <div className="card" style={{ padding: 14 }}>
            <div style={{ display: 'flex', gap: 10 }}>
              <input className="input" placeholder="Buscar por cliente, producto, número..." value={buscar} onChange={e => setBuscar(e.target.value)} style={{ flex: 1 }} />
              <select className="input" value={filtroEstado} onChange={e => setFiltroEstado(e.target.value)} style={{ width: 160 }}>
                <option value="">Todos</option>
                <option value="vigente">Vigente</option>
                <option value="vencida">Vencida</option>
                <option value="reclamada">Reclamada</option>
                <option value="anulada">Anulada</option>
              </select>
            </div>
          </div>

          <div className="card">
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead><tr>{['#', 'Cliente', 'Producto', 'Serie', 'Venta', 'Vence', 'Días', 'Estado', ''].map(h => <th key={h} style={thS}>{h}</th>)}</tr></thead>
                <tbody>
                  {garantias.length === 0
                    ? <tr><td colSpan={9} style={{ textAlign: 'center', padding: 50, color: '#8a887e' }}>Sin garantías</td></tr>
                    : garantias.map(g => {
                      const dias = diasRestantes(g)
                      return (
                        <tr key={g.id}>
                          <td style={{ ...tdS, fontWeight: 700, color: '#16a34a' }}>{g.numero}</td>
                          <td style={{ ...tdS, fontWeight: 600, color: '#18181b' }}>{g.clienteNombre}</td>
                          <td style={{ ...tdS, color: '#52524d' }}>{g.productoNombre}</td>
                          <td style={{ ...tdS, color: '#8a887e', fontSize: 11, fontFamily: 'monospace' }}>{g.productoSerie || '—'}</td>
                          <td style={{ ...tdS, color: '#8a887e', fontSize: 11 }}>{fmtDate(g.fechaVenta)}</td>
                          <td style={{ ...tdS, color: '#8a887e', fontSize: 11 }}>{fmtDate(g.fechaVencimiento)}</td>
                          <td style={tdS}>
                            <span style={{ fontWeight: 700, color: dias <= 0 ? '#dc2626' : dias <= 30 ? '#d97706' : '#16a34a', fontSize: 13 }}>
                              {dias <= 0 ? 'Vencida' : `${dias}d`}
                            </span>
                          </td>
                          <td style={tdS}><span className={estadoBadge[g.estado] || 'badge-gray'} style={{ textTransform: 'capitalize' }}>{g.estado}</span></td>
                          <td style={{ ...tdS }}>
                            <div style={{ display: 'flex', gap: 5 }}>
                              {g.estado === 'vigente' && (
                                <button onClick={() => abrirReclamo(g)}
                                  style={{ fontSize: 11, fontWeight: 700, padding: '4px 10px', background: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca', borderRadius: 6, cursor: 'pointer', fontFamily: 'inherit' }}>
                                  Reclamar
                                </button>
                              )}
                              <button className="btn-ghost btn-sm" onClick={() => printGarantia(g)}></button>
                            </div>
                          </td>
                        </tr>
                      )
                    })}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {tab === 'reclamos' && (
        <div className="card">
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead><tr>{['#', 'Fecha', 'Garantía', 'Cliente', 'Motivo', 'Decisión', 'Estado', ''].map(h => <th key={h} style={thS}>{h}</th>)}</tr></thead>
              <tbody>
                {todosReclamos.length === 0
                  ? <tr><td colSpan={8} style={{ textAlign: 'center', padding: 50, color: '#8a887e' }}>Sin reclamos</td></tr>
                  : todosReclamos.map(r => (
                    <tr key={r.id}>
                      <td style={{ ...tdS, fontWeight: 700, color: '#dc2626' }}>{r.numero}</td>
                      <td style={{ ...tdS, color: '#8a887e', fontSize: 11, whiteSpace: 'nowrap' }}>{fmtDate(r.fecha)}</td>
                      <td style={{ ...tdS, color: '#1581E3', fontWeight: 600 }}>{r.garantiaNumero}</td>
                      <td style={{ ...tdS, fontWeight: 600 }}>{r.clienteNombre}</td>
                      <td style={{ ...tdS, color: '#52524d', maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.motivoReclamo}</td>
                      <td style={tdS}>{r.decision ? <span className="badge-blue" style={{ textTransform: 'capitalize' }}>{r.decision}</span> : <span style={{ color: '#8a887e' }}>Pendiente</span>}</td>
                      <td style={tdS}><span className={estadoReclamoBadge[r.estado] || 'badge-gray'} style={{ textTransform: 'capitalize' }}>{r.estado}</span></td>
                      <td style={tdS}>
                        {r.estado === 'recibido' && (
                          <div style={{ display: 'flex', gap: 5 }}>
                            <button onClick={() => resolverReclamo(r, 'reparar', 'En reparación')}
                              style={{ fontSize: 10, fontWeight: 700, padding: '3px 8px', background: '#eff6ff', color: '#1581E3', border: '1px solid #bfdbfe', borderRadius: 6, cursor: 'pointer', fontFamily: 'inherit' }}> Reparar</button>
                            <button onClick={() => resolverReclamo(r, 'reemplazar', 'Producto reemplazado')}
                              style={{ fontSize: 10, fontWeight: 700, padding: '3px 8px', background: '#f0fdf4', color: '#16a34a', border: '1px solid #bbf7d0', borderRadius: 6, cursor: 'pointer', fontFamily: 'inherit' }}>↻ Reemplazar</button>
                            <button onClick={() => resolverReclamo(r, 'rechazar', 'No cubre garantía')}
                              style={{ fontSize: 10, fontWeight: 700, padding: '3px 8px', background: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca', borderRadius: 6, cursor: 'pointer', fontFamily: 'inherit' }}> Rechazar</button>
                          </div>
                        )}
                        {r.ordenTrabajoId && <span style={{ fontSize: 10, color: '#8a887e' }}>OT #{r.ordenTrabajoId}</span>}
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* MODAL NUEVA GARANTIA */}
      {showModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.5)', zIndex: 999, display: 'flex', alignItems: 'flex-start', justifyContent: 'center', padding: 20, overflowY: 'auto' }}>
          <div style={{ background: '#fff', border: '1.5px solid #d8d6cd', borderRadius: 6, padding: 28, width: '100%', maxWidth: 680, margin: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 20, paddingBottom: 14, borderBottom: '1.5px solid #d8d6cd' }}>
              <h3 style={{ fontSize: 16, fontWeight: 700, color: '#18181b' }}>Nueva Garantía</h3>
              <button onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', fontSize: 22, cursor: 'pointer', color: '#8a887e' }}>×</button>
            </div>
            <div style={{ marginBottom: 14 }}>
              <label style={lbl}>Vincular a factura de venta (opcional)</label>
              <select className="input" onChange={e => selVenta(e.target.value)}>
                <option value="">Seleccionar venta...</option>
                {ventas.slice(0, 50).map((v: any) => <option key={v.id} value={v.id}>{v.numero} — {v.clienteNombre}</option>)}
              </select>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              {[
                { label: 'Nombre cliente *', key: 'clienteNombre', full: true },
                { label: 'NIT', key: 'clienteNit' }, { label: 'Teléfono', key: 'clienteTelefono' },
                { label: 'Producto *', key: 'productoNombre', full: true },
                { label: 'No. Serie', key: 'productoSerie' }, { label: 'No. Factura', key: 'ventaNumero' },
                { label: 'Fecha de venta', key: 'fechaVenta', type: 'date' },
                { label: 'Días de garantía', key: 'diasGarantia', type: 'number' },
                { label: 'Condiciones', key: 'condiciones', full: true },
              ].map((f: any) => (
                <div key={f.key} style={{ gridColumn: f.full ? '1/-1' : 'auto' }}>
                  <label style={lbl}>{f.label}</label>
                  <input className="input" type={f.type || 'text'} value={(form as any)[f.key]} onChange={e => setF(f.key, e.target.value)} />
                </div>
              ))}
            </div>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 20 }}>
              <button className="btn-ghost" onClick={() => setShowModal(false)}>Cancelar</button>
              <button className="btn-primary" onClick={saveGarantia} disabled={loading}>{loading ? 'Guardando...' : 'Crear e Imprimir'}</button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL RECLAMO */}
      {showReclamo && selectedGarantia && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.5)', zIndex: 999, display: 'flex', alignItems: 'flex-start', justifyContent: 'center', padding: 20, overflowY: 'auto' }}>
          <div style={{ background: '#fff', border: '1.5px solid #d8d6cd', borderRadius: 6, padding: 28, width: '100%', maxWidth: 680, margin: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 20, paddingBottom: 14, borderBottom: '2px solid #dc2626' }}>
              <div>
                <h3 style={{ fontSize: 16, fontWeight: 700, color: '#18181b' }}>Reclamo de Garantía</h3>
                <p style={{ fontSize: 12, color: '#8a887e', marginTop: 2 }}>{selectedGarantia.numero} · {selectedGarantia.clienteNombre} · {selectedGarantia.productoNombre}</p>
              </div>
              <button onClick={() => setShowReclamo(false)} style={{ background: 'none', border: 'none', fontSize: 22, cursor: 'pointer', color: '#8a887e' }}>×</button>
            </div>

            <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 6, padding: 12, marginBottom: 16, fontSize: 12 }}>
              <div style={{ display: 'flex', gap: 20 }}>
                <span> Vence: <strong>{fmtDate(selectedGarantia.fechaVencimiento)}</strong></span>
                <span> {diasRestantes(selectedGarantia)} días restantes</span>
                <span> Serie: <strong>{selectedGarantia.productoSerie || '—'}</strong></span>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14 }}>
              <div>
                <label style={lbl}>NIT del cliente</label>
                <input className="input" value={reclamoForm.clienteNit} onChange={e => setRF('clienteNit', e.target.value)} placeholder="CF" />
              </div>
              <div>
                <label style={lbl}>DPI del cliente</label>
                <input className="input" value={reclamoForm.clienteDpi} onChange={e => setRF('clienteDpi', e.target.value)} placeholder="Número de DPI" />
              </div>
              <div>
                <label style={lbl}>Teléfono</label>
                <input className="input" value={reclamoForm.clienteTelefono} onChange={e => setRF('clienteTelefono', e.target.value)} />
              </div>
              <div>
                <label style={lbl}>¿Presenta factura original?</label>
                <div style={{ display: 'flex', gap: 10, marginTop: 6 }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', fontSize: 13 }}>
                    <input type="radio" checked={reclamoForm.tieneFactura} onChange={() => setRF('tieneFactura', true)} /> Sí
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', fontSize: 13 }}>
                    <input type="radio" checked={!reclamoForm.tieneFactura} onChange={() => setRF('tieneFactura', false)} /> No
                  </label>
                </div>
              </div>
              {reclamoForm.tieneFactura && (
                <div>
                  <label style={lbl}>Número de factura</label>
                  <input className="input" value={reclamoForm.numeroFactura} onChange={e => setRF('numeroFactura', e.target.value)} />
                </div>
              )}
              <div style={{ gridColumn: '1/-1' }}>
                <label style={lbl}>Motivo del reclamo *</label>
                <select className="input" value={reclamoForm.motivoReclamo} onChange={e => setRF('motivoReclamo', e.target.value)}>
                  <option value="">Seleccionar motivo...</option>
                  {MOTIVOS.map(m => <option key={m} value={m}>{m}</option>)}
                </select>
              </div>
              <div style={{ gridColumn: '1/-1' }}>
                <label style={lbl}>Descripción detallada del defecto *</label>
                <textarea className="input" rows={3} value={reclamoForm.descripcionFalla} onChange={e => setRF('descripcionFalla', e.target.value)} placeholder="Describe con detalle el problema que presenta el producto..." />
              </div>
              <div style={{ gridColumn: '1/-1' }}>
                <label style={lbl}>Notas internas</label>
                <input className="input" value={reclamoForm.notas} onChange={e => setRF('notas', e.target.value)} placeholder="Observaciones del técnico al recibir el equipo" />
              </div>
            </div>

            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button className="btn-ghost" onClick={() => setShowReclamo(false)}>Cancelar</button>
              <button onClick={saveReclamo} disabled={loading}
                style={{ background: '#dc2626', color: '#fff', border: 'none', padding: '10px 24px', borderRadius: 6, fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>
                {loading ? 'Registrando...' : 'Registrar Reclamo e Imprimir'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

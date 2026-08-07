'use client'

import { fmtDate } from '@/lib/utils'
import { useGarantias } from '../hooks/use-garantias'
import { printGarantia } from '../utils/pdfGenerators'

export default function GarantiasModule() {
  const { state, actions } = useGarantias()
  const {
    garantias, buscar, showModal, showReclamo, selectedGarantia,
    todosReclamos, form, reclamoForm, loading, ventas, tab
  } = state
  const {
    setBuscar, setShowModal, setShowReclamo, setTab,
    setForm, setF, setRF, selVenta,
    saveGarantia, abrirReclamo, saveReclamo, resolverReclamo, emptyForm
  } = actions

  const diasRestantes = (g: any) => {
    if (!g?.fechaVencimiento) return 0
    const venc = new Date(g.fechaVencimiento).getTime()
    return isNaN(venc) ? 0 : Math.ceil((venc - Date.now()) / 86400000)
  }

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

      <div style={{ display: 'flex', gap: 2, background: '#f4f3ef', border: '1.5px solid #d8d6cd', borderRadius: 6, padding: 4, width: 'fit-content', flexWrap: 'wrap' }}>
        {([
          ['todas', 'Todas'],
          ['vigente', 'Vigentes'],
          ['reclamada', 'Reclamadas'],
          ['vencida', 'Vencidas'],
          ['anulada', 'Anuladas']
        ] as const).map(([id, label]) => (
          <button key={id} onClick={() => setTab(id as any)} style={{ padding: '8px 16px', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 12, fontWeight: 600, fontFamily: 'inherit', background: tab === id ? '#2563eb' : 'transparent', color: tab === id ? '#fff' : '#64748b', transition: 'all .15s' }}>{label}</button>
        ))}
      </div>

      {tab !== 'reclamada' && (() => {
        const garantiasFiltradas = (garantias || []).filter(g => {
          const matchBuscar = !buscar || (
            g.numero?.toLowerCase().includes(buscar.toLowerCase()) ||
            g.clienteNombre?.toLowerCase().includes(buscar.toLowerCase()) ||
            g.productoNombre?.toLowerCase().includes(buscar.toLowerCase()) ||
            g.productoSerie?.toLowerCase().includes(buscar.toLowerCase())
          )
          const estadoLow = (g.estado || '').toLowerCase()
          const dias = diasRestantes(g)
          let matchTab = false
          if (tab === 'todas') {
            matchTab = true
          } else if (tab === 'vigente') {
            matchTab = estadoLow === 'vigente' && dias > 0
          } else if (tab === 'vencida') {
            matchTab = estadoLow === 'vencida' || (estadoLow === 'vigente' && dias <= 0)
          } else if (tab === 'anulada') {
            matchTab = estadoLow === 'anulada'
          } else {
            matchTab = estadoLow === tab
          }
          return matchBuscar && matchTab
        })

        return (
          <>
            <div className="card" style={{ padding: 14 }}>
              <input className="input" placeholder="Buscar por cliente, producto, número..." value={buscar} onChange={e => setBuscar(e.target.value)} style={{ width: '100%' }} />
            </div>

            <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                  <thead>
                    <tr style={{ background: '#f8fafc', borderBottom: '1.5px solid #e2e8f0' }}>
                      <th style={{ ...thS, width: 110 }}>No. Garantía</th>
                      <th style={{ ...thS, width: 180 }}>Cliente</th>
                      <th style={{ ...thS, minWidth: 160 }}>Producto</th>
                      <th style={{ ...thS, width: 130 }}>No. Serie</th>
                      <th style={{ ...thS, width: 100 }}>Venta</th>
                      <th style={{ ...thS, width: 100 }}>Vencimiento</th>
                      <th style={{ ...thS, width: 90 }}>Días</th>
                      <th style={{ ...thS, width: 100 }}>Estado</th>
                      <th style={{ ...thS, width: 130, textAlign: 'right' }}>Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {garantiasFiltradas.length === 0 ? (
                      <tr>
                        <td colSpan={9} style={{ textAlign: 'center', padding: 48, color: '#8a887e', fontSize: 13 }}>
                          Sin garantías en esta sección
                        </td>
                      </tr>
                    ) : (
                      garantiasFiltradas.map(g => {
                        const dias = diasRestantes(g)
                        return (
                          <tr key={g.id} style={{ borderBottom: '1px solid #e2e8f0', transition: 'background-color .15s' }}>
                            <td style={{ ...tdS, fontWeight: 700, color: '#16a34a', whiteSpace: 'nowrap' }}>{g.numero}</td>
                            <td style={{ ...tdS, fontWeight: 600, color: '#18181b', maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{g.clienteNombre}</td>
                            <td style={{ ...tdS, color: '#334155', maxWidth: 220, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{g.productoNombre}</td>
                            <td style={{ ...tdS, color: '#64748b', fontSize: 12, fontFamily: 'monospace' }}>{g.productoSerie || '—'}</td>
                            <td style={{ ...tdS, color: '#64748b', fontSize: 12, whiteSpace: 'nowrap' }}>{fmtDate(g.fechaVenta)}</td>
                            <td style={{ ...tdS, color: '#64748b', fontSize: 12, whiteSpace: 'nowrap' }}>{fmtDate(g.fechaVencimiento)}</td>
                            <td style={{ ...tdS, whiteSpace: 'nowrap' }}>
                              <span style={{ fontWeight: 700, color: dias <= 0 ? '#dc2626' : dias <= 30 ? '#d97706' : '#16a34a', fontSize: 12 }}>
                                {dias <= 0 ? 'Vencida' : `${dias} d`}
                              </span>
                            </td>
                            <td style={tdS}>
                              <span className={estadoBadge[g.estado] || 'badge-gray'} style={{ textTransform: 'capitalize' }}>
                                {g.estado}
                              </span>
                            </td>
                            <td style={{ ...tdS, textAlign: 'right' }}>
                              <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end', alignItems: 'center' }}>
                                {g.estado === 'vigente' && (
                                  <button
                                    onClick={() => abrirReclamo(g)}
                                    style={{ fontSize: 11, fontWeight: 700, padding: '4px 10px', background: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca', borderRadius: 6, cursor: 'pointer', fontFamily: 'inherit' }}
                                  >
                                    Reclamar
                                  </button>
                                )}
                                <button
                                  className="btn-ghost btn-sm"
                                  onClick={() => printGarantia(g)}
                                  style={{ fontSize: 11, fontWeight: 600, padding: '4px 10px' }}
                                >
                                  Imprimir
                                </button>
                              </div>
                            </td>
                          </tr>
                        )
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )
      })()}

      {tab === 'reclamada' && (() => {
        const reclamosFiltrados = (todosReclamos || []).filter((r: any) => {
          if (!buscar) return true
          const q = buscar.toLowerCase()
          return (
            r.numero?.toLowerCase().includes(q) ||
            r.garantiaNumero?.toLowerCase().includes(q) ||
            r.clienteNombre?.toLowerCase().includes(q) ||
            r.motivoReclamo?.toLowerCase().includes(q)
          )
        })

        const garantiasReclamadas = (garantias || []).filter(g => {
          const matchBuscar = !buscar || (
            g.numero?.toLowerCase().includes(buscar.toLowerCase()) ||
            g.clienteNombre?.toLowerCase().includes(buscar.toLowerCase()) ||
            g.productoNombre?.toLowerCase().includes(buscar.toLowerCase()) ||
            g.productoSerie?.toLowerCase().includes(buscar.toLowerCase())
          )
          return matchBuscar && (g.estado || '').toLowerCase() === 'reclamada'
        })

        if (reclamosFiltrados.length === 0 && garantiasReclamadas.length > 0) {
          return (
            <>
              <div className="card" style={{ padding: 14 }}>
                <input className="input" placeholder="Buscar por cliente, producto, número..." value={buscar} onChange={e => setBuscar(e.target.value)} style={{ width: '100%' }} />
              </div>

              <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                    <thead>
                      <tr style={{ background: '#f8fafc', borderBottom: '1.5px solid #e2e8f0' }}>
                        <th style={{ ...thS, width: 110 }}>No. Garantía</th>
                        <th style={{ ...thS, width: 180 }}>Cliente</th>
                        <th style={{ ...thS, minWidth: 160 }}>Producto</th>
                        <th style={{ ...thS, width: 130 }}>No. Serie</th>
                        <th style={{ ...thS, width: 100 }}>Venta</th>
                        <th style={{ ...thS, width: 100 }}>Vencimiento</th>
                        <th style={{ ...thS, width: 90 }}>Días</th>
                        <th style={{ ...thS, width: 100 }}>Estado</th>
                        <th style={{ ...thS, width: 130, textAlign: 'right' }}>Acciones</th>
                      </tr>
                    </thead>
                    <tbody>
                      {garantiasReclamadas.map(g => {
                        const dias = diasRestantes(g)
                        return (
                          <tr key={g.id} style={{ borderBottom: '1px solid #e2e8f0', transition: 'background-color .15s' }}>
                            <td style={{ ...tdS, fontWeight: 700, color: '#16a34a', whiteSpace: 'nowrap' }}>{g.numero}</td>
                            <td style={{ ...tdS, fontWeight: 600, color: '#18181b', maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{g.clienteNombre}</td>
                            <td style={{ ...tdS, color: '#334155', maxWidth: 220, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{g.productoNombre}</td>
                            <td style={{ ...tdS, color: '#64748b', fontSize: 12, fontFamily: 'monospace' }}>{g.productoSerie || '—'}</td>
                            <td style={{ ...tdS, color: '#64748b', fontSize: 12, whiteSpace: 'nowrap' }}>{fmtDate(g.fechaVenta)}</td>
                            <td style={{ ...tdS, color: '#64748b', fontSize: 12, whiteSpace: 'nowrap' }}>{fmtDate(g.fechaVencimiento)}</td>
                            <td style={{ ...tdS, whiteSpace: 'nowrap' }}>
                              <span style={{ fontWeight: 700, color: dias <= 0 ? '#dc2626' : dias <= 30 ? '#d97706' : '#16a34a', fontSize: 12 }}>
                                {dias <= 0 ? 'Vencida' : `${dias} d`}
                              </span>
                            </td>
                            <td style={tdS}>
                              <span className={estadoBadge[g.estado] || 'badge-gray'} style={{ textTransform: 'capitalize' }}>
                                {g.estado}
                              </span>
                            </td>
                            <td style={{ ...tdS, textAlign: 'right' }}>
                              <button
                                className="btn-ghost btn-sm"
                                onClick={() => printGarantia(g)}
                                style={{ fontSize: 11, fontWeight: 600, padding: '4px 10px' }}
                              >
                                Imprimir
                              </button>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )
        }

        return (
          <>
            <div className="card" style={{ padding: 14 }}>
              <input className="input" placeholder="Buscar reclamo por cliente, garantía, motivo, número..." value={buscar} onChange={e => setBuscar(e.target.value)} style={{ width: '100%' }} />
            </div>

            <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                  <thead>
                    <tr style={{ background: '#f8fafc', borderBottom: '1.5px solid #e2e8f0' }}>
                      <th style={{ ...thS, width: 110 }}>No. Reclamo</th>
                      <th style={{ ...thS, width: 100 }}>Fecha</th>
                      <th style={{ ...thS, width: 110 }}>Garantía</th>
                      <th style={{ ...thS, width: 170 }}>Cliente</th>
                      <th style={{ ...thS, minWidth: 180 }}>Motivo</th>
                      <th style={{ ...thS, width: 110 }}>Decisión</th>
                      <th style={{ ...thS, width: 100 }}>Estado</th>
                      <th style={{ ...thS, width: 230, textAlign: 'right' }}>Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reclamosFiltrados.length === 0 ? (
                      <tr>
                        <td colSpan={8} style={{ textAlign: 'center', padding: 48, color: '#8a887e', fontSize: 13 }}>
                          Sin reclamos registrados
                        </td>
                      </tr>
                    ) : (
                      reclamosFiltrados.map(r => (
                        <tr key={r.id} style={{ borderBottom: '1px solid #e2e8f0', transition: 'background-color .15s' }}>
                          <td style={{ ...tdS, fontWeight: 700, color: '#dc2626', whiteSpace: 'nowrap' }}>{r.numero}</td>
                          <td style={{ ...tdS, color: '#64748b', fontSize: 12, whiteSpace: 'nowrap' }}>{fmtDate(r.fecha)}</td>
                          <td style={{ ...tdS, color: '#2563eb', fontWeight: 600, whiteSpace: 'nowrap' }}>{r.garantiaNumero}</td>
                          <td style={{ ...tdS, fontWeight: 600, color: '#18181b', maxWidth: 170, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.clienteNombre}</td>
                          <td style={{ ...tdS, color: '#334155', maxWidth: 220, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.motivoReclamo}</td>
                          <td style={tdS}>
                            {r.decision ? (
                              <span className="badge-blue" style={{ textTransform: 'capitalize' }}>
                                {r.decision}
                              </span>
                            ) : (
                              <span style={{ color: '#94a3b8', fontSize: 12 }}>Pendiente</span>
                            )}
                          </td>
                          <td style={tdS}>
                            <span className={estadoReclamoBadge[r.estado] || 'badge-gray'} style={{ textTransform: 'capitalize' }}>
                              {r.estado}
                            </span>
                          </td>
                          <td style={{ ...tdS, textAlign: 'right' }}>
                            {r.estado === 'recibido' ? (
                              <div style={{ display: 'flex', gap: 5, justifyContent: 'flex-end' }}>
                                <button
                                  onClick={() => resolverReclamo(r, 'reparar', 'En reparación')}
                                  style={{ fontSize: 11, fontWeight: 700, padding: '3px 8px', background: '#eff6ff', color: '#2563eb', border: '1px solid #bfdbfe', borderRadius: 6, cursor: 'pointer', fontFamily: 'inherit' }}
                                >
                                  Reparar
                                </button>
                                <button
                                  onClick={() => resolverReclamo(r, 'reemplazar', 'Producto reemplazado')}
                                  style={{ fontSize: 11, fontWeight: 700, padding: '3px 8px', background: '#f0fdf4', color: '#16a34a', border: '1px solid #bbf7d0', borderRadius: 6, cursor: 'pointer', fontFamily: 'inherit' }}
                                >
                                  Reemplazar
                                </button>
                                <button
                                  onClick={() => resolverReclamo(r, 'rechazar', 'No cubre garantía')}
                                  style={{ fontSize: 11, fontWeight: 700, padding: '3px 8px', background: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca', borderRadius: 6, cursor: 'pointer', fontFamily: 'inherit' }}
                                >
                                  Rechazar
                                </button>
                              </div>
                            ) : r.ordenTrabajoId ? (
                              <span style={{ fontSize: 11, color: '#64748b', fontWeight: 600 }}>OT #{r.ordenTrabajoId}</span>
                            ) : null}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )
      })()}

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

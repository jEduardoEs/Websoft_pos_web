'use client'

import { fmt, fmtDate, fmtDateTime } from '@/lib/utils'
import { useServicio, ESTADOS } from '../hooks/use-servicio'
import { printOrden } from '../utils/pdfGenerators'

export default function ServicioModule() {
  const { state, actions } = useServicio()
  const {
    ordenes, filtroEstado, buscar, showModal, showDetalle, selected,
    form, loading, comentarioCambio, emptyForm
  } = state
  const {
    setFiltroEstado, setBuscar, setShowModal, setShowDetalle, setSelected,
    setForm, setF, setRepuestos, setComentarioCambio, save, cambiarEstado
  } = actions

  const estadoInfo = (e: string) => ESTADOS.find(x => x.value === e) || ESTADOS[0]

  const thS = { background: '#f8fafc', fontSize: 11, fontWeight: 700 as const, color: '#64748b', textTransform: 'uppercase' as const, letterSpacing: '.5px' as const, padding: '12px 16px', textAlign: 'left' as const, borderBottom: '1.5px solid #e2e8f0', whiteSpace: 'nowrap' as const }
  const tdS = { padding: '14px 16px', fontSize: 13, borderBottom: '1px solid #f1f5f9', color: '#18181b', verticalAlign: 'middle' as const }
  const lbl = { display: 'block' as const, fontSize: 11, fontWeight: 700 as const, color: '#8a887e', textTransform: 'uppercase' as const, marginBottom: 4 }

  const stats = ESTADOS.map(e => ({ ...e, count: ordenes.filter(o => o.estado === e.value).length }))

  return (
    <div className="page-wrap">
      <div className="page-header">
        <div>
          <h1>Servicio Técnico</h1>
          <p>Órdenes de trabajo y reparaciones en taller</p>
        </div>
        <button className="btn-primary" onClick={() => { setForm(emptyForm); setRepuestos([]); setShowModal(true) }}>
          + Nueva Orden
        </button>
      </div>

      {/* Estado cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6,1fr)', gap: 12 }}>
        {stats.map(s => (
          <div key={s.value} onClick={() => setFiltroEstado(filtroEstado === s.value ? '' : s.value)}
            className="card" style={{ padding: '14px 16px', cursor: 'pointer', borderTop: `3px solid ${s.color}`, opacity: filtroEstado && filtroEstado !== s.value ? .5 : 1, transition: 'all .15s' }}>
            <div style={{ fontSize: 24, fontWeight: 800, color: s.color }}>{s.count}</div>
            <div style={{ fontSize: 11, color: '#64748b', marginTop: 3, fontWeight: 600 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="card" style={{ padding: 14 }}>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <input className="input" placeholder="Buscar por número, cliente, equipo, técnico..." value={buscar} onChange={e => setBuscar(e.target.value)} style={{ flex: 1 }} />
          {filtroEstado && <button className="btn-ghost btn-sm" onClick={() => setFiltroEstado('')}>Limpiar filtro</button>}
        </div>
      </div>

      {/* Table */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ background: '#f8fafc', borderBottom: '1.5px solid #e2e8f0' }}>
                <th style={{ ...thS, width: 110 }}>No. Orden</th>
                <th style={{ ...thS, width: 100 }}>Fecha</th>
                <th style={{ ...thS, minWidth: 160 }}>Cliente</th>
                <th style={{ ...thS, minWidth: 140 }}>Equipo</th>
                <th style={{ ...thS, minWidth: 200 }}>Falla Reportada</th>
                <th style={{ ...thS, minWidth: 130 }}>Técnico</th>
                <th style={{ ...thS, width: 110 }}>Promesa</th>
                <th style={{ ...thS, width: 110 }}>Total</th>
                <th style={{ ...thS, width: 130 }}>Estado</th>
                <th style={{ ...thS, width: 140, textAlign: 'right' }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {ordenes.length === 0 ? (
                <tr><td colSpan={10} style={{ textAlign: 'center', padding: 50, color: '#8a887e', fontSize: 13 }}>Sin órdenes de servicio registradas.</td></tr>
              ) : ordenes.map(o => {
                const est = estadoInfo(o.estado)
                const vencida = o.fechaPromesa && new Date(o.fechaPromesa) < new Date() && !['entregado', 'cancelado'].includes(o.estado)
                return (
                  <tr key={o.id} onClick={() => { setSelected(o); setShowDetalle(true) }}
                    style={{ cursor: 'pointer', borderBottom: '1px solid #f1f5f9', transition: 'background-color .15s' }}
                    onMouseEnter={e => e.currentTarget.style.backgroundColor = '#f8fafc'}
                    onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}>
                    <td style={{ ...tdS, fontWeight: 700, color: '#1581E3', whiteSpace: 'nowrap' }}>{o.numero}</td>
                    <td style={{ ...tdS, color: '#64748b', fontSize: 12, whiteSpace: 'nowrap' }}>{fmtDate(o.fecha)}</td>
                    <td style={{ ...tdS, fontWeight: 600, color: '#0f172a' }}>{o.clienteNombre}</td>
                    <td style={{ ...tdS, color: '#334155', fontWeight: 500 }}>{o.tipoEquipo} {o.marca ? `· ${o.marca}` : ''}</td>
                    <td style={{ ...tdS, color: '#475569', maxWidth: 220, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{o.descripcionFalla}</td>
                    <td style={{ ...tdS, color: '#64748b', fontSize: 12 }}>{o.tecnicoNombre || '—'}</td>
                    <td style={{ ...tdS, color: vencida ? '#dc2626' : '#64748b', fontSize: 12, fontWeight: vencida ? 700 : 400, whiteSpace: 'nowrap' }}>
                      {o.fechaPromesa ? fmtDate(o.fechaPromesa) : '—'}
                    </td>
                    <td style={{ ...tdS, fontWeight: 700, color: '#0f172a', whiteSpace: 'nowrap' }}>{o.total > 0 ? fmt(o.total) : '—'}</td>
                    <td style={{ ...tdS, whiteSpace: 'nowrap' }}>
                      <span style={{ background: est.bg, color: est.color, fontSize: 11, fontWeight: 700, padding: '4px 11px', borderRadius: 20, display: 'inline-block' }}>
                        {est.label}
                      </span>
                    </td>
                    <td style={{ ...tdS, textAlign: 'right' }} onClick={e => e.stopPropagation()}>
                      <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end', alignItems: 'center' }}>
                        <button
                          className="btn-ghost btn-sm"
                          onClick={() => { setSelected(o); setShowDetalle(true); }}
                          style={{ fontSize: 11, fontWeight: 600, padding: '4px 10px' }}
                        >
                          Ver
                        </button>
                        <button
                          className="btn-ghost btn-sm"
                          onClick={() => printOrden(o)}
                          style={{ fontSize: 11, fontWeight: 600, padding: '4px 10px', color: '#1581E3', borderColor: '#bfdbfe', background: '#eff6ff' }}
                        >
                          Imprimir
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* ─── MODAL NUEVA ORDEN ─── */}
      {showModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.5)', zIndex: 999, display: 'flex', alignItems: 'flex-start', justifyContent: 'center', padding: 20, overflowY: 'auto' }}>
          <div style={{ background: '#fff', border: '1.5px solid #d8d6cd', borderRadius: 6, padding: 28, width: '100%', maxWidth: 800, margin: 'auto', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 20, paddingBottom: 14, borderBottom: '1.5px solid #d8d6cd' }}>
              <h3 style={{ fontSize: 16, fontWeight: 700, color: '#18181b' }}>Nueva Orden de Servicio</h3>
              <button onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', fontSize: 22, cursor: 'pointer', color: '#8a887e' }}>×</button>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 16 }}>
              {/* Cliente */}
              <div style={{ gridColumn: '1/-1', background: '#f4f3ef', border: '1.5px solid #d8d6cd', borderRadius: 6, padding: 14 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: '#1581E3', textTransform: 'uppercase', marginBottom: 10 }}>Cliente</div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
                  <div style={{ gridColumn: '1/-1' }}><label style={lbl}>Nombre *</label><input className="input" value={form.clienteNombre} onChange={e => setF('clienteNombre', e.target.value)} /></div>
                  <div><label style={lbl}>Teléfono (8 dígitos)</label><input className="input" type="tel" maxLength={8} value={form.clienteTelefono || ''} onChange={e => setF('clienteTelefono', e.target.value.replace(/\D/g, '').slice(0, 8))} placeholder="Ej: 55554444" /></div>
                  <div><label style={lbl}>NIT</label><input className="input" value={form.clienteNit} onChange={e => setF('clienteNit', e.target.value)} /></div>
                  <div><label style={lbl}>Prioridad</label>
                    <select className="input" value={form.prioridad} onChange={e => setF('prioridad', e.target.value)}>
                      <option value="normal">Normal</option>
                      <option value="urgente">Urgente</option>
                      <option value="vip">VIP</option>
                    </select>
                  </div>
                </div>
              </div>
              {/* Equipo */}
              <div style={{ gridColumn: '1/-1', background: '#f4f3ef', border: '1.5px solid #d8d6cd', borderRadius: 6, padding: 14 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: '#1581E3', textTransform: 'uppercase', marginBottom: 10 }}>Equipo</div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10 }}>
                  <div><label style={lbl}>Tipo de equipo *</label><input className="input" value={form.tipoEquipo} onChange={e => setF('tipoEquipo', e.target.value)} placeholder="Ej: Laptop, Cámara, DVR..." /></div>
                  <div><label style={lbl}>Marca</label><input className="input" value={form.marca} onChange={e => setF('marca', e.target.value)} /></div>
                  <div><label style={lbl}>Modelo</label><input className="input" value={form.modelo} onChange={e => setF('modelo', e.target.value)} /></div>
                  <div><label style={lbl}>No. Serie</label><input className="input" value={form.serie} onChange={e => setF('serie', e.target.value)} /></div>
                  <div style={{ gridColumn: '2/-1' }}><label style={lbl}>Accesorios entregados</label><input className="input" value={form.accesorios} onChange={e => setF('accesorios', e.target.value)} placeholder="Cable, cargador, funda..." /></div>
                </div>
              </div>
              {/* Falla */}
              <div style={{ gridColumn: '1/-1' }}>
                <label style={lbl}>Descripción de la falla *</label>
                <textarea className="input" rows={3} value={form.descripcionFalla} onChange={e => setF('descripcionFalla', e.target.value)} placeholder="Describe el problema reportado por el cliente..." />
              </div>
              <div>
                <label style={lbl}>Observaciones internas</label>
                <textarea className="input" rows={2} value={form.observaciones} onChange={e => setF('observaciones', e.target.value)} />
              </div>
              <div>
                <label style={lbl}>Técnico asignado</label>
                <input className="input" value={form.tecnicoNombre} onChange={e => setF('tecnicoNombre', e.target.value)} placeholder="Nombre del técnico" />
              </div>
              <div>
                <label style={lbl}>Fecha promesa de entrega</label>
                <input className="input" type="date" value={form.fechaPromesa} onChange={e => setF('fechaPromesa', e.target.value)} />
              </div>
              <div>
                <label style={lbl}>Costo estimado reparación</label>
                <input className="input" type="number" value={form.costoReparacion} onChange={e => setF('costoReparacion', e.target.value)} placeholder="Q 0.00" />
              </div>
            </div>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 8 }}>
              <button className="btn-ghost" onClick={() => setShowModal(false)}>Cancelar</button>
              <button className="btn-primary" onClick={save} disabled={loading}>{loading ? 'Guardando...' : 'Crear Orden e Imprimir'}</button>
            </div>
          </div>
        </div>
      )}

      {/* ─── DETALLE ─── */}
      {showDetalle && selected && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.5)', zIndex: 999, display: 'flex', alignItems: 'flex-start', justifyContent: 'center', padding: 20, overflowY: 'auto' }}>
          <div style={{ background: '#fff', border: '1.5px solid #d8d6cd', borderRadius: 6, padding: 28, width: '100%', maxWidth: 700, margin: 'auto',  }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 20 }}>
              <div>
                <div style={{ fontSize: 18, fontWeight: 800, color: '#18181b' }}>{selected.numero}</div>
                <div style={{ fontSize: 12, color: '#8a887e' }}>{selected.clienteNombre} · {selected.tipoEquipo}</div>
              </div>
              <button onClick={() => setShowDetalle(false)} style={{ background: 'none', border: 'none', fontSize: 24, cursor: 'pointer', color: '#8a887e' }}>×</button>
            </div>

            {/* Estado actual + cambiar */}
            <div style={{ background: '#f4f3ef', borderRadius: 6, padding: 14, marginBottom: 16 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#8a887e', textTransform: 'uppercase', marginBottom: 10 }}>Cambiar estado</div>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 10 }}>
                {ESTADOS.map(e => (
                  <button key={e.value} onClick={() => cambiarEstado(selected.id, e.value)}
                    style={{ padding: '5px 12px', borderRadius: 20, border: `1.5px solid ${e.color}`, background: selected.estado === e.value ? e.color : 'transparent', color: selected.estado === e.value ? '#fff' : e.color, fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>
                    {e.label}
                  </button>
                ))}
              </div>
              <input className="input" value={comentarioCambio} onChange={e => setComentarioCambio(e.target.value)} placeholder="Comentario del cambio (opcional)" style={{ fontSize: 12 }} />
            </div>

            {/* Info */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16, fontSize: 13 }}>
              {[['Falla', selected.descripcionFalla], ['Técnico', selected.tecnicoNombre || '—'], ['Promesa', selected.fechaPromesa ? fmtDate(selected.fechaPromesa) : '—'], ['Total', fmt(selected.total)]].map(([l, v]) => (
                <div key={l}>
                  <div style={{ fontSize: 10, fontWeight: 700, color: '#8a887e', textTransform: 'uppercase', marginBottom: 2 }}>{l}</div>
                  <div style={{ color: '#18181b' }}>{v}</div>
                </div>
              ))}
            </div>

            {/* Historial */}
            {selected.historial?.length > 0 && (
              <div>
                <div style={{ fontSize: 12, fontWeight: 700, color: '#18181b', marginBottom: 8 }}>Historial de cambios</div>
                {selected.historial.map((h: any, i: number) => (
                  <div key={i} style={{ display: 'flex', gap: 10, padding: '8px 0', borderBottom: '1px solid #e3e1d8', fontSize: 12 }}>
                    <span style={{ color: '#8a887e', whiteSpace: 'nowrap' }}>{fmtDateTime(h.fecha)}</span>
                    <span style={{ color: '#1581E3', fontWeight: 600 }}>{h.estadoNuevo}</span>
                    {h.comentario && <span style={{ color: '#52524d' }}>{h.comentario}</span>}
                    <span style={{ color: '#8a887e', marginLeft: 'auto' }}>{h.usuarioNombre}</span>
                  </div>
                ))}
              </div>
            )}

            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 20 }}>
              <button className="btn-ghost" onClick={() => setShowDetalle(false)}>Cerrar</button>
              <button className="btn-primary" onClick={() => printOrden(selected)}>Imprimir</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

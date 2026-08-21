'use client'
import { useRouter } from 'next/navigation'
import { useProyectos } from '../hooks/use-proyectos'

const ESTADOS = ['planificado', 'en_ejecucion', 'completado', 'cancelado'] as const
const ESTADO_LABEL: Record<string, string> = { planificado: 'Planificación', en_ejecucion: 'En ejecución', completado: 'Completado', cancelado: 'Cancelado' }
const ESTADO_COLOR: Record<string, string> = { planificado: '#1581E3', en_ejecucion: '#d97706', completado: '#16a34a', cancelado: '#94a3b8' }
const fmt = (d: string | null) => d ? new Date(d).toLocaleDateString('es-GT', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'

export default function ProyectosListModule({ esAdminOSupervisor }: { esAdminOSupervisor: boolean }) {
  const router = useRouter()
  const { state, actions, utils, refs } = useProyectos(esAdminOSupervisor)
  const { proyectos, alertas, tab, buscar, showModal, form, loading, formError, openMenuId, showPinEliminar, pinInput, cotizacionesList, clientesList, clienteSearch, asociados } = state
  const { setTab, setBuscar, setShowModal, openModal, closeModal, setF, save, handleEliminar, eliminarProyecto, setPinInput, setShowPinEliminar, setOpenMenuId, setClienteSearch, seleccionarAsociado, cargarDesdeCotizacion, cargarDesdeCliente } = actions
  const { diasPara, getAlertaMant } = utils
  const { menuRef } = refs

  const thS: React.CSSProperties = { background: '#f8fafc', fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', padding: '10px 14px', textAlign: 'left', borderBottom: '1px solid #e2e8f0' }
  const tdS: React.CSSProperties = { padding: '12px 14px', fontSize: 13, borderBottom: '1px solid #f1f5f9', verticalAlign: 'middle' }
  const lbl: React.CSSProperties = { display: 'block', fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', marginBottom: 5 }

  return (
    <div className="page-wrap">
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 700, color: '#0f172a' }}>Proyectos e Instalaciones</h1>
          <p style={{ fontSize: 12, color: '#64748b', marginTop: 3 }}>Gestión de proyectos instalados con control de mantenimientos de garantía</p>
        </div>
        <button className="btn-primary" onClick={openModal}>+ Nuevo proyecto</button>
      </div>

      {/* Alertas globales */}
      <div style={{ display: 'flex', gap: 12 }}>
        {alertas.vencidos > 0 && <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 10, padding: '10px 16px', fontSize: 13, color: '#dc2626', fontWeight: 600 }}> {alertas.vencidos} proyecto(s) con mantenimiento vencido</div>}
        {alertas.proximos > 0 && <div style={{ background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 10, padding: '10px 16px', fontSize: 13, color: '#d97706', fontWeight: 600 }}> {alertas.proximos} proyecto(s) con mantenimiento próximo</div>}
      </div>

      {/* Filtros + Búsqueda */}
      <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', gap: 4, background: '#f1f5f9', padding: 4, borderRadius: 8 }}>
          {(['todos', 'planificado', 'en_ejecucion', 'completado', 'cancelado'] as const).map(t => (
            <button key={t} onClick={() => setTab(t)} style={{ padding: '6px 14px', borderRadius: 6, fontSize: 12, fontWeight: 600, border: 'none', cursor: 'pointer', background: tab === t ? '#fff' : 'transparent', color: tab === t ? '#0f172a' : '#64748b', boxShadow: tab === t ? '0 1px 3px rgba(0,0,0,.1)' : 'none' }}>
              {t === 'todos' ? 'Todos' : ESTADO_LABEL[t]}
            </button>
          ))}
        </div>
        <input className="input" style={{ width: 260 }} value={buscar} onChange={e => setBuscar(e.target.value)} placeholder="Buscar por cliente, nombre o número..." />
      </div>

      {/* Tabla de proyectos */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th style={thS}>Número</th>
                <th style={thS}>Nombre / Cliente</th>
                <th style={thS}>Contacto</th>
                <th style={thS}>Instalación</th>
                <th style={thS}>Estado</th>
                <th style={thS}>Mantenimientos</th>
                <th style={thS}>Próximo Maint.</th>
                <th style={{ ...thS, textAlign: 'right' }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {proyectos.length === 0
                ? <tr><td colSpan={8} style={{ textAlign: 'center', padding: 50, color: '#94a3b8', fontSize: 13 }}>Sin proyectos. Crea el primero.</td></tr>
                : proyectos.map(p => {
                    const alerta = getAlertaMant(p.mantenimientos)
                    const mCompletados = p.mantenimientos.filter(m => m.realizado).length
                    return (
                      <tr key={p.id} onClick={() => router.push(`/proyectos/${p.id}`)} style={{ cursor: 'pointer' }}>
                        <td style={tdS}><span style={{ fontWeight: 700, color: '#1581E3', fontFamily: 'monospace' }}>{p.numero}</span></td>
                        <td style={tdS}>
                          <div style={{ fontWeight: 600, color: '#0f172a' }}>{p.nombre}</div>
                          <div style={{ fontSize: 11, color: '#64748b' }}>{p.clienteNombre} {p.clienteNit ? `· NIT ${p.clienteNit}` : ''}</div>
                        </td>
                        <td style={tdS}>
                          <div style={{ fontSize: 12, color: '#334155' }}>{p.contactoNombre || '—'}</div>
                          <div style={{ fontSize: 11, color: '#64748b' }}>{p.clienteTelefono || '—'}</div>
                        </td>
                        <td style={tdS}>{fmt(p.fechaInicio)}</td>
                        <td style={tdS}>
                          <span style={{ padding: '3px 10px', borderRadius: 12, fontSize: 11, fontWeight: 700, background: `${ESTADO_COLOR[p.estado]}18`, color: ESTADO_COLOR[p.estado] }}>
                            {ESTADO_LABEL[p.estado] || p.estado}
                          </span>
                        </td>
                        <td style={tdS}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <div style={{ flex: 1, background: '#e2e8f0', borderRadius: 4, height: 6, width: 60, overflow: 'hidden' }}>
                              <div style={{ width: `${(mCompletados / 3) * 100}%`, background: '#16a34a', height: '100%' }} />
                            </div>
                            <span style={{ fontSize: 11, fontWeight: 700, color: '#64748b' }}>{mCompletados}/3</span>
                          </div>
                        </td>
                        <td style={tdS}>
                          {alerta ? (
                            <span style={{ padding: '3px 8px', borderRadius: 6, fontSize: 11, fontWeight: 700, background: alerta.tipo === 'vencido' ? '#fef2f2' : '#fffbeb', color: alerta.tipo === 'vencido' ? '#dc2626' : '#d97706' }}>
                              {alerta.tipo === 'vencido' ? `M${alerta.num} vencido hace ${alerta.dias}d` : `M${alerta.num} en ${alerta.dias}d`}
                            </span>
                          ) : <span style={{ color: '#94a3b8', fontSize: 12 }}>—</span>}
                        </td>
                        <td style={{ ...tdS, textAlign: 'right' }} onClick={e => e.stopPropagation()}>
                          <div style={{ position: 'relative', display: 'inline-block' }}>
                            <button onClick={() => setOpenMenuId(openMenuId === p.id ? null : p.id)} style={{ background: 'none', border: 'none', fontSize: 16, cursor: 'pointer', color: '#64748b', padding: '4px 8px' }}>⋮</button>
                            {openMenuId === p.id && (
                              <div ref={menuRef} style={{ position: 'absolute', right: 0, top: '100%', background: '#fff', border: '1px solid #e2e8f0', borderRadius: 8, boxShadow: '0 10px 30px rgba(0,0,0,.15)', zIndex: 100, minWidth: 140, overflow: 'hidden' }}>
                                <button onClick={() => router.push(`/proyectos/${p.id}`)} style={{ width: '100%', textAlign: 'left', padding: '9px 14px', background: 'none', border: 'none', fontSize: 12, cursor: 'pointer', color: '#334155' }}>
                                  Ver Detalle
                                </button>
                                <button onClick={() => handleEliminar(p.id)} style={{ width: '100%', textAlign: 'left', padding: '9px 14px', background: 'none', border: 'none', fontSize: 12, cursor: 'pointer', color: '#dc2626' }}>
                                  Eliminar
                                </button>
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    )
                  })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Crear Proyecto */}
      {showModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.5)', zIndex: 999, display: 'flex', alignItems: 'flex-start', justifyContent: 'center', padding: 20, overflowY: 'auto' }}>
          <div style={{ background: '#fff', borderRadius: 14, padding: 28, width: '100%', maxWidth: 640, margin: 'auto', boxShadow: '0 20px 60px rgba(0,0,0,.2)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 20, paddingBottom: 14, borderBottom: '1px solid #e2e8f0' }}>
              <h3 style={{ fontSize: 16, fontWeight: 700, color: '#0f172a' }}>Nuevo Proyecto</h3>
              <button onClick={closeModal} style={{ background: 'none', border: 'none', fontSize: 22, cursor: 'pointer', color: '#94a3b8' }}>&times;</button>
            </div>

            {formError && (
              <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8, padding: '10px 14px', fontSize: 13, color: '#dc2626', fontWeight: 600, marginBottom: 16 }}>
                {formError}
              </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              <div style={{ gridColumn: '1/-1' }}>
                <label style={lbl}>Nombre del proyecto *</label>
                <input className="input" value={form.nombre} onChange={e => setF('nombre', e.target.value)} placeholder="Ej: Sistema CCTV Farmacia San José" />
              </div>
              <div style={{ position: 'relative' }}>
                <label style={lbl}>Cliente / Empresa *</label>
                <div style={{ display: 'flex', gap: 6 }}>
                  <input
                    className="input"
                    value={form.clienteNombre}
                    onChange={e => {
                      const val = e.target.value
                      setF('clienteNombre', val)
                      setClienteSearch(val)
                    }}
                    onKeyDown={e => {
                      if (e.key === 'Enter') {
                        e.preventDefault()
                        cargarDesdeCliente(form.clienteNombre)
                      }
                    }}
                    placeholder="Nombre del cliente o empresa"
                    style={{ flex: 1 }}
                  />
                  <button
                    type="button"
                    onClick={() => cargarDesdeCliente(form.clienteNombre)}
                    style={{ background: '#1581E3', color: '#fff', border: 'none', borderRadius: 6, padding: '0 12px', fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}
                  >
                    Buscar
                  </button>
                </div>
                {asociados.length > 0 && clienteSearch.trim().length >= 2 && (
                  <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, background: '#fff', border: '1px solid #cbd5e1', borderRadius: 6, boxShadow: '0 8px 20px rgba(0,0,0,.15)', zIndex: 1000, maxHeight: 160, overflowY: 'auto', marginTop: 2 }}>
                    <div style={{ fontSize: 10, fontWeight: 700, color: '#64748b', padding: '6px 10px', background: '#f8fafc', borderBottom: '1px solid #f1f5f9' }}>
                      Cotizaciones/Ventas encontradas ({asociados.length}):
                    </div>
                    {asociados.map(a => (
                      <div
                        key={`${a.tipo}-${a.id}`}
                        onClick={() => {
                          seleccionarAsociado(a)
                          setClienteSearch('')
                        }}
                        style={{ padding: '8px 10px', fontSize: 12, cursor: 'pointer', borderBottom: '1px solid #f8fafc' }}
                        onMouseEnter={e => (e.currentTarget.style.background = '#f0f7ff')}
                        onMouseLeave={e => (e.currentTarget.style.background = '#fff')}
                      >
                        <div style={{ fontWeight: 700, color: '#1e40af', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span>
                            {a.tipo === 'cotizacion' ? 'Cotización' : 'Venta'} {a.numero}
                            {a.tipo === 'cotizacion' && (
                              <span style={{
                                fontSize: 10,
                                background: a.estado === 'facturada' ? '#dcfce7' : '#fee2e2',
                                color: a.estado === 'facturada' ? '#15803d' : '#b91c1c',
                                padding: '1px 6px',
                                borderRadius: 4,
                                fontWeight: 600,
                                marginLeft: 6
                              }}>
                                {a.estado === 'facturada' ? 'Facturada' : 'No Facturada (Requiere POS)'}
                              </span>
                            )}
                          </span>
                          {a.hasInstalacion && (
                            <span style={{ fontSize: 10, background: '#dcfce7', color: '#15803d', padding: '1px 6px', borderRadius: 4, fontWeight: 600 }}>
                              Con instalación
                            </span>
                          )}
                        </div>
                        <div style={{ fontSize: 11, color: '#64748b' }}>{a.clienteNombre} · Q {Number(a.total).toFixed(2)}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <div style={{ position: 'relative' }}>
                <label style={lbl}>NIT</label>
                <div style={{ display: 'flex', gap: 6 }}>
                  <input
                    className="input"
                    value={form.clienteNit}
                    onChange={e => {
                      const val = e.target.value
                      setF('clienteNit', val)
                      setClienteSearch(val && val !== 'CF' ? val : '')
                    }}
                    onKeyDown={e => {
                      if (e.key === 'Enter') {
                        e.preventDefault()
                        cargarDesdeCliente(form.clienteNit)
                      }
                    }}
                    placeholder="NIT del cliente"
                    style={{ flex: 1 }}
                  />
                  <button
                    type="button"
                    onClick={() => cargarDesdeCliente(form.clienteNit)}
                    style={{ background: '#1581E3', color: '#fff', border: 'none', borderRadius: 6, padding: '0 12px', fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}
                  >
                    Buscar
                  </button>
                </div>
              </div>

              {/* SECCIÓN NO. COTIZACIÓN / VENTA VINCULADA */}
              <div>
                <label style={lbl}>No. Cotización / Venta vinculada</label>
                <div style={{ display: 'flex', gap: 6 }}>
                  <input
                    className="input"
                    value={form.cotizacionNumero}
                    onChange={e => setF('cotizacionNumero', e.target.value)}
                    onKeyDown={e => {
                      if (e.key === 'Enter') {
                        e.preventDefault()
                        cargarDesdeCotizacion(form.cotizacionNumero)
                      }
                    }}
                    placeholder="COT-000001 o FAC-000001"
                    style={{ flex: 1 }}
                  />
                  <button
                    type="button"
                    onClick={() => cargarDesdeCotizacion(form.cotizacionNumero)}
                    style={{ background: '#1581E3', color: '#fff', border: 'none', borderRadius: 6, padding: '0 12px', fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}
                  >
                    Buscar
                  </button>
                </div>
              </div>

              <div>
                <label style={lbl}>Teléfono</label>
                <input className="input" value={form.clienteTelefono} onChange={e => setF('clienteTelefono', e.target.value)} />
              </div>
              <div>
                <label style={lbl}>Persona de contacto</label>
                <input className="input" value={form.contactoNombre} onChange={e => setF('contactoNombre', e.target.value)} placeholder="Ej: Gerente, encargado..." />
              </div>
              <div>
                <label style={lbl}>Fecha de instalación *</label>
                <input className="input" type="date" value={form.fechaInicio} onChange={e => setF('fechaInicio', e.target.value)} />
              </div>
              <div style={{ gridColumn: '1/-1' }}>
                <label style={lbl}>Ubicación / Dirección</label>
                <input className="input" value={form.clienteDireccion} onChange={e => setF('clienteDireccion', e.target.value)} placeholder="Colonia, municipio, zona..." />
              </div>
              <div style={{ gridColumn: '1/-1' }}>
                <label style={lbl}>Descripción del trabajo realizado *</label>
                <textarea className="input" rows={2} value={form.descripcion} onChange={e => setF('descripcion', e.target.value)} placeholder="Ej: Instalación sistema CCTV 8 cámaras IP Hilook + DVR 16ch + monitor 21pul" style={{ resize: 'vertical' }} />
              </div>
              <div style={{ gridColumn: '1/-1' }}>
                <label style={lbl}>Alcance / detalles técnicos adicionales</label>
                <textarea className="input" rows={2} value={form.alcance} onChange={e => setF('alcance', e.target.value)} placeholder="Metraje de cable, configuración especial, equipos adicionales..." style={{ resize: 'vertical' }} />
              </div>
              <div style={{ gridColumn: '1/-1' }}>
                <label style={lbl}>Notas internas</label>
                <input className="input" value={form.notas} onChange={e => setF('notas', e.target.value)} />
              </div>
            </div>

            <div style={{ background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: 8, padding: '10px 14px', fontSize: 12, color: '#1e40af', margin: '16px 0' }}>
              Al guardar, el sistema programará automáticamente los 3 mantenimientos de garantía: a los 4, 8 y 12 meses desde la fecha de instalación.
            </div>

            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button className="btn-ghost" onClick={closeModal}>Cancelar</button>
              <button className="btn-primary" onClick={save} disabled={loading}>{loading ? 'Guardando...' : 'Crear proyecto'}</button>
            </div>
          </div>
        </div>
      )}

      {showPinEliminar && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.5)', zIndex: 999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <div style={{ background: '#fff', borderRadius: 10, padding: 28, width: '100%', maxWidth: 360, boxShadow: '0 20px 60px rgba(0,0,0,.2)' }}>
            <h3 style={{ fontSize: 16, fontWeight: 700, color: '#18181b', marginBottom: 8 }}>Autorización requerida</h3>
            <p style={{ fontSize: 13, color: '#52524d', marginBottom: 20, lineHeight: 1.6 }}>Ingresa la contraseña de un administrador para eliminar este proyecto.</p>
            <input className="input" type="password" placeholder="Contraseña de administrador" value={pinInput}
              onChange={e => setPinInput(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && showPinEliminar) eliminarProyecto(showPinEliminar, pinInput) }}
              style={{ marginBottom: 16, textAlign: 'center', fontSize: 16 }} autoFocus />
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button className="btn-ghost" onClick={() => { setShowPinEliminar(null); setPinInput('') }}>Cancelar</button>
              <button className="btn-danger" onClick={() => showPinEliminar && eliminarProyecto(showPinEliminar, pinInput)}>Confirmar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

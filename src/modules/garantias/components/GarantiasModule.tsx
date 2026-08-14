'use client'

import React, { useState, useEffect } from 'react'
import { fmtDate, diasRestantes } from '../utils/garantia-calc.helper'
import { useGarantias } from '../hooks/use-garantias'
import { printGarantia } from '../utils/pdfGenerators'
import { GarantiaReclamoModal } from './GarantiaReclamoModal'
import { GarantiaDetalleModal } from './GarantiaDetalleModal'

export default function GarantiasModule() {
  const { state, actions } = useGarantias()
  const {
    garantias, buscar, showModal, showReclamo, showDetalle, selectedGarantia,
    reclamos, todosReclamos, form, reclamoForm, loading, ventas, tab, isAdmin
  } = state
  const {
    setBuscar, setShowModal, setShowReclamo, setShowDetalle, setTab,
    setForm, setF, setRF, selVenta, verDetalle,
    saveGarantia, abrirReclamo, saveReclamo, resolverReclamo, anularGarantia, eliminarGarantia, emptyForm
  } = actions

  const [openMenuId, setOpenMenuId] = useState<number | null>(null)

  useEffect(() => {
    const handleOutside = () => setOpenMenuId(null)
    window.addEventListener('click', handleOutside)
    return () => window.removeEventListener('click', handleOutside)
  }, [])

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
                      <th style={{ ...thS, width: 60, textAlign: 'right' }}>Acciones</th>
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
                          <tr key={g.id} onClick={() => verDetalle(g)}
                            style={{ borderBottom: '1px solid #e2e8f0', cursor: 'pointer', transition: 'background-color .15s' }}
                            onMouseEnter={e => e.currentTarget.style.backgroundColor = '#f8fafc'}
                            onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}>
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
                            <td style={{ ...tdS, textAlign: 'right', position: 'relative' }} onClick={e => e.stopPropagation()}>
                              <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setOpenMenuId(openMenuId === g.id ? null : g.id);
                                  }}
                                  style={{
                                    background: '#f8fafc',
                                    border: '1px solid #cbd5e1',
                                    borderRadius: 6,
                                    width: 30,
                                    height: 30,
                                    cursor: 'pointer',
                                    fontSize: 16,
                                    fontWeight: 'bold',
                                    color: '#475569',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    lineHeight: 1
                                  }}
                                  title="Opciones"
                                >
                                  &#8942;
                                </button>
                                {openMenuId === g.id && (
                                  <div
                                    style={{
                                      position: 'absolute',
                                      right: 14,
                                      top: '100%',
                                      marginTop: 4,
                                      background: '#ffffff',
                                      border: '1px solid #e2e8f0',
                                      borderRadius: 8,
                                      boxShadow: '0 10px 25px -5px rgba(0,0,0,0.15)',
                                      zIndex: 100,
                                      minWidth: 140,
                                      padding: '6px 0',
                                      display: 'flex',
                                      flexDirection: 'column',
                                      textAlign: 'left'
                                    }}
                                    onClick={e => e.stopPropagation()}
                                  >
                                    {g.estado === 'vigente' && (
                                      <button
                                        onClick={() => { setOpenMenuId(null); abrirReclamo(g); }}
                                        style={{ padding: '8px 14px', background: 'none', border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 600, color: '#dc2626', textAlign: 'left', width: '100%' }}
                                      >
                                        Reclamar
                                      </button>
                                    )}
                                    <button
                                      onClick={() => { setOpenMenuId(null); printGarantia(g); }}
                                      style={{ padding: '8px 14px', background: 'none', border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 600, color: '#334155', textAlign: 'left', width: '100%' }}
                                    >
                                      Imprimir
                                    </button>
                                    {isAdmin && g.estado !== 'anulada' && (
                                      <button
                                        onClick={() => { setOpenMenuId(null); anularGarantia(g); }}
                                        style={{ padding: '8px 14px', background: 'none', border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 600, color: '#c2410c', textAlign: 'left', width: '100%' }}
                                      >
                                        Anular
                                      </button>
                                    )}
                                    {isAdmin && (
                                      <button
                                        onClick={() => { setOpenMenuId(null); eliminarGarantia(g); }}
                                        style={{ padding: '8px 14px', background: 'none', border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 600, color: '#b91c1c', textAlign: 'left', width: '100%' }}
                                      >
                                        Eliminar
                                      </button>
                                    )}
                                  </div>
                                )}
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
                        <th style={{ ...thS, width: 60, textAlign: 'right' }}>Acciones</th>
                      </tr>
                    </thead>
                    <tbody>
                      {garantiasReclamadas.map(g => {
                        const dias = diasRestantes(g)
                        return (
                          <tr key={g.id} onClick={() => verDetalle(g)}
                            style={{ borderBottom: '1px solid #e2e8f0', cursor: 'pointer', transition: 'background-color .15s' }}
                            onMouseEnter={e => e.currentTarget.style.backgroundColor = '#f8fafc'}
                            onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}>
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
                            <td style={{ ...tdS, textAlign: 'right', position: 'relative' }} onClick={e => e.stopPropagation()}>
                              <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setOpenMenuId(openMenuId === g.id ? null : g.id);
                                  }}
                                  style={{
                                    background: '#f8fafc',
                                    border: '1px solid #cbd5e1',
                                    borderRadius: 6,
                                    width: 30,
                                    height: 30,
                                    cursor: 'pointer',
                                    fontSize: 16,
                                    fontWeight: 'bold',
                                    color: '#475569',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    lineHeight: 1
                                  }}
                                  title="Opciones"
                                >
                                  &#8942;
                                </button>
                                {openMenuId === g.id && (
                                  <div
                                    style={{
                                      position: 'absolute',
                                      right: 14,
                                      top: '100%',
                                      marginTop: 4,
                                      background: '#ffffff',
                                      border: '1px solid #e2e8f0',
                                      borderRadius: 8,
                                      boxShadow: '0 10px 25px -5px rgba(0,0,0,0.15)',
                                      zIndex: 100,
                                      minWidth: 140,
                                      padding: '6px 0',
                                      display: 'flex',
                                      flexDirection: 'column',
                                      textAlign: 'left'
                                    }}
                                    onClick={e => e.stopPropagation()}
                                  >
                                    {g.estado === 'vigente' && (
                                      <button
                                        onClick={() => { setOpenMenuId(null); abrirReclamo(g); }}
                                        style={{ padding: '8px 14px', background: 'none', border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 600, color: '#dc2626', textAlign: 'left', width: '100%' }}
                                      >
                                        Reclamar
                                      </button>
                                    )}
                                    <button
                                      onClick={() => { setOpenMenuId(null); printGarantia(g); }}
                                      style={{ padding: '8px 14px', background: 'none', border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 600, color: '#334155', textAlign: 'left', width: '100%' }}
                                    >
                                      Imprimir
                                    </button>
                                    {isAdmin && g.estado !== 'anulada' && (
                                      <button
                                        onClick={() => { setOpenMenuId(null); anularGarantia(g); }}
                                        style={{ padding: '8px 14px', background: 'none', border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 600, color: '#c2410c', textAlign: 'left', width: '100%' }}
                                      >
                                        Anular
                                      </button>
                                    )}
                                    {isAdmin && (
                                      <button
                                        onClick={() => { setOpenMenuId(null); eliminarGarantia(g); }}
                                        style={{ padding: '8px 14px', background: 'none', border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 600, color: '#b91c1c', textAlign: 'left', width: '100%' }}
                                      >
                                        Eliminar
                                      </button>
                                    )}
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
        <GarantiaReclamoModal
          garantiasHook={{ ...state, ...actions }}
          garantia={selectedGarantia}
          onClose={() => setShowReclamo(false)}
          onSuccess={() => setShowReclamo(false)}
        />
      )}

      {/* ─── MODAL DETALLE GARANTÍA ─── */}
      {showDetalle && selectedGarantia && (
        <GarantiaDetalleModal
          garantia={selectedGarantia}
          reclamos={reclamos}
          isAdmin={isAdmin}
          onClose={() => setShowDetalle(false)}
          onAbrirReclamo={() => { setShowDetalle(false); abrirReclamo(selectedGarantia); }}
          onPrintCertificado={() => printGarantia(selectedGarantia)}
          onAnular={() => { setShowDetalle(false); anularGarantia(selectedGarantia); }}
          onEliminar={() => { setShowDetalle(false); eliminarGarantia(selectedGarantia); }}
        />
      )}
    </div>
  )
}

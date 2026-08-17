'use client'

import React, { useState, useEffect } from 'react'
import { fmtDate, diasRestantes } from '../utils/garantia-calc.helper'
import { useGarantias } from '../hooks/use-garantias'
import { printGarantia } from '../utils/pdfGenerators'
import { GarantiaReclamoModal } from './GarantiaReclamoModal'
import { GarantiaDetalleModal } from './GarantiaDetalleModal'
import { GarantiaFormModal } from './GarantiaFormModal'
import { GarantiaReclamosTabla } from './GarantiaReclamosTabla'

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

      {(() => {
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

        if (reclamosFiltrados.length === 0) return null;

        return (
          <GarantiaReclamosTabla
            buscar={buscar}
            reclamosFiltrados={reclamosFiltrados}
            onSetBuscar={setBuscar}
            onResolverReclamo={resolverReclamo}
          />
        )
      })()}

      {/* MODAL NUEVA GARANTIA */}
      <GarantiaFormModal
        showModal={showModal}
        form={form}
        ventas={ventas}
        loading={loading}
        onClose={() => setShowModal(false)}
        onSelVenta={selVenta}
        onSetField={setF}
        onSave={saveGarantia}
      />

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
